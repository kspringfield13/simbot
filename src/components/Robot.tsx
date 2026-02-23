import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../stores/useStore';
import * as THREE from 'three';

export function Robot() {
  const groupRef = useRef<THREE.Group>(null);
  const leftUpperArmRef = useRef<THREE.Group>(null);
  const rightUpperArmRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftShinRef = useRef<THREE.Group>(null);
  const rightShinRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);

  const { robotPosition, robotTarget, robotState, currentAnimation, setRobotPosition } = useStore();

  // Colors - Tesla Optimus inspired
  const shellDark = '#1e1e1e';
  const shellMid = '#2d2d2d';
  const shellLight = '#3d3d3d';
  const panelWhite = '#ddd8cc';
  const panelLight = '#c8c2b4';
  const jointDark = '#111';
  const visor = '#00b8e8';
  const visorDim = '#005570';
  const indicator = '#00e0a0';

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // === MOVEMENT — slow, human-like pace ===
    if (robotTarget && robotState === 'walking') {
      const current = new THREE.Vector3(robotPosition[0], 0, robotPosition[2]);
      const target = new THREE.Vector3(robotTarget[0], 0, robotTarget[2]);
      const direction = target.clone().sub(current);
      const distance = direction.length();

      if (distance > 0.15) {
        direction.normalize();
        // ~1.2 m/s — realistic human walking speed
        const speed = 1.2 * delta;
        const newPos: [number, number, number] = [
          robotPosition[0] + direction.x * speed,
          0,
          robotPosition[2] + direction.z * speed,
        ];
        setRobotPosition(newPos);

        // Smooth rotation — gradual turn like a real biped
        const targetAngle = Math.atan2(direction.x, direction.z);
        const currentAngle = groupRef.current.rotation.y;
        let diff = targetAngle - currentAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        groupRef.current.rotation.y += diff * 0.06;
      }
    }

    groupRef.current.position.set(robotPosition[0], robotPosition[1], robotPosition[2]);

    const t = Date.now() * 0.001;

    // === IDLE ===
    if (robotState === 'idle') {
      // Subtle weight shifting
      if (torsoRef.current) {
        torsoRef.current.position.y = 1.05 + Math.sin(t * 1.2) * 0.004;
        torsoRef.current.rotation.y = THREE.MathUtils.lerp(torsoRef.current.rotation.y, 0, 0.02);
        torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, 0, 0.02);
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.3) * 0.08;
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, Math.sin(t * 0.5) * 0.02, 0.02);
      }
      // Arms hang naturally with slight sway
      if (leftUpperArmRef.current) {
        leftUpperArmRef.current.rotation.x = THREE.MathUtils.lerp(leftUpperArmRef.current.rotation.x, Math.sin(t * 0.8) * 0.02, 0.03);
        leftUpperArmRef.current.rotation.z = THREE.MathUtils.lerp(leftUpperArmRef.current.rotation.z, 0.05, 0.03);
      }
      if (rightUpperArmRef.current) {
        rightUpperArmRef.current.rotation.x = THREE.MathUtils.lerp(rightUpperArmRef.current.rotation.x, Math.sin(t * 0.8 + 0.5) * 0.02, 0.03);
        rightUpperArmRef.current.rotation.z = THREE.MathUtils.lerp(rightUpperArmRef.current.rotation.z, -0.05, 0.03);
      }
      // Forearms slight bend
      if (leftForearmRef.current) leftForearmRef.current.rotation.x = THREE.MathUtils.lerp(leftForearmRef.current.rotation.x, -0.08, 0.03);
      if (rightForearmRef.current) rightForearmRef.current.rotation.x = THREE.MathUtils.lerp(rightForearmRef.current.rotation.x, -0.08, 0.03);
      // Legs straight
      [leftLegRef, rightLegRef].forEach(ref => {
        if (ref.current) ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, 0, 0.03);
      });
      [leftShinRef, rightShinRef].forEach(ref => {
        if (ref.current) ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, 0, 0.03);
      });
    }

    // === WALKING — realistic human gait cycle ===
    if (robotState === 'walking') {
      const ws = 4.5; // slower, more natural cadence
      const hipSwing = 0.28;
      const kneeMax = 0.45;

      // Hip rotation (upper leg)
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = Math.sin(t * ws) * hipSwing;
        rightLegRef.current.rotation.x = Math.sin(t * ws + Math.PI) * hipSwing;
      }
      // Knee bend — only bends when leg is swinging forward
      if (leftShinRef.current && rightShinRef.current) {
        const leftPhase = Math.sin(t * ws);
        const rightPhase = Math.sin(t * ws + Math.PI);
        leftShinRef.current.rotation.x = leftPhase > 0 ? -leftPhase * kneeMax : 0;
        rightShinRef.current.rotation.x = rightPhase > 0 ? -rightPhase * kneeMax : 0;
      }
      // Counter-swing arms naturally
      if (leftUpperArmRef.current && rightUpperArmRef.current) {
        leftUpperArmRef.current.rotation.x = -Math.sin(t * ws) * 0.2;
        rightUpperArmRef.current.rotation.x = -Math.sin(t * ws + Math.PI) * 0.2;
        leftUpperArmRef.current.rotation.z = 0.05;
        rightUpperArmRef.current.rotation.z = -0.05;
      }
      if (leftForearmRef.current && rightForearmRef.current) {
        leftForearmRef.current.rotation.x = -0.15 - Math.max(0, Math.sin(t * ws)) * 0.1;
        rightForearmRef.current.rotation.x = -0.15 - Math.max(0, Math.sin(t * ws + Math.PI)) * 0.1;
      }
      // Vertical bob — double bounce per stride
      groupRef.current.position.y = Math.abs(Math.sin(t * ws * 2)) * 0.012;
      // Slight lateral sway
      if (torsoRef.current) {
        torsoRef.current.rotation.z = Math.sin(t * ws) * 0.015;
        torsoRef.current.rotation.y = Math.sin(t * ws) * 0.02;
        torsoRef.current.position.y = 1.05;
      }
      if (headRef.current) {
        headRef.current.rotation.x = -0.03;
        headRef.current.rotation.y = 0;
      }
    }

    // === WORKING ANIMATIONS ===
    if (robotState === 'working') {
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -0.2, 0.03);
      }

      switch (currentAnimation) {
        case 'dishes': {
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -1.1 + Math.sin(t * 4) * 0.12;
            rightUpperArmRef.current.rotation.x = -0.9 + Math.sin(t * 4 + 0.5) * 0.15;
            leftUpperArmRef.current.rotation.z = 0.15;
            rightUpperArmRef.current.rotation.z = -0.15 + Math.sin(t * 4) * 0.08;
          }
          if (leftForearmRef.current && rightForearmRef.current) {
            leftForearmRef.current.rotation.x = -0.6 + Math.sin(t * 6) * 0.1;
            rightForearmRef.current.rotation.x = -0.5 + Math.cos(t * 5) * 0.12;
          }
          if (torsoRef.current) torsoRef.current.rotation.x = -0.06;
          break;
        }
        case 'vacuuming': {
          const pushPull = Math.sin(t * 1.8) * 0.4;
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -0.6 + pushPull;
            rightUpperArmRef.current.rotation.x = -0.6 + pushPull;
            leftUpperArmRef.current.rotation.z = 0.12;
            rightUpperArmRef.current.rotation.z = -0.12;
          }
          if (leftForearmRef.current && rightForearmRef.current) {
            leftForearmRef.current.rotation.x = -0.3;
            rightForearmRef.current.rotation.x = -0.3;
          }
          // Slow walk while vacuuming
          if (leftLegRef.current && rightLegRef.current) {
            leftLegRef.current.rotation.x = Math.sin(t * 2.5) * 0.12;
            rightLegRef.current.rotation.x = -Math.sin(t * 2.5) * 0.12;
          }
          if (leftShinRef.current && rightShinRef.current) {
            const lp = Math.sin(t * 2.5);
            leftShinRef.current.rotation.x = lp > 0 ? -lp * 0.15 : 0;
            rightShinRef.current.rotation.x = -lp > 0 ? lp * 0.15 : 0;
          }
          if (torsoRef.current) torsoRef.current.rotation.y = Math.sin(t * 0.6) * 0.25;
          groupRef.current.position.x = robotPosition[0] + Math.sin(t * 0.4) * 0.25;
          groupRef.current.position.z = robotPosition[2] + Math.cos(t * 0.55) * 0.25;
          break;
        }
        case 'sweeping': {
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -0.8;
            rightUpperArmRef.current.rotation.x = -0.55;
            leftUpperArmRef.current.rotation.z = Math.sin(t * 2.5) * 0.3;
            rightUpperArmRef.current.rotation.z = Math.sin(t * 2.5) * 0.25;
          }
          if (leftForearmRef.current) leftForearmRef.current.rotation.x = -0.4;
          if (rightForearmRef.current) rightForearmRef.current.rotation.x = -0.3;
          if (torsoRef.current) torsoRef.current.rotation.y = Math.sin(t * 2.5) * 0.08;
          break;
        }
        case 'cleaning': {
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -0.7 + Math.sin(t * 2.5) * 0.1;
            rightUpperArmRef.current.rotation.x = -0.9 + Math.cos(t * 3) * 0.12;
            leftUpperArmRef.current.rotation.z = 0.25 + Math.cos(t * 2.5) * 0.15;
            rightUpperArmRef.current.rotation.z = -0.08 + Math.sin(t * 3) * 0.15;
          }
          if (leftForearmRef.current && rightForearmRef.current) {
            leftForearmRef.current.rotation.x = -0.5 + Math.sin(t * 3) * 0.1;
            rightForearmRef.current.rotation.x = -0.6 + Math.cos(t * 3.5) * 0.1;
          }
          if (torsoRef.current) torsoRef.current.rotation.y = Math.sin(t * 1.2) * 0.12;
          break;
        }
        case 'bed-making': {
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -0.4 + Math.sin(t * 1.5) * 0.4;
            rightUpperArmRef.current.rotation.x = -0.4 + Math.sin(t * 1.5 + Math.PI) * 0.4;
            leftUpperArmRef.current.rotation.z = 0.35 + Math.sin(t * 1.5) * 0.15;
            rightUpperArmRef.current.rotation.z = -0.35 - Math.sin(t * 1.5) * 0.15;
          }
          if (leftForearmRef.current && rightForearmRef.current) {
            leftForearmRef.current.rotation.x = -0.3;
            rightForearmRef.current.rotation.x = -0.3;
          }
          if (torsoRef.current) torsoRef.current.rotation.x = -0.12 + Math.sin(t * 1.5) * 0.06;
          break;
        }
        case 'laundry': {
          const fold = Math.sin(t * 1.5);
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -0.7 + fold * 0.2;
            rightUpperArmRef.current.rotation.x = -0.7 + fold * 0.2;
            leftUpperArmRef.current.rotation.z = 0.25 - fold * 0.25;
            rightUpperArmRef.current.rotation.z = -0.25 + fold * 0.25;
          }
          if (leftForearmRef.current && rightForearmRef.current) {
            leftForearmRef.current.rotation.x = -0.5 + fold * 0.15;
            rightForearmRef.current.rotation.x = -0.5 + fold * 0.15;
          }
          if (torsoRef.current) torsoRef.current.rotation.x = -0.08;
          break;
        }
        case 'organizing': {
          const pick = Math.sin(t * 1.2);
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = pick > 0 ? -0.4 - pick * 0.4 : -0.4;
            rightUpperArmRef.current.rotation.x = pick < 0 ? -0.4 + pick * 0.4 : -0.4;
            leftUpperArmRef.current.rotation.z = pick > 0 ? 0.15 : 0.05;
            rightUpperArmRef.current.rotation.z = pick < 0 ? -0.15 : -0.05;
          }
          if (leftForearmRef.current) leftForearmRef.current.rotation.x = pick > 0 ? -0.4 : -0.2;
          if (rightForearmRef.current) rightForearmRef.current.rotation.x = pick < 0 ? -0.4 : -0.2;
          if (torsoRef.current) torsoRef.current.rotation.y = Math.sin(t * 0.6) * 0.35;
          break;
        }
        case 'cooking': {
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -0.85;
            leftUpperArmRef.current.rotation.z = 0.15 + Math.sin(t * 3) * 0.1;
            rightUpperArmRef.current.rotation.x = -0.5 + Math.sin(t * 1.2) * 0.3;
            rightUpperArmRef.current.rotation.z = -0.08;
          }
          if (leftForearmRef.current) leftForearmRef.current.rotation.x = -0.6 + Math.sin(t * 3) * 0.05;
          if (rightForearmRef.current) rightForearmRef.current.rotation.x = -0.3;
          if (torsoRef.current) torsoRef.current.rotation.y = Math.sin(t * 0.8) * 0.08;
          break;
        }
        case 'scrubbing': {
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -0.9 + Math.sin(t * 5) * 0.15;
            rightUpperArmRef.current.rotation.x = -0.7 + Math.sin(t * 5 + 1) * 0.18;
            leftUpperArmRef.current.rotation.z = 0.1 + Math.cos(t * 5) * 0.1;
            rightUpperArmRef.current.rotation.z = -0.1;
          }
          if (leftForearmRef.current && rightForearmRef.current) {
            leftForearmRef.current.rotation.x = -0.7 + Math.sin(t * 5) * 0.1;
            rightForearmRef.current.rotation.x = -0.5;
          }
          if (torsoRef.current) {
            torsoRef.current.rotation.x = -0.1;
            torsoRef.current.rotation.y = Math.sin(t * 1.5) * 0.08;
          }
          if (leftLegRef.current && rightLegRef.current) {
            leftLegRef.current.rotation.x = -0.12;
            rightLegRef.current.rotation.x = -0.12;
          }
          if (leftShinRef.current && rightShinRef.current) {
            leftShinRef.current.rotation.x = -0.1;
            rightShinRef.current.rotation.x = -0.1;
          }
          break;
        }
        case 'grocery-list': {
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -0.45;
            leftUpperArmRef.current.rotation.z = 0.25;
            rightUpperArmRef.current.rotation.x = -0.25 + Math.sin(t * 1.2) * 0.15;
            rightUpperArmRef.current.rotation.z = -0.08;
          }
          if (leftForearmRef.current) leftForearmRef.current.rotation.x = -0.6;
          if (rightForearmRef.current) rightForearmRef.current.rotation.x = -0.3;
          if (headRef.current) headRef.current.rotation.y = Math.sin(t * 0.6) * 0.2;
          break;
        }
        default: {
          if (leftUpperArmRef.current && rightUpperArmRef.current) {
            leftUpperArmRef.current.rotation.x = -0.7 + Math.sin(t * 2.5) * 0.2;
            rightUpperArmRef.current.rotation.x = -0.7 + Math.sin(t * 2.5 + 1.5) * 0.2;
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
        {/* Upper chest — main panel */}
        <mesh castShadow>
          <boxGeometry args={[0.46, 0.36, 0.22]} />
          <meshStandardMaterial color={panelWhite} metalness={0.3} roughness={0.5} />
        </mesh>
        {/* Chest side panels */}
        <mesh position={[-0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.34, 0.21]} />
          <meshStandardMaterial color={shellMid} metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.34, 0.21]} />
          <meshStandardMaterial color={shellMid} metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Center seam */}
        <mesh position={[0, 0, 0.115]}>
          <boxGeometry args={[0.025, 0.32, 0.005]} />
          <meshStandardMaterial color={shellDark} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Status indicators */}
        <mesh position={[0.08, 0.08, 0.115]}>
          <boxGeometry args={[0.03, 0.03, 0.008]} />
          <meshStandardMaterial color={indicator} emissive={indicator} emissiveIntensity={2} />
        </mesh>
        <mesh position={[-0.08, 0.08, 0.115]}>
          <boxGeometry args={[0.03, 0.03, 0.008]} />
          <meshStandardMaterial color={visor} emissive={visor} emissiveIntensity={1.5} />
        </mesh>
        {/* Back plate */}
        <mesh position={[0, 0, -0.115]} castShadow>
          <boxGeometry args={[0.42, 0.34, 0.01]} />
          <meshStandardMaterial color={shellMid} metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Back detail vents */}
        {[-0.1, 0, 0.1].map((y, i) => (
          <mesh key={`vent-${i}`} position={[0, y, -0.125]}>
            <boxGeometry args={[0.2, 0.025, 0.005]} />
            <meshStandardMaterial color={shellDark} metalness={0.7} roughness={0.2} />
          </mesh>
        ))}

        {/* Lower torso / waist */}
        <mesh position={[0, -0.26, 0]} castShadow>
          <boxGeometry args={[0.38, 0.16, 0.18]} />
          <meshStandardMaterial color={shellDark} metalness={0.6} roughness={0.25} />
        </mesh>
        {/* Waist detail ring */}
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.21, 0.19, 0.03, 20]} />
          <meshStandardMaterial color={jointDark} metalness={0.8} roughness={0.15} />
        </mesh>
        {/* Abdominal segments */}
        {[-0.22, -0.26, -0.30].map((y, i) => (
          <mesh key={`ab-${i}`} position={[0, y, 0.095]}>
            <boxGeometry args={[0.25, 0.02, 0.005]} />
            <meshStandardMaterial color={shellLight} metalness={0.4} roughness={0.4} />
          </mesh>
        ))}

        {/* === HEAD === */}
        <group ref={headRef} position={[0, 0.35, 0]}>
          {/* Neck — segmented */}
          <mesh position={[0, -0.06, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.07, 0.06, 14]} />
            <meshStandardMaterial color={jointDark} metalness={0.7} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.02, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.055, 0.04, 14]} />
            <meshStandardMaterial color={shellMid} metalness={0.6} roughness={0.3} />
          </mesh>

          {/* Head main shape */}
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[0.23, 0.24, 0.19]} />
            <meshStandardMaterial color={panelWhite} metalness={0.3} roughness={0.45} />
          </mesh>
          {/* Head top */}
          <mesh position={[0, 0.23, 0]} castShadow>
            <boxGeometry args={[0.21, 0.03, 0.17]} />
            <meshStandardMaterial color={shellMid} metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Chin */}
          <mesh position={[0, -0.02, 0.04]} castShadow>
            <boxGeometry args={[0.16, 0.04, 0.1]} />
            <meshStandardMaterial color={panelLight} metalness={0.3} roughness={0.5} />
          </mesh>

          {/* Visor housing */}
          <mesh position={[0, 0.12, 0.1]}>
            <boxGeometry args={[0.21, 0.1, 0.015]} />
            <meshStandardMaterial color={shellDark} metalness={0.8} roughness={0.1} />
          </mesh>
          {/* Visor screen */}
          <mesh position={[0, 0.12, 0.11]}>
            <boxGeometry args={[0.19, 0.065, 0.005]} />
            <meshStandardMaterial color={visorDim} metalness={0.9} roughness={0.05} />
          </mesh>
          {/* Visor glow */}
          <mesh position={[0, 0.12, 0.115]}>
            <boxGeometry args={[0.17, 0.04, 0.003]} />
            <meshStandardMaterial color={visor} emissive={visor} emissiveIntensity={2.5} transparent opacity={0.85} />
          </mesh>

          {/* Side sensors / ears */}
          <mesh position={[0.125, 0.1, 0]}>
            <boxGeometry args={[0.015, 0.1, 0.08]} />
            <meshStandardMaterial color={shellMid} metalness={0.6} roughness={0.25} />
          </mesh>
          <mesh position={[-0.125, 0.1, 0]}>
            <boxGeometry args={[0.015, 0.1, 0.08]} />
            <meshStandardMaterial color={shellMid} metalness={0.6} roughness={0.25} />
          </mesh>
          {/* Sensor lights */}
          <mesh position={[0.135, 0.1, 0]}>
            <boxGeometry args={[0.005, 0.04, 0.02]} />
            <meshStandardMaterial color={visor} emissive={visor} emissiveIntensity={1} />
          </mesh>
          <mesh position={[-0.135, 0.1, 0]}>
            <boxGeometry args={[0.005, 0.04, 0.02]} />
            <meshStandardMaterial color={visor} emissive={visor} emissiveIntensity={1} />
          </mesh>
        </group>

        {/* === SHOULDERS === */}
        <mesh position={[-0.27, 0.13, 0]} castShadow>
          <sphereGeometry args={[0.055, 14, 14]} />
          <meshStandardMaterial color={jointDark} metalness={0.8} roughness={0.15} />
        </mesh>
        <mesh position={[0.27, 0.13, 0]} castShadow>
          <sphereGeometry args={[0.055, 14, 14]} />
          <meshStandardMaterial color={jointDark} metalness={0.8} roughness={0.15} />
        </mesh>

        {/* === LEFT ARM === */}
        <group ref={leftUpperArmRef} position={[-0.33, 0.06, 0]}>
          {/* Upper arm */}
          <mesh position={[0, -0.12, 0]} castShadow>
            <boxGeometry args={[0.095, 0.22, 0.095]} />
            <meshStandardMaterial color={shellLight} metalness={0.45} roughness={0.35} />
          </mesh>
          {/* Bicep detail */}
          <mesh position={[-0.05, -0.1, 0]}>
            <boxGeometry args={[0.01, 0.12, 0.06]} />
            <meshStandardMaterial color={shellDark} metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Elbow */}
          <mesh position={[0, -0.25, 0]} castShadow>
            <sphereGeometry args={[0.042, 12, 12]} />
            <meshStandardMaterial color={jointDark} metalness={0.8} roughness={0.15} />
          </mesh>
          {/* Forearm */}
          <group ref={leftForearmRef} position={[0, -0.25, 0]}>
            <mesh position={[0, -0.15, 0]} castShadow>
              <boxGeometry args={[0.085, 0.22, 0.085]} />
              <meshStandardMaterial color={panelLight} metalness={0.3} roughness={0.45} />
            </mesh>
            {/* Wrist */}
            <mesh position={[0, -0.27, 0]} castShadow>
              <cylinderGeometry args={[0.03, 0.035, 0.03, 10]} />
              <meshStandardMaterial color={jointDark} metalness={0.7} roughness={0.2} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.32, 0]} castShadow>
              <boxGeometry args={[0.065, 0.07, 0.035]} />
              <meshStandardMaterial color={shellDark} metalness={0.5} roughness={0.35} />
            </mesh>
            {/* Finger detail */}
            <mesh position={[0, -0.37, 0]} castShadow>
              <boxGeometry args={[0.055, 0.03, 0.03]} />
              <meshStandardMaterial color={jointDark} metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        </group>

        {/* === RIGHT ARM === */}
        <group ref={rightUpperArmRef} position={[0.33, 0.06, 0]}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <boxGeometry args={[0.095, 0.22, 0.095]} />
            <meshStandardMaterial color={shellLight} metalness={0.45} roughness={0.35} />
          </mesh>
          <mesh position={[0.05, -0.1, 0]}>
            <boxGeometry args={[0.01, 0.12, 0.06]} />
            <meshStandardMaterial color={shellDark} metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.25, 0]} castShadow>
            <sphereGeometry args={[0.042, 12, 12]} />
            <meshStandardMaterial color={jointDark} metalness={0.8} roughness={0.15} />
          </mesh>
          <group ref={rightForearmRef} position={[0, -0.25, 0]}>
            <mesh position={[0, -0.15, 0]} castShadow>
              <boxGeometry args={[0.085, 0.22, 0.085]} />
              <meshStandardMaterial color={panelLight} metalness={0.3} roughness={0.45} />
            </mesh>
            <mesh position={[0, -0.27, 0]} castShadow>
              <cylinderGeometry args={[0.03, 0.035, 0.03, 10]} />
              <meshStandardMaterial color={jointDark} metalness={0.7} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.32, 0]} castShadow>
              <boxGeometry args={[0.065, 0.07, 0.035]} />
              <meshStandardMaterial color={shellDark} metalness={0.5} roughness={0.35} />
            </mesh>
            <mesh position={[0, -0.37, 0]} castShadow>
              <boxGeometry args={[0.055, 0.03, 0.03]} />
              <meshStandardMaterial color={jointDark} metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        </group>
      </group>

      {/* === HIP === */}
      <mesh position={[0, 0.63, 0]} castShadow>
        <boxGeometry args={[0.32, 0.07, 0.16]} />
        <meshStandardMaterial color={shellDark} metalness={0.6} roughness={0.25} />
      </mesh>

      {/* === LEFT LEG === */}
      <group ref={leftLegRef} position={[-0.1, 0.59, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.048, 12, 12]} />
          <meshStandardMaterial color={jointDark} metalness={0.8} roughness={0.15} />
        </mesh>
        {/* Upper leg / thigh */}
        <mesh position={[0, -0.16, 0]} castShadow>
          <boxGeometry args={[0.105, 0.26, 0.105]} />
          <meshStandardMaterial color={shellLight} metalness={0.45} roughness={0.35} />
        </mesh>
        {/* Thigh detail */}
        <mesh position={[0, -0.16, 0.055]}>
          <boxGeometry args={[0.07, 0.18, 0.008]} />
          <meshStandardMaterial color={shellDark} metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Knee */}
        <mesh position={[0, -0.32, 0]} castShadow>
          <sphereGeometry args={[0.048, 12, 12]} />
          <meshStandardMaterial color={jointDark} metalness={0.8} roughness={0.15} />
        </mesh>
        {/* Lower leg / shin */}
        <group ref={leftShinRef} position={[0, -0.32, 0]}>
          <mesh position={[0, -0.17, 0]} castShadow>
            <boxGeometry args={[0.095, 0.28, 0.095]} />
            <meshStandardMaterial color={panelLight} metalness={0.3} roughness={0.45} />
          </mesh>
          {/* Shin guard detail */}
          <mesh position={[0, -0.17, 0.05]}>
            <boxGeometry args={[0.06, 0.2, 0.008]} />
            <meshStandardMaterial color={shellMid} metalness={0.4} roughness={0.35} />
          </mesh>
          {/* Ankle */}
          <mesh position={[0, -0.33, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.04, 0.03, 10]} />
            <meshStandardMaterial color={jointDark} metalness={0.7} roughness={0.2} />
          </mesh>
          {/* Foot */}
          <mesh position={[0, -0.37, 0.025]} castShadow>
            <boxGeometry args={[0.11, 0.04, 0.18]} />
            <meshStandardMaterial color={shellDark} metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Toe */}
          <mesh position={[0, -0.38, 0.1]} castShadow>
            <boxGeometry args={[0.1, 0.02, 0.06]} />
            <meshStandardMaterial color={shellMid} metalness={0.4} roughness={0.35} />
          </mesh>
        </group>
      </group>

      {/* === RIGHT LEG === */}
      <group ref={rightLegRef} position={[0.1, 0.59, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.048, 12, 12]} />
          <meshStandardMaterial color={jointDark} metalness={0.8} roughness={0.15} />
        </mesh>
        <mesh position={[0, -0.16, 0]} castShadow>
          <boxGeometry args={[0.105, 0.26, 0.105]} />
          <meshStandardMaterial color={shellLight} metalness={0.45} roughness={0.35} />
        </mesh>
        <mesh position={[0, -0.16, 0.055]}>
          <boxGeometry args={[0.07, 0.18, 0.008]} />
          <meshStandardMaterial color={shellDark} metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.32, 0]} castShadow>
          <sphereGeometry args={[0.048, 12, 12]} />
          <meshStandardMaterial color={jointDark} metalness={0.8} roughness={0.15} />
        </mesh>
        <group ref={rightShinRef} position={[0, -0.32, 0]}>
          <mesh position={[0, -0.17, 0]} castShadow>
            <boxGeometry args={[0.095, 0.28, 0.095]} />
            <meshStandardMaterial color={panelLight} metalness={0.3} roughness={0.45} />
          </mesh>
          <mesh position={[0, -0.17, 0.05]}>
            <boxGeometry args={[0.06, 0.2, 0.008]} />
            <meshStandardMaterial color={shellMid} metalness={0.4} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.33, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.04, 0.03, 10]} />
            <meshStandardMaterial color={jointDark} metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.37, 0.025]} castShadow>
            <boxGeometry args={[0.11, 0.04, 0.18]} />
            <meshStandardMaterial color={shellDark} metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.38, 0.1]} castShadow>
            <boxGeometry args={[0.1, 0.02, 0.06]} />
            <meshStandardMaterial color={shellMid} metalness={0.4} roughness={0.35} />
          </mesh>
        </group>
      </group>

      {/* Subtle ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.25, 32]} />
        <meshStandardMaterial color={visor} emissive={visor} emissiveIntensity={0.2} transparent opacity={0.1} />
      </mesh>
      <pointLight position={[0, 1.5, 0.3]} color={visor} intensity={0.25} distance={1.5} />
    </group>
  );
}
