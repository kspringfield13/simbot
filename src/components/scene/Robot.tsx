import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useStore } from '../../stores/useStore';
import { getAvoidanceForce } from '../../systems/ObstacleMap';
import * as THREE from 'three';

/*
 * RobotExpressive GLB — full humanoid skeleton (43 joints), articulated fingers,
 * 14 built-in animations. Reskinned to Tesla Optimus color scheme.
 *
 * Materials reskin:
 *   Grey  → White panels (#ddd8cc, metalness 0.35)
 *   Main  → Dark charcoal body (#1e1e1e, metalness 0.55)
 *   Black → Jet black joints (#0a0a0a, metalness 0.85)
 *
 * Visor glow added via emissive on the "eye" area.
 */

// Scale: RobotExpressive is ~2.5 units tall. Target ~0.83 scene units.
const ROBOT_SCALE = 0.33;

// Optimus color palette
const COLORS = {
  panelWhite: new THREE.Color('#ddd8cc'),
  bodyDark: new THREE.Color('#1e1e1e'),
  jointBlack: new THREE.Color('#0a0a0a'),
  visor: new THREE.Color('#00b8e8'),
  indicator: new THREE.Color('#00e0a0'),
};

// Map robot states/tasks to animation names
const WALK_ANIM = 'Walking';
const RUN_ANIM = 'Running';
const IDLE_ANIM = 'Idle';

const TASK_ANIM_MAP: Record<string, string> = {
  dishes: 'Punch',
  scrubbing: 'Punch',
  cooking: 'Punch',
  cleaning: 'Punch',
  vacuuming: 'Walking',
  sweeping: 'Walking',
  'bed-making': 'Wave',
  laundry: 'Wave',
  organizing: 'ThumbsUp',
  'grocery-list': 'Standing',
  general: 'Standing',
};

export function Robot() {
  const groupRef = useRef<THREE.Group>(null);
  const currentSpeedRef = useRef(0);
  const currentAnimRef = useRef<string>(IDLE_ANIM);

  const { scene, animations } = useGLTF('/models/robot-expressive.glb');

  // Clone and reskin
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Reskin materials to Optimus palette
        const reskinMaterial = (mat: THREE.Material) => {
          if (!(mat instanceof THREE.MeshStandardMaterial)) return mat;
          const m = mat.clone();

          const name = mat.name?.toLowerCase() ?? '';
          if (name.includes('grey') || name === 'grey') {
            // Grey panels → white Optimus panels
            m.color = COLORS.panelWhite.clone();
            m.metalness = 0.35;
            m.roughness = 0.4;
          } else if (name.includes('main') || name === 'main') {
            // Main body → dark charcoal
            m.color = COLORS.bodyDark.clone();
            m.metalness = 0.55;
            m.roughness = 0.3;
          } else if (name.includes('black') || name === 'black') {
            // Black joints → glossy black
            m.color = COLORS.jointBlack.clone();
            m.metalness = 0.85;
            m.roughness = 0.1;
            // Add subtle visor glow to dark parts on the head
            m.emissive = COLORS.visor.clone();
            m.emissiveIntensity = 0.08;
          }
          return m;
        };

        if (Array.isArray(child.material)) {
          child.material = child.material.map(reskinMaterial);
        } else {
          child.material = reskinMaterial(child.material);
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

  // Crossfade to a new animation
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
    const idle = actions[IDLE_ANIM];
    if (idle) {
      idle.play();
      currentAnimRef.current = IDLE_ANIM;
    }
  }, [actions]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const timeScale = Math.max(simSpeed, 0);
    const scaledDelta = Math.min(delta * timeScale, 0.08);

    // Sync animation mixer to sim speed
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

        // Choose walk or run animation based on speed
        if (currentSpeedRef.current > 2.0) {
          playAnim(RUN_ANIM, 0.3);
          const runAction = actions[RUN_ANIM];
          if (runAction) runAction.timeScale = currentSpeedRef.current / 2.2;
        } else {
          playAnim(WALK_ANIM, 0.3);
          const walkAction = actions[WALK_ANIM];
          if (walkAction) walkAction.timeScale = Math.max(currentSpeedRef.current / 1.2, 0.4);
        }
      } else {
        currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0, 0.15);
      }
    } else if (timeScale > 0 && robotState === 'idle') {
      currentSpeedRef.current = THREE.MathUtils.lerp(currentSpeedRef.current, 0, 0.1);
      playAnim(IDLE_ANIM, 0.5);
    } else if (timeScale > 0 && robotState === 'working') {
      currentSpeedRef.current = 0;
      const animName = TASK_ANIM_MAP[currentAnimation] ?? 'Standing';
      playAnim(animName, 0.4);

      // Vacuuming: robot moves around the area
      if (currentAnimation === 'vacuuming') {
        const t = performance.now() / 1000;
        groupRef.current.position.x = robotPosition[0] + Math.sin(t * 0.4) * 0.4;
        groupRef.current.position.z = robotPosition[2] + Math.cos(t * 0.55) * 0.4;
        return; // skip normal position set
      }
    }

    // Update position
    groupRef.current.position.set(robotPosition[0], robotPosition[1], robotPosition[2]);
    setRobotRotationY(groupRef.current.rotation.y);
  });

  return (
    <group ref={groupRef}>
      <primitive
        object={clonedScene}
        scale={[ROBOT_SCALE, ROBOT_SCALE, ROBOT_SCALE]}
        position={[0, 0, 0]}
      />
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
      {/* Eye glow light */}
      <pointLight position={[0, 0.7, 0.2]} color="#00b8e8" intensity={0.3} distance={2.5} />
      {/* Status indicator */}
      <pointLight position={[0, 0.5, 0.15]} color="#00e0a0" intensity={0.1} distance={1} />
    </group>
  );
}

useGLTF.preload('/models/robot-expressive.glb');
