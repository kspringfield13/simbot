import { useRef, useEffect, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { useStore } from '../../stores/useStore';
import { getAvoidanceForce, isPositionClear, findClearPosition } from '../../systems/ObstacleMap';
import { ROBOT_CONFIGS } from '../../config/robots';
import type { RobotId } from '../../types';
import { ROBOT_IDS } from '../../types';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const ROBOT_SCALE = 1.55;
const ROBOT_COLLISION_RADIUS = 1.2;

/** Get positions of all other robots for inter-robot avoidance */
function getOtherRobotPositions(selfId: RobotId): { x: number; z: number }[] {
  const robots = useStore.getState().robots;
  const others: { x: number; z: number }[] = [];
  for (const id of ROBOT_IDS) {
    if (id === selfId) continue;
    const pos = robots[id].position;
    others.push({ x: pos[0], z: pos[2] });
  }
  return others;
}

/** Compute avoidance force from other robots */
function getRobotAvoidanceForce(
  selfId: RobotId,
  posX: number,
  posZ: number,
  dirX: number,
  dirZ: number,
): [number, number] {
  const others = getOtherRobotPositions(selfId);
  let forceX = 0;
  let forceZ = 0;

  for (const other of others) {
    const dx = posX - other.x;
    const dz = posZ - other.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = ROBOT_COLLISION_RADIUS * 2;

    if (dist < minDist + 2.0) {
      const dot = dirX * (other.x - posX) + dirZ * (other.z - posZ);
      if (dot > 0 || dist < minDist) {
        const strength = dist < minDist ? 4.0 : 2.0 / Math.max(dist - minDist, 0.1);
        const nx = dx / Math.max(dist, 0.01);
        const nz = dz / Math.max(dist, 0.01);
        forceX += nx * strength;
        forceZ += nz * strength;
      }
    }
  }

  return [forceX, forceZ];
}

function RobotModel({ robotId }: { robotId: RobotId }) {
  const config = ROBOT_CONFIGS[robotId];
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const currentSpeedRef = useRef(0);
  const currentAnimRef = useRef<string>('idle');
  const stuckTimerRef = useRef(0);
  const lastDistRef = useRef(999);

  const { scene, animations } = useGLTF('/models/xbot.glb');

  // Clone scene for this robot instance with unique materials
  const clonedScene = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene);
    const color = new THREE.Color(config.color);
    cloned.traverse((child: any) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.material = child.material.clone();
        child.material.emissive = color;
        child.material.emissiveIntensity = 0.2;
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
      }
    });
    return cloned;
  }, [scene, config.color]);

  const { actions, mixer } = useAnimations(animations, modelRef);

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

  // Click to select this robot
  const handleClick = (e: any) => {
    e.stopPropagation();
    const s = useStore.getState();
    s.setActiveRobotId(robotId);
    if (s.cameraMode === 'overview') {
      s.setCameraMode('follow');
    }
  };

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const s = useStore.getState();
    const robot = s.robots[robotId];
    const simSpeed = s.simSpeed;

    const timeScale = Math.max(simSpeed, 0);
    const scaledDelta = Math.min(delta * timeScale, 0.08);
    if (mixer) mixer.timeScale = timeScale;

    if (timeScale > 0 && robot.target && robot.state === 'walking') {
      const dx = robot.target[0] - robot.position[0];
      const dz = robot.target[2] - robot.position[2];
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance > 0.15) {
        const dirX = dx / distance;
        const dirZ = dz / distance;

        const targetAngle = Math.atan2(dirX, dirZ);
        let diff = targetAngle - groupRef.current.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        groupRef.current.rotation.y += diff * 0.18;

        const targetSpeed = Math.abs(diff) > 1.0 ? 0.3 : (distance < 1.0 ? 0.8 : 1.3);
        currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, targetSpeed, 0.05);

        const speed = currentSpeedRef.current * scaledDelta;

        // Furniture avoidance
        const stuckTime = stuckTimerRef.current;
        const avoidStr = stuckTime > 1 ? 2.0 : 0.7;
        const [avoidX, avoidZ] = getAvoidanceForce(robot.position[0], robot.position[2], dirX, dirZ, 2.0);

        // Inter-robot avoidance
        const [robotAvoidX, robotAvoidZ] = getRobotAvoidanceForce(robotId, robot.position[0], robot.position[2], dirX, dirZ);

        let steerX = dirX + avoidX * avoidStr + robotAvoidX;
        let steerZ = dirZ + avoidZ * avoidStr + robotAvoidZ;

        if (stuckTime > 1.0) {
          const sign = ((Math.floor(stuckTime * 2) % 2) === 0) ? 1 : -1;
          steerX += Math.cos(targetAngle + Math.PI * 0.5 * sign) * 1.5;
          steerZ += Math.sin(targetAngle + Math.PI * 0.5 * sign) * 1.5;
        }

        const steerLen = Math.sqrt(steerX * steerX + steerZ * steerZ) || 1;
        const newX = robot.position[0] + (steerX / steerLen) * speed;
        const newZ = robot.position[2] + (steerZ / steerLen) * speed;

        if (isPositionClear(newX, newZ, 0.4)) {
          s.setRobotPosition(robotId, [newX, 0, newZ]);
        } else if (isPositionClear(newX, robot.position[2], 0.4)) {
          s.setRobotPosition(robotId, [newX, 0, robot.position[2]]);
        } else if (isPositionClear(robot.position[0], newZ, 0.4)) {
          s.setRobotPosition(robotId, [robot.position[0], 0, newZ]);
        }

        // Stuck detection
        if (Math.abs(distance - lastDistRef.current) < 0.08) {
          stuckTimerRef.current += scaledDelta;
          if (stuckTimerRef.current > 2) {
            const [cx, cz] = findClearPosition(robot.position[0], robot.position[2], 1.0);
            s.setRobotPosition(robotId, [cx, 0, cz]);
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
    } else if (robot.state === 'idle') {
      currentSpeedRef.current = 0;
      const t = performance.now() / 1000;
      // Offset animation cycles per robot so they don't sync
      const offset = robotId === 'sim' ? 0 : robotId === 'chef' ? 2.7 : 5.3;
      const cycle = Math.floor((t + offset) / 8) % 5;
      if (cycle === 1 && actions['agree']) {
        playAnim('agree', 0.5);
      } else if (cycle === 3 && actions['headShake']) {
        playAnim('headShake', 0.5);
      } else {
        playAnim('idle', 0.5);
      }
    } else if (robot.state === 'working') {
      currentSpeedRef.current = 0;
      playAnim('idle', 0.4);
    }

    groupRef.current.position.set(robot.position[0], robot.position[1], robot.position[2]);
    s.setRobotRotationY(robotId, groupRef.current.rotation.y);
  });

  const activeRobotId = useStore((s) => s.activeRobotId);
  const isActive = activeRobotId === robotId;
  const thought = useStore((s) => s.robots[robotId].thought);
  return (
    <group ref={groupRef} onClick={handleClick}>
      <group ref={modelRef} scale={[ROBOT_SCALE, ROBOT_SCALE, ROBOT_SCALE]}>
        <primitive object={clonedScene} />
      </group>

      {/* Name label above robot */}
      <Html center distanceFactor={12} position={[0, 2.8, 0]} transform>
        <div
          className={`pointer-events-none rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide whitespace-nowrap backdrop-blur-sm ${
            isActive ? 'border border-white/30 bg-black/70 text-white' : 'bg-black/50 text-white/60'
          }`}
          style={{ borderColor: isActive ? config.color : 'transparent' }}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full mr-1" style={{ background: config.color }} />
          {config.name}
        </div>
      </Html>

      {/* Thought bubble for active robot */}
      {isActive && (
        <Html center distanceFactor={10} position={[0, 2.2, 0]} transform>
          <div className="pointer-events-none max-w-[160px] rounded-lg border border-white/10 bg-black/75 px-2.5 py-1.5 text-[10px] leading-snug text-white/70 backdrop-blur-md">
            {thought.trim() || '...'}
          </div>
        </Html>
      )}

      {/* Selection ring */}
      {isActive && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.8, 0.95, 32]} />
          <meshBasicMaterial color={config.color} transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

function RobotInstance({ robotId }: { robotId: RobotId }) {
  return (
    <Suspense fallback={
      <mesh position={[0, 0.8, 0]}>
        <capsuleGeometry args={[0.3, 1, 8, 16]} />
        <meshStandardMaterial color={ROBOT_CONFIGS[robotId].color} />
      </mesh>
    }>
      <RobotModel robotId={robotId} />
    </Suspense>
  );
}

export function Robot() {
  return (
    <>
      {ROBOT_IDS.map((id) => (
        <RobotInstance key={id} robotId={id} />
      ))}
    </>
  );
}

useGLTF.preload('/models/xbot.glb');
