import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../stores/useStore';

// Module-level mutable state for 3D→2D projection (avoids per-frame re-renders)
export const screenPos = { x: 0, y: 0 };

/** Mount inside <Canvas>. Projects robot head position to screen coords each frame. */
export function RobotScreenTracker() {
  const { camera, size } = useThree();
  const vec = useRef(new THREE.Vector3());

  useFrame(() => {
    const _s = useStore.getState();
    const pos = _s.robots[_s.activeRobotId].position;
    // Robot head is roughly 2.5 units above ground (scale 1.55, head ~y=1.6)
    vec.current.set(pos[0], pos[1] + 2.5, pos[2]);
    vec.current.project(camera);
    screenPos.x = ((vec.current.x + 1) / 2) * size.width;
    screenPos.y = ((-vec.current.y + 1) / 2) * size.height;
  });

  return null;
}
