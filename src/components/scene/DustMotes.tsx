import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../../stores/useStore';
import { useAccessibility } from '../../stores/useAccessibility';
import * as THREE from 'three';

const S = 2;
const MOTE_COUNT = 120;

// Sunbeam zones near windows where dust motes are visible
const sunbeamZones: { center: [number, number, number]; size: [number, number, number] }[] = [
  // Living room — west windows casting light inward
  { center: [-6.5 * S, 1.2 * S, -6 * S], size: [3 * S, 2 * S, 4 * S] },
  // Kitchen — north windows
  { center: [4 * S, 1.2 * S, -8 * S], size: [5 * S, 2 * S, 3 * S] },
  // Bedroom — south windows
  { center: [-4 * S, 1.2 * S, 6 * S], size: [4 * S, 2 * S, 3 * S] },
  // Bathroom — east window
  { center: [6.5 * S, 1.2 * S, 5 * S], size: [2.5 * S, 2 * S, 3 * S] },
];

function getDustVisibility(simMinutes: number): { opacity: number; color: THREE.Color } {
  const hour = (simMinutes % 1440) / 60;

  // Dust motes only visible when sunlight streams in
  if (hour >= 7 && hour < 10) {
    // Morning sun — warm golden motes
    const t = (hour - 7) / 3;
    return { opacity: 0.15 + t * 0.2, color: new THREE.Color('#ffe8b0') };
  }
  if (hour >= 10 && hour < 15) {
    // Midday — bright white motes, peak visibility
    return { opacity: 0.3, color: new THREE.Color('#fff8e8') };
  }
  if (hour >= 15 && hour < 18) {
    // Afternoon — warm amber, fading
    const t = (hour - 15) / 3;
    return { opacity: 0.25 * (1 - t * 0.7), color: new THREE.Color('#ffd890') };
  }
  // Night / early morning — no visible motes
  return { opacity: 0, color: new THREE.Color('#ffffff') };
}

export function DustMotes() {
  const pointsRef = useRef<THREE.Points>(null);
  const simMinutes = useStore((s) => s.simMinutes);
  const simSpeed = useStore((s) => s.simSpeed);
  const reducedMotion = useAccessibility((s) => s.reducedMotion);

  // Hide particles entirely in reduced motion mode
  if (reducedMotion) return null;

  // Generate random positions within sunbeam zones
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(MOTE_COUNT * 3);
    const vel = new Float32Array(MOTE_COUNT * 3);

    for (let i = 0; i < MOTE_COUNT; i++) {
      const zone = sunbeamZones[i % sunbeamZones.length];
      const i3 = i * 3;
      pos[i3] = zone.center[0] + (Math.random() - 0.5) * zone.size[0];
      pos[i3 + 1] = zone.center[1] + (Math.random() - 0.5) * zone.size[1];
      pos[i3 + 2] = zone.center[2] + (Math.random() - 0.5) * zone.size[2];

      // Slow drifting velocities
      vel[i3] = (Math.random() - 0.5) * 0.02;
      vel[i3 + 1] = (Math.random() - 0.3) * 0.01; // slight upward bias
      vel[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    return { positions: pos, velocities: vel };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current || simSpeed === 0) return;

    const scaledDelta = Math.min(delta * simSpeed, 0.1);
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < MOTE_COUNT; i++) {
      const i3 = i * 3;
      const zone = sunbeamZones[i % sunbeamZones.length];

      // Drift with slight sinusoidal wobble
      const wobble = Math.sin(Date.now() * 0.001 + i * 0.7) * 0.005;
      arr[i3] += (velocities[i3] + wobble) * scaledDelta * 60;
      arr[i3 + 1] += velocities[i3 + 1] * scaledDelta * 60;
      arr[i3 + 2] += (velocities[i3 + 2] + wobble * 0.7) * scaledDelta * 60;

      // Wrap around within zone bounds
      for (let axis = 0; axis < 3; axis++) {
        const min = zone.center[axis] - zone.size[axis] * 0.5;
        const max = zone.center[axis] + zone.size[axis] * 0.5;
        if (arr[i3 + axis] < min) arr[i3 + axis] = max;
        if (arr[i3 + axis] > max) arr[i3 + axis] = min;
      }
    }

    posAttr.needsUpdate = true;

    // Update visibility based on time of day
    const { opacity, color } = getDustVisibility(simMinutes);
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = opacity;
    mat.color.copy(color);
  });

  const { opacity, color } = getDustVisibility(simMinutes);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        transparent
        opacity={opacity}
        color={color}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
