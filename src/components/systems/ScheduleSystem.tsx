import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { findTaskTarget } from '../../utils/homeLayout';
import type { Task } from '../../types';

const MINUTES_PER_DAY = 24 * 60;

/**
 * Headless component that checks scheduled tasks against sim-time
 * and submits them when the time arrives. Tracks which tasks
 * already fired this sim-day to avoid duplicates.
 */
export function ScheduleSystem() {
  // Track which schedule IDs have fired on the current sim-day
  const firedRef = useRef<Set<string>>(new Set());
  const lastDayRef = useRef(-1);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const s = useStore.getState();
      if (s.simSpeed === 0) return;

      const currentDay = Math.floor(s.simMinutes / MINUTES_PER_DAY);
      const timeOfDay = s.simMinutes % MINUTES_PER_DAY;

      // Reset fired set on new day
      if (currentDay !== lastDayRef.current) {
        firedRef.current.clear();
        lastDayRef.current = currentDay;
      }

      for (const scheduled of s.scheduledTasks) {
        if (!scheduled.enabled) continue;
        if (firedRef.current.has(scheduled.id)) continue;

        // Fire if sim-time has passed the scheduled time (within a 2-minute window)
        if (timeOfDay >= scheduled.timeMinutes && timeOfDay < scheduled.timeMinutes + 2) {
          firedRef.current.add(scheduled.id);

          const target = findTaskTarget(scheduled.command);
          if (!target) continue;

          // Clear any queued AI tasks for this robot so the schedule takes priority
          s.clearQueuedAiTasks(scheduled.assignedTo);

          const task: Task = {
            id: crypto.randomUUID(),
            command: scheduled.command,
            source: 'schedule',
            targetRoom: target.roomId,
            targetPosition: target.position,
            status: 'queued',
            progress: 0,
            description: target.description,
            taskType: target.taskType,
            workDuration: target.workDuration,
            createdAt: Date.now(),
            assignedTo: scheduled.assignedTo,
          };

          s.addTask(task);
          s.setRobotThought(scheduled.assignedTo, `Time for my scheduled task: ${scheduled.command}.`);
          s.setRobotMood(scheduled.assignedTo, 'focused');

          s.addMessage({
            id: crypto.randomUUID(),
            sender: 'robot',
            text: `Scheduled task: ${scheduled.command}`,
            timestamp: Date.now(),
          });
        }
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}
