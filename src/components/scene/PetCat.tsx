import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../stores/useStore';
import { isPositionClear, getAvoidanceForce } from '../../systems/ObstacleMap';
import { rooms } from '../../utils/homeLayout';

type CatState = 'wandering' | 'napping' | 'following' | 'sitting' | 'idle';

// Doorway positions (gaps in walls between rooms)
const DOORWAYS: [number, number][] = [
  [0.5, -4],   // Living/Kitchen → Hallway
  [-2.5, 0],   // Hallway → Bedroom
  [4.5, 0],    // Hallway → Bathroom
];

// Nap spots near furniture
const NAP_SPOTS: [number, number][] = [
  [-13, -12],  // Near sofa
  [-9, 14],    // Near bed
  [-10, -12],  // Near coffee table
  [8, 6],      // Bathroom floor
];

// Colors
const CAT = '#f5a623';
const STRIPE = '#d48b1a';
const PINK = '#ff9999';
const EYE = '#4caf50';

export function PetCat() {
  const groupRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const earLRef = useRef<THREE.Mesh>(null);
  const earRRef = useRef<THREE.Mesh>(null);
  const bodyGrpRef = useRef<THREE.Group>(null);

  // AI state
  const stateRef = useRef<CatState>('idle');
  const posRef = useRef<[number, number]>([-6, -10]);
  const targetRef = useRef<[number, number]>([-6, -10]);
  const rotRef = useRef(0);
  const stateTimerRef = useRef(0);
  const durationRef = useRef(5);
  const speedRef = useRef(0);
  const stretchRef = useRef(0);

  const pickWanderTarget = () => {
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    const halfW = room.size[0] / 2 - 1.5;
    const halfD = room.size[1] / 2 - 1.5;
    const x = room.position[0] + (Math.random() - 0.5) * 2 * halfW;
    const z = room.position[2] + (Math.random() - 0.5) * 2 * halfD;
    if (isPositionClear(x, z, 0.3)) targetRef.current = [x, z];
  };

  const transitionTo = (state: CatState) => {
    stateRef.current = state;
    stateTimerRef.current = 0;
    switch (state) {
      case 'idle':
        durationRef.current = 3 + Math.random() * 5;
        break;
      case 'wandering':
        durationRef.current = 15;
        pickWanderTarget();
        break;
      case 'napping': {
        durationRef.current = 12 + Math.random() * 15;
        const spot = NAP_SPOTS[Math.floor(Math.random() * NAP_SPOTS.length)];
        targetRef.current = [spot[0], spot[1]];
        break;
      }
      case 'sitting': {
        durationRef.current = 6 + Math.random() * 8;
        const door = DOORWAYS[Math.floor(Math.random() * DOORWAYS.length)];
        targetRef.current = [door[0], door[1]];
        break;
      }
      case 'following':
        durationRef.current = 8 + Math.random() * 7;
        break;
    }
  };

  const decideNext = () => {
    const r = Math.random();
    if (r < 0.35) transitionTo('wandering');
    else if (r < 0.55) transitionTo('napping');
    else if (r < 0.70) transitionTo('following');
    else if (r < 0.85) transitionTo('sitting');
    else transitionTo('idle');
  };

  const moveToward = (tx: number, tz: number, catSpeed: number, dt: number): boolean => {
    const pos = posRef.current;
    const dx = tx - pos[0];
    const dz = tz - pos[1];
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.3) return true;

    const dirX = dx / dist;
    const dirZ = dz / dist;
    const angle = Math.atan2(dirX, dirZ);

    let diff = angle - rotRef.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    rotRef.current += diff * 0.12;

    speedRef.current = THREE.MathUtils.lerp(speedRef.current, catSpeed, 0.05);
    const move = speedRef.current * dt;

    const [avX, avZ] = getAvoidanceForce(pos[0], pos[1], dirX, dirZ, 1.0);
    let sx = dirX + avX * 0.5;
    let sz = dirZ + avZ * 0.5;
    const len = Math.sqrt(sx * sx + sz * sz) || 1;
    sx /= len;
    sz /= len;

    const nx = pos[0] + sx * move;
    const nz = pos[1] + sz * move;

    if (isPositionClear(nx, nz, 0.25)) {
      posRef.current = [nx, nz];
    } else if (isPositionClear(nx, pos[1], 0.25)) {
      posRef.current = [nx, pos[1]];
    } else if (isPositionClear(pos[0], nz, 0.25)) {
      posRef.current = [pos[0], nz];
    } else {
      return true; // stuck
    }
    return false;
  };

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const simSpeed = useStore.getState().simSpeed;
    if (simSpeed === 0) return;

    const robotPos = useStore.getState().robotPosition;
    const dt = Math.min(delta * simSpeed, 0.08);
    stateTimerRef.current += dt;

    const state = stateRef.current;
    const target = targetRef.current;

    // ── State machine ──
    switch (state) {
      case 'idle': {
        speedRef.current = THREE.MathUtils.lerp(speedRef.current, 0, 0.1);
        if (stateTimerRef.current > durationRef.current) decideNext();
        if (stretchRef.current === 0 && Math.random() < 0.002) stretchRef.current = 1;
        break;
      }
      case 'wandering': {
        const arrived = moveToward(target[0], target[1], 0.6, dt);
        if (arrived || stateTimerRef.current > durationRef.current) transitionTo('idle');
        break;
      }
      case 'following': {
        const dx = robotPos[0] - posRef.current[0];
        const dz = robotPos[2] - posRef.current[1];
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 2.5) {
          moveToward(robotPos[0], robotPos[2], 0.9, dt);
        } else {
          speedRef.current = THREE.MathUtils.lerp(speedRef.current, 0, 0.1);
          if (dist > 0.1) {
            const angle = Math.atan2(dx / dist, dz / dist);
            let diff = angle - rotRef.current;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            rotRef.current += diff * 0.05;
          }
        }
        if (stateTimerRef.current > durationRef.current) decideNext();
        break;
      }
      case 'napping': {
        const dx = target[0] - posRef.current[0];
        const dz = target[1] - posRef.current[1];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0.5) {
          const stuck = moveToward(target[0], target[1], 0.5, dt);
          if (stuck) transitionTo('idle');
        } else {
          speedRef.current = THREE.MathUtils.lerp(speedRef.current, 0, 0.15);
          if (stateTimerRef.current > durationRef.current) {
            stretchRef.current = 1;
            decideNext();
          }
        }
        break;
      }
      case 'sitting': {
        const dx = target[0] - posRef.current[0];
        const dz = target[1] - posRef.current[1];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0.5) {
          const stuck = moveToward(target[0], target[1], 0.5, dt);
          if (stuck) transitionTo('idle');
        } else {
          speedRef.current = THREE.MathUtils.lerp(speedRef.current, 0, 0.15);
          if (stateTimerRef.current > durationRef.current) decideNext();
        }
        break;
      }
    }

    // ── Update transform ──
    groupRef.current.position.set(posRef.current[0], 0, posRef.current[1]);
    groupRef.current.rotation.y = rotRef.current;

    // ── Animations ──
    const t = performance.now() / 1000;
    const moving = speedRef.current > 0.1;
    const napping = state === 'napping' && !moving;

    // Body bob / nap crouch
    if (bodyGrpRef.current) {
      const baseY = napping ? 0.15 : 0.25;
      const bob = moving ? Math.sin(t * 12) * 0.015 : 0;
      bodyGrpRef.current.position.y = THREE.MathUtils.lerp(
        bodyGrpRef.current.position.y, baseY + bob, 0.1,
      );

      // Stretch
      if (stretchRef.current > 0) {
        stretchRef.current = Math.max(0, stretchRef.current - delta * 0.7);
        const s = stretchRef.current;
        bodyGrpRef.current.scale.set(1, 1 - s * 0.15, 1 + s * 0.2);
      } else if (napping) {
        bodyGrpRef.current.scale.set(1, 1 + Math.sin(t * 1.5) * 0.015, 1);
      } else {
        bodyGrpRef.current.scale.x = THREE.MathUtils.lerp(bodyGrpRef.current.scale.x, 1, 0.1);
        bodyGrpRef.current.scale.y = THREE.MathUtils.lerp(bodyGrpRef.current.scale.y, 1, 0.1);
        bodyGrpRef.current.scale.z = THREE.MathUtils.lerp(bodyGrpRef.current.scale.z, 1, 0.1);
      }
    }

    // Tail swish
    if (tailRef.current) {
      const spd = moving ? 8 : 2.5;
      const amt = moving ? 0.5 : 0.3;
      tailRef.current.rotation.z = Math.sin(t * spd) * amt;
      tailRef.current.rotation.x = Math.sin(t * spd * 1.3) * 0.08;
    }

    // Ear twitch
    const twL = Math.sin(t * 0.7) > 0.92 ? Math.sin(t * 25) * 0.25 : 0;
    const twR = Math.sin(t * 0.9 + 1.5) > 0.92 ? Math.sin(t * 25) * 0.25 : 0;
    if (earLRef.current) earLRef.current.rotation.z = -0.2 + twL;
    if (earRRef.current) earRRef.current.rotation.z = 0.2 + twR;
  });

  return (
    <group ref={groupRef}>
      <group ref={bodyGrpRef} position={[0, 0.25, 0]}>
        {/* Body */}
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.25, 0.5]} />
          <meshStandardMaterial color={CAT} roughness={0.8} />
        </mesh>
        {/* Stripes */}
        <mesh position={[0, 0.126, -0.05]}>
          <boxGeometry args={[0.31, 0.01, 0.1]} />
          <meshStandardMaterial color={STRIPE} />
        </mesh>
        <mesh position={[0, 0.126, 0.1]}>
          <boxGeometry args={[0.31, 0.01, 0.08]} />
          <meshStandardMaterial color={STRIPE} />
        </mesh>

        {/* Head */}
        <group position={[0, 0.1, -0.32]}>
          <mesh castShadow>
            <boxGeometry args={[0.28, 0.24, 0.24]} />
            <meshStandardMaterial color={CAT} roughness={0.8} />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.07, 0.03, -0.121]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color={EYE} emissive={EYE} emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0.07, 0.03, -0.121]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color={EYE} emissive={EYE} emissiveIntensity={0.3} />
          </mesh>
          {/* Pupils */}
          <mesh position={[-0.07, 0.03, -0.155]}>
            <sphereGeometry args={[0.018, 6, 6]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0.07, 0.03, -0.155]}>
            <sphereGeometry args={[0.018, 6, 6]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          {/* Nose */}
          <mesh position={[0, -0.02, -0.121]}>
            <boxGeometry args={[0.04, 0.025, 0.02]} />
            <meshStandardMaterial color={PINK} />
          </mesh>
          {/* Ears */}
          <mesh ref={earLRef} position={[-0.1, 0.16, 0]} rotation={[0, 0, -0.2]}>
            <coneGeometry args={[0.06, 0.12, 3]} />
            <meshStandardMaterial color={CAT} roughness={0.8} />
          </mesh>
          <mesh ref={earRRef} position={[0.1, 0.16, 0]} rotation={[0, 0, 0.2]}>
            <coneGeometry args={[0.06, 0.12, 3]} />
            <meshStandardMaterial color={CAT} roughness={0.8} />
          </mesh>
          {/* Inner ears */}
          <mesh position={[-0.1, 0.155, -0.005]} rotation={[0, 0, -0.2]}>
            <coneGeometry args={[0.035, 0.08, 3]} />
            <meshStandardMaterial color={PINK} />
          </mesh>
          <mesh position={[0.1, 0.155, -0.005]} rotation={[0, 0, 0.2]}>
            <coneGeometry args={[0.035, 0.08, 3]} />
            <meshStandardMaterial color={PINK} />
          </mesh>
          {/* Whiskers */}
          <mesh position={[-0.14, -0.01, -0.1]} rotation={[0, 0.3, 0.1]}>
            <cylinderGeometry args={[0.003, 0.003, 0.15, 3]} />
            <meshStandardMaterial color="#ddd" />
          </mesh>
          <mesh position={[-0.14, -0.03, -0.1]} rotation={[0, 0.3, -0.05]}>
            <cylinderGeometry args={[0.003, 0.003, 0.15, 3]} />
            <meshStandardMaterial color="#ddd" />
          </mesh>
          <mesh position={[0.14, -0.01, -0.1]} rotation={[0, -0.3, -0.1]}>
            <cylinderGeometry args={[0.003, 0.003, 0.15, 3]} />
            <meshStandardMaterial color="#ddd" />
          </mesh>
          <mesh position={[0.14, -0.03, -0.1]} rotation={[0, -0.3, 0.05]}>
            <cylinderGeometry args={[0.003, 0.003, 0.15, 3]} />
            <meshStandardMaterial color="#ddd" />
          </mesh>
        </group>

        {/* Legs */}
        <mesh position={[-0.1, -0.18, -0.15]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.18, 6]} />
          <meshStandardMaterial color={CAT} roughness={0.8} />
        </mesh>
        <mesh position={[0.1, -0.18, -0.15]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.18, 6]} />
          <meshStandardMaterial color={CAT} roughness={0.8} />
        </mesh>
        <mesh position={[-0.1, -0.18, 0.15]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.18, 6]} />
          <meshStandardMaterial color={CAT} roughness={0.8} />
        </mesh>
        <mesh position={[0.1, -0.18, 0.15]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.18, 6]} />
          <meshStandardMaterial color={CAT} roughness={0.8} />
        </mesh>
        {/* White paws */}
        <mesh position={[-0.1, -0.27, -0.15]}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshStandardMaterial color="#fff" roughness={0.8} />
        </mesh>
        <mesh position={[0.1, -0.27, -0.15]}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshStandardMaterial color="#fff" roughness={0.8} />
        </mesh>
        <mesh position={[-0.1, -0.27, 0.15]}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshStandardMaterial color="#fff" roughness={0.8} />
        </mesh>
        <mesh position={[0.1, -0.27, 0.15]}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshStandardMaterial color="#fff" roughness={0.8} />
        </mesh>

        {/* Tail */}
        <group ref={tailRef} position={[0, 0.05, 0.28]}>
          <mesh castShadow rotation={[0.8, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.02, 0.4, 6]} />
            <meshStandardMaterial color={CAT} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.14, 0.14]} rotation={[0.5, 0, 0]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color={STRIPE} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
