import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../../stores/useStore';
import { screenPos } from './ReactionsOverlay';

interface Reaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

const REACTION_DURATION = 2000;

/** Renders floating emoji reactions above the robot based on state changes. */
export function EmojiReaction() {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const prevCleanRef = useRef<Record<string, number>>({});
  const prevCompletedRef = useRef<Set<string>>(new Set());
  const prevRobotStateRef = useRef<string>('idle');
  const prevBoredomRef = useRef<number>(10);
  const lastReactionTimeRef = useRef(0);

  const addReaction = useCallback((emoji: string) => {
    const now = Date.now();
    if (now - lastReactionTimeRef.current < 500) return;
    lastReactionTimeRef.current = now;

    const id = crypto.randomUUID();
    const x = screenPos.x;
    const y = screenPos.y;
    setReactions((prev) => [...prev, { id, emoji, x, y }]);

    // Sync to store
    useStore.getState().triggerEmoji(emoji);

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
      useStore.getState().clearEmoji();
    }, REACTION_DURATION);
  }, []);

  // Watch room cleanliness: spotless (>90) → 😍, very dirty (<30) → 😰
  useEffect(() => {
    return useStore.subscribe((state) => {
      for (const [roomId, needs] of Object.entries(state.roomNeeds)) {
        const prev = prevCleanRef.current[roomId];
        const cur = needs.cleanliness;

        if (prev !== undefined) {
          if (prev <= 90 && cur > 90) addReaction('😍');
          if (prev >= 30 && cur < 30) addReaction('💦');
        }
        prevCleanRef.current[roomId] = cur;
      }
    });
  }, [addReaction]);

  // Watch task completions → ✨
  useEffect(() => {
    return useStore.subscribe((state) => {
      for (const task of state.tasks) {
        if (task.status === 'completed' && !prevCompletedRef.current.has(task.id)) {
          prevCompletedRef.current.add(task.id);
          addReaction('✨');
        }
      }
      // Prune stale IDs
      const currentIds = new Set(state.tasks.map((t) => t.id));
      for (const id of prevCompletedRef.current) {
        if (!currentIds.has(id)) prevCompletedRef.current.delete(id);
      }
    });
  }, [addReaction]);

  // Watch robot state: starting work → 💪, idle + bored → 😴
  useEffect(() => {
    return useStore.subscribe((state) => {
      const activeRobot = state.robots[state.activeRobotId];
      const currentState = activeRobot.state;
      const prevState = prevRobotStateRef.current;

      // Starting work
      if (prevState !== 'working' && currentState === 'working') {
        addReaction('💪');
      }

      // Idle and bored
      const boredom = activeRobot.needs.boredom;
      const prevBoredom = prevBoredomRef.current;
      if (currentState === 'idle' && prevBoredom <= 75 && boredom > 75) {
        addReaction('💤');
      }

      prevRobotStateRef.current = currentState;
      prevBoredomRef.current = boredom;
    });
  }, [addReaction]);

  if (reactions.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="reaction-float"
          style={{
            position: 'absolute',
            left: r.x,
            top: r.y,
            transform: 'translate(-50%, -100%)',
            fontSize: '2.5rem',
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
          }}
        >
          {r.emoji}
        </div>
      ))}
    </div>
  );
}
