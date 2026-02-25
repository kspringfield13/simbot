import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useStore } from '../../stores/useStore';
import { getAvoidanceForce } from '../../systems/ObstacleMap';
import * as THREE from 'three';

// Robot height in model units is ~3.76. We want ~1.7 scene units tall.
// Model is 3.76 units tall. Rooms are 8x8 with 2.8 wall height.
// A human-scale robot should be ~0.8-0.9 scene units tall (roughly 1/3 wall height)
const ROBOT_SCALE = 0.22;

export function Robot() {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const currentSpeedRef = useRef(0);
  const walkPhaseRef = useRef(0);
  const animTimeRef = useRef(0);

  const { scene } = useGLTF('/models/optimus.glb');
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
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

    if (timeScale > 0) {
      animTimeRef.current += scaledDelta;
    }

    // === MOVEMENT ===
    if (timeScale > 0 && robotTarget && robotState === 'walking') {
      const current = new THREE.Vector3(robotPosition[0], 0, robotPosition[2]);
      const target = new THREE.Vector3(robotTarget[0], 0, robotTarget[2]);
      const direction = target.clone().sub(current);
      const distance = direction.length();

      if (distance > 0.1) {
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
          currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0.15, 0.08);
        } else {
          const targetSpeed = distance < 0.6 ? 0.5 : distance < 1.2 ? 0.9 : 1.3;
          const accelRate = currentSpeedRef.current < targetSpeed ? 0.04 : 0.08;
          currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, targetSpeed, accelRate);
        }

        const speed = currentSpeedRef.current * scaledDelta;

        const [avoidX, avoidZ] = getAvoidanceForce(
          robotPosition[0], robotPosition[2],
          direction.x, direction.z,
          0.8 + currentSpeedRef.current * 0.3,
        );
        const steerX = direction.x + avoidX * 0.5;
        const steerZ = direction.z + avoidZ * 0.5;
        const steerLen = Math.sqrt(steerX * steerX + steerZ * steerZ) || 1;

        const newPos: [number, number, number] = [
          robotPosition[0] + (steerX / steerLen) * speed,
          0,
          robotPosition[2] + (steerZ / steerLen) * speed,
        ];
        setRobotPosition(newPos);

        walkPhaseRef.current += currentSpeedRef.current * scaledDelta * 5.0;
      } else {
        currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0, 0.15);
      }
    } else if (timeScale > 0 && robotState === 'idle') {
      currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0, 0.1);
    }

    // Update group position
    groupRef.current.position.set(robotPosition[0], robotPosition[1], robotPosition[2]);
    setRobotRotationY(groupRef.current.rotation.y);

    const t = animTimeRef.current;
    const wp = walkPhaseRef.current;
    const sf = Math.min(currentSpeedRef.current / 1.3, 1);

    // === PROCEDURAL BODY ANIMATION (applied to model group) ===
    if (robotState === 'walking') {
      // Vertical bob — walk bounce
      const bob = Math.abs(Math.sin(wp)) * 0.015 * sf;
      modelRef.current.position.y = bob;
      // Slight forward lean at speed
      modelRef.current.rotation.x = THREE.MathUtils.lerp(modelRef.current.rotation.x, -sf * 0.04, 0.08);
      // Lateral sway
      modelRef.current.rotation.z = THREE.MathUtils.lerp(modelRef.current.rotation.z, Math.sin(wp) * 0.02 * sf, 0.1);
      // Pelvis rotation (torso twist)
      modelRef.current.rotation.y = THREE.MathUtils.lerp(modelRef.current.rotation.y, Math.sin(wp) * 0.03 * sf, 0.08);
    } else if (robotState === 'idle') {
      // Breathing
      const breath = Math.sin(t * 1.8) * 0.003;
      modelRef.current.position.y = THREE.MathUtils.lerp(modelRef.current.position.y, breath, 0.05);
      modelRef.current.rotation.x = THREE.MathUtils.lerp(modelRef.current.rotation.x, 0, 0.03);
      modelRef.current.rotation.z = THREE.MathUtils.lerp(modelRef.current.rotation.z, Math.sin(t * 0.4) * 0.005, 0.02);
      modelRef.current.rotation.y = THREE.MathUtils.lerp(modelRef.current.rotation.y, Math.sin(t * 0.25) * 0.02, 0.02);
    } else if (robotState === 'working') {
      // Working bob/sway depending on task
      const workIntensity = currentAnimation === 'scrubbing' || currentAnimation === 'vacuuming' ? 0.03 : 0.015;
      const workSpeed = currentAnimation === 'scrubbing' ? 3.5 : currentAnimation === 'vacuuming' ? 1.8 : 2.0;
      modelRef.current.position.y = Math.sin(t * workSpeed) * workIntensity;
      modelRef.current.rotation.x = THREE.MathUtils.lerp(modelRef.current.rotation.x, -0.04, 0.03);
      modelRef.current.rotation.y = THREE.MathUtils.lerp(modelRef.current.rotation.y, Math.sin(t * workSpeed * 0.5) * 0.06, 0.05);
      modelRef.current.rotation.z = THREE.MathUtils.lerp(modelRef.current.rotation.z, Math.sin(t * workSpeed) * 0.02, 0.05);

      // Vacuuming: move around the area
      if (currentAnimation === 'vacuuming') {
        groupRef.current.position.x = robotPosition[0] + Math.sin(t * 0.4) * 0.25;
        groupRef.current.position.z = robotPosition[2] + Math.cos(t * 0.55) * 0.25;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={modelRef}>
        <primitive
          object={clonedScene}
          scale={[ROBOT_SCALE, ROBOT_SCALE, ROBOT_SCALE]}
          position={[0, 0, 0]}
        />
      </group>
      {/* Ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.35, 32]} />
        <meshStandardMaterial
          color="#00b8e8"
          emissive="#00b8e8"
          emissiveIntensity={0.2}
          transparent
          opacity={0.1}
        />
      </mesh>
      <pointLight position={[0, 1.0, 0.3]} color="#00b8e8" intensity={0.25} distance={2.5} />
    </group>
  );
}

useGLTF.preload('/models/optimus.glb');
