import { useEffect } from 'react';
import { useStore } from '../../stores/useStore';
import type { TaskType } from '../../types';

// ── Mini-Game Trigger System ──────────────────────────────────────────
// Watches for task completions and occasionally offers mini-games.
// ~15% chance per matching task type.

const COOKING_TASKS: TaskType[] = ['cooking'];
const REPAIR_TASKS: TaskType[] = ['cleaning', 'scrubbing', 'dishes'];
const GARDEN_TASKS: TaskType[] = ['watering', 'weeding', 'mowing'];

const TRIGGER_CHANCE = 0.15; // 15%

export function MiniGameTrigger() {
  useEffect(() => {
    const unsub = useStore.subscribe((state, prevState) => {
      // Detect newly completed tasks
      const completed = state.tasks.filter((t) => t.status === 'completed');
      const prevCompleted = prevState.tasks.filter((t) => t.status === 'completed');

      if (completed.length <= prevCompleted.length) return;

      // Find new completions
      const prevIds = new Set(prevCompleted.map((t) => t.id));
      const newlyCompleted = completed.filter((t) => !prevIds.has(t.id));

      for (const task of newlyCompleted) {
        if (Math.random() > TRIGGER_CHANCE) continue;

        const s = useStore.getState();
        // Don't trigger if any mini-game is already open
        if (s.showCookingGame || s.showRepairGame || s.showGardenGame || s.showMiniGames) continue;

        if (COOKING_TASKS.includes(task.taskType)) {
          s.addNotification({
            type: 'info',
            title: 'Mini-Game Available!',
            message: '🍳 A cooking challenge appeared! Open Mini-Games to play.',
          });
          s.setShowCookingGame(true);
          return;
        }

        if (REPAIR_TASKS.includes(task.taskType)) {
          s.addNotification({
            type: 'info',
            title: 'Mini-Game Available!',
            message: '🔧 A repair puzzle appeared! Open Mini-Games to play.',
          });
          s.setShowRepairGame(true);
          return;
        }

        if (GARDEN_TASKS.includes(task.taskType)) {
          s.addNotification({
            type: 'info',
            title: 'Mini-Game Available!',
            message: '🌱 Garden tending time! Open Mini-Games to play.',
          });
          s.setShowGardenGame(true);
          return;
        }
      }
    });

    return unsub;
  }, []);

  return null;
}
