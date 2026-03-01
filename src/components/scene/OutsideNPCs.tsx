import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../stores/useStore';
import {
  getArchetypesForPeriod,
  pickWeightedArchetype,
  pickRandomPath,
  type NPCArchetype,
  type WalkPath,
} from '../../config/outsideNPCs';

// ── Active NPC tracking (component-local, no store needed) ──

interface ActiveNPC {
  id: string;
  archetype: NPCArchetype;
  path: WalkPath;
  /** 0-1 progress along the path */
  progress: number;
  /** Walking direction for leg animation phase offset */
  legPhase: number;
}

const MAX_OUTSIDE_NPCS = 4;
const BASE_WALK_SPEED = 0.012; // progress per sim-minute
const SPAWN_INTERVAL_MIN = 8;  // sim-minutes between spawn attempts
const SPAWN_INTERVAL_MAX = 20;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Interpolate position along a path's point sequence */
function getPathPosition(path: WalkPath, progress: number): [number, number, number] {
  const pts = path.points;
  const segments = pts.length - 1;
  const t = Math.max(0, Math.min(1, progress)) * segments;
  const idx = Math.min(Math.floor(t), segments - 1);
  const frac = t - idx;

  const a = pts[idx];
  const b = pts[idx + 1];
  return [
    a[0] + (b[0] - a[0]) * frac,
    a[1] + (b[1] - a[1]) * frac,
    a[2] + (b[2] - a[2]) * frac,
  ];
}

/** Get facing direction along path */
function getPathRotation(path: WalkPath, progress: number): number {
  const pts = path.points;
  const segments = pts.length - 1;
  const t = Math.max(0, Math.min(1, progress)) * segments;
  const idx = Math.min(Math.floor(t), segments - 1);

  const a = pts[idx];
  const b = pts[idx + 1];
  return Math.atan2(b[0] - a[0], b[2] - a[2]);
}

// ── Single NPC figure ──────────────────────────────────────

function NPCFigure({ npc }: { npc: ActiveNPC }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!groupRef.current) return;

    const pos = getPathPosition(npc.path, npc.progress);
    const rot = getPathRotation(npc.path, npc.progress);

    groupRef.current.position.set(pos[0], pos[1], pos[2]);
    groupRef.current.rotation.y = rot;

    // Walking animation — swing legs and arms
    const swing = Math.sin(npc.legPhase) * 0.4;

    if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.6;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.6;
  });

  const { archetype } = npc;

  return (
    <group ref={groupRef}>
      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.12, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        <meshStandardMaterial color={archetype.legColor} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.12, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        <meshStandardMaterial color={archetype.legColor} />
      </mesh>

      {/* Body */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.5, 4, 8]} />
        <meshStandardMaterial color={archetype.bodyColor} />
      </mesh>

      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.32, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.4, 4, 8]} />
        <meshStandardMaterial color={archetype.bodyColor} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.32, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.4, 4, 8]} />
        <meshStandardMaterial color={archetype.bodyColor} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color={archetype.headColor} />
      </mesh>

      {/* Accessories */}
      {archetype.accessory === 'mailbag' && (
        <mesh position={[0.3, 0.85, 0.1]} castShadow>
          <boxGeometry args={[0.25, 0.3, 0.15]} />
          <meshStandardMaterial color="#8B6914" roughness={0.9} />
        </mesh>
      )}

      {archetype.accessory === 'dog' && (
        <group position={[0.5, 0, 0.4]}>
          {/* Dog body */}
          <mesh position={[0, 0.25, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.25, 4, 8]} />
            <meshStandardMaterial color="#8B6914" />
          </mesh>
          {/* Dog head */}
          <mesh position={[0, 0.3, 0.2]} castShadow>
            <sphereGeometry args={[0.1, 6, 6]} />
            <meshStandardMaterial color="#a07020" />
          </mesh>
          {/* Leash line (thin cylinder) */}
          <mesh position={[-0.2, 0.55, 0.1]} rotation={[0, 0, Math.PI / 4]}>
            <cylinderGeometry args={[0.01, 0.01, 0.5, 4]} />
            <meshStandardMaterial color="#553311" />
          </mesh>
        </group>
      )}

      {archetype.accessory === 'pizza-box' && (
        <mesh position={[0.35, 0.9, 0.15]} rotation={[0, 0, 0.1]} castShadow>
          <boxGeometry args={[0.4, 0.06, 0.4]} />
          <meshStandardMaterial color="#d4a050" roughness={0.9} />
        </mesh>
      )}

      {archetype.accessory === 'briefcase' && (
        <mesh position={[0.35, 0.5, 0]} castShadow>
          <boxGeometry args={[0.3, 0.22, 0.08]} />
          <meshStandardMaterial color="#4a3520" roughness={0.9} />
        </mesh>
      )}

      {archetype.accessory === 'phone' && (
        <mesh position={[0.28, 1.35, 0.15]} castShadow>
          <boxGeometry args={[0.06, 0.1, 0.02]} />
          <meshStandardMaterial color="#222222" emissive="#4488ff" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}

// ── Main system + renderer ────────────────────────────────

export function OutsideNPCs() {
  const npcsRef = useRef<ActiveNPC[]>([]);
  const nextSpawnRef = useRef(0);
  const lastPeriodRef = useRef<string>('');
  // Force re-render when NPC list changes
  const renderKeyRef = useRef(0);
  const forceUpdate = useStore((s) => s.simMinutes); // re-renders each frame naturally
  void forceUpdate; // suppress unused warning

  useFrame(() => {
    const s = useStore.getState();
    if (s.simSpeed === 0) return;

    const now = s.simMinutes;
    const period = s.simPeriod;
    const delta = s.simSpeed / 60; // approximate sim-minutes per frame at 60fps

    // Clear NPCs when transitioning to night
    if (period === 'night') {
      if (npcsRef.current.length > 0) {
        npcsRef.current = [];
        renderKeyRef.current++;
      }
      return;
    }

    // When period changes, allow faster initial spawns
    if (period !== lastPeriodRef.current) {
      lastPeriodRef.current = period;
      nextSpawnRef.current = now + rand(2, 5);
    }

    // Initialize spawn timer
    if (nextSpawnRef.current === 0) {
      nextSpawnRef.current = now + rand(3, 8);
    }

    // Update existing NPCs — advance progress
    let changed = false;
    for (const npc of npcsRef.current) {
      npc.progress += BASE_WALK_SPEED * npc.archetype.speed * delta;
      npc.legPhase += delta * npc.archetype.speed * 8;
    }

    // Remove NPCs that finished their path
    const before = npcsRef.current.length;
    npcsRef.current = npcsRef.current.filter((n) => n.progress < 1);
    if (npcsRef.current.length !== before) {
      changed = true;
    }

    // Spawn new NPCs
    if (now >= nextSpawnRef.current && npcsRef.current.length < MAX_OUTSIDE_NPCS) {
      const available = getArchetypesForPeriod(period);
      if (available.length > 0) {
        const archetype = pickWeightedArchetype(available);
        const path = pickRandomPath();

        npcsRef.current.push({
          id: `npc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          archetype,
          path,
          progress: 0,
          legPhase: Math.random() * Math.PI * 2,
        });
        changed = true;
      }

      nextSpawnRef.current = now + rand(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX);
    }

    if (changed) {
      renderKeyRef.current++;
    }
  });

  // Render all active NPCs
  const npcs = npcsRef.current;

  return (
    <group>
      {npcs.map((npc) => (
        <NPCFigure key={npc.id} npc={npc} />
      ))}
    </group>
  );
}
