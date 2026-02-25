import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useStore } from '../../stores/useStore';
import type { CameraMode } from '../../types';

interface CameraPose {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

interface CameraTransition {
  active: boolean;
  elapsed: number;
  duration: number;
  startPos: THREE.Vector3;
  startTarget: THREE.Vector3;
  endPos: THREE.Vector3;
  endTarget: THREE.Vector3;
}

const OVERVIEW_DIRECTION = new THREE.Vector3(0.66, 0.72, 0.64).normalize();

function getOverviewPose(snapTarget?: [number, number, number] | null): CameraPose {
  const target = snapTarget
    ? new THREE.Vector3(snapTarget[0], 0, snapTarget[2])
    : new THREE.Vector3(0, 0, -1);
  const distance = 20;

  return {
    target,
    position: target.clone().add(OVERVIEW_DIRECTION.clone().multiplyScalar(distance)),
  };
}

function getFollowPose(
  robotPosition: [number, number, number],
  robotRotationY: number,
): CameraPose {
  const x = robotPosition[0];
  const z = robotPosition[2];

  const distance = 6;
  const height = 3.2;

  const behindX = x - (Math.sin(robotRotationY) * distance);
  const behindZ = z - (Math.cos(robotRotationY) * distance);

  return {
    position: new THREE.Vector3(behindX, height, behindZ),
    target: new THREE.Vector3(x, 1.1, z),
  };
}

function getPovPose(
  robotPosition: [number, number, number],
  robotRotationY: number,
): CameraPose {
  const x = robotPosition[0];
  const z = robotPosition[2];
  const eyeHeight = 1.58;

  const eye = new THREE.Vector3(
    x + (Math.sin(robotRotationY) * 0.1),
    eyeHeight,
    z + (Math.cos(robotRotationY) * 0.1),
  );

  const lookTarget = new THREE.Vector3(
    x + (Math.sin(robotRotationY) * 2.4),
    eyeHeight - 0.08,
    z + (Math.cos(robotRotationY) * 2.4),
  );

  return {
    position: eye,
    target: lookTarget,
  };
}

function getPoseForMode(mode: CameraMode): CameraPose {
  const state = useStore.getState();

  if (mode === 'follow') {
    return getFollowPose(state.robotPosition, state.robotRotationY);
  }

  if (mode === 'pov') {
    return getPovPose(state.robotPosition, state.robotRotationY);
  }

  return getOverviewPose(state.cameraSnapTarget);
}

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const transitionRef = useRef<CameraTransition>({
    active: false,
    elapsed: 0,
    duration: 1,
    startPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
  });

  const cameraMode = useStore((state) => state.cameraMode);
  const cameraSnapTarget = useStore((state) => state.cameraSnapTarget);
  const clearCameraSnap = useStore((state) => state.clearCameraSnap);
  const { camera, gl } = useThree();

  const orbitConfig = useMemo(() => ({
    minDistance: 3,
    maxDistance: 30,
    minPolarAngle: 0.28,
    maxPolarAngle: Math.PI / 2.04,
  }), []);

  const startTransition = (pose: CameraPose) => {
    const controls = controlsRef.current;
    if (!controls) return;

    transitionRef.current = {
      active: true,
      elapsed: 0,
      duration: 1,
      startPos: camera.position.clone(),
      startTarget: controls.target.clone(),
      endPos: pose.position.clone(),
      endTarget: pose.target.clone(),
    };
  };

  useEffect(() => {
    gl.domElement.style.touchAction = 'none';
  }, [gl]);

  useEffect(() => {
    startTransition(getPoseForMode(cameraMode));
  }, [cameraMode]);

  useEffect(() => {
    if (!cameraSnapTarget) return;

    startTransition(getOverviewPose(cameraSnapTarget));
    clearCameraSnap();
  }, [cameraSnapTarget, clearCameraSnap]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const state = useStore.getState();

    controls.minDistance = orbitConfig.minDistance;
    controls.maxDistance = orbitConfig.maxDistance;
    controls.minPolarAngle = orbitConfig.minPolarAngle;
    controls.maxPolarAngle = orbitConfig.maxPolarAngle;

    controls.enablePan = state.cameraMode === 'overview';
    controls.enableZoom = state.cameraMode !== 'pov';
    controls.enableRotate = true;

    controls.rotateSpeed = state.cameraMode === 'overview' ? 0.56 : 0.7;
    controls.panSpeed = state.cameraMode === 'overview' ? 0.7 : 0.5;

    controls.touches.ONE = state.cameraMode === 'overview' ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
    controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;

    if (state.cameraMode === 'follow') {
      controls.minDistance = 2.6;
      controls.maxDistance = 14;
      controls.minPolarAngle = 0.15;
      controls.maxPolarAngle = Math.PI / 1.9;
    } else if (state.cameraMode === 'pov') {
      controls.minDistance = 0.35;
      controls.maxDistance = 1.4;
      controls.minPolarAngle = 0.7;
      controls.maxPolarAngle = Math.PI - 0.7;
    }

    const transition = transitionRef.current;

    if (transition.active) {
      transition.elapsed += delta;
      const progress = Math.min(transition.elapsed / transition.duration, 1);
      const eased = 1 - ((1 - progress) ** 3);

      camera.position.lerpVectors(transition.startPos, transition.endPos, eased);
      controls.target.lerpVectors(transition.startTarget, transition.endTarget, eased);
      controls.update();

      if (progress >= 1) {
        transition.active = false;
      }

      return;
    }

    if (state.cameraMode === 'follow') {
      const pose = getFollowPose(state.robotPosition, state.robotRotationY);
      controls.target.lerp(pose.target, 0.08);
      camera.position.lerp(pose.position, state.robotState === 'walking' ? 0.035 : 0.02);
    } else if (state.cameraMode === 'pov') {
      const pose = getPovPose(state.robotPosition, state.robotRotationY);
      controls.target.lerp(pose.target, 0.09);
      camera.position.lerp(pose.position, 0.08);
    }

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.11}
      zoomSpeed={0.78}
      rotateSpeed={0.56}
      panSpeed={0.7}
      minDistance={3}
      maxDistance={30}
    />
  );
}
