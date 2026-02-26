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

export function Robot() {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const currentSpeedRef = useRef(0);
  const currentAnimRef = useRef<string>('idle');
  const stuckTimerRef = useRef(0);
  const lastDistRef = useRef(999);

  const { scene, animations } = useGLTF('/models/xbot.glb');

  // Setup shadows and shiny silver material
  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
        if (child.material) {
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#c0c0c0'),
            metalness: 0.9,
            roughness: 0.15,
            envMapIntensity: 1.5,
          });
        }
      }
    });
  }, [scene]);

  const { actions, mixer } = useAnimations(animations, modelRef);
  const bonesRef = useRef<Record<string, THREE.Bone>>({});

  const {
    robotPosition,
    robotTarget,
    robotState,
    currentAnimation,
    simSpeed,
    setRobotPosition,
    setRobotRotationY,
  } = useStore();

  const glowColor = '#88ccff';

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

  // Cache bone references + start idle
  useEffect(() => {
    console.log('[Robot] XBot animations:', Object.keys(actions));
    const idle = actions['idle'];
    if (idle) {
      idle.reset().play();
      currentAnimRef.current = 'idle';
    }
    // Find and cache bones
    scene.traverse((child: any) => {
      if (child.isSkinnedMesh && child.skeleton) {
        const boneMap: Record<string, THREE.Bone> = {};
        for (const bone of child.skeleton.bones) {
          boneMap[bone.name] = bone;
        }
        bonesRef.current = boneMap;
      }
    });
  }, [actions, scene]);

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
      const t = performance.now() / 1000;
      const idleCycle = Math.floor(t / 6) % 4;
      if (idleCycle === 1 && actions['agree']) {
        playAnim('agree', 0.5);
      } else if (idleCycle === 2 && actions['headShake']) {
        playAnim('headShake', 0.5);
      } else {
        playAnim('idle', 0.5);
      }
    } else if (timeScale > 0 && robotState === 'working') {
      currentSpeedRef.current = 0;
      playAnim('idle', 0.4);

      if (currentAnimation === 'vacuuming' && groupRef.current) {
        const t = performance.now() / 1000;
        groupRef.current.position.x = robotPosition[0] + Math.sin(t * 0.5) * 0.3;
        groupRef.current.position.z = robotPosition[2] + Math.cos(t * 0.7) * 0.3;
        return;
      }
    }

    groupRef.current.position.set(robotPosition[0], robotPosition[1], robotPosition[2]);
    setRobotRotationY(groupRef.current.rotation.y);
  });

  // LATE useFrame — runs AFTER mixer updates, so bone overrides actually stick
  useFrame(() => {
    const bones = bonesRef.current;
    if (!bones || Object.keys(bones).length === 0) return;
    const t = performance.now() / 1000;

    const rArm = bones['mixamorig:RightArm'];
    const lArm = bones['mixamorig:LeftArm'];
    const rForeArm = bones['mixamorig:RightForeArm'];
    const lForeArm = bones['mixamorig:LeftForeArm'];
    const rHand = bones['mixamorig:RightHand'];
    const lHand = bones['mixamorig:LeftHand'];
    const spine = bones['mixamorig:Spine1'];
    const head = bones['mixamorig:Head'];

    if (robotState === 'idle') {
      // Subtle head look-around
      if (head) {
        head.rotation.y += Math.sin(t * 0.3) * 0.2;
        head.rotation.x += Math.sin(t * 0.2) * 0.08;
      }
    } else if (robotState === 'working') {
      switch (currentAnimation) {
        case 'dishes':
        case 'scrubbing': {
          if (rArm) rArm.rotation.x = -1.2 + Math.sin(t * 4) * 0.15;
          if (lArm) lArm.rotation.x = -1.2 + Math.cos(t * 4) * 0.15;
          if (rForeArm) rForeArm.rotation.x = -0.6 + Math.sin(t * 6) * 0.2;
          if (lForeArm) lForeArm.rotation.x = -0.6 + Math.cos(t * 6) * 0.2;
          if (rHand) rHand.rotation.z = Math.sin(t * 8) * 0.3;
          if (lHand) lHand.rotation.z = Math.cos(t * 8) * 0.3;
          if (spine) spine.rotation.x = -0.1 + Math.sin(t * 2) * 0.03;
          if (head) head.rotation.x = -0.15;
          break;
        }
        case 'cooking': {
          if (rArm) rArm.rotation.x = -1.0;
          if (lArm) lArm.rotation.x = -0.8;
          if (rForeArm) rForeArm.rotation.x = -0.8;
          if (lForeArm) lForeArm.rotation.x = -0.4;
          if (rHand) { rHand.rotation.x = Math.sin(t * 3) * 0.4; rHand.rotation.z = Math.cos(t * 3) * 0.4; }
          if (spine) spine.rotation.x = -0.08;
          if (head) head.rotation.x = -0.12;
          break;
        }
        case 'vacuuming': {
          if (rArm) rArm.rotation.x = -0.9 + Math.sin(t * 2) * 0.3;
          if (lArm) lArm.rotation.x = -0.9 + Math.sin(t * 2) * 0.3;
          if (rForeArm) rForeArm.rotation.x = -0.3;
          if (lForeArm) lForeArm.rotation.x = -0.3;
          if (spine) spine.rotation.x = -0.05 + Math.sin(t * 2) * 0.05;
          break;
        }
        case 'sweeping': {
          if (rArm) { rArm.rotation.x = -0.7; rArm.rotation.z = Math.sin(t * 2.5) * 0.4; }
          if (lArm) { lArm.rotation.x = -1.0; lArm.rotation.z = Math.sin(t * 2.5) * 0.4; }
          if (rForeArm) rForeArm.rotation.x = -0.2;
          if (lForeArm) lForeArm.rotation.x = -0.5;
          if (spine) spine.rotation.y = Math.sin(t * 2.5) * 0.1;
          break;
        }
        case 'cleaning': {
          if (rArm) { rArm.rotation.x = -1.1; rArm.rotation.z = Math.sin(t * 3) * 0.3; }
          if (rForeArm) rForeArm.rotation.x = -0.5;
          if (rHand) rHand.rotation.z = Math.sin(t * 5) * 0.5;
          if (lArm) lArm.rotation.x = -0.3;
          break;
        }
        case 'bed-making': {
          if (rArm) rArm.rotation.x = -1.3 + Math.sin(t * 1.5) * 0.2;
          if (lArm) lArm.rotation.x = -1.3 + Math.cos(t * 1.5) * 0.2;
          if (rForeArm) rForeArm.rotation.x = -0.4;
          if (lForeArm) lForeArm.rotation.x = -0.4;
          if (spine) spine.rotation.x = -0.15 + Math.sin(t * 1.5) * 0.05;
          break;
        }
        case 'laundry': {
          if (rArm) rArm.rotation.x = -1.0 + Math.sin(t * 1.8) * 0.4;
          if (lArm) lArm.rotation.x = -1.0 + Math.cos(t * 1.8) * 0.4;
          if (rForeArm) rForeArm.rotation.x = -0.5 + Math.sin(t * 1.8) * 0.2;
          if (lForeArm) lForeArm.rotation.x = -0.5 + Math.cos(t * 1.8) * 0.2;
          break;
        }
        default: {
          if (rArm) rArm.rotation.x = -0.6 + Math.sin(t * 2) * 0.15;
          if (lArm) lArm.rotation.x = -0.5 + Math.cos(t * 2.3) * 0.15;
          break;
        }
      }
    }
  }, 1); // priority 1 = runs AFTER default (0) where mixer updates

  return (
    <group ref={groupRef}>
      <group ref={modelRef} scale={[ROBOT_SCALE, ROBOT_SCALE, ROBOT_SCALE]}>
        <primitive object={scene} />
      </group>
      {/* Ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={0.25}
          transparent
          opacity={0.1}
        />
      </mesh>
      <pointLight position={[0, 1.0, 0.3]} color={glowColor} intensity={0.25} distance={3} />
    </group>
  );
}

useGLTF.preload('/models/xbot.glb');
