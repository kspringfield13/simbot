import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../stores/useStore';
import { getFloorPlan } from '../../config/floorPlans';
import type { StairsDef, ElevatorDef } from '../../config/floorPlans';

const FLOOR_HEIGHT = 5.6; // 2.8 * S where S=2
const STEP_COUNT = 10;
const STEP_HEIGHT = FLOOR_HEIGHT / STEP_COUNT;
const STEP_DEPTH = 0.5;
const STEP_WIDTH = 2.4;

function StaircaseModel({ stairs }: { stairs: StairsDef }) {
  const [px, , pz] = stairs.position;

  return (
    <group position={[px, 0, pz]} rotation={[0, stairs.rotation, 0]}>
      {/* Steps */}
      {Array.from({ length: STEP_COUNT }).map((_, i) => (
        <mesh
          key={`step-${i}`}
          position={[0, STEP_HEIGHT * i + STEP_HEIGHT / 2, -STEP_DEPTH * i]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[STEP_WIDTH, STEP_HEIGHT * 0.9, STEP_DEPTH]} />
          <meshStandardMaterial color="#8b7355" roughness={0.7} />
        </mesh>
      ))}
      {/* Left railing */}
      <mesh position={[-STEP_WIDTH / 2 - 0.05, FLOOR_HEIGHT / 2, -STEP_DEPTH * STEP_COUNT / 2]} castShadow>
        <boxGeometry args={[0.06, FLOOR_HEIGHT, STEP_DEPTH * STEP_COUNT + 0.2]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Right railing */}
      <mesh position={[STEP_WIDTH / 2 + 0.05, FLOOR_HEIGHT / 2, -STEP_DEPTH * STEP_COUNT / 2]} castShadow>
        <boxGeometry args={[0.06, FLOOR_HEIGHT, STEP_DEPTH * STEP_COUNT + 0.2]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Railing top bars */}
      <mesh position={[-STEP_WIDTH / 2 - 0.05, FLOOR_HEIGHT + 0.5, -STEP_DEPTH * STEP_COUNT / 2]} castShadow>
        <boxGeometry args={[0.08, 0.08, STEP_DEPTH * STEP_COUNT + 0.4]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[STEP_WIDTH / 2 + 0.05, FLOOR_HEIGHT + 0.5, -STEP_DEPTH * STEP_COUNT / 2]} castShadow>
        <boxGeometry args={[0.08, 0.08, STEP_DEPTH * STEP_COUNT + 0.4]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  );
}

function ElevatorModel({ elevator }: { elevator: ElevatorDef }) {
  const [px, , pz] = elevator.position;
  const cabinRef = useRef<THREE.Mesh>(null);
  const doorLeftRef = useRef<THREE.Mesh>(null);
  const doorRightRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (cabinRef.current) {
      // Gentle bob to show it's active
      const t = clock.getElapsedTime();
      const bob = Math.sin(t * 0.5) * 0.02;
      cabinRef.current.position.y = FLOOR_HEIGHT / 2 + bob;
    }
    if (doorLeftRef.current && doorRightRef.current) {
      const t = clock.getElapsedTime();
      // Doors slowly open and close
      const cycle = (Math.sin(t * 0.3) + 1) / 2; // 0-1
      const openOffset = cycle * 0.6;
      doorLeftRef.current.position.x = -0.55 - openOffset;
      doorRightRef.current.position.x = 0.55 + openOffset;
    }
    if (lightRef.current) {
      const period = useStore.getState().simPeriod;
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity,
        period === 'night' ? 0.8 : 0.3,
        0.05,
      );
    }
  });

  return (
    <group position={[px, 0, pz]}>
      {/* Elevator shaft (both floors) */}
      <mesh position={[0, FLOOR_HEIGHT / 2, 0]}>
        <boxGeometry args={[2.2, FLOOR_HEIGHT + 1, 2.2]} />
        <meshStandardMaterial color="#555555" roughness={0.4} metalness={0.6} transparent opacity={0.3} side={THREE.BackSide} />
      </mesh>
      {/* Cabin */}
      <mesh ref={cabinRef} position={[0, FLOOR_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 2.4, 1.8]} />
        <meshStandardMaterial color="#888888" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Doors (ground floor) */}
      <mesh ref={doorLeftRef} position={[-0.55, 1.2, 1.1]} castShadow>
        <boxGeometry args={[0.8, 2.2, 0.06]} />
        <meshStandardMaterial color="#aaaaaa" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh ref={doorRightRef} position={[0.55, 1.2, 1.1]} castShadow>
        <boxGeometry args={[0.8, 2.2, 0.06]} />
        <meshStandardMaterial color="#aaaaaa" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Interior light */}
      <pointLight ref={lightRef} position={[0, FLOOR_HEIGHT / 2 + 0.8, 0]} color="#ffe8c0" intensity={0.3} distance={5} />
      {/* Floor indicator panels */}
      <mesh position={[1.15, 2.2, 0]}>
        <boxGeometry args={[0.1, 0.3, 0.2]} />
        <meshStandardMaterial color="#333333" emissive="#00ff88" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[1.15, FLOOR_HEIGHT + 2.2, 0]}>
        <boxGeometry args={[0.1, 0.3, 0.2]} />
        <meshStandardMaterial color="#333333" emissive="#00ff88" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

export function StairsAndElevators() {
  const floorPlanId = useStore((s) => s.floorPlanId);
  const plan = getFloorPlan(floorPlanId);

  if (!plan.stairs?.length && !plan.elevators?.length) return null;

  return (
    <>
      {plan.stairs?.map((stairs, i) => (
        <StaircaseModel key={`stairs-${i}`} stairs={stairs} />
      ))}
      {plan.elevators?.map((elevator, i) => (
        <ElevatorModel key={`elevator-${i}`} elevator={elevator} />
      ))}
    </>
  );
}
