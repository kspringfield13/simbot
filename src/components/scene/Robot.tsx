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
    robotTheme,
    setRobotPosition,
    setRobotRotationY,
  } = useStore();

  // Theme accent colors for the robot shell
  const themeAccents: Record<string, string> = {
    blue: '#1a8cff',
    red: '#e63946',
    green: '#2dd4bf',
    gold: '#f59e0b',
  };
  const themeAccent = themeAccents[robotTheme] ?? themeAccents.blue;

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

  // Update emissive materials to reflect mood + theme accent tint on body
  useEffect(() => {
    const emissiveColor = new THREE.Color(visorColor);
    const accent = new THREE.Color(themeAccent);
    scene.traverse((child: any) => {
      if ((child.isMesh || child.isSkinnedMesh) && child.material) {
        const mat = child.material;
        if (mat.emissive && mat.emissiveIntensity > 0) {
          mat.emissive.copy(emissiveColor);
        }
        // Tint non-emissive dark materials with theme accent
        if (mat.color && (!mat.emissive || mat.emissiveIntensity === 0)) {
          const lum = mat.color.r * 0.299 + mat.color.g * 0.587 + mat.color.b * 0.114;
          if (lum < 0.35) {
            // Blend dark panels with theme accent (subtle 15% tint)
            mat.color.lerp(accent, 0.15);
          }
        }
      }
    });
  }, [scene, visorColor, themeAccent]);

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
          // Always walk, never run — calm deliberate movement
          const targetSpeed = distance < 1.0 ? 0.8 : distance < 3.0 ? 1.2 : 1.5;
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

        // Stuck detection — aggressive recovery
        if (Math.abs(distance - lastDistRef.current) < 0.08) {
          stuckTimerRef.current += scaledDelta;
          if (stuckTimerRef.current > 1.5) {
            // Find a clear position nearby and nudge there
            const [clearX, clearZ] = findClearPosition(robotPosition[0], robotPosition[2], 1.2);
            if (clearX !== robotPosition[0] || clearZ !== robotPosition[2]) {
              setRobotPosition([clearX, 0, clearZ]);
            }
            if (stuckTimerRef.current > 3) {
              // Truly stuck — force arrival at current position, skip this target
              console.log('[Robot] Stuck >3s, skipping target');
              stuckTimerRef.current = 0;
              lastDistRef.current = 999;
              currentSpeedRef.current = 0;
              // Signal arrival by setting position close enough
              setRobotPosition([robotTarget[0], 0, robotTarget[2]]);
            }
          }
        } else {
          stuckTimerRef.current = 0;
          lastDistRef.current = distance;
        }

        // Always walk — calm, deliberate movement
        playAnim('walk', 0.3);
        const walkAction = actions['walk'];
        if (walkAction) walkAction.timeScale = Math.max(currentSpeedRef.current / 1.2, 0.4);
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

      // Procedural arm/hand animations for specific tasks
      const t = performance.now() / 1000;
      const skeleton = scene.getObjectByProperty('type', 'SkinnedMesh') as any;
      if (skeleton?.skeleton) {
        const bones = skeleton.skeleton.bones as THREE.Bone[];
        const findBone = (name: string) => bones.find(b => b.name === name);

        const rArm = findBone('mixamorig:RightArm');
        const lArm = findBone('mixamorig:LeftArm');
        const rForeArm = findBone('mixamorig:RightForeArm');
        const lForeArm = findBone('mixamorig:LeftForeArm');
        const rHand = findBone('mixamorig:RightHand');
        const lHand = findBone('mixamorig:LeftHand');
        const spine = findBone('mixamorig:Spine1');

        switch (currentAnimation) {
          case 'dishes':
          case 'scrubbing': {
            // Arms forward, hands scrubbing motion
            if (rArm) rArm.rotation.x = -1.2 + Math.sin(t * 4) * 0.15;
            if (lArm) lArm.rotation.x = -1.2 + Math.cos(t * 4) * 0.15;
            if (rForeArm) rForeArm.rotation.x = -0.6 + Math.sin(t * 6) * 0.2;
            if (lForeArm) lForeArm.rotation.x = -0.6 + Math.cos(t * 6) * 0.2;
            if (rHand) rHand.rotation.z = Math.sin(t * 8) * 0.3;
            if (lHand) lHand.rotation.z = Math.cos(t * 8) * 0.3;
            if (spine) spine.rotation.x = -0.1 + Math.sin(t * 2) * 0.03;
            break;
          }
          case 'cooking': {
            // Stirring motion — one hand stirs, other holds
            if (rArm) rArm.rotation.x = -1.0;
            if (lArm) lArm.rotation.x = -0.8;
            if (rForeArm) rForeArm.rotation.x = -0.8;
            if (lForeArm) lForeArm.rotation.x = -0.4;
            // Circular stirring with right hand
            if (rHand) {
              rHand.rotation.x = Math.sin(t * 3) * 0.4;
              rHand.rotation.z = Math.cos(t * 3) * 0.4;
            }
            if (spine) spine.rotation.x = -0.08;
            break;
          }
          case 'vacuuming': {
            // Push/pull motion, body sways
            if (rArm) rArm.rotation.x = -0.9 + Math.sin(t * 2) * 0.3;
            if (lArm) lArm.rotation.x = -0.9 + Math.sin(t * 2) * 0.3;
            if (rForeArm) rForeArm.rotation.x = -0.3;
            if (lForeArm) lForeArm.rotation.x = -0.3;
            if (spine) spine.rotation.x = -0.05 + Math.sin(t * 2) * 0.05;
            // Slight body sway
            groupRef.current.position.x = robotPosition[0] + Math.sin(t * 0.5) * 0.3;
            groupRef.current.position.z = robotPosition[2] + Math.cos(t * 0.7) * 0.3;
            return;
          }
          case 'sweeping': {
            // Wide sweeping arm motions
            if (rArm) rArm.rotation.x = -0.7;
            if (lArm) lArm.rotation.x = -1.0;
            if (rForeArm) rForeArm.rotation.x = -0.2;
            if (lForeArm) lForeArm.rotation.x = -0.5;
            // Sweep side to side
            if (rArm) rArm.rotation.z = Math.sin(t * 2.5) * 0.4;
            if (lArm) lArm.rotation.z = Math.sin(t * 2.5) * 0.4;
            if (spine) spine.rotation.y = Math.sin(t * 2.5) * 0.1;
            break;
          }
          case 'cleaning': {
            // Wiping motion — one arm moves side to side
            if (rArm) rArm.rotation.x = -1.1;
            if (rForeArm) rForeArm.rotation.x = -0.5;
            if (rHand) rHand.rotation.z = Math.sin(t * 5) * 0.5;
            if (rArm) rArm.rotation.z = Math.sin(t * 3) * 0.3;
            if (lArm) lArm.rotation.x = -0.3;
            break;
          }
          case 'bed-making': {
            // Both arms smoothing/tucking
            if (rArm) rArm.rotation.x = -1.3 + Math.sin(t * 1.5) * 0.2;
            if (lArm) lArm.rotation.x = -1.3 + Math.cos(t * 1.5) * 0.2;
            if (rForeArm) rForeArm.rotation.x = -0.4;
            if (lForeArm) lForeArm.rotation.x = -0.4;
            if (spine) spine.rotation.x = -0.15 + Math.sin(t * 1.5) * 0.05;
            break;
          }
          case 'laundry': {
            // Loading/unloading — arms reach forward and back
            if (rArm) rArm.rotation.x = -1.0 + Math.sin(t * 1.8) * 0.4;
            if (lArm) lArm.rotation.x = -1.0 + Math.cos(t * 1.8) * 0.4;
            if (rForeArm) rForeArm.rotation.x = -0.5 + Math.sin(t * 1.8) * 0.2;
            if (lForeArm) lForeArm.rotation.x = -0.5 + Math.cos(t * 1.8) * 0.2;
            break;
          }
          default: {
            // General organizing — subtle hand movements
            if (rArm) rArm.rotation.x = -0.6 + Math.sin(t * 2) * 0.15;
            if (lArm) lArm.rotation.x = -0.5 + Math.cos(t * 2.3) * 0.15;
            break;
          }
        }
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
