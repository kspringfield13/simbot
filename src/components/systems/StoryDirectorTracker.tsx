// Headless tracker that drives the Story Director system.
// Periodically generates new story arcs and advances existing ones.

import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import {
  createStoryArc,
  advanceStoryArc,
  shouldStartNewArc,
  getStoryMoodEffect,
} from '../../systems/StoryDirector';

export function StoryDirectorTracker() {
  const lastTickRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStore.getState();
      if (state.simSpeed === 0) return;

      const now = state.simMinutes;
      // Only tick every ~5 sim-minutes
      if (now - lastTickRef.current < 5) return;
      lastTickRef.current = now;

      let arcs = [...state.storyArcs];
      let changed = false;

      // Advance existing arcs
      for (let i = 0; i < arcs.length; i++) {
        const result = advanceStoryArc(arcs[i], now);
        if (result.newBeat) {
          arcs[i] = result.arc;
          changed = true;

          // Apply mood effects to involved robots
          const effects = getStoryMoodEffect(result.arc);
          for (const effect of effects) {
            state.setRobotMood(effect.robotId, effect.mood);
            state.setRobotThought(effect.robotId, effect.thought);
          }

          // Add notification for new story beat
          state.addNotification({
            type: 'info',
            title: `📖 ${result.arc.title}`,
            message: result.newBeat.text,
          });
        }
      }

      // Try to start a new arc
      if (shouldStartNewArc(arcs, now)) {
        const newArc = createStoryArc(now, arcs);
        if (newArc) {
          arcs = [...arcs, newArc];
          changed = true;

          state.addNotification({
            type: 'info',
            title: '📖 New Story Arc!',
            message: newArc.title,
          });
        }
      }

      if (changed) {
        state.setStoryArcs(arcs);
      }
    }, 3000); // Check every 3 real seconds

    return () => clearInterval(interval);
  }, []);

  return null;
}
