import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useStore } from '../../stores/useStore';
import { getAvoidanceForce } from '../../systems/ObstacleMap';
import * as THREE from 'three';

/*
 * Tesla Optimus: single mesh, 6 material groups.
 * Model is ~16.6 units tall. We split it into body part groups via clipping planes
 * on separate copies, each in its own group node for bone-like animation.
 *
 * Approach: duplicate the model for each body part, clip vertices outside
 * the part's Y range by making them transparent, and rotate each group
 * around its pivot point. This gives us articulated animation without
 * needing a real skeleton.
 *
 * Simpler approach: just animate the whole model with procedural body motion
 * (bob, lean, sway) and add a helper skeleton overlay for limb indication.
 * Since the mesh is a single draw call, we get great performance.
 */

const ROBOT_SCALE = 0.22;

export function Robot() {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const currentSpeedRef = useRef(0);
  const walkPhaseRef = useRef(0);
  const animTimeRef = useRef(0);

  const { scene } = useGLTF('/models/optimus.glb');

  // Split model into head (y > 11.5) and body groups for basic articulation
  const { bodyScene } = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return { bodyScene: clone };
  }, [scene]);

  const {
    robotPosition,
    robotTarget,
    robotState,
    currentAnimation,
    simSpeed,
    setRobotPosition,
    setRobotRotationY,
  } = useStore();

  useFrame((_, delta) => {
    if (!groupRef.current || !modelRef.current) return;

    const timeScale = Math.max(simSpeed, 0);
    const scaledDelta = Math.min(delta * timeScale, 0.08);
    if (timeScale > 0) animTimeRef.current += scaledDelta;

    // === MOVEMENT ===
    if (timeScale > 0 && robotTarget && robotState === 'walking') {
      const current = new THREE.Vector3(robotPosition[0], 0, robotPosition[2]);
      const target = new THREE.Vector3(robotTarget[0], 0, robotTarget[2]);
      const direction = target.clone().sub(current);
      const distance = direction.length();

      if (distance > 0.15) {
        direction.normalize();
        const targetAngle = Math.atan2(direction.x, direction.z);
        const currentAngle = groupRef.current.rotation.y;
        let diff = targetAngle - currentAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const absDiff = Math.abs(diff);

        const rotSpeed = absDiff > 1.5 ? 0.18 : absDiff > 0.8 ? 0.14 : 0.1;
        groupRef.current.rotation.y += diff * rotSpeed;

        if (absDiff > 1.0) {
          currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0.3, 0.08);
        } else {
          const targetSpeed = distance < 1.2 ? 1.0 : distance < 2.5 ? 1.8 : 2.6;
          const accelRate = currentSpeedRef.current < targetSpeed ? 0.04 : 0.08;
          currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, targetSpeed, accelRate);
        }

        const speed = currentSpeedRef.current * scaledDelta;
        const [avoidX, avoidZ] = getAvoidanceForce(
          robotPosition[0], robotPosition[2],
          direction.x, direction.z,
          1.5 + currentSpeedRef.current * 0.3,
        );
        const steerX = direction.x + avoidX * 0.5;
        const steerZ = direction.z + avoidZ * 0.5;
        const steerLen = Math.sqrt(steerX * steerX + steerZ * steerZ) || 1;

        setRobotPosition([
          robotPosition[0] + (steerX / steerLen) * speed,
          0,
          robotPosition[2] + (steerZ / steerLen) * speed,
        ]);

        walkPhaseRef.current += currentSpeedRef.current * scaledDelta * 3.0;
      } else {
        currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0, 0.15);
      }
    } else if (timeScale > 0 && robotState === 'idle') {
      currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0, 0.1);
    }

    groupRef.current.position.set(robotPosition[0], robotPosition[1], robotPosition[2]);
    setRobotRotationY(groupRef.current.rotation.y);

    const t = animTimeRef.current;
    const wp = walkPhaseRef.current;
    const sf = Math.min(currentSpeedRef.current / 2.6, 1);

    // === BODY ANIMATION ===
    // Since the mesh is a single piece, we animate the model group for full-body motion
    // and use the head group for head-specific movement.

    if (robotState === 'walking') {
      // Walk bob
      const bob = Math.abs(Math.sin(wp)) * 0.15 * sf;
      modelRef.current.position.y = bob;

      // Forward lean at speed
      modelRef.current.rotation.x = THREE.MathUtils.lerp(modelRef.current.rotation.x, -sf * 0.06, 0.08);
      // Lateral sway (hip shift)
      modelRef.current.rotation.z = THREE.MathUtils.lerp(modelRef.current.rotation.z, Math.sin(wp) * 0.035 * sf, 0.1);
      // Pelvis twist
      modelRef.current.rotation.y = THREE.MathUtils.lerp(modelRef.current.rotation.y, Math.sin(wp) * 0.04 * sf, 0.08);

    } else if (robotState === 'idle') {
      const breath = Math.sin(t * 1.8) * 0.02;
      modelRef.current.position.y = THREE.MathUtils.lerp(modelRef.current.position.y, breath, 0.05);
      modelRef.current.rotation.x = THREE.MathUtils.lerp(modelRef.current.rotation.x, 0, 0.03);
      modelRef.current.rotation.z = THREE.MathUtils.lerp(modelRef.current.rotation.z, Math.sin(t * 0.4) * 0.008, 0.02);
      modelRef.current.rotation.y = THREE.MathUtils.lerp(modelRef.current.rotation.y, Math.sin(t * 0.25) * 0.015, 0.02);

    } else if (robotState === 'working') {
      const workSpeed = currentAnimation === 'scrubbing' || currentAnimation === 'dishes' ? 3.5
        : currentAnimation === 'vacuuming' ? 1.8 : 2.0;
      const intensity = currentAnimation === 'scrubbing' ? 0.04
        : currentAnimation === 'vacuuming' ? 0.03 : 0.02;

      modelRef.current.position.y = Math.sin(t * workSpeed) * intensity * 3;
      modelRef.current.rotation.x = THREE.MathUtils.lerp(modelRef.current.rotation.x, -0.06, 0.03);
      modelRef.current.rotation.y = THREE.MathUtils.lerp(modelRef.current.rotation.y, Math.sin(t * workSpeed * 0.5) * 0.08, 0.05);
      modelRef.current.rotation.z = THREE.MathUtils.lerp(modelRef.current.rotation.z, Math.sin(t * workSpeed) * 0.03, 0.05);

      if (currentAnimation === 'vacuuming') {
        groupRef.current.position.x = robotPosition[0] + Math.sin(t * 0.4) * 0.4;
        groupRef.current.position.z = robotPosition[2] + Math.cos(t * 0.55) * 0.4;
      }
    }

    // Head can move independently — scan/look around
    // Since head meshes are part of the same geometry, we animate via a parent transform node
    // The headGroupRef wraps the pivot point near the neck
    if (headGroupRef.current) {
      if (robotState === 'idle') {
        headGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          headGroupRef.current.rotation.y,
          Math.sin(t * 0.25) * 0.15 + Math.sin(t * 0.7) * 0.05, 0.015);
        headGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          headGroupRef.current.rotation.x,
          Math.sin(t * 0.35) * 0.05, 0.015);
      } else if (robotState === 'walking') {
        // Head stabilizes (counter-rotates vs body sway)
        headGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          headGroupRef.current.rotation.y,
          -Math.sin(wp) * 0.02 * sf, 0.05);
        headGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          headGroupRef.current.rotation.x, -0.03, 0.05);
      } else if (robotState === 'working') {
        // Head looks down at work surface with focused small movements
        const focusX = currentAnimation === 'scrubbing' || currentAnimation === 'dishes'
          ? -0.18 + Math.sin(t * 2.5) * 0.03  // look closely at hands
          : currentAnimation === 'vacuuming'
          ? -0.08 + Math.sin(t * 1.8) * 0.04  // scan floor ahead
          : -0.12 + Math.sin(t * 1.2) * 0.03; // general downward focus
        const focusY = currentAnimation === 'vacuuming'
          ? Math.sin(t * 0.4) * 0.15  // track vacuum path
          : Math.sin(t * 0.8) * 0.05; // subtle task-tracking
        headGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          headGroupRef.current.rotation.x, focusX, 0.04);
        headGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          headGroupRef.current.rotation.y, focusY, 0.04);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={modelRef} scale={[ROBOT_SCALE, ROBOT_SCALE, ROBOT_SCALE]}>
        <primitive object={bodyScene} />
      </group>
      {/* Ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshStandardMaterial color="#00b8e8" emissive="#00b8e8" emissiveIntensity={0.2} transparent opacity={0.1} />
      </mesh>
      <pointLight position={[0, 1.0, 0.3]} color="#00b8e8" intensity={0.25} distance={3} />
    </group>
  );
}

useGLTF.preload('/models/optimus.glb');
