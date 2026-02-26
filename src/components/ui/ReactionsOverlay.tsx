import { useEffect, useRef, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../stores/useStore';

// Module-level mutable state for 3D→2D projection (avoids per-frame re-renders)
const screenPos = { x: 0, y: 0 };

/** Mount inside <Canvas>. Projects robot head position to screen coords each frame. */
export function RobotScreenTracker() {
  const { camera, size } = useThree();
  const vec = useRef(new THREE.Vector3());

  useFrame(() => {
    const pos = useStore.getState().robotPosition;
    // Robot head is roughly 2.5 units above ground (scale 1.55, head ~y=1.6)
    vec.current.set(pos[0], pos[1] + 2.5, pos[2]);
    vec.current.project(camera);
    screenPos.x = ((vec.current.x + 1) / 2) * size.width;
    screenPos.y = ((-vec.current.y + 1) / 2) * size.height;
  });

  return null;
}

interface Reaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

const REACTION_DURATION = 2000;

/** Mount outside <Canvas>. Renders floating emoji reactions above the robot. */
export function ReactionsOverlay() {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const prevCleanRef = useRef<Record<string, number>>({});
  const prevCompletedRef = useRef<Set<string>>(new Set());
  const lastReactionTimeRef = useRef(0);

  const addReaction = useCallback((emoji: string) => {
    const now = Date.now();
    if (now - lastReactionTimeRef.current < 500) return;
    lastReactionTimeRef.current = now;

    const id = crypto.randomUUID();
    const x = screenPos.x;
    const y = screenPos.y;
    setReactions((prev) => [...prev, { id, emoji, x, y }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, REACTION_DURATION);
  }, []);

  // Watch room cleanliness thresholds
  useEffect(() => {
    return useStore.subscribe((state) => {
      for (const [roomId, needs] of Object.entries(state.roomNeeds)) {
        const prev = prevCleanRef.current[roomId];
        const cur = needs.cleanliness;

        if (prev !== undefined) {
          if (prev <= 90 && cur > 90) addReaction(Math.random() > 0.5 ? '✨' : '😊');
          if (prev >= 30 && cur < 30) addReaction(Math.random() > 0.5 ? '😰' : '💦');
        }
        prevCleanRef.current[roomId] = cur;
      }
    });
  }, [addReaction]);

  // Watch task completions
  useEffect(() => {
    return useStore.subscribe((state) => {
      for (const task of state.tasks) {
        if (task.status === 'completed' && !prevCompletedRef.current.has(task.id)) {
          prevCompletedRef.current.add(task.id);
          addReaction('👍');
        }
      }
      // Prune stale IDs
      const currentIds = new Set(state.tasks.map((t) => t.id));
      for (const id of prevCompletedRef.current) {
        if (!currentIds.has(id)) prevCompletedRef.current.delete(id);
      }
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
