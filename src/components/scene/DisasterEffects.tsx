import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../stores/useStore';
import { useAccessibility } from '../../stores/useAccessibility';
import { getRoomCenter } from '../../utils/homeLayout';
import type { RoomId } from '../../types';

const S = 2;

// ── Fire Particles ────────────────────────────────────────

const FIRE_COUNT = 80;

function FireEffect({ roomId, severity }: { roomId: RoomId; severity: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const center = useMemo(() => getRoomCenter(roomId), [roomId]);

  const { positions, velocities, lifetimes } = useMemo(() => {
    const pos = new Float32Array(FIRE_COUNT * 3);
    const vel = new Float32Array(FIRE_COUNT * 3);
    const life = new Float32Array(FIRE_COUNT);

    for (let i = 0; i < FIRE_COUNT; i++) {
      const i3 = i * 3;
      pos[i3] = center[0] + (Math.random() - 0.5) * 3 * S;
      pos[i3 + 1] = 0.1 + Math.random() * 1.5 * S;
      pos[i3 + 2] = center[2] + (Math.random() - 0.5) * 3 * S;

      vel[i3] = (Math.random() - 0.5) * 0.3;
      vel[i3 + 1] = 0.5 + Math.random() * 1.5;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.3;

      life[i] = Math.random();
    }
    return { positions: pos, velocities: vel, lifetimes: life };
  }, [center]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const scaledDelta = Math.min(delta, 0.05);

    for (let i = 0; i < FIRE_COUNT; i++) {
      const i3 = i * 3;
      lifetimes[i] -= scaledDelta * (0.4 + Math.random() * 0.3);

      if (lifetimes[i] <= 0) {
        // Reset particle
        arr[i3] = center[0] + (Math.random() - 0.5) * 2 * severity * S;
        arr[i3 + 1] = 0.1;
        arr[i3 + 2] = center[2] + (Math.random() - 0.5) * 2 * severity * S;
        lifetimes[i] = 0.7 + Math.random() * 0.3;
        velocities[i3 + 1] = 0.5 + Math.random() * 1.5;
      } else {
        arr[i3] += velocities[i3] * scaledDelta;
        arr[i3 + 1] += velocities[i3 + 1] * scaledDelta * severity;
        arr[i3 + 2] += velocities[i3 + 2] * scaledDelta;
        // Slight turbulence
        arr[i3] += Math.sin(Date.now() * 0.005 + i) * 0.01;
      }
    }

    posAttr.needsUpdate = true;

    // Pulsing glow
    if (glowRef.current) {
      const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.3;
      glowRef.current.intensity = severity * 2.5 * pulse;
    }

    // Color shifts with severity
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    const t = (Math.sin(Date.now() * 0.004) + 1) / 2;
    if (severity >= 3) {
      mat.color.lerpColors(new THREE.Color('#ff4400'), new THREE.Color('#ffcc00'), t);
    } else if (severity >= 2) {
      mat.color.lerpColors(new THREE.Color('#ff6600'), new THREE.Color('#ff9900'), t);
    } else {
      mat.color.lerpColors(new THREE.Color('#ff8800'), new THREE.Color('#ffaa33'), t);
    }
    mat.opacity = 0.6 + severity * 0.1;
    mat.size = 0.15 + severity * 0.05;
  });

  return (
    <group>
      <pointLight
        ref={glowRef}
        position={[center[0], 1.5 * S, center[2]]}
        color="#ff6622"
        intensity={severity * 2}
        distance={8 * S}
        decay={2}
      />
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.2}
          transparent
          opacity={0.7}
          color="#ff7700"
          depthWrite={false}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// ── Flood Water Plane ────────────────────────────────────────

function FloodEffect({ roomId, severity }: { roomId: RoomId; severity: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const center = useMemo(() => getRoomCenter(roomId), [roomId]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    // Water level rises with severity
    const targetHeight = severity * 0.15 * S;
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      targetHeight,
      0.02,
    );

    // Gentle wave motion
    meshRef.current.position.x = center[0] + Math.sin(t * 0.8) * 0.05;
    meshRef.current.position.z = center[2] + Math.cos(t * 0.6) * 0.05;

    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = 0.35 + severity * 0.1;
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[center[0], 0.05, center[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[5 * S, 5 * S, 8, 8]} />
        <meshStandardMaterial
          color="#3388cc"
          transparent
          opacity={0.4}
          roughness={0.1}
          metalness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Water reflection/highlight */}
      <pointLight
        position={[center[0], 0.5 * S, center[2]]}
        color="#4499dd"
        intensity={severity * 0.8}
        distance={6 * S}
        decay={2}
      />
    </group>
  );
}

// ── Earthquake Shake ────────────────────────────────────────

function EarthquakeEffect({ severity }: { severity: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;

    const intensity = severity * 0.04 * S;
    const speed = 15 + severity * 10;
    const t = Date.now() * 0.001;

    // Shake the entire scene root
    groupRef.current.position.x = Math.sin(t * speed) * intensity;
    groupRef.current.position.z = Math.cos(t * speed * 1.3) * intensity * 0.7;
    groupRef.current.position.y = Math.sin(t * speed * 0.7) * intensity * 0.3;

    groupRef.current.rotation.z = Math.sin(t * speed * 0.9) * intensity * 0.01;
  });

  // We render an invisible group that applies CSS shake via the canvas
  // The actual scene shake happens through an HTML overlay
  return <group ref={groupRef} />;
}

