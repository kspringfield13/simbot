import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../stores/useStore';
import { PET_CONFIGS } from '../../config/pets';

// ── Fish Tank ─────────────────────────────────────────────────
// Glass box with water, animated fish swimming inside, soft glow

function Fish({ index, tankWidth, tankDepth, tankHeight: _tankHeight }: { index: number; tankWidth: number; tankDepth: number; tankHeight: number }) {
  const ref = useRef<THREE.Group>(null);
  const speed = 0.4 + index * 0.15;
  const yBase = 0.3 + (index % 3) * 0.25;
  const phase = index * Math.PI * 0.7;
  const radiusX = (tankWidth * 0.35) - index * 0.05;
  const radiusZ = (tankDepth * 0.35) - index * 0.03;

  // Fish colors
  const colors = ['#ff6b35', '#ffd166', '#ef476f', '#06d6a0', '#118ab2'];
  const color = colors[index % colors.length];

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001 * speed + phase;
    ref.current.position.x = Math.sin(t) * radiusX;
    ref.current.position.z = Math.cos(t) * radiusZ;
    ref.current.position.y = yBase + Math.sin(t * 1.5) * 0.08;
    // Face swimming direction
    ref.current.rotation.y = Math.atan2(
      Math.cos(t) * radiusX,
      -Math.sin(t) * radiusZ,
    );
    // Subtle tail wiggle via slight z rotation
    ref.current.rotation.z = Math.sin(t * 4) * 0.15;
  });

  return (
    <group ref={ref}>
      {/* Body */}
      <mesh>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Tail */}
      <mesh position={[-0.1, 0, 0]}>
        <coneGeometry args={[0.06, 0.1, 4]} />
        <meshStandardMaterial color={color} roughness={0.4} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function FishTank() {
  const config = PET_CONFIGS.fish;
  const waterRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const happiness = useStore((s) => s.petStates.fish.happiness);

  const tankW = 1.8;
  const tankD = 0.8;
  const tankH = 1.2;

  // Water shimmer animation
  useFrame(() => {
    if (waterRef.current) {
      const mat = waterRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.35 + Math.sin(performance.now() * 0.001) * 0.05;
    }
    if (glowRef.current) {
      glowRef.current.intensity = 0.3 + Math.sin(performance.now() * 0.0008) * 0.1;
    }
  });

  // Number of visible fish scales with happiness
  const fishCount = happiness > 60 ? 5 : happiness > 30 ? 3 : 2;

  return (
    <group position={config.position}>
      {/* Tank stand */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[tankW + 0.1, 0.7, tankD + 0.1]} />
        <meshStandardMaterial color="#3d3530" roughness={0.8} />
      </mesh>

      {/* Glass walls - transparent box */}
      <mesh position={[0, 0.7 + tankH / 2, 0]}>
        <boxGeometry args={[tankW, tankH, tankD]} />
        <meshStandardMaterial
          color="#88ccee"
          transparent
          opacity={0.15}
          roughness={0.05}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Water fill */}
      <mesh ref={waterRef} position={[0, 0.7 + tankH * 0.45, 0]}>
        <boxGeometry args={[tankW - 0.04, tankH * 0.85, tankD - 0.04]} />
        <meshStandardMaterial
          color="#1a8fba"
          transparent
          opacity={0.35}
          roughness={0.1}
        />
      </mesh>

      {/* Gravel bottom */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[tankW - 0.06, 0.08, tankD - 0.06]} />
        <meshStandardMaterial color="#8b7355" roughness={0.9} />
      </mesh>

      {/* Small decorative plant */}
      <mesh position={[0.5, 0.95, 0.15]}>
        <coneGeometry args={[0.08, 0.35, 5]} />
        <meshStandardMaterial color="#2d8a4e" roughness={0.7} />
      </mesh>
      <mesh position={[-0.4, 0.92, -0.1]}>
        <coneGeometry args={[0.06, 0.28, 5]} />
        <meshStandardMaterial color="#3ca55e" roughness={0.7} />
      </mesh>

      {/* Fish */}
      <group position={[0, 0.7, 0]}>
        {Array.from({ length: fishCount }).map((_, i) => (
          <Fish key={i} index={i} tankWidth={tankW} tankDepth={tankD} tankHeight={tankH} />
        ))}
      </group>

      {/* Underwater glow */}
      <pointLight
        ref={glowRef}
        color="#44aadd"
        intensity={0.3}
        distance={4}
        position={[0, 1.2, 0]}
      />

      {/* Happiness indicator - bubbles when happy */}
      {happiness > 50 && <Bubbles tankH={tankH} />}
    </group>
  );
}

function Bubbles({ tankH }: { tankH: number }) {
  const bubblesRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!bubblesRef.current) return;
    bubblesRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      mesh.position.y += 0.008;
      if (mesh.position.y > tankH * 0.85) {
        mesh.position.y = 0.1;
        mesh.position.x = (Math.random() - 0.5) * 0.6;
      }
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.3 + Math.sin(performance.now() * 0.003 + i) * 0.15;
    });
  });

  return (
    <group ref={bubblesRef} position={[0, 0.75, 0]}>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[(Math.random() - 0.5) * 0.6, Math.random() * 0.5, (Math.random() - 0.5) * 0.2]}>
          <sphereGeometry args={[0.02 + Math.random() * 0.02, 6, 6]} />
          <meshStandardMaterial color="#aaddff" transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

