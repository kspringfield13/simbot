import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { ROBOT_IDS } from '../../types';
import type { RobotId, IntruderEvent } from '../../types';
import { getRoomFromPoint } from '../../utils/homeLayout';
import { generateDiaryEntry } from '../../config/diary';
import {
  INTRUDER_CONFIGS,
  INTRUDER_MIN_INTERVAL,
  INTRUDER_MAX_INTERVAL,
  PATROL_ROUTE,
  PATROL_WAIT_PER_ROOM,
  PATROL_START_HOUR,
  PATROL_END_HOUR,
  DEFAULT_ALARM_CONFIG,
  pickIntruderType,
  pickIntruderRoom,
  type IntruderType,
} from '../../config/security';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isNightTime(simMinutes: number): boolean {
  const hour = Math.floor((simMinutes % 1440) / 60);
  return hour >= PATROL_START_HOUR || hour < PATROL_END_HOUR;
}

/**
 * Headless system managing home security:
 * 1. Auto-arms alarm at night if configured
 * 2. Robot patrol mode during night hours
 * 3. Random intruder events at night
 * 4. Camera detection, alarm triggering, robot response
 */
export function SecurityTracker() {
  const lastIntruderTimeRef = useRef(0);
  const nextIntruderDelayRef = useRef(INTRUDER_MIN_INTERVAL + Math.random() * (INTRUDER_MAX_INTERVAL - INTRUDER_MIN_INTERVAL));
  const phaseTimerRef = useRef(0);
  const patrolIndexRef = useRef(0);
  const lastPatrolCheckRef = useRef(0);
  const lastNightCheckRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStore.getState();
      const { simMinutes, simSpeed, activeIntruder, installedCameras, alarmState, patrolEnabled } = state;
      if (simSpeed === 0) return;

      const nightTime = isNightTime(simMinutes);

      // ── Auto-arm alarm at night ──
      if (nightTime && !lastNightCheckRef.current && DEFAULT_ALARM_CONFIG.autoArmAtNight) {
        if (alarmState === 'disarmed') {
          state.setAlarmState('armed-home');
          state.addSecurityLog({ simMinutes, type: 'alarm-arm', message: 'Alarm auto-armed for night mode' });
          state.addNotification({ type: 'info', title: 'Security', message: 'Alarm auto-armed for night.' });
        }
      }
      lastNightCheckRef.current = nightTime;

      // ── Robot patrol at night ──
      if (patrolEnabled && nightTime && !activeIntruder) {
        const patrolElapsed = simMinutes - lastPatrolCheckRef.current;
        if (patrolElapsed >= PATROL_WAIT_PER_ROOM) {
          const patrolRoom = PATROL_ROUTE[patrolIndexRef.current % PATROL_ROUTE.length];
          patrolIndexRef.current = (patrolIndexRef.current + 1) % PATROL_ROUTE.length;
          lastPatrolCheckRef.current = simMinutes;

          // Find idle robot for patrol
          const patroller = ROBOT_IDS.find((rid) => {
            const r = state.robots[rid];
            return r.state === 'idle' && !r.isCharging && r.battery > 15;
          });

          if (patroller) {
            state.setRobotThought(patroller, `Patrolling ${patrolRoom}... all clear so far.`);
            state.addSecurityLog({
              simMinutes,
              type: 'patrol-check',
              message: `${patroller} checked ${patrolRoom}`,
              roomId: patrolRoom,
            });
          }
        }
      }

      // ── Intruder event generation (night only) ──
      if (!activeIntruder && nightTime) {
        const elapsed = simMinutes - lastIntruderTimeRef.current;
        if (elapsed >= nextIntruderDelayRef.current) {
          // Don't trigger if another major event is active
          if (state.activeHomeEvent || state.activeDisaster) return;

          const intruderType = pickIntruderType();
          const roomId = pickIntruderRoom(intruderType);
          const config = INTRUDER_CONFIGS[intruderType];

          // Check if camera covers this room
          const cameraCovers = installedCameras.some((camId) => camId === roomId);
          const cameraDetected = cameraCovers && Math.random() > config.stealthLevel;

          const event: IntruderEvent = {
            id: `intruder-${Date.now()}`,
            type: intruderType,
            phase: 'detected',
            roomId,
            startedAt: simMinutes,
            detectedBy: null,
            respondingRobots: [],
            resolvedAt: null,
            cameraDetected,
            alarmTriggered: false,
          };

          state.setActiveIntruder(event);
          lastIntruderTimeRef.current = simMinutes;
          nextIntruderDelayRef.current = INTRUDER_MIN_INTERVAL + Math.random() * (INTRUDER_MAX_INTERVAL - INTRUDER_MIN_INTERVAL);
          phaseTimerRef.current = simMinutes;

          // Apply room damage
          const roomNeeds = state.roomNeeds[roomId];
          if (roomNeeds) {
            useStore.setState({
              roomNeeds: {
                ...state.roomNeeds,
                [roomId]: {
                  ...roomNeeds,
                  cleanliness: Math.max(0, roomNeeds.cleanliness + config.cleanlinessImpact),
                  tidiness: Math.max(0, roomNeeds.tidiness + config.tidinessImpact),
                },
              },
            });
          }

          // Camera detection log
          if (cameraDetected) {
            state.addSecurityLog({
              simMinutes,
              type: 'camera-motion',
              message: `${config.emoji} Camera detected motion in ${roomId}: ${config.label}!`,
              roomId,
            });
          }

          state.addSecurityLog({
            simMinutes,
            type: 'intruder-detected',
            message: `${config.emoji} ${config.label} detected in ${roomId}!`,
            roomId,
          });
        }
        return;
      }

      // ── Active intruder: manage phases ──
      if (!activeIntruder) return;

      const config = INTRUDER_CONFIGS[activeIntruder.type as IntruderType];
      if (!config) return;
      const phaseAge = simMinutes - phaseTimerRef.current;

      switch (activeIntruder.phase) {
        case 'detected': {
          // After 1 sim-minute, a robot detects (faster if camera saw it)
          const detectionTime = activeIntruder.cameraDetected ? 0.5 : 1.5;
          if (phaseAge >= detectionTime) {
            // Find closest robot
            let closestRobot: RobotId = 'sim';
            let closestDist = Infinity;

            for (const rid of ROBOT_IDS) {
              const robot = state.robots[rid];
              const robotRoom = getRoomFromPoint(robot.position[0], robot.position[2]);
              if (robotRoom === activeIntruder.roomId) {
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

            const thought = pick(config.detectionThoughts[closestRobot]);
            state.setRobotThought(closestRobot, thought);
            state.setRobotMood(closestRobot, 'focused');
            state.clearQueuedAiTasks(closestRobot);

            // Trigger alarm if armed
            let alarmTriggered = false;
            if (alarmState === 'armed-away' || alarmState === 'armed-home') {
              state.setAlarmState('triggered');
              alarmTriggered = true;
              state.addSecurityLog({ simMinutes, type: 'alarm-trigger', message: 'ALARM TRIGGERED — intruder detected!' });
              state.addNotification({ type: 'warning', title: 'ALARM TRIGGERED', message: `${config.emoji} ${config.label} in ${activeIntruder.roomId}!` });
            }

            state.updateIntruder({
              phase: 'responding',
              detectedBy: closestRobot,
              respondingRobots: [closestRobot],
              alarmTriggered,
            });
            phaseTimerRef.current = simMinutes;
          }
          break;
        }

        case 'responding': {
          // Rally other robots after 2 sim-minutes
          if (phaseAge >= 2 && activeIntruder.respondingRobots.length < ROBOT_IDS.length) {
            const newResponders = [...activeIntruder.respondingRobots];
            for (const rid of ROBOT_IDS) {
              if (newResponders.includes(rid)) continue;
              const robot = state.robots[rid];
              if (robot.isCharging || robot.battery <= 5) continue;

              const thought = pick(config.responseThoughts[rid]);
              state.setRobotThought(rid, thought);
              state.setRobotMood(rid, 'focused');
              state.clearQueuedAiTasks(rid);
              newResponders.push(rid);
            }
            state.updateIntruder({ respondingRobots: newResponders });
          }

          // Resolve: alarm scares off faster, more robots = faster
          const baseFlee = activeIntruder.alarmTriggered ? config.fleeTime * 0.5 : config.fleeTime;
          const robotBonus = activeIntruder.respondingRobots.length * 1.5;
          const resolveTime = Math.max(3, baseFlee - robotBonus);

          if (phaseAge >= resolveTime) {
            state.updateIntruder({ phase: 'resolved' });
            phaseTimerRef.current = simMinutes;
          }
          break;
        }

        case 'resolved': {
          if (phaseAge >= 2) {
            const detectedBy = activeIntruder.detectedBy ?? 'sim';
            const thought = pick(config.resolvedThoughts[detectedBy]);
            state.setRobotThought(detectedBy, thought);
            state.setRobotMood(detectedBy, 'happy');

            // Partial room recovery
            const roomNeeds = state.roomNeeds[activeIntruder.roomId];
            if (roomNeeds) {
              useStore.setState({
                roomNeeds: {
                  ...state.roomNeeds,
                  [activeIntruder.roomId]: {
                    ...roomNeeds,
                    cleanliness: Math.min(100, roomNeeds.cleanliness + 10),
                    tidiness: Math.min(100, roomNeeds.tidiness + 8),
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
            diaryEntry.text = diaryEntry.text.split(' - ')[0] + ` - ${config.emoji} ${config.label} in ${activeIntruder.roomId}! ${thought}`;
            state.addDiaryEntry(diaryEntry);

            // Happiness boost for responders
            for (const rid of activeIntruder.respondingRobots) {
              state.updateRobotNeeds(rid, {
                happiness: Math.min(100, state.robots[rid].needs.happiness + 10),
                boredom: Math.max(0, state.robots[rid].needs.boredom - 20),
              });
            }

            state.addSecurityLog({
              simMinutes,
              type: 'intruder-resolved',
              message: `${config.emoji} ${config.label} chased away from ${activeIntruder.roomId}`,
              roomId: activeIntruder.roomId,
            });

            state.resolveIntruder();
          }
          break;
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