// ── Falling Debris Particles (Earthquake) ────────────────────

const DEBRIS_COUNT = 40;

function DebrisEffect({ roomId, severity }: { roomId: RoomId; severity: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const center = useMemo(() => getRoomCenter(roomId), [roomId]);

  const { positions, velocities, lifetimes } = useMemo(() => {
    const pos = new Float32Array(DEBRIS_COUNT * 3);
    const vel = new Float32Array(DEBRIS_COUNT * 3);
    const life = new Float32Array(DEBRIS_COUNT);

    for (let i = 0; i < DEBRIS_COUNT; i++) {
      const i3 = i * 3;
      pos[i3] = center[0] + (Math.random() - 0.5) * 4 * S;
      pos[i3 + 1] = 2 * S + Math.random() * 1 * S;
      pos[i3 + 2] = center[2] + (Math.random() - 0.5) * 4 * S;
      vel[i3] = (Math.random() - 0.5) * 0.5;
      vel[i3 + 1] = -(1 + Math.random() * 2);
      vel[i3 + 2] = (Math.random() - 0.5) * 0.5;
      life[i] = Math.random();
    }
    return { positions: pos, velocities: vel, lifetimes: life };
  }, [center]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const sd = Math.min(delta, 0.05);

    for (let i = 0; i < DEBRIS_COUNT; i++) {
      const i3 = i * 3;
      lifetimes[i] -= sd * 0.5;

      if (lifetimes[i] <= 0 || arr[i3 + 1] < 0) {
        arr[i3] = center[0] + (Math.random() - 0.5) * 4 * severity * S;
        arr[i3 + 1] = 2 * S + Math.random() * S;
        arr[i3 + 2] = center[2] + (Math.random() - 0.5) * 4 * severity * S;
        lifetimes[i] = 0.6 + Math.random() * 0.4;
      } else {
        arr[i3] += velocities[i3] * sd;
        arr[i3 + 1] += velocities[i3 + 1] * sd * severity;
        arr[i3 + 2] += velocities[i3 + 2] * sd;
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
        color="#887766"
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ── Main Export ────────────────────────────────────────

export function DisasterEffects() {
  const disaster = useStore((s) => s.activeDisaster);
  const reducedMotion = useAccessibility((s) => s.reducedMotion);

  if (!disaster || reducedMotion) return null;

  const { type, roomId, severity } = disaster;

  return (
    <group>
      {type === 'fire' && <FireEffect roomId={roomId} severity={severity} />}
      {type === 'flood' && <FloodEffect roomId={roomId} severity={severity} />}
      {type === 'earthquake' && (
        <>
          <EarthquakeEffect severity={severity} />
          <DebrisEffect roomId={roomId} severity={severity} />
        </>
      )}
    </group>
  );
}
