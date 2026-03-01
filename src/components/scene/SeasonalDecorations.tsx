import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../../stores/useStore';
import * as THREE from 'three';

const S = 2;

// Window frame positions for icicles / decorations
const windowFrames: { position: [number, number, number]; rotation: number }[] = [
  { position: [-7.8 * S, 2.0 * S, -7 * S], rotation: Math.PI / 2 },
  { position: [-7.8 * S, 2.0 * S, -5 * S], rotation: Math.PI / 2 },
  { position: [3 * S, 2.0 * S, -9.8 * S], rotation: 0 },
  { position: [5.5 * S, 2.0 * S, -9.8 * S], rotation: 0 },
  { position: [7.8 * S, 2.0 * S, -7 * S], rotation: Math.PI / 2 },
  { position: [-5 * S, 2.0 * S, 7.8 * S], rotation: 0 },
  { position: [-3 * S, 2.0 * S, 7.8 * S], rotation: 0 },
  { position: [7.8 * S, 2.0 * S, 5 * S], rotation: Math.PI / 2 },
  { position: [4 * S, 2.0 * S, 7.8 * S], rotation: 0 },
];

// Particle spawn zones near windows (outside / just inside)
const particleZones: { center: [number, number, number]; size: [number, number, number] }[] = [
  { center: [-7 * S, 1.8 * S, -6 * S], size: [3 * S, 3 * S, 4 * S] },
  { center: [4.5 * S, 1.8 * S, -9 * S], size: [5 * S, 3 * S, 3 * S] },
  { center: [7 * S, 1.8 * S, -7 * S], size: [3 * S, 3 * S, 3 * S] },
  { center: [-4 * S, 1.8 * S, 7 * S], size: [4 * S, 3 * S, 3 * S] },
  { center: [7 * S, 1.8 * S, 5 * S], size: [3 * S, 3 * S, 3 * S] },
  { center: [4 * S, 1.8 * S, 7 * S], size: [3 * S, 3 * S, 3 * S] },
];

const PARTICLE_COUNT = 200;

// ─── Winter: snowflakes + icicles + ground snow + frost on windows ────────

function Snowflakes() {
  const pointsRef = useRef<THREE.Points>(null);
  const simSpeed = useStore((s) => s.simSpeed);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const zone = particleZones[i % particleZones.length];
      const i3 = i * 3;
      pos[i3] = zone.center[0] + (Math.random() - 0.5) * zone.size[0];
      pos[i3 + 1] = zone.center[1] + Math.random() * zone.size[1];
      pos[i3 + 2] = zone.center[2] + (Math.random() - 0.5) * zone.size[2];
      vel[i3] = (Math.random() - 0.5) * 0.3;
      vel[i3 + 1] = -(0.5 + Math.random() * 0.8); // falling
      vel[i3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current || simSpeed === 0) return;
    const dt = Math.min(delta, 0.05);
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const zone = particleZones[i % particleZones.length];
      const wobble = Math.sin(Date.now() * 0.002 + i * 1.3) * 0.3;

      arr[i3] += (velocities[i3] + wobble) * dt;
      arr[i3 + 1] += velocities[i3 + 1] * dt;
      arr[i3 + 2] += (velocities[i3 + 2] + wobble * 0.5) * dt;

      if (arr[i3 + 1] < 0) {
        arr[i3] = zone.center[0] + (Math.random() - 0.5) * zone.size[0];
        arr[i3 + 1] = zone.center[1] + zone.size[1] * 0.5;
        arr[i3 + 2] = zone.center[2] + (Math.random() - 0.5) * zone.size[2];
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        transparent
        opacity={0.7}
        color="#e8f0ff"
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Icicles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const iciclesPerWindow = 5;
  const count = windowFrames.length * iciclesPerWindow;

  useMemo(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    let idx = 0;

    for (const frame of windowFrames) {
      for (let j = 0; j < iciclesPerWindow; j++) {
        const offset = (j - (iciclesPerWindow - 1) / 2) * 0.4 * S;
        const len = 0.2 * S + Math.random() * 0.3 * S;

        dummy.position.set(
          frame.position[0] + (frame.rotation === 0 ? offset : 0),
          frame.position[1] - len * 0.5,
          frame.position[2] + (frame.rotation !== 0 ? offset : 0),
        );
        dummy.scale.set(0.06 * S, len, 0.06 * S);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(idx, dummy.matrix);
        idx++;
      }
    }
    meshRef.current!.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <coneGeometry args={[1, 1, 6]} />
      <meshStandardMaterial
        color="#c8e8ff"
        transparent
        opacity={0.6}
        roughness={0.1}
        metalness={0.3}
      />
    </instancedMesh>
  );
}

/** Thin white plane on the ground to simulate snow accumulation */
function GroundSnow() {
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[18 * S, 18 * S]} />
      <meshStandardMaterial
        color="#e8f4ff"
        transparent
        opacity={0.35}
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}

