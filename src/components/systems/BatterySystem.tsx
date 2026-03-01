import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { getNavigationPath } from '../../utils/pathfinding';
import { ROBOT_IDS } from '../../types';
import type { RobotId } from '../../types';
import {
  CHARGING_RANGE,
  LOW_BATTERY_THRESHOLD,
  FULL_CHARGE_THRESHOLD,
  getActiveChargingPosition,
} from '../../utils/battery';

/**
 * Headless system that manages battery behavior:
 * - Detects when robots are near the charging station and sets isCharging
 * - Auto-navigates robots to the charger when battery < LOW_BATTERY_THRESHOLD
 * - Stops charging when battery >= FULL_CHARGE_THRESHOLD
 */
export function BatterySystem() {
  const chargingTaskSent = useRef<Record<RobotId, boolean>>({
    sim: false,
    chef: false,
    sparkle: false,
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      const s = useStore.getState();
      if (s.simSpeed === 0) return;

      for (const robotId of ROBOT_IDS) {
        const robot = s.robots[robotId];
        const [rx, , rz] = robot.position;
        const [cx, , cz] = getActiveChargingPosition();
        const dist = Math.hypot(rx - cx, rz - cz);
        const nearStation = dist < CHARGING_RANGE;

        // --- Charging proximity logic ---
        if (nearStation && robot.state === 'idle' && robot.battery < FULL_CHARGE_THRESHOLD) {
          if (!robot.isCharging) {
            s.setRobotCharging(robotId, true);
          }
        } else if (robot.isCharging) {
          // Stop charging if moved away, started a task, or fully charged
          if (!nearStation || robot.state !== 'idle' || robot.battery >= FULL_CHARGE_THRESHOLD) {
            s.setRobotCharging(robotId, false);
            if (robot.battery >= FULL_CHARGE_THRESHOLD) {
              s.setRobotThought(robotId, 'Fully charged! Ready to get back to work.');
              s.setRobotMood(robotId, 'happy');
              chargingTaskSent.current[robotId] = false;
            }
          }
        }

        // --- Dead battery: force stop ---
        if (robot.battery <= 0 && !robot.isCharging) {
          if (robot.state !== 'idle' || s.tasks.some((t) => t.assignedTo === robotId && t.status !== 'completed')) {
            s.clearActiveTaskState(robotId);
            s.clearQueuedAiTasks(robotId);
            s.setRobotThought(robotId, 'Battery depleted... shutting down until recharged.');
            s.setRobotMood(robotId, 'tired');
          }
          // Skip further processing - robot is dead
          continue;
        }

        // --- Low battery auto-navigate ---
        if (
          robot.battery < LOW_BATTERY_THRESHOLD &&
          !robot.isCharging &&
          !chargingTaskSent.current[robotId]
        ) {
          // Clear any current AI tasks and send robot to charger
          s.clearActiveTaskState(robotId);
          s.clearQueuedAiTasks(robotId);

          const chargingPos = getActiveChargingPosition();
          const path = getNavigationPath(robot.position, chargingPos);
          if (path.length > 0) {
            s.addTask({
              id: crypto.randomUUID(),
              command: 'Heading to charging station',
              source: 'ai',
              targetRoom: 'hallway',
              targetPosition: chargingPos,
              status: 'queued',
              progress: 0,
              description: 'Navigating to charging station.',
              taskType: 'general',
              workDuration: 2,
              createdAt: Date.now(),
              assignedTo: robotId,
            });

            s.setRobotThought(robotId, 'Battery low... need to recharge.');
            s.setRobotMood(robotId, 'tired');
            chargingTaskSent.current[robotId] = true;
          }
        }

        // Reset charging task flag when battery recovers
        if (robot.battery > LOW_BATTERY_THRESHOLD + 10) {
          chargingTaskSent.current[robotId] = false;
        }
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}
