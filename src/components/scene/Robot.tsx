import { useRef, useEffect, useMemo, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { useStore } from '../../stores/useStore';
import { getAvoidanceForce, isPositionClear, findClearPosition } from '../../systems/ObstacleMap';
import { ROBOT_CONFIGS } from '../../config/robots';
import type { RobotId, ActiveChat } from '../../types';
import { ROBOT_IDS } from '../../types';
import { useRobotDisplayName } from '../../stores/useRobotNames';
import { getFriendshipKey } from '../../config/conversations';
import { getActiveRooms } from '../../utils/homeLayout';
import { getEvolutionVisuals, getStageLabel, getStageColor } from '../../utils/evolution';
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

/** Check if all rooms have cleanliness >= 74 (green/"Clean" status) */
function areAllRoomsClean(): boolean {
  const roomNeeds = useStore.getState().roomNeeds;
  const rooms = getActiveRooms();
  if (rooms.length === 0) return false;
  return rooms.every((room) => {
    const needs = roomNeeds[room.id];
    return needs && needs.cleanliness >= 74;
  });
}

/** Shared high-five cooldown tracker between robot pairs (prevents double-triggering) */
const highFiveCooldowns: Record<string, number> = {};
const HIGHFIVE_PROXIMITY = 3.0;
const HIGHFIVE_DURATION = 1.6; // seconds
const HIGHFIVE_COOLDOWN = 15.0; // seconds between high-fives for same pair

function RobotBatteryBar({ robotId }: { robotId: RobotId }) {
  const battery = useStore((s) => Math.round(s.robots[robotId].battery));
  const isCharging = useStore((s) => s.robots[robotId].isCharging);
  const fill = battery > 50 ? '#4ade80' : battery > 20 ? '#facc15' : '#f87171';

  return (
    <div className="flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">
      <div className="relative h-[4px] w-[28px] overflow-hidden rounded-full bg-white/10">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${isCharging ? 'animate-pulse' : ''}`}
          style={{ width: `${battery}%`, background: fill }}
        />
      </div>
      <span className={`text-[7px] font-mono ${battery < 20 ? 'text-red-400' : isCharging ? 'text-emerald-400' : 'text-white/40'}`}>
        {battery}%
      </span>
    </div>
  );
}

function RobotFlashlight({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) {
  const spotRef = useRef<THREE.SpotLight>(null);
  const coneRef = useRef<THREE.Mesh>(null);
  const targetRef = useRef<THREE.Object3D>(null);
  const intensityRef = useRef(0);

  useFrame(() => {
    const period = useStore.getState().simPeriod;
    const isNight = period === 'night';
    const targetIntensity = isNight ? 8 : 0;
    intensityRef.current = THREE.MathUtils.lerp(intensityRef.current, targetIntensity, 0.06);

    if (spotRef.current && groupRef.current) {
      spotRef.current.intensity = intensityRef.current;
      // Point the spotlight forward from the robot's position
      const forward = new THREE.Vector3(0, 0, 1);
      forward.applyQuaternion(groupRef.current.quaternion);
      const pos = groupRef.current.position;
      if (targetRef.current) {
        targetRef.current.position.set(
          pos.x + forward.x * 10,
          0.3,
          pos.z + forward.z * 10,
        );
      }
    }

    if (coneRef.current) {
      const mat = coneRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, isNight ? 0.12 : 0, 0.06);
    }
  });

  return (
    <>
      <spotLight
        ref={spotRef}
        color="#ffe8a0"
        intensity={0}
        angle={Math.PI / 6}
        penumbra={0.5}
        distance={18}
        decay={1.5}
        position={[0, 1.6, 0.4]}
        castShadow={false}
      >
        <primitive object={(() => {
          const target = new THREE.Object3D();
          targetRef.current = target;
          return target;
        })()} attach="target" />
      </spotLight>

      {/* Visible flashlight cone beam */}
      <mesh ref={coneRef} position={[0, 1.2, 3.5]} rotation={[Math.PI / 2 + 0.15, 0, 0]}>
        <coneGeometry args={[2.2, 6, 16, 1, true]} />
        <meshBasicMaterial
          color="#fff5c0"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

/** Speech bubble shown above a robot during an active chat */
function ChatBubble({ robotId }: { robotId: RobotId }) {
  const chatLine = useStore((s) => {
    const chat = s.activeChats.find(
      (c: ActiveChat) => c.robotA === robotId || c.robotB === robotId,
    );
    if (!chat) return null;
    const line = chat.lines[chat.currentLineIndex];
    if (!line || line.speaker !== robotId) return null;
    return line.text;
  });

  if (!chatLine) return null;

  return (
    <Html center distanceFactor={10} position={[0, 2.6, 0]} transform>
      <div className="pointer-events-none max-w-[170px] animate-pulse rounded-xl border border-pink-400/30 bg-gradient-to-br from-pink-900/80 to-purple-900/80 px-3 py-1.5 text-[10px] leading-snug text-pink-100 shadow-lg backdrop-blur-md">
        <span className="mr-1 text-[8px]">💬</span>
        {chatLine}
      </div>
    </Html>
  );
}

/** Heart icon shown between best friends when they're close */
function FriendshipHeart({ robotId }: { robotId: RobotId }) {
  const showHeart = useStore((s) => {
    const myPos = s.robots[robotId].position;
    for (const otherId of ROBOT_IDS) {
      if (otherId === robotId) continue;
      const otherPos = s.robots[otherId].position;
      const dx = myPos[0] - otherPos[0];
      const dz = myPos[2] - otherPos[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 5) continue;
      const key = getFriendshipKey(robotId, otherId);
      const friendship = s.friendships[key];
      if (friendship && friendship.level >= 50) return true;
    }
    return false;
  });

  if (!showHeart) return null;

  return (
    <Html center distanceFactor={12} position={[0.6, 3.2, 0]} transform>
      <div className="pointer-events-none animate-bounce text-[12px] opacity-70">
        ❤️
      </div>
    </Html>
  );
}

/** Floating celebration indicator (party popper) */
function CelebrationIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <Html center distanceFactor={10} position={[0, 3.4, 0]} transform>
      <div className="pointer-events-none reaction-float text-[16px]">
        🎉
      </div>
    </Html>
  );
}

/** Floating high-five indicator */
function HighFiveIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <Html center distanceFactor={10} position={[-0.5, 3.2, 0]} transform>
      <div className="pointer-events-none reaction-float text-[14px]">
        🙌
      </div>
    </Html>
  );
}

function EvolutionBadge({ robotId }: { robotId: RobotId }) {
  const evo = useStore((s) => s.robotEvolutions[robotId]);
  if (!evo || evo.stage === 'novice') return null;
  const stageColor = getStageColor(evo.stage);
  const label = getStageLabel(evo.stage);
  return (
    <Html center distanceFactor={12} position={[0, 3.3, 0]} transform>
      <div
        className="pointer-events-none rounded-full px-1.5 py-0.5 text-[7px] font-bold tracking-wider whitespace-nowrap backdrop-blur-sm"
        style={{ background: `${stageColor}33`, color: stageColor, border: `1px solid ${stageColor}55` }}
      >
        {label}
      </div>
    </Html>
  );
}

/** Antenna accessory — appears for junior+ robots */
function RobotAntenna({ color, stage }: { color: string; stage: string }) {
  const stageIdx = ['novice', 'apprentice', 'expert', 'master', 'legend'].indexOf(stage);
  if (stageIdx < 1) return null;

  const tipRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (tipRef.current) {
      tipRef.current.position.y = 2.35 + Math.sin(performance.now() / 600) * 0.04;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Antenna stalk */}
      <mesh position={[0, 2.15, -0.05]}>
        <cylinderGeometry args={[0.015, 0.025, 0.35, 6]} />
        <meshStandardMaterial color="#666" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Antenna tip — glows with stage color */}
      <mesh ref={tipRef} position={[0, 2.35, -0.05]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6 + stageIdx * 0.2}
        />
      </mesh>
    </group>
  );
}

/** Shoulder accent lights — seasoned+ robots */
function ShoulderAccents({ color, stage }: { color: string; stage: string }) {
  const stageIdx = ['novice', 'apprentice', 'expert', 'master', 'legend'].indexOf(stage);
  if (stageIdx < 2) return null;

  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const t = performance.now() / 1000;
    const pulse = 0.4 + Math.sin(t * 2) * 0.2;
    if (leftRef.current) {
      (leftRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
    if (rightRef.current) {
      (rightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
  });

  return (
    <group>
      <mesh ref={leftRef} position={[-0.28, 1.4, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh ref={rightRef} position={[0.28, 1.4, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Orbiting particle ring — veteran+ robots */
function OrbitRing({ color, stage }: { color: string; stage: string }) {
  const stageIdx = ['novice', 'apprentice', 'expert', 'master', 'legend'].indexOf(stage);
  if (stageIdx < 3) return null;

  const groupRef = useRef<THREE.Group>(null);
  const particleCount = stageIdx >= 4 ? 8 : 5;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.015;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.8, 0]}>
      {Array.from({ length: particleCount }).map((_, i) => {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 0.65;
        return (
          <mesh key={i} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={1.2}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Crown/halo — legendary robots only */
function LegendaryCrown({ color }: { color: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ringRef.current) {
      ringRef.current.rotation.z = Math.sin(performance.now() / 2000) * 0.05;
      (ringRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.8 + Math.sin(performance.now() / 800) * 0.3;
    }
  });

  return (
    <group position={[0, 2.05, 0]}>
      {/* Halo ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.025, 12, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Crown points */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.18, 0.04, Math.sin(angle) * 0.18]}>
            <coneGeometry args={[0.025, 0.08, 4]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} metalness={0.8} roughness={0.2} />
          </mesh>
        );
      })}
    </group>
  );
}

function RobotModel({ robotId }: { robotId: RobotId }) {
  const config = ROBOT_CONFIGS[robotId];
  const customColor = useStore((s) => s.robotColors[robotId]);
  const displayColor = customColor ?? config.color;
  const evolution = useStore((s) => s.robotEvolutions[robotId]);
  const evoVisuals = getEvolutionVisuals(evolution);
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const currentSpeedRef = useRef(0);
  const currentAnimRef = useRef<string>('idle');
  const stuckTimerRef = useRef(0);
  const lastDistRef = useRef(999);

  // ── Celebration dance state (all rooms clean) ──
  const celebratingRef = useRef(false);
  const celebrationTimerRef = useRef(0);
  const celebrationSpinRef = useRef(0);
  const celebrationCooldownRef = useRef(0);
  const wasAllCleanRef = useRef(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // ── High-five state (two robots meet) ──
  const highFiveTimerRef = useRef(0);
  const highFiveActiveRef = useRef(false);
  const [showHighFive, setShowHighFive] = useState(false);

  const { scene, animations } = useGLTF('/models/xbot.glb');

  // Clone scene for this robot instance with unique materials
  const clonedScene = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene);
    const baseColor = new THREE.Color(displayColor);
    // Apply evolution color shift via HSL adjustment
    const hsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(hsl);
    const [hShift, sShift, lShift] = evoVisuals.colorShift;
    baseColor.setHSL(
      (hsl.h + hShift) % 1,
      Math.min(1, hsl.s + sShift),
      Math.min(1, hsl.l + lShift),
    );
    cloned.traverse((child: any) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.material = child.material.clone();
        child.material.emissive = baseColor;
        child.material.emissiveIntensity = evoVisuals.emissiveIntensity;
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
      }
    });
    return cloned;
  }, [scene, displayColor, evoVisuals.emissiveIntensity, evoVisuals.colorShift[0], evoVisuals.colorShift[1], evoVisuals.colorShift[2]]);

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

    // ── Celebration dance: spin+jump when all rooms are clean ──
    if (celebrationCooldownRef.current > 0) {
      celebrationCooldownRef.current -= delta;
    }

    const allClean = areAllRoomsClean();
    // Trigger on rising edge (rooms just became all-clean)
    if (allClean && !wasAllCleanRef.current && celebrationCooldownRef.current <= 0 && !celebratingRef.current) {
      celebratingRef.current = true;
      celebrationTimerRef.current = 0;
      celebrationSpinRef.current = 0;
      setShowCelebration(true);
    }
    wasAllCleanRef.current = allClean;

    let modelYOffset = 0;
    let modelSpinOffset = 0;

    if (celebratingRef.current) {
      celebrationTimerRef.current += delta;
      const t = celebrationTimerRef.current;
      const duration = 2.0;

      if (t < duration) {
        // Spin: 2 full rotations
        celebrationSpinRef.current = (t / duration) * Math.PI * 4;
        modelSpinOffset = celebrationSpinRef.current;
        // Jump: two smooth bounces via abs(sin)
        modelYOffset = Math.abs(Math.sin(t / duration * Math.PI * 2)) * 0.6;
        playAnim('agree', 0.2);
      } else {
        celebratingRef.current = false;
        setShowCelebration(false);
        celebrationCooldownRef.current = 30;
      }
    }

    // ── High-five: when two idle robots meet ──
    if (highFiveActiveRef.current) {
      highFiveTimerRef.current += delta;
      if (highFiveTimerRef.current < HIGHFIVE_DURATION) {
        const t = highFiveTimerRef.current;
        modelYOffset += Math.sin(t / HIGHFIVE_DURATION * Math.PI) * 0.3;
        playAnim('agree', 0.2);
      } else {
        highFiveActiveRef.current = false;
        setShowHighFive(false);
      }
    } else if (robot.state === 'idle' && !celebratingRef.current) {
      for (const otherId of ROBOT_IDS) {
        if (otherId === robotId) continue;
        const other = s.robots[otherId];
        if (other.state !== 'idle') continue;

        const dx = robot.position[0] - other.position[0];
        const dz = robot.position[2] - other.position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < HIGHFIVE_PROXIMITY) {
          const pairKey = [robotId, otherId].sort().join('-');
          const now = performance.now() / 1000;
          const lastTime = highFiveCooldowns[pairKey] ?? 0;

          if (now - lastTime > HIGHFIVE_COOLDOWN) {
            highFiveCooldowns[pairKey] = now;
            highFiveActiveRef.current = true;
            highFiveTimerRef.current = 0;
            setShowHighFive(true);
            break;
          }
        }
      }
    }

    // Apply transforms: base position on outer group, dance offsets on inner model
    groupRef.current.position.set(robot.position[0], robot.position[1], robot.position[2]);
    s.setRobotRotationY(robotId, groupRef.current.rotation.y);

    if (modelRef.current) {
      modelRef.current.position.y = modelYOffset / ROBOT_SCALE;
      modelRef.current.rotation.y = modelSpinOffset;

      // Evolution glow pulse for veteran+ robots
      if (evoVisuals.glowPulseSpeed > 0) {
        const pulse = Math.sin(performance.now() / 1000 * evoVisuals.glowPulseSpeed) * 0.1 + evoVisuals.emissiveIntensity;
        modelRef.current.traverse((child: any) => {
          if ((child.isMesh || child.isSkinnedMesh) && child.material?.emissiveIntensity !== undefined) {
            child.material.emissiveIntensity = pulse;
          }
        });
      }

      // Evolution scale
      const evoScale = ROBOT_SCALE * evoVisuals.scaleMult;
      modelRef.current.scale.setScalar(evoScale);
    }
  });

  const activeRobotId = useStore((s) => s.activeRobotId);
  const isActive = activeRobotId === robotId;
  const thought = useStore((s) => s.robots[robotId].thought);
  const displayName = useRobotDisplayName(robotId);
  return (
    <group ref={groupRef} onClick={handleClick}>
      <group ref={modelRef} scale={ROBOT_SCALE * evoVisuals.scaleMult}>
        <primitive object={clonedScene} />
        {/* Evolution visual accessories */}
        <RobotAntenna color={getStageColor(evolution.stage)} stage={evolution.stage} />
        <ShoulderAccents color={getStageColor(evolution.stage)} stage={evolution.stage} />
        <OrbitRing color={getStageColor(evolution.stage)} stage={evolution.stage} />
        {evolution.stage === 'legend' && <LegendaryCrown color={getStageColor(evolution.stage)} />}
      </group>

      {/* Night mode flashlight */}
      <RobotFlashlight groupRef={groupRef} />

      {/* Name label + battery bar above robot */}
      <Html center distanceFactor={12} position={[0, 2.8, 0]} transform>
        <div className="pointer-events-none flex flex-col items-center gap-0.5">
          <div
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide whitespace-nowrap backdrop-blur-sm ${
              isActive ? 'border border-white/30 bg-black/70 text-white' : 'bg-black/50 text-white/60'
            }`}
            style={{ borderColor: isActive ? displayColor : 'transparent' }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full mr-1" style={{ background: displayColor }} />
            {displayName}
          </div>
          <RobotBatteryBar robotId={robotId} />
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

      {/* Chat bubble (social interaction) */}
      <ChatBubble robotId={robotId} />

      {/* Friendship heart indicator */}
      <FriendshipHeart robotId={robotId} />

      {/* Evolution stage badge */}
      <EvolutionBadge robotId={robotId} />

      {/* Celebration dance indicator (all rooms clean) */}
      <CelebrationIndicator active={showCelebration} />

      {/* High-five indicator (robots meeting) */}
      <HighFiveIndicator active={showHighFive} />

      {/* Selection ring */}
      {isActive && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.8, 0.95, 32]} />
          <meshBasicMaterial color={displayColor} transparent opacity={0.4} />
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