/** Frost overlay on window panes */
function WindowFrost() {
  return (
    <group>
      {windowFrames.map((frame, i) => (
        <mesh
          key={i}
          position={[
            frame.position[0] + (frame.rotation === Math.PI / 2 ? (frame.position[0] > 0 ? -0.05 : 0.05) : 0),
            frame.position[1],
            frame.position[2] + (frame.rotation === 0 ? (frame.position[2] > 0 ? -0.05 : 0.05) : 0),
          ]}
          rotation={[0, frame.rotation, 0]}
        >
          <planeGeometry args={[1.2 * S, 1.4 * S]} />
          <meshStandardMaterial
            color="#d0e8ff"
            transparent
            opacity={0.25}
            roughness={0.05}
            metalness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function WinterDecorations() {
  return (
    <group>
      <Snowflakes />
      <Icicles />
      <GroundSnow />
      <WindowFrost />
    </group>
  );
}

// ─── Spring: flower petals + green grass ────────────────────────────────────

function SpringParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const simSpeed = useStore((s) => s.simSpeed);

  const petalColors = useMemo(
    () => ['#ffb7c5', '#ff91a4', '#ffd1dc', '#c8e6c9', '#a5d6a7', '#81c784'],
    [],
  );

  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const zone = particleZones[i % particleZones.length];
      const i3 = i * 3;
      pos[i3] = zone.center[0] + (Math.random() - 0.5) * zone.size[0];
      pos[i3 + 1] = zone.center[1] + Math.random() * zone.size[1];
      pos[i3 + 2] = zone.center[2] + (Math.random() - 0.5) * zone.size[2];

      vel[i3] = (Math.random() - 0.5) * 0.4;
      vel[i3 + 1] = -(0.15 + Math.random() * 0.3);
      vel[i3 + 2] = (Math.random() - 0.5) * 0.4;

      const c = new THREE.Color(petalColors[i % petalColors.length]);
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }
    return { positions: pos, velocities: vel, colors: col };
  }, [petalColors]);

  useFrame((_, delta) => {
    if (!pointsRef.current || simSpeed === 0) return;
    const dt = Math.min(delta, 0.05);
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const zone = particleZones[i % particleZones.length];
      const t = Date.now() * 0.001 + i * 0.8;
      const sway = Math.sin(t) * 0.5;

      arr[i3] += (velocities[i3] + sway) * dt;
      arr[i3 + 1] += velocities[i3 + 1] * dt;
      arr[i3 + 2] += (velocities[i3 + 2] + Math.cos(t * 0.7) * 0.3) * dt;

      if (arr[i3 + 1] < 0) {
        arr[i3] = zone.center[0] + (Math.random() - 0.5) * zone.size[0];
        arr[i3 + 1] = zone.center[1] + zone.size[1] * 0.5;
        arr[i3 + 2] = zone.center[2] + (Math.random() - 0.5) * zone.size[2];
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        transparent
        opacity={0.65}
        vertexColors
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/** Green grass tint on the ground for spring */
function SpringGrass() {
  return (
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[18 * S, 18 * S]} />
      <meshStandardMaterial
        color="#4a8c3f"
        transparent
        opacity={0.15}
        roughness={0.95}
        metalness={0}
      />
    </mesh>
  );
}

function SpringDecorations() {
  return (
    <group>
      <SpringParticles />
      <SpringGrass />
    </group>
  );
}

// ─── Summer: sun rays + heat shimmer + dry grass ─────────────────────────

function SunBeams() {
  const groupRef = useRef<THREE.Group>(null);
  const simMinutes = useStore((s) => s.simMinutes);

  const hour = (simMinutes % 1440) / 60;
  const intensity = hour >= 8 && hour < 17
    ? 0.3 + Math.sin(((hour - 8) / 9) * Math.PI) * 0.4
    : 0;

  return (
    <group ref={groupRef}>
      {intensity > 0 && windowFrames.map((frame, i) => {
        const beamLength = 4 * S;
        const inwardX = frame.rotation === Math.PI / 2
          ? (frame.position[0] > 0 ? -1 : 1) * 1.5 * S
          : 0;
        const inwardZ = frame.rotation === 0
          ? (frame.position[2] > 0 ? -1 : 1) * 1.5 * S
          : 0;

        return (
          <mesh
            key={i}
            position={[
              frame.position[0] + inwardX * 0.5,
              frame.position[1] - 0.8 * S,
              frame.position[2] + inwardZ * 0.5,
            ]}
            rotation={[
              frame.rotation === 0 ? -0.4 : 0,
              0,
              frame.rotation === Math.PI / 2 ? (frame.position[0] > 0 ? 0.4 : -0.4) : 0,
            ]}
          >
            <planeGeometry args={[1.0 * S, beamLength]} />
            <meshBasicMaterial
              color="#fff8e0"
              transparent
              opacity={intensity * 0.15}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Heat shimmer effect — wavy distortion planes above the floor */
function HeatShimmer() {
  const groupRef = useRef<THREE.Group>(null);
  const simMinutes = useStore((s) => s.simMinutes);

  const hour = (simMinutes % 1440) / 60;
  const active = hour >= 10 && hour < 16;

  useFrame(({ clock }) => {
    if (!groupRef.current || !active) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = 0.3 * S + Math.sin(t * 0.8) * 0.05 * S;
    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshBasicMaterial;
        material.opacity = 0.03 + Math.sin(t * 1.2 + i * 2) * 0.015;
      }
    });
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {[0, 0.15, 0.3].map((yOff, i) => (
        <mesh key={i} position={[0, yOff * S, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[14 * S, 14 * S]} />
          <meshBasicMaterial
            color="#fffbe6"
            transparent
            opacity={0.03}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Dry yellowish grass tint for summer */
function DryGrass() {
  return (
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[18 * S, 18 * S]} />
      <meshStandardMaterial
        color="#c4a43a"
        transparent
        opacity={0.12}
        roughness={0.95}
        metalness={0}
      />
    </mesh>
  );
}

function SummerDecorations() {
  return (
    <group>
      <SunBeams />
      <HeatShimmer />
      <DryGrass />
    </group>
  );
}

// ─── Fall: falling leaves + wind particles ──────────────────────────────────

function FallLeaves() {
  const pointsRef = useRef<THREE.Points>(null);
  const simSpeed = useStore((s) => s.simSpeed);

  const leafColors = useMemo(
    () => ['#d4520a', '#e8780a', '#c4430a', '#a0522d', '#b8651a', '#cc7722'],
    [],
  );

  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const zone = particleZones[i % particleZones.length];
      const i3 = i * 3;
      pos[i3] = zone.center[0] + (Math.random() - 0.5) * zone.size[0];
      pos[i3 + 1] = zone.center[1] + Math.random() * zone.size[1];
      pos[i3 + 2] = zone.center[2] + (Math.random() - 0.5) * zone.size[2];

      vel[i3] = (Math.random() - 0.5) * 0.6;
      vel[i3 + 1] = -(0.3 + Math.random() * 0.5);
      vel[i3 + 2] = (Math.random() - 0.5) * 0.6;

      const c = new THREE.Color(leafColors[i % leafColors.length]);
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }
    return { positions: pos, velocities: vel, colors: col };
  }, [leafColors]);

  useFrame((_, delta) => {
    if (!pointsRef.current || simSpeed === 0) return;
    const dt = Math.min(delta, 0.05);
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const zone = particleZones[i % particleZones.length];
      const t = Date.now() * 0.001 + i * 1.1;
      const sway = Math.sin(t) * 0.8;
      const flutter = Math.cos(t * 2.3) * 0.3;

      arr[i3] += (velocities[i3] + sway) * dt;
      arr[i3 + 1] += velocities[i3 + 1] * dt;
      arr[i3 + 2] += (velocities[i3 + 2] + flutter) * dt;

      if (arr[i3 + 1] < 0) {
        arr[i3] = zone.center[0] + (Math.random() - 0.5) * zone.size[0];
        arr[i3 + 1] = zone.center[1] + zone.size[1] * 0.5;
        arr[i3 + 2] = zone.center[2] + (Math.random() - 0.5) * zone.size[2];
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.18}
        transparent
        opacity={0.75}
        vertexColors
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/** Wind particle streaks — small fast-moving specs in the air */
function WindParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const simSpeed = useStore((s) => s.simSpeed);
  const WIND_COUNT = 80;

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(WIND_COUNT * 3);
    const vel = new Float32Array(WIND_COUNT * 3);
    for (let i = 0; i < WIND_COUNT; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 16 * S;
      pos[i3 + 1] = 0.5 * S + Math.random() * 3 * S;
      pos[i3 + 2] = (Math.random() - 0.5) * 16 * S;
      vel[i3] = 1.5 + Math.random() * 1.5;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.3;
      vel[i3 + 2] = 0.8 + Math.random() * 0.8;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current || simSpeed === 0) return;
    const dt = Math.min(delta, 0.05);
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < WIND_COUNT; i++) {
      const i3 = i * 3;
      arr[i3] += velocities[i3] * dt;
      arr[i3 + 1] += velocities[i3 + 1] * dt;
      arr[i3 + 2] += velocities[i3 + 2] * dt;

      if (arr[i3] > 8 * S) arr[i3] = -8 * S;
      if (arr[i3 + 2] > 8 * S) arr[i3 + 2] = -8 * S;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        transparent
        opacity={0.3}
        color="#d4c9b0"
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function FallDecorations() {
  return (
    <group>
      <FallLeaves />
      <WindParticles />
    </group>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function SeasonalDecorations() {
  const enabled = useStore((s) => s.seasonalDecorations);
  const season = useStore((s) => s.currentSeason);

  if (!enabled) return null;

  switch (season) {
    case 'winter':
      return <WinterDecorations />;
    case 'spring':
      return <SpringDecorations />;
    case 'summer':
      return <SummerDecorations />;
    case 'fall':
      return <FallDecorations />;
  }
}
