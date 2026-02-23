import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../stores/useStore';
import * as THREE from 'three';

function Joint({ position, size, color, metalness = 0.7, roughness = 0.25, meshRef }: {
  position: [number, number, number];
  size: [number, number, number] | number;
  color: string;
  metalness?: number;
  roughness?: number;
  children?: React.ReactNode;
  meshRef?: React.Ref<THREE.Mesh>;
}) {
  const isRadius = typeof size === 'number';
  return (
    <mesh ref={meshRef} position={position} castShadow>
      {isRadius ? <sphereGeometry args={[size, 12, 12]} /> : <boxGeometry args={size} />}
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

export function Robot() {
  const groupRef = useRef<THREE.Group>(null);
  const leftUpperArmRef = useRef<THREE.Group>(null);
  const rightUpperArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);

  const { robotPosition, robotTarget, robotState, currentAnimation, setRobotPosition } = useStore();

  const shell = '#2a2a2a';
  const shellLight = '#3a3a3a';
  const accent = '#e8e0d0';
  const joint = '#1a1a1a';
  const visor = '#00c8ff';

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Movement toward current target
    if (robotTarget && robotState === 'walking') {
      const current = new THREE.Vector3(robotPosition[0], 0, robotPosition[2]);
      const target = new THREE.Vector3(robotTarget[0], 0, robotTarget[2]);
      const direction = target.clone().sub(current);
      const distance = direction.length();

      if (distance > 0.2) {
        direction.normalize();
        const speed = 2.2 * delta;
        const newPos: [number, number, number] = [
          robotPosition[0] + direction.x * speed,
          0,
          robotPosition[2] + direction.z * speed,
        ];
        setRobotPosition(newPos);

        // Smooth rotation to face movement direction
        const targetAngle = Math.atan2(direction.x, direction.z);
        const currentAngle = groupRef.current.rotation.y;
        let diff = targetAngle - currentAngle;
        // Normalize angle
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        groupRef.current.rotation.y += diff * 0.08;
      }
    }

    groupRef.current.position.set(robotPosition[0], robotPosition[1], robotPosition[2]);

    const t = Date.now() * 0.001;

    // === IDLE ANIMATION ===
    if (robotState === 'idle') {
      if (torsoRef.current) torsoRef.current.position.y = 1.05 + Math.sin(t * 1.5) * 0.006;
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.4) * 0.12;
        headRef.current.rotation.x = Math.sin(t * 0.6) * 0.03;
      }
      // Arms rest naturally
      [leftUpperArmRef, rightUpperArmRef, leftLegRef, rightLegRef].forEach(ref => {
        if (ref.current) {
          ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, 0, 0.04);
          ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, 0, 0.04);
        }
      });
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.03);
      }
    }

    // === WALKING ANIMATION ===
    if (robotState === 'walking') {
      const ws = 7; // walk speed
      const stride = 0.35;
      // Legs
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = Math.sin(t * ws) * stride;
        rightLegRef.current.rotation.x = -Math.sin(t * ws) * stride;
      }
      // Counter-swing arms
      if (leftUpperArmRef.current && rightUpperArmRef.current) {
        leftUpperArmRef.current.rotation.x = -Math.sin(t * ws) * 0.25;
        rightUpperArmRef.current.rotation.x = Math.sin(t * ws) * 0.25;
        leftUpperArmRef.current.rotation.z = 0;
        rightUpperArmRef.current.rotation.z = 0;
      }
      // Body bob and sway
      groupRef.current.position.y = Math.abs(Math.sin(t * ws)) * 0.025;
      if (torsoRef.current) {
        torsoRef.current.rotation.y = Math.sin(t * ws) * 0.03;
        torsoRef.current.position.y = 1.05;
      }
      if (headRef.current) {
        headRef.current.rotation.x = -0.05;
        headRef.current.rotation.y = 0;
      }
    }

    // === WORKING ANIMATIONS (task-specific) ===
    if (robotState === 'working') {
      // Head looks down at work
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -0.25, 0.05);
        headRef.current.rotation.y = Math.sin(t * 1) * 0.08;
      }

      switch (currentAnimation) {
        case 'dishes': {
          // Scrubbing motion at sink
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -1.2 + Math.sin(t * 5) * 0.2;
            rightUpperArmRef.current.rotation.x = -1.0 + Math.sin(t * 5 + 0.5) * 0.25;
            leftUpperArmRef.current.rotation.z = 0.2;
            rightUpperArmRef.current.rotation.z = -0.2 + Math.sin(t * 5) * 0.1;
          }
          // Slight body lean forward
          if (torsoRef.current) torsoRef.current.rotation.x = -0.08;
          break;
        }
        case 'vacuuming': {
          // Push/pull vacuum motion
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            const pushPull = Math.sin(t * 2) * 0.5;
            leftUpperArmRef.current.rotation.x = -0.7 + pushPull;
            rightUpperArmRef.current.rotation.x = -0.7 + pushPull;
            leftUpperArmRef.current.rotation.z = 0.15;
            rightUpperArmRef.current.rotation.z = -0.15;
          }
          // Walking while vacuuming
          if (leftLegRef.current && rightLegRef.current) {
            leftLegRef.current.rotation.x = Math.sin(t * 3) * 0.15;
            rightLegRef.current.rotation.x = -Math.sin(t * 3) * 0.15;
          }
          // Slow body rotation to "cover area"
          if (torsoRef.current) torsoRef.current.rotation.y = Math.sin(t * 0.8) * 0.3;
          groupRef.current.position.x = robotPosition[0] + Math.sin(t * 0.5) * 0.3;
          groupRef.current.position.z = robotPosition[2] + Math.cos(t * 0.7) * 0.3;
          break;
        }
        case 'sweeping': {
          // Side-to-side sweeping
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -0.9;
            rightUpperArmRef.current.rotation.x = -0.6;
            leftUpperArmRef.current.rotation.z = Math.sin(t * 3) * 0.4;
            rightUpperArmRef.current.rotation.z = Math.sin(t * 3) * 0.4;
          }
          if (torsoRef.current) torsoRef.current.rotation.y = Math.sin(t * 3) * 0.1;
          break;
        }
        case 'cleaning': {
          // Wiping surfaces circular motion
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -0.8 + Math.sin(t * 3) * 0.15;
            rightUpperArmRef.current.rotation.x = -1.0 + Math.cos(t * 4) * 0.2;
            leftUpperArmRef.current.rotation.z = 0.3 + Math.cos(t * 3) * 0.2;
            rightUpperArmRef.current.rotation.z = -0.1 + Math.sin(t * 4) * 0.2;
          }
          if (torsoRef.current) {
            torsoRef.current.rotation.y = Math.sin(t * 1.5) * 0.15;
            torsoRef.current.rotation.x = -0.05;
          }
          break;
        }
        case 'bed-making': {
          // Pulling/tucking sheets - wide arm movements
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -0.5 + Math.sin(t * 2) * 0.5;
            rightUpperArmRef.current.rotation.x = -0.5 + Math.sin(t * 2 + Math.PI) * 0.5;
            leftUpperArmRef.current.rotation.z = 0.4 + Math.sin(t * 2) * 0.2;
            rightUpperArmRef.current.rotation.z = -0.4 - Math.sin(t * 2) * 0.2;
          }
          // Lean forward
          if (torsoRef.current) torsoRef.current.rotation.x = -0.15 + Math.sin(t * 2) * 0.08;
          break;
        }
        case 'laundry': {
          // Folding motion - hands come together and apart
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            const fold = Math.sin(t * 2);
            leftUpperArmRef.current.rotation.x = -0.8 + fold * 0.3;
            rightUpperArmRef.current.rotation.x = -0.8 + fold * 0.3;
            leftUpperArmRef.current.rotation.z = 0.3 - fold * 0.3;
            rightUpperArmRef.current.rotation.z = -0.3 + fold * 0.3;
          }
          if (torsoRef.current) torsoRef.current.rotation.x = -0.1;
          break;
        }
        case 'organizing': {
          // Pick up and place - alternating arms
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            const pick = Math.sin(t * 1.5);
            leftUpperArmRef.current.rotation.x = pick > 0 ? -0.5 - pick * 0.5 : -0.5;
            rightUpperArmRef.current.rotation.x = pick < 0 ? -0.5 + pick * 0.5 : -0.5;
            leftUpperArmRef.current.rotation.z = pick > 0 ? 0.2 : 0;
            rightUpperArmRef.current.rotation.z = pick < 0 ? -0.2 : 0;
          }
          // Turn to different spots
          if (torsoRef.current) torsoRef.current.rotation.y = Math.sin(t * 0.8) * 0.4;
          break;
        }
        case 'cooking': {
          // Stirring + reaching
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            // Left hand stirs
            leftUpperArmRef.current.rotation.x = -0.9;
            leftUpperArmRef.current.rotation.z = 0.2 + Math.sin(t * 4) * 0.15;
            // Right hand reaches/grabs
            rightUpperArmRef.current.rotation.x = -0.6 + Math.sin(t * 1.5) * 0.4;
            rightUpperArmRef.current.rotation.z = -0.1;
          }
          if (torsoRef.current) torsoRef.current.rotation.y = Math.sin(t * 1) * 0.1;
          break;
        }
        case 'scrubbing': {
          // Aggressive scrubbing motion
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -1.0 + Math.sin(t * 6) * 0.2;
            rightUpperArmRef.current.rotation.x = -0.8 + Math.sin(t * 6 + 1) * 0.25;
            leftUpperArmRef.current.rotation.z = 0.15 + Math.cos(t * 6) * 0.15;
            rightUpperArmRef.current.rotation.z = -0.15;
          }
          // Leaning into it
          if (torsoRef.current) {
            torsoRef.current.rotation.x = -0.12;
            torsoRef.current.rotation.y = Math.sin(t * 2) * 0.1;
          }
          // Knees slightly bent (crouching)
          if (leftLegRef.current && rightLegRef.current) {
            leftLegRef.current.rotation.x = -0.15;
            rightLegRef.current.rotation.x = -0.15;
          }
          break;
        }
        case 'grocery-list': {
          // Looking at fridge, one hand on door, other hand gesturing
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -0.5;
            leftUpperArmRef.current.rotation.z = 0.3;
            rightUpperArmRef.current.rotation.x = -0.3 + Math.sin(t * 1.5) * 0.2;
            rightUpperArmRef.current.rotation.z = -0.1;
          }
          if (headRef.current) {
            headRef.current.rotation.x = -0.1;
            headRef.current.rotation.y = Math.sin(t * 0.8) * 0.2;
          }
          break;
        }
        default: {
          // Generic working
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -0.8 + Math.sin(t * 3) * 0.3;
            rightUpperArmRef.current.rotation.x = -0.8 + Math.sin(t * 3 + 1.5) * 0.3;
          }
          break;
        }
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* === TORSO === */}
      <group ref={torsoRef} position={[0, 1.05, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.44, 0.38, 0.22]} />
          <meshStandardMaterial color={accent} metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.115]}>
          <boxGeometry args={[0.06, 0.3, 0.01]} />
          <meshStandardMaterial color={shell} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0.1, 0.05, 0.115]}>
          <boxGeometry args={[0.04, 0.04, 0.01]} />
          <meshStandardMaterial color={visor} emissive={visor} emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[-0.1, 0.05, 0.115]}>
          <boxGeometry args={[0.04, 0.04, 0.01]} />
          <meshStandardMaterial color={visor} emissive={visor} emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0, -0.28, 0]} castShadow>
          <boxGeometry args={[0.36, 0.2, 0.18]} />
          <meshStandardMaterial color={shell} metalness={0.6} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.18, 0.04, 16]} />
          <meshStandardMaterial color={joint} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* HEAD */}
        <group ref={headRef} position={[0, 0.38, 0]}>
          <mesh position={[0, -0.08, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.12, 12]} />
            <meshStandardMaterial color={joint} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[0.24, 0.26, 0.2]} />
            <meshStandardMaterial color={accent} metalness={0.35} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.11, 0.105]}>
            <boxGeometry args={[0.2, 0.1, 0.02]} />
            <meshStandardMaterial color="#001520" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.11, 0.115]}>
            <boxGeometry args={[0.18, 0.06, 0.005]} />
            <meshStandardMaterial color={visor} emissive={visor} emissiveIntensity={2} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 0.24, 0]} castShadow>
            <boxGeometry args={[0.22, 0.04, 0.18]} />
            <meshStandardMaterial color={shell} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0.13, 0.12, 0]}>
            <boxGeometry args={[0.02, 0.08, 0.06]} />
            <meshStandardMaterial color={shell} metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[-0.13, 0.12, 0]}>
            <boxGeometry args={[0.02, 0.08, 0.06]} />
            <meshStandardMaterial color={shell} metalness={0.7} roughness={0.2} />
          </mesh>
        </group>

        {/* SHOULDERS */}
        <Joint position={[-0.28, 0.12, 0]} size={0.06} color={joint} />
        <Joint position={[0.28, 0.12, 0]} size={0.06} color={joint} />

        {/* LEFT ARM */}
        <group ref={leftUpperArmRef} position={[-0.34, 0.05, 0]}>
          <mesh position={[0, -0.14, 0]} castShadow>
            <boxGeometry args={[0.1, 0.28, 0.1]} />
            <meshStandardMaterial color={shellLight} metalness={0.5} roughness={0.3} />
          </mesh>
          <Joint position={[0, -0.3, 0]} size={0.045} color={joint} />
          <mesh position={[0, -0.45, 0]} castShadow>
            <boxGeometry args={[0.09, 0.25, 0.09]} />
            <meshStandardMaterial color={accent} metalness={0.35} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.6, 0]} castShadow>
            <boxGeometry args={[0.07, 0.08, 0.04]} />
            <meshStandardMaterial color={joint} metalness={0.6} roughness={0.3} />
          </mesh>
        </group>

        {/* RIGHT ARM */}
        <group ref={rightUpperArmRef} position={[0.34, 0.05, 0]}>
          <mesh position={[0, -0.14, 0]} castShadow>
            <boxGeometry args={[0.1, 0.28, 0.1]} />
            <meshStandardMaterial color={shellLight} metalness={0.5} roughness={0.3} />
          </mesh>
          <Joint position={[0, -0.3, 0]} size={0.045} color={joint} />
          <mesh position={[0, -0.45, 0]} castShadow>
            <boxGeometry args={[0.09, 0.25, 0.09]} />
            <meshStandardMaterial color={accent} metalness={0.35} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.6, 0]} castShadow>
            <boxGeometry args={[0.07, 0.08, 0.04]} />
            <meshStandardMaterial color={joint} metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* HIP */}
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.3, 0.08, 0.16]} />
        <meshStandardMaterial color={shell} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* LEFT LEG */}
      <group ref={leftLegRef} position={[-0.1, 0.58, 0]}>
        <Joint position={[0, 0, 0]} size={0.05} color={joint} />
        <mesh position={[0, -0.18, 0]} castShadow>
          <boxGeometry args={[0.11, 0.3, 0.11]} />
          <meshStandardMaterial color={shellLight} metalness={0.5} roughness={0.3} />
        </mesh>
        <Joint position={[0, -0.35, 0]} size={0.05} color={joint} />
        <mesh position={[0, -0.52, 0]} castShadow>
          <boxGeometry args={[0.1, 0.28, 0.1]} />
          <meshStandardMaterial color={accent} metalness={0.35} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.68, 0.03]} castShadow>
          <boxGeometry args={[0.12, 0.04, 0.18]} />
          <meshStandardMaterial color={shell} metalness={0.5} roughness={0.3} />
        </mesh>
      </group>

      {/* RIGHT LEG */}
      <group ref={rightLegRef} position={[0.1, 0.58, 0]}>
        <Joint position={[0, 0, 0]} size={0.05} color={joint} />
        <mesh position={[0, -0.18, 0]} castShadow>
          <boxGeometry args={[0.11, 0.3, 0.11]} />
          <meshStandardMaterial color={shellLight} metalness={0.5} roughness={0.3} />
        </mesh>
        <Joint position={[0, -0.35, 0]} size={0.05} color={joint} />
        <mesh position={[0, -0.52, 0]} castShadow>
          <boxGeometry args={[0.1, 0.28, 0.1]} />
          <meshStandardMaterial color={accent} metalness={0.35} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.68, 0.03]} castShadow>
          <boxGeometry args={[0.12, 0.04, 0.18]} />
          <meshStandardMaterial color={shell} metalness={0.5} roughness={0.3} />
        </mesh>
      </group>

      {/* Ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial color={visor} emissive={visor} emissiveIntensity={0.3} transparent opacity={0.15} />
      </mesh>
      <pointLight position={[0, 1.5, 0.3]} color={visor} intensity={0.3} distance={2} />
    </group>
  );
}
