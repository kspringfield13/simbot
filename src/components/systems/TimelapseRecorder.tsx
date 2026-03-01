import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { ROBOT_IDS } from '../../types';
import type { RobotId } from '../../types';

/**
 * Headless system that records simulation events into a circular buffer
 * for timelapse replay. Captures:
 * - Robot positions every ~2 sim-minutes
 * - Task start/complete events
 * - Room cleanliness snapshots periodically
 */
export function TimelapseRecorder() {
  const lastPositionSample = useRef(0);
  const lastRoomSample = useRef(0);
  const prevTaskStatuses = useRef<Record<string, string>>({});

  useEffect(() => {
    const POSITION_INTERVAL = 2;   // sim-minutes between position samples
    const ROOM_INTERVAL = 10;      // sim-minutes between room snapshots

    const interval = setInterval(() => {
      const s = useStore.getState();
      if (s.simSpeed === 0 || s.timelapsePlayback) return;

      const simMin = s.simMinutes;
      const push = s.pushTimelapseEvent;

      // Record robot positions
      if (simMin - lastPositionSample.current >= POSITION_INTERVAL) {
        lastPositionSample.current = simMin;
        for (const rid of ROBOT_IDS) {
          const robot = s.robots[rid];
          push({
            type: 'position',
            simMinutes: simMin,
            robotId: rid as RobotId,
            position: [...robot.position] as [number, number, number],
          });
        }
      }

      // Record room cleanliness snapshots
      if (simMin - lastRoomSample.current >= ROOM_INTERVAL) {
        lastRoomSample.current = simMin;
        for (const [roomId, need] of Object.entries(s.roomNeeds)) {
          push({
            type: 'room-change',
            simMinutes: simMin,
            roomId,
            cleanliness: Math.round(need.cleanliness),
          });
        }
      }

      // Detect task status changes
      const currentStatuses: Record<string, string> = {};
      for (const task of s.tasks) {
        currentStatuses[task.id] = task.status;
        const prev = prevTaskStatuses.current[task.id];

        if (!prev && (task.status === 'walking' || task.status === 'working')) {
          push({
            type: 'task-start',
            simMinutes: simMin,
            robotId: task.assignedTo,
            taskType: task.taskType,
            roomId: task.targetRoom,
          });
        } else if (prev !== 'completed' && task.status === 'completed') {
          push({
            type: 'task-complete',
            simMinutes: simMin,
            robotId: task.assignedTo,
            taskType: task.taskType,
            roomId: task.targetRoom,
          });
        }
      }
      prevTaskStatuses.current = currentStatuses;
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return null;
}
