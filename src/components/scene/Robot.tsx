import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useStore } from '../../stores/useStore';
import { getAvoidanceForce } from '../../systems/ObstacleMap';
import * as THREE from 'three';

/*
 * Tesla Optimus — rigged via Blender headless auto-rig.
 * 24 joints, 5 animations: Walk, Idle, Run, Work, Wave
 * Envelope-weighted skinning on 93K vertices.
 */

const ROBOT_SCALE = 0.22;

const TASK_ANIM_MAP: Record<string, string> = {
  dishes: 'Work',
  scrubbing: 'Work',
  cooking: 'Work',
  cleaning: 'Work',
  vacuuming: 'Walk',
  sweeping: 'Walk',
  'bed-making': 'Wave',
  laundry: 'Wave',
  organizing: 'Work',
  'grocery-list': 'Idle',
  general: 'Work',
};

export function Robot() {
  const groupRef = useRef<THREE.Group>(null);
  const currentSpeedRef = useRef(0);
  const currentAnimRef = useRef<string>('Idle');

  const { scene, animations } = useGLTF('/models/optimus-rigged.glb');
  const sceneRef = useRef<THREE.Group>(null);

  // Setup shadows
  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m: any) => {
            if (m.isMeshStandardMaterial) {
              m.metalness = Math.max(m.metalness, 0.3);
              m.roughness = Math.min(m.roughness, 0.6);
            }
          });
        }
      }
    });
  }, [scene]);

  // useAnimations needs a ref to the root that contains the animated nodes
  // Pass scene directly so the mixer finds the bones
  const { actions, mixer } = useAnimations(animations, sceneRef);

  const {
    robotPosition,
    robotTarget,
    robotState,
    currentAnimation,
    simSpeed,
    setRobotPosition,
    setRobotRotationY,
  } = useStore();

  // Crossfade to animation
  const playAnim = (name: string, fadeTime = 0.35) => {
    if (currentAnimRef.current === name) return;
    const prev = actions[currentAnimRef.current];
    const next = actions[name];
    if (!next) return;

    if (prev) prev.fadeOut(fadeTime);
    next.reset().fadeIn(fadeTime).play();
    currentAnimRef.current = name;
  };

  // Start with idle
  useEffect(() => {
    console.log('[Robot] Available animations:', Object.keys(actions));
    const idle = actions['Idle'];
    if (idle) {
      idle.reset().play();
      currentAnimRef.current = 'Idle';
      console.log('[Robot] Playing Idle animation');
    } else {
      console.warn('[Robot] Idle animation not found!');
    }
  }, [actions]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const timeScale = Math.max(simSpeed, 0);
    const scaledDelta = Math.min(delta * timeScale, 0.08);

    if (mixer) mixer.timeScale = timeScale;

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

        // Walk vs Run based on speed
        if (currentSpeedRef.current > 2.0) {
          playAnim('Run', 0.3);
          const runAction = actions['Run'];
          if (runAction) runAction.timeScale = currentSpeedRef.current / 2.2;
        } else {
          playAnim('Walk', 0.3);
          const walkAction = actions['Walk'];
          if (walkAction) walkAction.timeScale = Math.max(currentSpeedRef.current / 1.2, 0.4);
        }
      } else {
        currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0, 0.15);
      }
    } else if (timeScale > 0 && robotState === 'idle') {
      currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0, 0.1);
      playAnim('Idle', 0.5);
    } else if (timeScale > 0 && robotState === 'working') {
      currentSpeedRef.current = 0;
      const animName = TASK_ANIM_MAP[currentAnimation] ?? 'Work';
      playAnim(animName, 0.4);

      // Vacuuming: robot moves around area
      if (currentAnimation === 'vacuuming') {
        const t = performance.now() / 1000;
        groupRef.current.position.x = robotPosition[0] + Math.sin(t * 0.4) * 0.4;
        groupRef.current.position.z = robotPosition[2] + Math.cos(t * 0.55) * 0.4;
        return;
      }
    }

    groupRef.current.position.set(robotPosition[0], robotPosition[1], robotPosition[2]);
    setRobotRotationY(groupRef.current.rotation.y);
  });

  return (
    <group ref={groupRef}>
      <group ref={sceneRef} scale={[ROBOT_SCALE, ROBOT_SCALE, ROBOT_SCALE]}>
        <primitive object={scene} />
      </group>
      {/* Ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshStandardMaterial
          color="#00b8e8"
          emissive="#00b8e8"
          emissiveIntensity={0.2}
          transparent
          opacity={0.1}
        />
      </mesh>
      <pointLight position={[0, 1.0, 0.3]} color="#00b8e8" intensity={0.25} distance={3} />
    </group>
  );
}

useGLTF.preload('/models/optimus-rigged.glb');
