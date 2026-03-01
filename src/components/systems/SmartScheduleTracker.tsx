import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import {
  loadSmartScheduleData,
  saveSmartScheduleData,
  recordCleaningEvent,
  shouldReanalyze,
  analyzePatterns,
  getAutoScheduleEntries,
  type SmartScheduleData,
  type CleaningEvent,
} from '../../systems/SmartSchedule';
import { findTaskTarget } from '../../utils/homeLayout';
import type { Task, RobotId } from '../../types';

const MINUTES_PER_DAY = 24 * 60;
const ROBOT_IDS: RobotId[] = ['sim', 'chef', 'sparkle'];

/** Pick the least-busy idle robot, cycling through them */
function pickIdleRobot(s: ReturnType<typeof useStore.getState>): RobotId | null {
  const busyRobots = new Set(
    s.tasks
      .filter((t) => t.status === 'queued' || t.status === 'walking' || t.status === 'working')
      .map((t) => t.assignedTo),
  );
  // Prefer robots with fewest active tasks
  const candidates = ROBOT_IDS.filter((id) => !busyRobots.has(id));
  if (candidates.length > 0) return candidates[0];
  // All busy — pick the one with fewest queued tasks
  const counts = ROBOT_IDS.map((id) => ({
    id,
    count: s.tasks.filter((t) => t.assignedTo === id && t.status === 'queued').length,
  }));
  counts.sort((a, b) => a.count - b.count);
  return counts[0].id;
}

/**
 * Headless system that observes task completions and feeds the
 * smart-scheduling AI. Runs a 1-second polling loop to detect
 * newly completed tasks and periodically re-analyzes patterns.
 * When smart scheduling is enabled, auto-dispatches tasks at
 * learned optimal times.
 */
export function SmartScheduleTracker() {
  const dataRef = useRef<SmartScheduleData>(loadSmartScheduleData());
  const seenTasksRef = useRef<Set<string>>(new Set());
  // Track which auto-schedule entries fired this sim-day
  const autoFiredRef = useRef<Set<string>>(new Set());
  const autoLastDayRef = useRef(-1);

  useEffect(() => {
    // Expose initial data to store so the UI can read it immediately
    useStore.getState().setSmartScheduleData(dataRef.current);

    const interval = window.setInterval(() => {
      const s = useStore.getState();
      if (s.simSpeed === 0) return;

      let data = dataRef.current;
      let changed = false;

      // Scan for newly completed tasks
      for (const task of s.tasks) {
        if (task.status !== 'completed') continue;
        if (seenTasksRef.current.has(task.id)) continue;
        seenTasksRef.current.add(task.id);

        const roomState = s.roomNeeds[task.targetRoom];
        const event: CleaningEvent = {
          roomId: task.targetRoom,
          taskType: task.taskType,
          simMinutes: s.simMinutes,
          timeOfDay: s.simMinutes % MINUTES_PER_DAY,
          source: task.source === 'user' ? 'user' : task.source === 'schedule' ? 'schedule' : 'ai',
          cleanlinessBeforeTask: roomState ? roomState.cleanliness : 75,
        };

        data = recordCleaningEvent(data, event);
        changed = true;
      }

      // Periodic pattern analysis
      if (shouldReanalyze(data, s.simMinutes)) {
        data = analyzePatterns(data, s.simMinutes);
        changed = true;
      }

      if (changed) {
        dataRef.current = data;
        saveSmartScheduleData(data);
        s.setSmartScheduleData(data);
      }

      // ── Auto-scheduling dispatch ──────────────────────────
      if (!s.smartScheduleEnabled) return;

      const currentDay = Math.floor(s.simMinutes / MINUTES_PER_DAY);
      const timeOfDay = s.simMinutes % MINUTES_PER_DAY;

      // Reset fired set on new day
      if (currentDay !== autoLastDayRef.current) {
        autoFiredRef.current.clear();
        autoLastDayRef.current = currentDay;
      }

      const entries = getAutoScheduleEntries(data);
      for (const entry of entries) {
        const key = `${entry.roomId}:${entry.taskType}`;
        if (autoFiredRef.current.has(key)) continue;

        // Fire within a 2-minute window of the optimal time
        if (timeOfDay >= entry.optimalTime && timeOfDay < entry.optimalTime + 2) {
          autoFiredRef.current.add(key);

          const target = findTaskTarget(entry.command);
          if (!target) continue;

          const robotId = pickIdleRobot(s);
          if (!robotId) continue;

          const task: Task = {
            id: crypto.randomUUID(),
            command: entry.command,
            source: 'schedule',
            targetRoom: target.roomId,
            targetPosition: target.position,
            status: 'queued',
            progress: 0,
            description: target.description,
            taskType: target.taskType,
            workDuration: target.workDuration,
            createdAt: Date.now(),
            assignedTo: robotId,
          };

          s.addTask(task);
          s.setRobotThought(robotId, `Smart AI: Time to ${entry.command}.`);
          s.setRobotMood(robotId, 'focused');

          s.addMessage({
            id: crypto.randomUUID(),
            sender: 'robot',
            text: `Smart Schedule: ${entry.command} (learned pattern)`,
            timestamp: Date.now(),
          });
        }
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}
