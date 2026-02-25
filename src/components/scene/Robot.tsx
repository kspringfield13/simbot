import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../../stores/useStore';
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

  // Smoothed speed for acceleration/deceleration
  const currentSpeedRef = useRef(0);
  const walkPhaseRef = useRef(0);
  const animationTimeRef = useRef(0);

  const {
    robotPosition,
    robotTarget,
    robotState,
    currentAnimation,
    simSpeed,
    setRobotPosition,
    setRobotRotationY,
  } = useStore();

  // Colors - Tesla Optimus inspired
  const shellDark = '#1e1e1e';
  const shellMid = '#2d2d2d';
  const panelWhite = '#ddd8cc';
  const panelLight = '#c8c2b4';
  const jointDark = '#111';
  const visor = '#00b8e8';
  const visorDim = '#005570';
  const indicator = '#00e0a0';

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const timeScale = Math.max(simSpeed, 0);
    const scaledDelta = Math.min(delta * timeScale, 0.08); // prevent jumps on tab switch

    // === MOVEMENT — acceleration, deceleration, precise turning ===
    if (timeScale > 0 && robotTarget && robotState === 'walking') {
      const current = new THREE.Vector3(robotPosition[0], 0, robotPosition[2]);
      const target = new THREE.Vector3(robotTarget[0], 0, robotTarget[2]);
      const direction = target.clone().sub(current);
      const distance = direction.length();

      if (distance > 0.1) {
        direction.normalize();

        // Calculate rotation
        const targetAngle = Math.atan2(direction.x, direction.z);
        const currentAngle = groupRef.current.rotation.y;
        let diff = targetAngle - currentAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const absDiff = Math.abs(diff);

        // Smooth rotation — faster for big turns, gentle for small adjustments
        const rotSpeed = absDiff > 1.5 ? 0.18 : absDiff > 0.8 ? 0.14 : 0.1;
        groupRef.current.rotation.y += diff * rotSpeed;

        if (absDiff > 1.0) {
          // Large angle — decelerate to turn in place
          currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0.15, 0.08);
        } else {
          // Target speed: full speed normally, decelerate near waypoint
          const targetSpeed = distance < 0.6 ? 0.5 : distance < 1.2 ? 0.9 : 1.3;
          // Accelerate smoothly from stops, decelerate near targets
          const accelRate = currentSpeedRef.current < targetSpeed ? 0.04 : 0.08;
          currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, targetSpeed, accelRate);
        }

        const speed = currentSpeedRef.current * scaledDelta;
        const newPos: [number, number, number] = [
          robotPosition[0] + direction.x * speed,
          0,
          robotPosition[2] + direction.z * speed,
        ];
        setRobotPosition(newPos);

        // Advance walk phase based on actual movement speed
        walkPhaseRef.current += currentSpeedRef.current * scaledDelta * 5.0;
      } else {
        // Very close — snap deceleration
        currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0, 0.15);
      }
    } else if (timeScale > 0 && robotState === 'idle') {
      currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0, 0.1);
    }

    if (timeScale > 0) {
      animationTimeRef.current += scaledDelta;
    }

    groupRef.current.position.set(robotPosition[0], robotPosition[1], robotPosition[2]);

    // Sync rotation to store for camera modes
    setRobotRotationY(groupRef.current.rotation.y);

    const t = animationTimeRef.current;
    const wp = walkPhaseRef.current;
    // Normalized speed factor for animation intensity (0..1)
    const sf = Math.min(currentSpeedRef.current / 1.3, 1);

    // === IDLE — breathing, micro-movements, occasional look-around ===
    if (robotState === 'idle') {
      // Breathing — chest rises and falls
      const breath = Math.sin(t * 1.8) * 0.006;
      if (torsoRef.current) {
        torsoRef.current.position.y = 1.05 + breath;
        torsoRef.current.rotation.y = THREE.MathUtils.lerp(torsoRef.current.rotation.y, Math.sin(t * 0.15) * 0.02, 0.01);
        torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, 0, 0.015);
        torsoRef.current.rotation.z = THREE.MathUtils.lerp(torsoRef.current.rotation.z, Math.sin(t * 0.4) * 0.005, 0.01);
      }
      if (headRef.current) {
        // Occasional slow look-around with varying speed
        const lookY = Math.sin(t * 0.25) * 0.12 + Math.sin(t * 0.7) * 0.04;
        const lookX = Math.sin(t * 0.35) * 0.03 + Math.sin(t * 0.13) * 0.02;
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, lookY, 0.015);
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, lookX, 0.015);
      }
      // Arms hang naturally with slight sway + breathing influence
      if (leftUpperArmRef.current) {
        leftUpperArmRef.current.rotation.x = THREE.MathUtils.lerp(leftUpperArmRef.current.rotation.x, Math.sin(t * 0.6) * 0.015 + breath * 2, 0.025);
        leftUpperArmRef.current.rotation.z = THREE.MathUtils.lerp(leftUpperArmRef.current.rotation.z, 0.06 + Math.sin(t * 0.4) * 0.01, 0.025);
      }
      if (rightUpperArmRef.current) {
        rightUpperArmRef.current.rotation.x = THREE.MathUtils.lerp(rightUpperArmRef.current.rotation.x, Math.sin(t * 0.6 + 0.8) * 0.015 + breath * 2, 0.025);
        rightUpperArmRef.current.rotation.z = THREE.MathUtils.lerp(rightUpperArmRef.current.rotation.z, -0.06 - Math.sin(t * 0.4) * 0.01, 0.025);
      }
      // Forearms slight natural bend
      if (leftForearmRef.current) leftForearmRef.current.rotation.x = THREE.MathUtils.lerp(leftForearmRef.current.rotation.x, -0.1 + Math.sin(t * 0.5) * 0.02, 0.02);
      if (rightForearmRef.current) rightForearmRef.current.rotation.x = THREE.MathUtils.lerp(rightForearmRef.current.rotation.x, -0.1 + Math.sin(t * 0.5 + 1) * 0.02, 0.02);
      // Legs — subtle weight shift side to side
      const weightShift = Math.sin(t * 0.3) * 0.015;
      [leftLegRef, rightLegRef].forEach((ref, i) => {
        if (ref.current) ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, i === 0 ? weightShift : -weightShift, 0.02);
      });
      [leftShinRef, rightShinRef].forEach(ref => {
        if (ref.current) ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, 0, 0.025);
      });
    }

    // === WALKING — realistic gait with speed-dependent intensity ===
    if (robotState === 'walking') {
      // Animation scales with speed
      const hipSwing = 0.22 + sf * 0.12; // bigger strides at full speed
      const kneeMax = 0.35 + sf * 0.15;
      const armSwing = 0.12 + sf * 0.14;
      const forearmBend = 0.12 + sf * 0.08;

      // Hip rotation (upper leg) — asymmetric for realism
      if (leftLegRef.current && rightLegRef.current) {
        const lHip = Math.sin(wp) * hipSwing;
        const rHip = Math.sin(wp + Math.PI) * hipSwing;
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, lHip, 0.12);
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, rHip, 0.12);
      }
      // Knee bend — smooth heel-strike/toe-off curve
      if (leftShinRef.current && rightShinRef.current) {
        const lp = Math.sin(wp);
        const rp = Math.sin(wp + Math.PI);
        // Knee bends during swing phase AND slightly at heel strike
        const lKnee = lp > 0 ? -lp * kneeMax : -Math.abs(lp) * kneeMax * 0.15;
        const rKnee = rp > 0 ? -rp * kneeMax : -Math.abs(rp) * kneeMax * 0.15;
        leftShinRef.current.rotation.x = THREE.MathUtils.lerp(leftShinRef.current.rotation.x, lKnee, 0.12);
        rightShinRef.current.rotation.x = THREE.MathUtils.lerp(rightShinRef.current.rotation.x, rKnee, 0.12);
      }
      // Counter-swing arms — opposite to legs, with natural lag
      if (leftUpperArmRef.current && rightUpperArmRef.current) {
        leftUpperArmRef.current.rotation.x = THREE.MathUtils.lerp(leftUpperArmRef.current.rotation.x, -Math.sin(wp) * armSwing, 0.1);
        rightUpperArmRef.current.rotation.x = THREE.MathUtils.lerp(rightUpperArmRef.current.rotation.x, -Math.sin(wp + Math.PI) * armSwing, 0.1);
        // Arms tuck in slightly at speed
        leftUpperArmRef.current.rotation.z = 0.04 + sf * 0.02;
        rightUpperArmRef.current.rotation.z = -0.04 - sf * 0.02;
      }
      // Forearms bend more when arm swings back
      if (leftForearmRef.current && rightForearmRef.current) {
        leftForearmRef.current.rotation.x = -forearmBend - Math.max(0, Math.sin(wp)) * 0.12 * sf;
        rightForearmRef.current.rotation.x = -forearmBend - Math.max(0, Math.sin(wp + Math.PI)) * 0.12 * sf;
      }
      // Vertical bob — peaks at mid-stance (double-bump per stride cycle)
      const bob = Math.abs(Math.sin(wp)) * 0.008 + Math.abs(Math.sin(wp * 2)) * 0.005;
      groupRef.current.position.y = bob * sf;
      // Torso — lateral sway, slight forward lean at speed, pelvis rotation
      if (torsoRef.current) {
        torsoRef.current.rotation.z = THREE.MathUtils.lerp(torsoRef.current.rotation.z, Math.sin(wp) * 0.018 * sf, 0.1);
        torsoRef.current.rotation.y = THREE.MathUtils.lerp(torsoRef.current.rotation.y, Math.sin(wp) * 0.025 * sf, 0.08);
        torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, -sf * 0.02, 0.05); // lean forward at speed
        torsoRef.current.position.y = 1.05;
      }
      // Head — stabilizes (counter-rotates slightly vs torso sway)
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -0.02 - sf * 0.02, 0.06);
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, -Math.sin(wp) * 0.01 * sf, 0.05);
        headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, -Math.sin(wp) * 0.008 * sf, 0.05);
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

  // Shared materials for performance
  const S = 16; // segment count for rounded shapes

  return (
    <group ref={groupRef}>
      {/* === TORSO === */}
      <group ref={torsoRef} position={[0, 1.05, 0]}>
        {/* Upper chest — rounded capsule torso */}
        <mesh castShadow>
          <capsuleGeometry args={[0.14, 0.2, 8, S]} />
          <meshStandardMaterial color={panelWhite} metalness={0.35} roughness={0.4} />
        </mesh>
        {/* Chest panel overlay — slightly forward */}
        <mesh position={[0, 0, 0.08]} castShadow>
          <cylinderGeometry args={[0.13, 0.12, 0.28, S]} />
          <meshStandardMaterial color={panelLight} metalness={0.3} roughness={0.45} />
        </mesh>
        {/* Center seam line */}
        <mesh position={[0, 0, 0.15]}>
          <cylinderGeometry args={[0.005, 0.005, 0.3, 6]} />
          <meshStandardMaterial color={shellDark} metalness={0.6} roughness={0.2} />
        </mesh>
        {/* Status indicator lights */}
        <mesh position={[0.06, 0.06, 0.155]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color={indicator} emissive={indicator} emissiveIntensity={3} />
        </mesh>
        <mesh position={[-0.06, 0.06, 0.155]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color={visor} emissive={visor} emissiveIntensity={2} />
        </mesh>
        {/* Back actuator housing */}
        <mesh position={[0, 0, -0.1]} castShadow>
          <cylinderGeometry args={[0.11, 0.1, 0.26, S]} />
          <meshStandardMaterial color={shellMid} metalness={0.5} roughness={0.3} />
        </mesh>

        {/* Lower torso / waist — tapered */}
        <mesh position={[0, -0.24, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.13, 0.14, S]} />
          <meshStandardMaterial color={shellDark} metalness={0.55} roughness={0.3} />
        </mesh>
        {/* Waist actuator ring */}
        <mesh position={[0, -0.17, 0]}>
          <torusGeometry args={[0.12, 0.015, 8, S]} />
          <meshStandardMaterial color={jointDark} metalness={0.85} roughness={0.1} />
        </mesh>

        {/* === HEAD === */}
        <group ref={headRef} position={[0, 0.35, 0]}>
          {/* Neck — stacked cylinders (actuator look) */}
          <mesh position={[0, -0.06, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.055, 0.05, S]} />
            <meshStandardMaterial color={jointDark} metalness={0.8} roughness={0.15} />
          </mesh>
          <mesh position={[0, -0.025, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.04, 0.03, S]} />
            <meshStandardMaterial color={shellMid} metalness={0.6} roughness={0.25} />
          </mesh>

          {/* Head — smooth rounded shape (Atlas style) */}
          <mesh position={[0, 0.1, 0.01]} castShadow>
            <sphereGeometry args={[0.12, S, S]} />
            <meshStandardMaterial color={panelWhite} metalness={0.3} roughness={0.35} />
          </mesh>
          {/* Head top cap */}
          <mesh position={[0, 0.18, 0]} castShadow>
            <sphereGeometry args={[0.09, S, S, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={shellMid} metalness={0.5} roughness={0.25} />
          </mesh>

          {/* Visor — smooth curved band across face */}
          <mesh position={[0, 0.11, 0.1]} rotation={[0.1, 0, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.05, S, 1, true, -Math.PI * 0.4, Math.PI * 0.8]} />
            <meshStandardMaterial color={visorDim} metalness={0.9} roughness={0.05} side={THREE.DoubleSide} />
          </mesh>
          {/* Visor glow strip */}
          <mesh position={[0, 0.11, 0.115]} rotation={[0.1, 0, 0]}>
            <cylinderGeometry args={[0.105, 0.105, 0.025, S, 1, true, -Math.PI * 0.35, Math.PI * 0.7]} />
            <meshStandardMaterial color={visor} emissive={visor} emissiveIntensity={3} transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>

          {/* Side sensor pods */}
          <mesh position={[0.12, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.015, 0.04, 4, 8]} />
            <meshStandardMaterial color={shellMid} metalness={0.6} roughness={0.2} />
          </mesh>
          <mesh position={[-0.12, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.015, 0.04, 4, 8]} />
            <meshStandardMaterial color={shellMid} metalness={0.6} roughness={0.2} />
          </mesh>
          {/* Sensor lights */}
          <mesh position={[0.14, 0.1, 0]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshStandardMaterial color={visor} emissive={visor} emissiveIntensity={1.5} />
          </mesh>
          <mesh position={[-0.14, 0.1, 0]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshStandardMaterial color={visor} emissive={visor} emissiveIntensity={1.5} />
          </mesh>
        </group>

        {/* === SHOULDERS — large ball joints === */}
        <mesh position={[-0.27, 0.13, 0]} castShadow>
          <sphereGeometry args={[0.06, S, S]} />
          <meshStandardMaterial color={jointDark} metalness={0.85} roughness={0.1} />
        </mesh>
        <mesh position={[0.27, 0.13, 0]} castShadow>
          <sphereGeometry args={[0.06, S, S]} />
          <meshStandardMaterial color={jointDark} metalness={0.85} roughness={0.1} />
        </mesh>

        {/* === LEFT ARM === */}
        <group ref={leftUpperArmRef} position={[-0.33, 0.06, 0]}>
          {/* Upper arm — tapered cylinder */}
          <mesh position={[0, -0.12, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 0.22, S]} />
            <meshStandardMaterial color={panelWhite} metalness={0.35} roughness={0.4} />
          </mesh>
          {/* Bicep actuator band */}
          <mesh position={[0, -0.06, 0]}>
            <torusGeometry args={[0.048, 0.008, 6, S]} />
            <meshStandardMaterial color={shellDark} metalness={0.7} roughness={0.15} />
          </mesh>
          {/* Elbow — ball joint */}
          <mesh position={[0, -0.25, 0]} castShadow>
            <sphereGeometry args={[0.045, S, S]} />
            <meshStandardMaterial color={jointDark} metalness={0.85} roughness={0.1} />
          </mesh>
          {/* Forearm */}
          <group ref={leftForearmRef} position={[0, -0.25, 0]}>
            <mesh position={[0, -0.14, 0]} castShadow>
              <cylinderGeometry args={[0.035, 0.045, 0.2, S]} />
              <meshStandardMaterial color={panelLight} metalness={0.3} roughness={0.4} />
            </mesh>
            {/* Wrist joint */}
            <mesh position={[0, -0.26, 0]} castShadow>
              <sphereGeometry args={[0.025, 10, 10]} />
              <meshStandardMaterial color={jointDark} metalness={0.8} roughness={0.12} />
            </mesh>
            {/* Hand — rounded */}
            <mesh position={[0, -0.31, 0]} castShadow>
              <capsuleGeometry args={[0.025, 0.04, 4, 8]} />
              <meshStandardMaterial color={shellDark} metalness={0.5} roughness={0.3} />
            </mesh>
            {/* Finger cluster */}
            <mesh position={[0, -0.37, 0]} castShadow>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color={jointDark} metalness={0.6} roughness={0.25} />
            </mesh>
          </group>
        </group>

        {/* === RIGHT ARM === */}
        <group ref={rightUpperArmRef} position={[0.33, 0.06, 0]}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 0.22, S]} />
            <meshStandardMaterial color={panelWhite} metalness={0.35} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.06, 0]}>
            <torusGeometry args={[0.048, 0.008, 6, S]} />
            <meshStandardMaterial color={shellDark} metalness={0.7} roughness={0.15} />
          </mesh>
          <mesh position={[0, -0.25, 0]} castShadow>
            <sphereGeometry args={[0.045, S, S]} />
            <meshStandardMaterial color={jointDark} metalness={0.85} roughness={0.1} />
          </mesh>
          <group ref={rightForearmRef} position={[0, -0.25, 0]}>
            <mesh position={[0, -0.14, 0]} castShadow>
              <cylinderGeometry args={[0.035, 0.045, 0.2, S]} />
              <meshStandardMaterial color={panelLight} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.26, 0]} castShadow>
              <sphereGeometry args={[0.025, 10, 10]} />
              <meshStandardMaterial color={jointDark} metalness={0.8} roughness={0.12} />
            </mesh>
            <mesh position={[0, -0.31, 0]} castShadow>
              <capsuleGeometry args={[0.025, 0.04, 4, 8]} />
              <meshStandardMaterial color={shellDark} metalness={0.5} roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.37, 0]} castShadow>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color={jointDark} metalness={0.6} roughness={0.25} />
            </mesh>
          </group>
        </group>
      </group>

      {/* === HIP — rounded pelvis === */}
      <mesh position={[0, 0.63, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.16, 4, S]} />
        <meshPhysicalMaterial color={shellDark} metalness={0.6} roughness={0.25} />
      </mesh>
      {/* Hip actuator discs */}
      <mesh position={[-0.1, 0.63, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.02, S]} />
        <meshStandardMaterial color={jointDark} metalness={0.85} roughness={0.1} />
      </mesh>
      <mesh position={[0.1, 0.63, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.02, S]} />
        <meshStandardMaterial color={jointDark} metalness={0.85} roughness={0.1} />
      </mesh>

      {/* === LEFT LEG === */}
      <group ref={leftLegRef} position={[-0.1, 0.59, 0]}>
        {/* Hip ball joint */}
        <mesh castShadow>
          <sphereGeometry args={[0.052, S, S]} />
          <meshStandardMaterial color={jointDark} metalness={0.85} roughness={0.1} />
        </mesh>
        {/* Thigh — tapered cylinder */}
        <mesh position={[0, -0.16, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.058, 0.26, S]} />
          <meshStandardMaterial color={panelWhite} metalness={0.35} roughness={0.4} />
        </mesh>
        {/* Thigh actuator band */}
        <mesh position={[0, -0.08, 0]}>
          <torusGeometry args={[0.055, 0.006, 6, S]} />
          <meshStandardMaterial color={shellDark} metalness={0.7} roughness={0.15} />
        </mesh>
        {/* Knee — large actuator joint */}
        <mesh position={[0, -0.32, 0]} castShadow>
          <sphereGeometry args={[0.052, S, S]} />
          <meshStandardMaterial color={jointDark} metalness={0.85} roughness={0.1} />
        </mesh>
        {/* Shin */}
        <group ref={leftShinRef} position={[0, -0.32, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow>
            <cylinderGeometry args={[0.038, 0.05, 0.26, S]} />
            <meshStandardMaterial color={panelLight} metalness={0.3} roughness={0.4} />
          </mesh>
          {/* Shin guard — front plate */}
          <mesh position={[0, -0.14, 0.04]} castShadow>
            <cylinderGeometry args={[0.03, 0.035, 0.18, 8, 1, true, -Math.PI * 0.3, Math.PI * 0.6]} />
            <meshStandardMaterial color={shellMid} metalness={0.45} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
          {/* Ankle actuator */}
          <mesh position={[0, -0.32, 0]} castShadow>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshStandardMaterial color={jointDark} metalness={0.8} roughness={0.12} />
          </mesh>
          {/* Foot — rounded wedge */}
          <mesh position={[0, -0.37, 0.02]} castShadow>
            <capsuleGeometry args={[0.03, 0.1, 4, 8]} />
            <meshStandardMaterial color={shellDark} metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Toe pad */}
          <mesh position={[0, -0.385, 0.08]} castShadow>
            <sphereGeometry args={[0.028, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={shellMid} metalness={0.4} roughness={0.35} />
          </mesh>
        </group>
      </group>

      {/* === RIGHT LEG === */}
      <group ref={rightLegRef} position={[0.1, 0.59, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.052, S, S]} />
          <meshStandardMaterial color={jointDark} metalness={0.85} roughness={0.1} />
        </mesh>
        <mesh position={[0, -0.16, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.058, 0.26, S]} />
          <meshStandardMaterial color={panelWhite} metalness={0.35} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.08, 0]}>
          <torusGeometry args={[0.055, 0.006, 6, S]} />
          <meshStandardMaterial color={shellDark} metalness={0.7} roughness={0.15} />
        </mesh>
        <mesh position={[0, -0.32, 0]} castShadow>
          <sphereGeometry args={[0.052, S, S]} />
          <meshStandardMaterial color={jointDark} metalness={0.85} roughness={0.1} />
        </mesh>
        <group ref={rightShinRef} position={[0, -0.32, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow>
            <cylinderGeometry args={[0.038, 0.05, 0.26, S]} />
            <meshStandardMaterial color={panelLight} metalness={0.3} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.14, 0.04]} castShadow>
            <cylinderGeometry args={[0.03, 0.035, 0.18, 8, 1, true, -Math.PI * 0.3, Math.PI * 0.6]} />
            <meshStandardMaterial color={shellMid} metalness={0.45} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.32, 0]} castShadow>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshStandardMaterial color={jointDark} metalness={0.8} roughness={0.12} />
          </mesh>
          <mesh position={[0, -0.37, 0.02]} castShadow>
            <capsuleGeometry args={[0.03, 0.1, 4, 8]} />
            <meshStandardMaterial color={shellDark} metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.385, 0.08]} castShadow>
            <sphereGeometry args={[0.028, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={shellMid} metalness={0.4} roughness={0.35} />
          </mesh>
        </group>
      </group>

      {/* Subtle ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial color={visor} emissive={visor} emissiveIntensity={0.15} transparent opacity={0.08} />
      </mesh>
      <pointLight position={[0, 1.5, 0.3]} color={visor} intensity={0.3} distance={2} />
    </group>
  );
}
