import { useRef, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useStore } from '../../stores/useStore';
import { getAvoidanceForce, isPositionClear, findClearPosition } from '../../systems/ObstacleMap';
import * as THREE from 'three';

const ROBOT_SCALE = 1.55;

function RobotModel() {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const currentSpeedRef = useRef(0);
  const currentAnimRef = useRef<string>('idle');
  const stuckTimerRef = useRef(0);
  const lastDistRef = useRef(999);

  const { scene, animations } = useGLTF('/models/xbot.glb');
  const { actions, mixer } = useAnimations(animations, modelRef);

  const {
    robotPosition,
    robotTarget,
    robotState,
    simSpeed,
    setRobotPosition,
    setRobotRotationY,
  } = useStore();

  // Setup shadows
  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
      }
    });
  }, [scene]);

  // Crossfade animation
  const playAnim = (name: string, fadeTime = 0.35) => {
    if (currentAnimRef.current === name || !actions[name]) return;
    const prev = actions[currentAnimRef.current];
    const next = actions[name]!;
    if (prev) prev.fadeOut(fadeTime);
    next.reset().fadeIn(fadeTime).play();
    currentAnimRef.current = name;
  };

  // Start idle
  useEffect(() => {
    if (actions['idle']) {
      actions['idle'].reset().play();
      currentAnimRef.current = 'idle';
    }
  }, [actions]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const timeScale = Math.max(simSpeed, 0);
    const scaledDelta = Math.min(delta * timeScale, 0.08);
    if (mixer) mixer.timeScale = timeScale;

    if (timeScale > 0 && robotTarget && robotState === 'walking') {
      const dx = robotTarget[0] - robotPosition[0];
      const dz = robotTarget[2] - robotPosition[2];
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance > 0.15) {
        const dirX = dx / distance;
        const dirZ = dz / distance;

        // Rotation
        const targetAngle = Math.atan2(dirX, dirZ);
        let diff = targetAngle - groupRef.current.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        groupRef.current.rotation.y += diff * 0.18;

        // Speed — walk only
        const targetSpeed = Math.abs(diff) > 1.0 ? 0.3 : (distance < 1.0 ? 0.8 : 1.3);
        currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, targetSpeed, 0.05);

        const speed = currentSpeedRef.current * scaledDelta;

        // Avoidance
        const stuckTime = stuckTimerRef.current;
        const avoidStr = stuckTime > 1 ? 2.0 : 0.7;
        const [avoidX, avoidZ] = getAvoidanceForce(robotPosition[0], robotPosition[2], dirX, dirZ, 2.0);

        let steerX = dirX + avoidX * avoidStr;
        let steerZ = dirZ + avoidZ * avoidStr;

        if (stuckTime > 1.0) {
          const sign = ((Math.floor(stuckTime * 2) % 2) === 0) ? 1 : -1;
          steerX += Math.cos(targetAngle + Math.PI * 0.5 * sign) * 1.5;
          steerZ += Math.sin(targetAngle + Math.PI * 0.5 * sign) * 1.5;
        }

        const steerLen = Math.sqrt(steerX * steerX + steerZ * steerZ) || 1;
        const newX = robotPosition[0] + (steerX / steerLen) * speed;
        const newZ = robotPosition[2] + (steerZ / steerLen) * speed;

        if (isPositionClear(newX, newZ, 0.4)) {
          setRobotPosition([newX, 0, newZ]);
        } else if (isPositionClear(newX, robotPosition[2], 0.4)) {
          setRobotPosition([newX, 0, robotPosition[2]]);
        } else if (isPositionClear(robotPosition[0], newZ, 0.4)) {
          setRobotPosition([robotPosition[0], 0, newZ]);
        }

        // Stuck detection
        if (Math.abs(distance - lastDistRef.current) < 0.08) {
          stuckTimerRef.current += scaledDelta;
          if (stuckTimerRef.current > 2) {
            const [cx, cz] = findClearPosition(robotPosition[0], robotPosition[2], 1.0);
            setRobotPosition([cx, 0, cz]);
            stuckTimerRef.current = 0;
            lastDistRef.current = 999;
          }
        } else {
          stuckTimerRef.current = 0;
          lastDistRef.current = distance;
        }

        playAnim('walk', 0.3);
        if (actions['walk']) actions['walk'].timeScale = Math.max(currentSpeedRef.current / 1.2, 0.4);
      } else {
        currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0, 0.15);
      }
    } else if (robotState === 'idle') {
      currentSpeedRef.current = 0;
      const t = performance.now() / 1000;
      const cycle = Math.floor(t / 8) % 5;
      if (cycle === 1 && actions['agree']) {
        playAnim('agree', 0.5);
      } else if (cycle === 3 && actions['headShake']) {
        playAnim('headShake', 0.5);
      } else {
        playAnim('idle', 0.5);
      }
    } else if (robotState === 'working') {
      currentSpeedRef.current = 0;
      playAnim('idle', 0.4);
    }

    groupRef.current.position.set(robotPosition[0], robotPosition[1], robotPosition[2]);
    setRobotRotationY(groupRef.current.rotation.y);
  });

  return (
    <group ref={groupRef}>
      <group ref={modelRef} scale={[ROBOT_SCALE, ROBOT_SCALE, ROBOT_SCALE]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

export function Robot() {
  return (
    <Suspense fallback={
      <mesh position={[0, 0.8, 0]}>
        <capsuleGeometry args={[0.3, 1, 8, 16]} />
        <meshStandardMaterial color="#aaa" />
      </mesh>
    }>
      <RobotModel />
    </Suspense>
  );
}

useGLTF.preload('/models/xbot.glb');
