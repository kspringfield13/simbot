import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useStore } from '../../stores/useStore';
import { getAvoidanceForce } from '../../systems/ObstacleMap';
import * as THREE from 'three';

// Map our task types to animation names in the GLB
const TASK_ANIMATION_MAP: Record<string, string> = {
  dishes: 'Punch',       // arm movements for scrubbing dishes
  cooking: 'Punch',
  vacuuming: 'Walking',  // slow walk while vacuuming
  cleaning: 'Punch',
  'bed-making': 'Wave',  // sweeping arm motions
  laundry: 'Punch',
  organizing: 'Wave',
  scrubbing: 'Punch',
  sweeping: 'Walking',
  'grocery-list': 'Standing',
  general: 'Standing',
};

export function Robot() {
  const groupRef = useRef<THREE.Group>(null);
  const currentSpeedRef = useRef(0);
  const currentActionRef = useRef<string>('Idle');
  const fadeTimeRef = useRef(0.4);

  const { scene, animations } = useGLTF('/models/robot-expressive.glb');
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Improve materials for PBR look
        if (child.material) {
          child.material = child.material.clone();
          child.material.metalness = Math.max(child.material.metalness ?? 0, 0.3);
          child.material.roughness = Math.min(child.material.roughness ?? 1, 0.6);
        }
      }
    });
    return clone;
  }, [scene]);

  const { actions, mixer } = useAnimations(animations, groupRef);

  const {
    robotPosition,
    robotTarget,
    robotState,
    currentAnimation,
    simSpeed,
    setRobotPosition,
    setRobotRotationY,
  } = useStore();

  // Play an animation with crossfade
  const playAnimation = (name: string, fadeTime = 0.4) => {
    if (currentActionRef.current === name) return;
    
    const prevAction = actions[currentActionRef.current];
    const nextAction = actions[name];
    
    if (!nextAction) return;

    if (prevAction) {
      prevAction.fadeOut(fadeTime);
    }

    nextAction.reset().fadeIn(fadeTime).play();
    currentActionRef.current = name;
    fadeTimeRef.current = fadeTime;
  };

  // Start with Idle
  useEffect(() => {
    if (actions['Idle']) {
      actions['Idle'].play();
      currentActionRef.current = 'Idle';
    }
  }, [actions]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const timeScale = Math.max(simSpeed, 0);
    const scaledDelta = Math.min(delta * timeScale, 0.08);

    // Set mixer speed based on sim speed
    if (mixer) {
      mixer.timeScale = timeScale;
    }

    // === MOVEMENT ===
    if (timeScale > 0 && robotTarget && robotState === 'walking') {
      const current = new THREE.Vector3(robotPosition[0], 0, robotPosition[2]);
      const target = new THREE.Vector3(robotTarget[0], 0, robotTarget[2]);
      const direction = target.clone().sub(current);
      const distance = direction.length();

      if (distance > 0.1) {
        direction.normalize();

        // Rotation
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

        // Obstacle avoidance
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

        // Choose walk or run animation based on speed
        if (currentSpeedRef.current > 1.0) {
          playAnimation('Running', 0.3);
          // Scale running animation speed with actual movement
          const runAction = actions['Running'];
          if (runAction) runAction.timeScale = currentSpeedRef.current / 1.3;
        } else {
          playAnimation('Walking', 0.3);
          const walkAction = actions['Walking'];
          if (walkAction) walkAction.timeScale = Math.max(currentSpeedRef.current / 0.8, 0.4);
        }
      } else {
        currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0, 0.15);
      }
    } else if (timeScale > 0 && robotState === 'idle') {
      currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0, 0.1);
      playAnimation('Idle', 0.5);
    } else if (timeScale > 0 && robotState === 'working') {
      currentSpeedRef.current = 0;
      const animName = TASK_ANIMATION_MAP[currentAnimation] ?? 'Standing';
      playAnimation(animName, 0.4);
    }

    // Update position
    groupRef.current.position.set(robotPosition[0], robotPosition[1], robotPosition[2]);
    setRobotRotationY(groupRef.current.rotation.y);
  });

  return (
    <group ref={groupRef}>
      <primitive
        object={clonedScene}
        scale={[0.55, 0.55, 0.55]}
        position={[0, 0, 0]}
      />
      {/* Subtle ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial
          color="#00b8e8"
          emissive="#00b8e8"
          emissiveIntensity={0.15}
          transparent
          opacity={0.08}
        />
      </mesh>
      <pointLight position={[0, 0.8, 0.2]} color="#00b8e8" intensity={0.2} distance={2} />
    </group>
  );
}

// Preload
useGLTF.preload('/models/robot-expressive.glb');
