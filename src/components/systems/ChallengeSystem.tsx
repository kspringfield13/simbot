import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';

/**
 * Headless system component that monitors task completions
 * during an active challenge and triggers challenge completion
 * when all tasks are done.
 */
export function ChallengeSystem() {
  const lastCompletedRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStore.getState();
      const { activeChallenge, tasks } = state;
      if (!activeChallenge) {
        lastCompletedRef.current = 0;
        return;
      }

      const { challengeTaskIds, totalTasks } = activeChallenge;

      // Count completed challenge tasks (completed status or removed from list)
      let completedCount = 0;
      for (const taskId of challengeTaskIds) {
        const task = tasks.find((t) => t.id === taskId);
        if (!task || task.status === 'completed') {
          completedCount++;
        }
      }

      // Sync the store's completed count with our observed count
      if (completedCount > lastCompletedRef.current) {
        const delta = completedCount - lastCompletedRef.current;
        for (let i = 0; i < delta; i++) {
          state.advanceChallengeTask();
        }
        lastCompletedRef.current = completedCount;
      }

      // All tasks done — complete the challenge
      if (completedCount >= totalTasks) {
        state.completeChallenge();
        lastCompletedRef.current = 0;
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return null;
}