// ── Hamster in Wheel ──────────────────────────────────────────

function HamsterWheel() {
  const config = PET_CONFIGS.hamster;
  const wheelRef = useRef<THREE.Group>(null);
  const hamsterRef = useRef<THREE.Group>(null);
  const happiness = useStore((s) => s.petStates.hamster.happiness);

  // Wheel spins faster when hamster is happy
  const spinSpeed = happiness > 60 ? 2.0 : happiness > 30 ? 1.0 : 0.3;

  useFrame(() => {
    if (wheelRef.current) {
      wheelRef.current.rotation.z += 0.01 * spinSpeed;
    }
    if (hamsterRef.current) {
      // Hamster bobs slightly as it "runs"
      hamsterRef.current.position.y = Math.sin(performance.now() * 0.006 * spinSpeed) * 0.02;
    }
  });

  const wheelRadius = 0.45;

  return (
    <group position={config.position}>
      {/* Cage base */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[1.2, 0.3, 0.8]} />
        <meshStandardMaterial color="#d4c8a0" roughness={0.85} />
      </mesh>

      {/* Cage walls - wireframe effect */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.2, 0.9, 0.8]} />
        <meshStandardMaterial
          color="#cccccc"
          transparent
          opacity={0.08}
          wireframe
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wheel frame/axle stand */}
      <mesh position={[0.25, 0.35, 0.3]}>
        <boxGeometry args={[0.06, 0.5, 0.06]} />
        <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.25, 0.35, -0.3]}>
        <boxGeometry args={[0.06, 0.5, 0.06]} />
        <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Spinning wheel */}
      <group ref={wheelRef} position={[0.25, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Wheel rim */}
        <mesh>
          <torusGeometry args={[wheelRadius, 0.03, 8, 24]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Wheel spokes */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * wheelRadius * 0.5, Math.sin(angle) * wheelRadius * 0.5, 0]} rotation={[0, 0, angle]}>
              <boxGeometry args={[wheelRadius, 0.015, 0.015]} />
              <meshStandardMaterial color="#bbbbbb" metalness={0.4} roughness={0.4} />
            </mesh>
          );
        })}
        {/* Wheel running surface */}
        <mesh>
          <cylinderGeometry args={[wheelRadius - 0.02, wheelRadius - 0.02, 0.25, 24, 1, true]} />
          <meshStandardMaterial color="#ddddcc" transparent opacity={0.3} side={THREE.DoubleSide} roughness={0.5} />
        </mesh>
      </group>

      {/* Hamster body */}
      <group ref={hamsterRef} position={[0.25, 0.42, 0]}>
        {/* Body */}
        <mesh>
          <sphereGeometry args={[0.12, 8, 6]} />
          <meshStandardMaterial color="#d4a05a" roughness={0.8} />
        </mesh>
        {/* Head */}
        <mesh position={[0.1, 0.04, 0]}>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshStandardMaterial color="#d4a05a" roughness={0.8} />
        </mesh>
        {/* Ears */}
        <mesh position={[0.13, 0.1, 0.04]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#c49050" roughness={0.8} />
        </mesh>
        <mesh position={[0.13, 0.1, -0.04]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#c49050" roughness={0.8} />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.15, 0.06, 0.03]}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
        <mesh position={[0.15, 0.06, -0.03]}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
        {/* Tiny tail */}
        <mesh position={[-0.12, 0.02, 0]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#c49050" roughness={0.8} />
        </mesh>
      </group>

      {/* Food bowl */}
      <mesh position={[-0.35, 0.35, 0]}>
        <cylinderGeometry args={[0.1, 0.08, 0.06, 12]} />
        <meshStandardMaterial color="#8b6c42" roughness={0.7} />
      </mesh>
      {/* Food pellets */}
      {happiness > 40 && (
        <group position={[-0.35, 0.39, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[(i - 1) * 0.03, 0, (i % 2) * 0.02]}>
              <sphereGeometry args={[0.015, 6, 6]} />
              <meshStandardMaterial color="#8a7a50" roughness={0.9} />
            </mesh>
          ))}
        </group>
      )}

      {/* Water bottle */}
      <mesh position={[0.55, 0.65, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.04, 0.04, 0.25, 8]} />
        <meshStandardMaterial color="#aaddff" transparent opacity={0.5} />
      </mesh>

      {/* Warm amber glow */}
      <pointLight
        color="#ffcc77"
        intensity={0.15}
        distance={3}
        position={[0, 0.8, 0]}
      />
    </group>
  );
}

// ── Pet Happiness Decay System ──────────────────────────────────

function PetDecaySystem() {
  const lastDecayRef = useRef(0);

  useFrame(() => {
    const simMinutes = useStore.getState().simMinutes;
    if (simMinutes - lastDecayRef.current < 1) return;
    const elapsed = simMinutes - lastDecayRef.current;
    lastDecayRef.current = simMinutes;
    useStore.getState().decayPetHappiness(elapsed);
  });

  return null;
}

// ── Main Export ─────────────────────────────────────────────────

export function RobotPetsScene() {
  return (
    <>
      <FishTank />
      <HamsterWheel />
      <PetDecaySystem />
    </>
  );
}
