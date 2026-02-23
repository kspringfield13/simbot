import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../stores/useStore';
import * as THREE from 'three';

function Joint({ position, size, color, metalness = 0.7, roughness = 0.25, children, meshRef }: {
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
      {children}
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

  const { robotPosition, robotTarget, robotState, setRobotPosition } = useStore();

  const shell = '#2a2a2a';
  const shellLight = '#3a3a3a';
  const accent = '#e8e0d0';
  const joint = '#1a1a1a';
  const visor = '#00c8ff';

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Movement
    if (robotTarget) {
      const current = new THREE.Vector3(robotPosition[0], 0, robotPosition[2]);
      const target = new THREE.Vector3(robotTarget[0], 0, robotTarget[2]);
      const direction = target.clone().sub(current);
      const distance = direction.length();

      if (distance > 0.3) {
        direction.normalize();
        const speed = 2.5 * delta;
        const newPos: [number, number, number] = [
          robotPosition[0] + direction.x * speed,
          0,
          robotPosition[2] + direction.z * speed,
        ];
        setRobotPosition(newPos);

        const angle = Math.atan2(direction.x, direction.z);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, 0.08);
      }
    }

    groupRef.current.position.set(robotPosition[0], robotPosition[1], robotPosition[2]);

    const time = Date.now() * 0.001;

    // Animations
    if (robotState === 'idle') {
      // Subtle breathing
      if (torsoRef.current) {
        torsoRef.current.position.y = 1.05 + Math.sin(time * 1.5) * 0.008;
      }
      // Slight head look
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
      }
    }

    if (robotState === 'walking') {
      // Walking cycle
      const walkSpeed = 8;
      const stride = 0.4;
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = Math.sin(time * walkSpeed) * stride;
        rightLegRef.current.rotation.x = -Math.sin(time * walkSpeed) * stride;
      }
      if (leftUpperArmRef.current && rightUpperArmRef.current) {
        leftUpperArmRef.current.rotation.x = -Math.sin(time * walkSpeed) * 0.3;
        rightUpperArmRef.current.rotation.x = Math.sin(time * walkSpeed) * 0.3;
      }
      // Body bob
      groupRef.current.position.y = Math.abs(Math.sin(time * walkSpeed)) * 0.03;
      // Slight torso twist
      if (torsoRef.current) {
        torsoRef.current.rotation.y = Math.sin(time * walkSpeed) * 0.04;
      }
    }

    if (robotState === 'working') {
      // Working arm movements
      if (leftUpperArmRef.current && rightUpperArmRef.current) {
        leftUpperArmRef.current.rotation.x = -0.8 + Math.sin(time * 3) * 0.4;
        rightUpperArmRef.current.rotation.x = -0.8 + Math.sin(time * 3 + 1.5) * 0.4;
        leftUpperArmRef.current.rotation.z = Math.sin(time * 2) * 0.15;
        rightUpperArmRef.current.rotation.z = -Math.sin(time * 2) * 0.15;
      }
      // Head looks down
      if (headRef.current) {
        headRef.current.rotation.x = -0.2 + Math.sin(time * 1) * 0.05;
      }
      // Subtle body movement
      if (torsoRef.current) {
        torsoRef.current.rotation.y = Math.sin(time * 1.5) * 0.08;
      }
    }

    // Return to idle smoothly
    if (robotState === 'idle') {
      [leftLegRef, rightLegRef, leftUpperArmRef, rightUpperArmRef].forEach(ref => {
        if (ref.current) {
          ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, 0, 0.05);
          ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, 0, 0.05);
        }
      });
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.05);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* === TORSO === */}
      <group ref={torsoRef} position={[0, 1.05, 0]}>
        {/* Upper torso / chest */}
        <mesh castShadow>
          <boxGeometry args={[0.44, 0.38, 0.22]} />
          <meshStandardMaterial color={accent} metalness={0.4} roughness={0.4} />
        </mesh>
        {/* Chest detail - center line */}
        <mesh position={[0, 0, 0.115]}>
          <boxGeometry args={[0.06, 0.3, 0.01]} />
          <meshStandardMaterial color={shell} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Chest panel indicators */}
        <mesh position={[0.1, 0.05, 0.115]}>
          <boxGeometry args={[0.04, 0.04, 0.01]} />
          <meshStandardMaterial color={visor} emissive={visor} emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[-0.1, 0.05, 0.115]}>
          <boxGeometry args={[0.04, 0.04, 0.01]} />
          <meshStandardMaterial color={visor} emissive={visor} emissiveIntensity={1.5} />
        </mesh>

        {/* Lower torso / waist */}
        <mesh position={[0, -0.28, 0]} castShadow>
          <boxGeometry args={[0.36, 0.2, 0.18]} />
          <meshStandardMaterial color={shell} metalness={0.6} roughness={0.25} />
        </mesh>
        {/* Waist joint ring */}
        <mesh position={[0, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.18, 0.04, 16]} />
          <meshStandardMaterial color={joint} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* === HEAD === */}
        <group ref={headRef} position={[0, 0.38, 0]}>
          {/* Neck */}
          <mesh position={[0, -0.08, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.12, 12]} />
            <meshStandardMaterial color={joint} metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Head main */}
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[0.24, 0.26, 0.2]} />
            <meshStandardMaterial color={accent} metalness={0.35} roughness={0.45} />
          </mesh>

          {/* Visor / face screen */}
          <mesh position={[0, 0.11, 0.105]}>
            <boxGeometry args={[0.2, 0.1, 0.02]} />
            <meshStandardMaterial
              color="#001520"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {/* Visor glow */}
          <mesh position={[0, 0.11, 0.115]}>
            <boxGeometry args={[0.18, 0.06, 0.005]} />
            <meshStandardMaterial
              color={visor}
              emissive={visor}
              emissiveIntensity={2}
              transparent
              opacity={0.9}
            />
          </mesh>

          {/* Head top cap */}
          <mesh position={[0, 0.24, 0]} castShadow>
            <boxGeometry args={[0.22, 0.04, 0.18]} />
            <meshStandardMaterial color={shell} metalness={0.6} roughness={0.3} />
          </mesh>

          {/* Side sensors */}
          <mesh position={[0.13, 0.12, 0]}>
            <boxGeometry args={[0.02, 0.08, 0.06]} />
            <meshStandardMaterial color={shell} metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[-0.13, 0.12, 0]}>
            <boxGeometry args={[0.02, 0.08, 0.06]} />
            <meshStandardMaterial color={shell} metalness={0.7} roughness={0.2} />
          </mesh>
        </group>

        {/* === SHOULDERS === */}
        <Joint position={[-0.28, 0.12, 0]} size={0.06} color={joint} />
        <Joint position={[0.28, 0.12, 0]} size={0.06} color={joint} />

        {/* === LEFT ARM === */}
        <group ref={leftUpperArmRef} position={[-0.34, 0.05, 0]}>
          {/* Upper arm */}
          <mesh position={[0, -0.14, 0]} castShadow>
            <boxGeometry args={[0.1, 0.28, 0.1]} />
            <meshStandardMaterial color={shellLight} metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Elbow */}
          <Joint position={[0, -0.3, 0]} size={0.045} color={joint} />
          {/* Forearm */}
          <mesh position={[0, -0.45, 0]} castShadow>
            <boxGeometry args={[0.09, 0.25, 0.09]} />
            <meshStandardMaterial color={accent} metalness={0.35} roughness={0.4} />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.6, 0]} castShadow>
            <boxGeometry args={[0.07, 0.08, 0.04]} />
            <meshStandardMaterial color={joint} metalness={0.6} roughness={0.3} />
          </mesh>
        </group>

        {/* === RIGHT ARM === */}
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

      {/* === HIP JOINT === */}
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.3, 0.08, 0.16]} />
        <meshStandardMaterial color={shell} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* === LEFT LEG === */}
      <group ref={leftLegRef} position={[-0.1, 0.58, 0]}>
        <Joint position={[0, 0, 0]} size={0.05} color={joint} />
        {/* Upper leg */}
        <mesh position={[0, -0.18, 0]} castShadow>
          <boxGeometry args={[0.11, 0.3, 0.11]} />
          <meshStandardMaterial color={shellLight} metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Knee */}
        <Joint position={[0, -0.35, 0]} size={0.05} color={joint} />
        {/* Lower leg */}
        <mesh position={[0, -0.52, 0]} castShadow>
          <boxGeometry args={[0.1, 0.28, 0.1]} />
          <meshStandardMaterial color={accent} metalness={0.35} roughness={0.4} />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.68, 0.03]} castShadow>
          <boxGeometry args={[0.12, 0.04, 0.18]} />
          <meshStandardMaterial color={shell} metalness={0.5} roughness={0.3} />
        </mesh>
      </group>

      {/* === RIGHT LEG === */}
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

      {/* Ground shadow/glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial
          color={visor}
          emissive={visor}
          emissiveIntensity={0.3}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Subtle robot light */}
      <pointLight position={[0, 1.5, 0.3]} color={visor} intensity={0.4} distance={2} />
    </group>
  );
}
