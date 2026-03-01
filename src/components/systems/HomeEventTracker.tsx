import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { ROBOT_IDS } from '../../types';
import type { RobotId } from '../../types';
import { getRoomFromPoint } from '../../utils/homeLayout';
import { generateDiaryEntry } from '../../config/diary';
import {
  createHomeEvent,
  eventToHistoryEntry,
  getEventConfig,
  getEventRoomName,
  EVENT_TYPES,
} from '../../systems/HomeEvents';

/**
 * Headless component that manages the Home Events lifecycle:
 * 1. Randomly triggers events every ~30-60 sim-minutes
 * 2. Manages detection → response → resolution phases
 * 3. Applies cleanliness impacts to affected rooms
 * 4. Generates diary entries for participating robots
 */
export function HomeEventTracker() {
  const lastEventTimeRef = useRef(0);
  const nextEventDelayRef = useRef(30 + Math.random() * 30); // 30-60 sim-minutes
  const phaseTimerRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStore.getState();
      const { simMinutes, simSpeed, activeHomeEvent } = state;
      if (simSpeed === 0) return;

      // ── No active event: check if it's time to trigger one ──
      if (!activeHomeEvent) {
        const elapsed = simMinutes - lastEventTimeRef.current;
        if (elapsed >= nextEventDelayRef.current) {
          // Pick a random event type
          const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
          const event = createHomeEvent(eventType, simMinutes);
          const config = getEventConfig(eventType);

          // Apply cleanliness impact to the affected room
          const roomNeeds = state.roomNeeds[event.roomId];
          if (roomNeeds) {
            const updatedNeeds = {
              ...state.roomNeeds,
              [event.roomId]: {
                ...roomNeeds,
                cleanliness: Math.max(0, roomNeeds.cleanliness + config.cleanlinessImpact),
                tidiness: Math.max(0, roomNeeds.tidiness + config.tidinessImpact),
              },
            };
            // We need to set roomNeeds directly — use the store's set via a workaround
            useStore.setState({ roomNeeds: updatedNeeds });
          }

          state.setActiveHomeEvent(event);
          lastEventTimeRef.current = simMinutes;
          nextEventDelayRef.current = 30 + Math.random() * 30;
          phaseTimerRef.current = simMinutes;
        }
        return;
      }

      // ── Active event: manage phases ──
      const config = getEventConfig(activeHomeEvent.type);
      const phaseAge = simMinutes - phaseTimerRef.current;

      switch (activeHomeEvent.phase) {
        case 'detection': {
          // Find the closest robot to the affected room to "detect" the event
          if (phaseAge >= 1) {
            let closestRobot: RobotId = 'sim';
            let closestDist = Infinity;

            for (const rid of ROBOT_IDS) {
              const robot = state.robots[rid];
              const robotRoom = getRoomFromPoint(robot.position[0], robot.position[2]);
              // Robot in the affected room detects immediately
              if (robotRoom === activeHomeEvent.roomId) {
                closestRobot = rid;
                closestDist = 0;
                break;
              }
              // Otherwise find closest by position
              const dx = robot.position[0];
              const dz = robot.position[2];
              const dist = Math.sqrt(dx * dx + dz * dz);
              if (dist < closestDist) {
                closestDist = dist;
                closestRobot = rid;
              }
            }

            // Detection thought
            const detectionThoughts = config.detectionThoughts[closestRobot];
            const thought = detectionThoughts[Math.floor(Math.random() * detectionThoughts.length)];
            state.setRobotThought(closestRobot, thought);
            state.setRobotMood(closestRobot, 'focused');

            state.updateHomeEvent({
              phase: 'response',
              detectedBy: closestRobot,
              respondingRobots: [closestRobot],
            });
            phaseTimerRef.current = simMinutes;

            // Clear any active AI tasks for this robot so they can respond
            state.clearQueuedAiTasks(closestRobot);
          }
          break;
        }

        case 'response': {
          // Rally other robots to help (after ~3 sim-minutes)
          if (phaseAge >= 3 && activeHomeEvent.respondingRobots.length < ROBOT_IDS.length) {
            const newResponders: RobotId[] = [...activeHomeEvent.respondingRobots];
            for (const rid of ROBOT_IDS) {
              if (newResponders.includes(rid)) continue;
              const robot = state.robots[rid];
              // Only recruit robots that aren't charging or dead
              if (robot.isCharging || robot.battery <= 5) continue;

              const responseThoughts = config.responseThoughts[rid];
              const thought = responseThoughts[Math.floor(Math.random() * responseThoughts.length)];
              state.setRobotThought(rid, thought);
              state.setRobotMood(rid, 'focused');
              state.clearQueuedAiTasks(rid);
              newResponders.push(rid);
            }
            state.updateHomeEvent({ respondingRobots: newResponders });
          }

          // After fix duration, resolve the event
          if (phaseAge >= config.fixDuration) {
            state.updateHomeEvent({ phase: 'resolution' });
            phaseTimerRef.current = simMinutes;
          }
          break;
        }

        case 'resolution': {
          // Generate resolution thoughts and diary entries, then clear the event
          if (phaseAge >= 2) {
            const detectedBy = activeHomeEvent.detectedBy ?? 'sim';
            const roomName = getEventRoomName(activeHomeEvent.roomId);

            // Resolution thought for the detecting robot
            const resThoughts = config.resolutionThoughts[detectedBy];
            const resThought = resThoughts[Math.floor(Math.random() * resThoughts.length)];
            state.setRobotThought(detectedBy, resThought);
            state.setRobotMood(detectedBy, 'happy');

            // Boost room cleanliness back up a bit (robots fixed it)
            const roomNeeds = state.roomNeeds[activeHomeEvent.roomId];
            if (roomNeeds) {
              useStore.setState({
                roomNeeds: {
                  ...state.roomNeeds,
                  [activeHomeEvent.roomId]: {
                    ...roomNeeds,
                    cleanliness: Math.min(100, roomNeeds.cleanliness + 15),
                    tidiness: Math.min(100, roomNeeds.tidiness + 10),
                  },
                },
              });
            }

            // Generate diary entry for the detecting robot
            const diaryEntry = generateDiaryEntry({
              robotId: detectedBy,
              simMinutes,
              mood: 'focused',
              battery: state.robots[detectedBy].battery,
              energy: state.robots[detectedBy].needs.energy,
              happiness: state.robots[detectedBy].needs.happiness,
              weather: state.weather,
              season: state.currentSeason,
            });
            // Override text with event-specific entry
            const eventEmoji = config.emoji;
            diaryEntry.text = diaryEntry.text.split(' - ')[0] + ` - ${eventEmoji} ${config.label} in ${roomName}! ${resThought}`;
            state.addDiaryEntry(diaryEntry);

            // Happiness boost for responding robots
            for (const rid of activeHomeEvent.respondingRobots) {
              state.updateRobotNeeds(rid, {
                happiness: Math.min(100, state.robots[rid].needs.happiness + 8),
                boredom: Math.max(0, state.robots[rid].needs.boredom - 15),
              });
            }

            // Archive and clear event
            const historyEntry = eventToHistoryEntry({
              ...activeHomeEvent,
              resolvedAt: simMinutes,
            });
            state.resolveHomeEvent(historyEntry);
          }
          break;
        }
      }
    }, 3000); // check every 3 real seconds

    return () => clearInterval(interval);
  }, []);

  return null;
}
