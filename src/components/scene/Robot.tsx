import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useStore } from '../../stores/useStore';
import { getAvoidanceForce, isPositionClear, findClearPosition } from '../../systems/ObstacleMap';
import * as THREE from 'three';

/*
 * XBot — Mixamo humanoid robot model.
 * 67 joints (full Mixamo rig), 7 animations: idle, walk, run, agree, headShake, sad_pose, sneak_pose
 * Properly rigged with professional skinning weights.
 * Robot aesthetic: metallic angular body, glowing eyes.
 */

// XBot is ~1.8 units tall. Target ~0.83 scene units.
const ROBOT_SCALE = 1.55;

const TASK_ANIM_MAP: Record<string, string> = {
  dishes: 'idle',
  scrubbing: 'idle',
  cooking: 'idle',
  cleaning: 'walk',
  vacuuming: 'walk',
  sweeping: 'walk',
  'bed-making': 'idle',
  laundry: 'idle',
  organizing: 'idle',
  'grocery-list': 'idle',
  general: 'idle',
};

export function Robot() {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const currentSpeedRef = useRef(0);
  const currentAnimRef = useRef<string>('idle');
  const stuckTimerRef = useRef(0);
  const lastDistRef = useRef(999);

  const { scene, animations } = useGLTF('/models/xbot.glb');

  // Setup shadows and enhance materials
  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false; // Prevent skinned mesh culling
      }
    });
  }, [scene]);

  const { actions, mixer } = useAnimations(animations, modelRef);

  const {
    robotPosition,
    robotTarget,
    robotState,
    currentAnimation,
    simSpeed,
    robotMood,
    setRobotPosition,
    setRobotRotationY,
  } = useStore();

  // Mood → visor/glow color mapping
  const moodColors: Record<string, string> = {
    content: '#00b8e8',   // calm blue (default)
    focused: '#ff8800',   // orange — working hard
    curious: '#a855f7',   // purple — exploring
    routine: '#00b8e8',   // blue — standard ops
    tired: '#64748b',     // dim gray — low energy
    lonely: '#6366f1',    // indigo — social need
    bored: '#eab308',     // yellow — restless
    happy: '#22c55e',     // green — satisfied
  };
  const visorColor = moodColors[robotMood] ?? '#00b8e8';

  // Update emissive materials on the model to reflect mood color
  useEffect(() => {
    const color = new THREE.Color(visorColor);
    scene.traverse((child: any) => {
      if ((child.isMesh || child.isSkinnedMesh) && child.material) {
        const mat = child.material;
        if (mat.emissive && mat.emissiveIntensity > 0) {
          mat.emissive.copy(color);
        }
      }
    });
  }, [scene, visorColor]);

  // Crossfade to animation
  const playAnim = (name: string, fadeTime = 0.35) => {
    if (currentAnimRef.current === name) return;
    if (!actions[name]) return;
    const prev = actions[currentAnimRef.current];
    const next = actions[name]!;
    if (prev) prev.fadeOut(fadeTime);
    next.reset().fadeIn(fadeTime).play();
    currentAnimRef.current = name;
  };

  // Start with idle
  useEffect(() => {
    console.log('[Robot] XBot animations:', Object.keys(actions));
    const idle = actions['idle'];
    if (idle) {
      idle.reset().play();
      currentAnimRef.current = 'idle';
      console.log('[Robot] ✅ Playing idle');
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
        // Avoidance with escalating strength when stuck
        const stuckTime = stuckTimerRef.current;
        const avoidStrength = stuckTime > 1.5 ? 2.0 : stuckTime > 0.8 ? 1.2 : 0.7;
        const lookAhead = 2.0 + currentSpeedRef.current * 0.4;
        const [avoidX, avoidZ] = getAvoidanceForce(
          robotPosition[0], robotPosition[2],
          direction.x, direction.z,
          lookAhead,
        );

        let steerX = direction.x + avoidX * avoidStrength;
        let steerZ = direction.z + avoidZ * avoidStrength;

        // If stuck for a while, add lateral escape — move perpendicular to direction
        if (stuckTime > 1.0) {
          const escapeAngle = stuckTime > 2.0 ? Math.PI * 0.7 : Math.PI * 0.4;
          const sign = ((Math.floor(stuckTime * 2) % 2) === 0) ? 1 : -1;
          steerX += Math.cos(Math.atan2(direction.x, direction.z) + escapeAngle * sign) * 1.5;
          steerZ += Math.sin(Math.atan2(direction.x, direction.z) + escapeAngle * sign) * 1.5;
        }

        const steerLen = Math.sqrt(steerX * steerX + steerZ * steerZ) || 1;

        const newX = robotPosition[0] + (steerX / steerLen) * speed;
        const newZ = robotPosition[2] + (steerZ / steerLen) * speed;

        // Only move if new position is clear
        if (isPositionClear(newX, newZ, 0.4)) {
          setRobotPosition([newX, 0, newZ]);
        } else {
          // Try sliding along one axis
          if (isPositionClear(newX, robotPosition[2], 0.4)) {
            setRobotPosition([newX, 0, robotPosition[2]]);
          } else if (isPositionClear(robotPosition[0], newZ, 0.4)) {
            setRobotPosition([robotPosition[0], 0, newZ]);
          }
          // else don't move — stuck detection will escalate
        }

        // Stuck detection
        if (Math.abs(distance - lastDistRef.current) < 0.05) {
          stuckTimerRef.current += scaledDelta;
          if (stuckTimerRef.current > 2) {
            // Truly stuck — find nearest clear position and teleport slightly
            console.log('[Robot] Stuck >4s, finding clear position');
            const [clearX, clearZ] = findClearPosition(robotPosition[0], robotPosition[2], 1.0);
            setRobotPosition([clearX, 0, clearZ]);
            stuckTimerRef.current = 0;
            lastDistRef.current = 999;
            currentSpeedRef.current = 0.5;
          }
        } else {
          stuckTimerRef.current = 0;
          lastDistRef.current = distance;
        }

        // Walk vs Run based on speed
        if (currentSpeedRef.current > 2.0) {
          playAnim('run', 0.3);
          const runAction = actions['run'];
          if (runAction) runAction.timeScale = currentSpeedRef.current / 2.2;
        } else {
          playAnim('walk', 0.3);
          const walkAction = actions['walk'];
          if (walkAction) walkAction.timeScale = Math.max(currentSpeedRef.current / 1.2, 0.4);
        }
      } else {
        currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0, 0.15);
      }
    } else if (timeScale > 0 && robotState === 'idle') {
      currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0, 0.1);
      playAnim('idle', 0.5);
    } else if (timeScale > 0 && robotState === 'working') {
      currentSpeedRef.current = 0;
      const animName = TASK_ANIM_MAP[currentAnimation] ?? 'idle';
      playAnim(animName, 0.4);

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
      <group ref={modelRef} scale={[ROBOT_SCALE, ROBOT_SCALE, ROBOT_SCALE]}>
        <primitive object={scene} />
      </group>
      {/* Ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshStandardMaterial
          color={visorColor}
          emissive={visorColor}
          emissiveIntensity={0.25}
          transparent
          opacity={0.1}
        />
      </mesh>
      <pointLight position={[0, 1.0, 0.3]} color={visorColor} intensity={0.25} distance={3} />
    </group>
  );
}

useGLTF.preload('/models/xbot.glb');
