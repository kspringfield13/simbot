import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../stores/useStore';
import * as THREE from 'three';

export function Robot() {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const { robotPosition, robotTarget, robotState, setRobotPosition } = useStore();

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Smooth movement toward target
    if (robotTarget) {
      const current = new THREE.Vector3(...robotPosition);
      const target = new THREE.Vector3(...robotTarget);
      const direction = target.clone().sub(current);
      const distance = direction.length();

      if (distance > 0.3) {
        direction.normalize();
        const speed = 3 * delta;
        const newPos: [number, number, number] = [
          robotPosition[0] + direction.x * speed,
          0,
          robotPosition[2] + direction.z * speed,
        ];
        setRobotPosition(newPos);

        // Face direction of movement
        const angle = Math.atan2(direction.x, direction.z);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, 0.1);
      }
    }

    // Update visual position
    groupRef.current.position.set(robotPosition[0], robotPosition[1], robotPosition[2]);

    const time = Date.now() * 0.001;

    // Idle bobbing
    if (robotState === 'idle') {
      groupRef.current.position.y = Math.sin(time * 2) * 0.05;
    }

    // Walking bob
    if (robotState === 'walking') {
      groupRef.current.position.y = Math.abs(Math.sin(time * 6)) * 0.08;
    }

    // Arm animations
    if (leftArmRef.current && rightArmRef.current) {
      if (robotState === 'walking') {
        leftArmRef.current.rotation.x = Math.sin(time * 6) * 0.5;
        rightArmRef.current.rotation.x = -Math.sin(time * 6) * 0.5;
      } else if (robotState === 'working') {
        leftArmRef.current.rotation.x = Math.sin(time * 4) * 0.8;
        rightArmRef.current.rotation.x = Math.sin(time * 4 + 1) * 0.8;
        leftArmRef.current.rotation.z = Math.sin(time * 3) * 0.3;
      } else {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 0.1);
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.1);
        leftArmRef.current.rotation.z = 0;
      }
    }
  });

  const bodyColor = '#00d4ff';
  const accentColor = '#0a0a2e';
  const glowColor = '#00ffff';

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.5, 0.6, 0.3]} />
        <meshStandardMaterial color={accentColor} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Chest plate / glow */}
      <mesh position={[0, 0.95, 0.16]}>
        <boxGeometry args={[0.3, 0.2, 0.02]} />
        <meshStandardMaterial color={bodyColor} emissive={glowColor} emissiveIntensity={0.5} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.3]} />
        <meshStandardMaterial color={accentColor} metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.08, 1.43, 0.16]}>
        <boxGeometry args={[0.08, 0.04, 0.02]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.08, 1.43, 0.16]}>
        <boxGeometry args={[0.08, 0.04, 0.02]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2} />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 1.65, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.15]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0, 1.75, 0]}>
        <sphereGeometry args={[0.04]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={3} />
      </mesh>

      {/* Left Arm */}
      <mesh ref={leftArmRef} position={[-0.38, 0.85, 0]} castShadow>
        <boxGeometry args={[0.12, 0.5, 0.12]} />
        <meshStandardMaterial color={accentColor} metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Right Arm */}
      <mesh ref={rightArmRef} position={[0.38, 0.85, 0]} castShadow>
        <boxGeometry args={[0.12, 0.5, 0.12]} />
        <meshStandardMaterial color={accentColor} metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.12, 0.35, 0]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color={accentColor} metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0.12, 0.35, 0]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color={accentColor} metalness={0.3} roughness={0.5} />
      </mesh>

      {/* Ground glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.3, 0.5, 32]} />
        <meshStandardMaterial color={bodyColor} emissive={glowColor} emissiveIntensity={0.8} transparent opacity={0.4} />
      </mesh>

      {/* Point light on robot */}
      <pointLight position={[0, 1.5, 0.3]} color={glowColor} intensity={1} distance={3} />
    </group>
  );
}
