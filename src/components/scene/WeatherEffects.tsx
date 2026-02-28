import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../stores/useStore';

const S = 2;

// Window positions and orientations for rain/snow overlays
const windowDefs = [
  // Living room west wall
  { pos: [-7.8 * S, 1.2 * S, -7 * S] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
  { pos: [-7.8 * S, 1.2 * S, -5 * S] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
  // Kitchen north wall
  { pos: [3 * S, 1.2 * S, -9.8 * S] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
  { pos: [5.5 * S, 1.2 * S, -9.8 * S] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
  // Kitchen east wall
  { pos: [7.8 * S, 1.2 * S, -7 * S] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
  // Bedroom south wall
  { pos: [-5 * S, 1.2 * S, 7.8 * S] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
  { pos: [-3 * S, 1.2 * S, 7.8 * S] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
  // Bathroom east wall
  { pos: [7.8 * S, 1.2 * S, 5 * S] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
  // Bathroom south wall
  { pos: [4 * S, 1.2 * S, 7.8 * S] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
];

const RAIN_COUNT = 18; // droplets per window
const SNOW_COUNT = 12; // snowflakes per window

// ── Rain droplets on window surface ──
function RainOnWindow({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const dropletsRef = useRef<THREE.InstancedMesh>(null);

  const dropletData = useMemo(() => {
    const data: { x: number; y: number; speed: number; length: number; offset: number }[] = [];
    for (let i = 0; i < RAIN_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * 1.1 * S,
        y: (Math.random() - 0.5) * 1.3 * S,
        speed: 0.4 + Math.random() * 0.6,
        length: 0.06 + Math.random() * 0.12,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!dropletsRef.current) return;
    const t = clock.getElapsedTime();

    for (let i = 0; i < RAIN_COUNT; i++) {
      const d = dropletData[i];
      // Droplets slide down the window surface, wrap around
      const yPos = ((d.y - t * d.speed + d.offset) % (1.4 * S));
      const wrappedY = yPos > 0 ? yPos - 0.7 * S : yPos + 0.7 * S;

      dummy.position.set(d.x, wrappedY, 0.02);
      dummy.scale.set(0.008 * S, d.length * S, 0.004 * S);
      dummy.updateMatrix();
      dropletsRef.current.setMatrixAt(i, dummy.matrix);
    }
    dropletsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <instancedMesh ref={dropletsRef} args={[undefined, undefined, RAIN_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#a0c8e8"
          transparent
          opacity={0.5}
          roughness={0.1}
          metalness={0.3}
        />
      </instancedMesh>
    </group>
  );
}

// ── Snow particles floating outside, visible through windows ──
function SnowOnWindow({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const flakesRef = useRef<THREE.InstancedMesh>(null);

  const flakeData = useMemo(() => {
    const data: { x: number; y: number; z: number; speed: number; drift: number; size: number; offset: number }[] = [];
    for (let i = 0; i < SNOW_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * 1.2 * S,
        y: (Math.random() - 0.5) * 1.4 * S,
        z: -0.1 - Math.random() * 0.8, // behind the window pane
        speed: 0.15 + Math.random() * 0.2,
        drift: (Math.random() - 0.5) * 0.3,
        size: 0.02 + Math.random() * 0.03,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!flakesRef.current) return;
    const t = clock.getElapsedTime();

    for (let i = 0; i < SNOW_COUNT; i++) {
      const f = flakeData[i];
      const yPos = ((f.y - t * f.speed + f.offset * 4) % (1.4 * S));
      const wrappedY = yPos > 0 ? yPos - 0.7 * S : yPos + 0.7 * S;
      const xDrift = f.x + Math.sin(t * 0.5 + f.offset) * f.drift * S;

      dummy.position.set(xDrift, wrappedY, f.z * S);
      const s = f.size * S;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      flakesRef.current.setMatrixAt(i, dummy.matrix);
    }
    flakesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <instancedMesh ref={flakesRef} args={[undefined, undefined, SNOW_COUNT]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.8}
          emissive="#ffffff"
          emissiveIntensity={0.2}
        />
      </instancedMesh>
    </group>
  );
}

export function WeatherEffects() {
  const weather = useStore((s) => s.weather);

  if (weather === 'sunny') return null;

  return (
    <group>
      {windowDefs.map((w, i) =>
        weather === 'rainy' ? (
          <RainOnWindow key={`rain-${i}`} position={w.pos} rotation={w.rot} />
        ) : (
          <SnowOnWindow key={`snow-${i}`} position={w.pos} rotation={w.rot} />
        )
      )}
    </group>
  );
}
