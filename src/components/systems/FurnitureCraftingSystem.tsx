import { useEffect } from 'react';
import { useStore } from '../../stores/useStore';

/** Headless system that monitors active furniture crafts and auto-completes them. */
export function FurnitureCraftingSystem() {
  useEffect(() => {
    const interval = window.setInterval(() => {
      const state = useStore.getState();
      const craft = state.activeFurnitureCraft;
      if (!craft) return;

      const elapsed = state.simMinutes - craft.startedAt;
      if (elapsed >= craft.craftDuration) {
        state.completeFurnitureCraft();
        state.addNotification({
          type: 'success',
          title: 'Furniture crafted!',
          message: 'A new furniture item is ready in your inventory.',
        });
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}
