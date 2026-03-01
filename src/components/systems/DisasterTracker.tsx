import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { ROBOT_IDS } from '../../types';
import type { RobotId } from '../../types';
import { getRoomFromPoint } from '../../utils/homeLayout';
import { generateDiaryEntry } from '../../config/diary';
import {
  createDisaster,
  disasterToHistoryEntry,
  getDisasterConfig,
  getDisasterRoomName,
  DISASTER_TYPES,
} from '../../systems/DisasterEvents';

/**
 * Headless system that manages disaster lifecycle:
 * 1. Randomly triggers disasters every ~90-150 sim-minutes
 * 2. Manages detection → response → resolution phases
 * 3. Escalates severity if robots don't respond fast enough
 * 4. Tracks response progress from responding robots
 * 5. Applies cleanliness/tidiness damage based on severity
 */
export function DisasterTracker() {
  const lastDisasterTimeRef = useRef(0);
  const nextDisasterDelayRef = useRef(90 + Math.random() * 60); // 90-150 sim-minutes
  const phaseTimerRef = useRef(0);
  const lastEscalationRef = useRef(0);
  const maxSeverityRef = useRef(1);
  const damageAppliedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStore.getState();
      const { simMinutes, simSpeed, activeDisaster, activeHomeEvent } = state;
      if (simSpeed === 0) return;

      // ── No active disaster: check if it's time to trigger one ──
      if (!activeDisaster) {
        // Don't trigger during an active home event
        if (activeHomeEvent) return;

        const elapsed = simMinutes - lastDisasterTimeRef.current;
        if (elapsed >= nextDisasterDelayRef.current) {
          const disasterType = DISASTER_TYPES[Math.floor(Math.random() * DISASTER_TYPES.length)];
          const disaster = createDisaster(disasterType, simMinutes);
          const config = getDisasterConfig(disasterType);

          // Apply initial severity-1 damage
          const roomNeeds = state.roomNeeds[disaster.roomId];
          if (roomNeeds) {
            useStore.setState({
              roomNeeds: {
                ...state.roomNeeds,
                [disaster.roomId]: {
                  ...roomNeeds,
                  cleanliness: Math.max(0, roomNeeds.cleanliness + config.cleanlinessImpact[1]),
                  tidiness: Math.max(0, roomNeeds.tidiness + config.tidinessImpact[1]),
                },
              },
            });
          }

          state.setActiveDisaster(disaster);
          lastDisasterTimeRef.current = simMinutes;
          nextDisasterDelayRef.current = 90 + Math.random() * 60;
          phaseTimerRef.current = simMinutes;
          lastEscalationRef.current = simMinutes;
          maxSeverityRef.current = 1;
          damageAppliedRef.current = false;
        }
        return;
      }

      // ── Active disaster: manage phases ──
      const config = getDisasterConfig(activeDisaster.type);
      const phaseAge = simMinutes - phaseTimerRef.current;

      switch (activeDisaster.phase) {
        case 'detection': {
          if (phaseAge >= 1) {
            let closestRobot: RobotId = 'sim';
            let closestDist = Infinity;

            for (const rid of ROBOT_IDS) {
              const robot = state.robots[rid];
              const robotRoom = getRoomFromPoint(robot.position[0], robot.position[2]);
              if (robotRoom === activeDisaster.roomId) {
                closestRobot = rid;
                closestDist = 0;
                break;
              }
              const dx = robot.position[0];
              const dz = robot.position[2];
              const dist = Math.sqrt(dx * dx + dz * dz);
              if (dist < closestDist) {
                closestDist = dist;
                closestRobot = rid;
              }
            }

            const thoughts = config.detectionThoughts[closestRobot];
            const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
            state.setRobotThought(closestRobot, thought);
            state.setRobotMood(closestRobot, 'focused');
            state.clearQueuedAiTasks(closestRobot);

            state.updateDisaster({
              phase: 'response',
              detectedBy: closestRobot,
              respondingRobots: [closestRobot],
            });
            phaseTimerRef.current = simMinutes;
          }
          break;
        }

        case 'response': {
          // Rally other robots after 2 sim-minutes
          if (phaseAge >= 2 && activeDisaster.respondingRobots.length < ROBOT_IDS.length) {
            const newResponders = [...activeDisaster.respondingRobots];
            for (const rid of ROBOT_IDS) {
              if (newResponders.includes(rid)) continue;
              const robot = state.robots[rid];
              if (robot.isCharging || robot.battery <= 5) continue;

              const responseThoughts = config.responseThoughts[rid];
              const thought = responseThoughts[Math.floor(Math.random() * responseThoughts.length)];
              state.setRobotThought(rid, thought);
              state.setRobotMood(rid, 'focused');
              state.clearQueuedAiTasks(rid);
              newResponders.push(rid);
            }
            state.updateDisaster({ respondingRobots: newResponders });
          }

          // Escalate severity if not enough progress
          const timeSinceEscalation = simMinutes - lastEscalationRef.current;
          if (
            activeDisaster.severity < 3 &&
            timeSinceEscalation >= config.escalateAfterMinutes
          ) {
            const newSeverity = Math.min(3, activeDisaster.severity + 1) as 1 | 2 | 3;
            maxSeverityRef.current = Math.max(maxSeverityRef.current, newSeverity);

            // Apply additional damage from escalation
            const roomNeeds = state.roomNeeds[activeDisaster.roomId];
            if (roomNeeds) {
              const addlClean = config.cleanlinessImpact[newSeverity] - config.cleanlinessImpact[activeDisaster.severity];
              const addlTidy = config.tidinessImpact[newSeverity] - config.tidinessImpact[activeDisaster.severity];
              useStore.setState({
                roomNeeds: {
                  ...state.roomNeeds,
                  [activeDisaster.roomId]: {
                    ...roomNeeds,
                    cleanliness: Math.max(0, roomNeeds.cleanliness + addlClean),
                    tidiness: Math.max(0, roomNeeds.tidiness + addlTidy),
                  },
                },
              });
            }

            // For earthquakes, damage ALL rooms at severity 3
            if (activeDisaster.type === 'earthquake' && newSeverity === 3) {
              const allNeeds = { ...state.roomNeeds };
              for (const [rid, needs] of Object.entries(allNeeds)) {
                if (rid === activeDisaster.roomId) continue;
                allNeeds[rid] = {
                  ...needs,
                  cleanliness: Math.max(0, needs.cleanliness - 15),
                  tidiness: Math.max(0, needs.tidiness - 25),
                };
              }
              useStore.setState({ roomNeeds: allNeeds });
            }

            state.updateDisaster({ severity: newSeverity });
            lastEscalationRef.current = simMinutes;
          }

          // Progress based on responding robots
          const progressInc = activeDisaster.respondingRobots.length * config.progressPerRobot;
          const newProgress = Math.min(100, activeDisaster.progress + progressInc);
          state.updateDisaster({ progress: newProgress });

          // If progress reaches 100, move to resolution
          if (newProgress >= 100) {
            state.updateDisaster({ phase: 'resolution', progress: 100 });
            phaseTimerRef.current = simMinutes;
          }
          break;
        }

        case 'resolution': {
          if (phaseAge >= 2) {
            const detectedBy = activeDisaster.detectedBy ?? 'sim';
            const roomName = getDisasterRoomName(activeDisaster.roomId);

            const resThoughts = config.resolutionThoughts[detectedBy];
            const resThought = resThoughts[Math.floor(Math.random() * resThoughts.length)];
            state.setRobotThought(detectedBy, resThought);
            state.setRobotMood(detectedBy, 'happy');

            // Partial cleanup boost
            const roomNeeds = state.roomNeeds[activeDisaster.roomId];
            if (roomNeeds) {
              useStore.setState({
                roomNeeds: {
                  ...state.roomNeeds,
                  [activeDisaster.roomId]: {
                    ...roomNeeds,
                    cleanliness: Math.min(100, roomNeeds.cleanliness + 20),
                    tidiness: Math.min(100, roomNeeds.tidiness + 15),
                  },
                },
              });
            }

            // Diary entry
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
            diaryEntry.text =
              diaryEntry.text.split(' - ')[0] +
              ` - ${config.emoji} ${config.severityLabels[maxSeverityRef.current]} in ${roomName}! ${resThought}`;
            state.addDiaryEntry(diaryEntry);

            // Happiness and boredom adjustments
            for (const rid of activeDisaster.respondingRobots) {
              state.updateRobotNeeds(rid, {
                happiness: Math.min(100, state.robots[rid].needs.happiness + 12),
                boredom: Math.max(0, state.robots[rid].needs.boredom - 20),
              });
            }

            const historyEntry = disasterToHistoryEntry(
              { ...activeDisaster, resolvedAt: simMinutes },
              maxSeverityRef.current,
            );
            state.resolveDisaster(historyEntry);
          }
          break;
        }
      }
    }, 3000); // check every 3 real seconds

    return () => clearInterval(interval);
  }, []);

  return null;
}
