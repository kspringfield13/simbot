import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { ROBOT_IDS } from '../../types';

/**
 * Periodically samples average room cleanliness and flushes session data.
 * Runs every ~2 sim-minutes (real-time depends on sim speed).
 */
export function LeaderboardTracker() {
  const lastSampleRef = useRef(0);
  const lastFlushRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStore.getState();
      const { simMinutes, roomNeeds, sampleCleanliness, flushSession } = state;

      // Sample cleanliness every 2 sim-minutes
      if (simMinutes - lastSampleRef.current >= 2) {
        lastSampleRef.current = simMinutes;
        const roomIds = Object.keys(roomNeeds);
        if (roomIds.length > 0) {
          const avg = roomIds.reduce((sum, id) => sum + (roomNeeds[id]?.cleanliness ?? 0), 0) / roomIds.length;
          sampleCleanliness(avg);
        }
      }

      // Auto-flush session every 10 real minutes
      const now = Date.now();
      if (now - lastFlushRef.current > 10 * 60 * 1000) {
        // Only flush if any robot completed a task
        const hasWork = ROBOT_IDS.some((rid) => state.sessionStats[rid].tasksCompleted > 0);
        if (hasWork) {
          flushSession(simMinutes);
          lastFlushRef.current = now;
        }
      }
    }, 5000); // check every 5 real seconds

    // Flush on page unload
    const handleUnload = () => {
      const state = useStore.getState();
      const hasWork = ROBOT_IDS.some((rid) => state.sessionStats[rid].tasksCompleted > 0);
      if (hasWork) {
        state.flushSession(state.simMinutes);
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return null;
}
