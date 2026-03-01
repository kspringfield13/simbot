import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import {
  loadSmartScheduleData,
  saveSmartScheduleData,
  recordCleaningEvent,
  shouldReanalyze,
  analyzePatterns,
  type SmartScheduleData,
  type CleaningEvent,
} from '../../systems/SmartSchedule';

const MINUTES_PER_DAY = 24 * 60;

/**
 * Headless system that observes task completions and feeds the
 * smart-scheduling AI. Runs a 1-second polling loop to detect
 * newly completed tasks and periodically re-analyzes patterns.
 */
export function SmartScheduleTracker() {
  const dataRef = useRef<SmartScheduleData>(loadSmartScheduleData());
  const seenTasksRef = useRef<Set<string>>(new Set());

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
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}
