import { useFrame, useThree } from '@react-three/fiber';
import { useStore } from '../stores/useStore';
import * as THREE from 'three';
import { useRef } from 'react';

export function CameraFollow() {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(0, 16, 12));
  const smoothLook = useRef(new THREE.Vector3());
  useFrame(() => {
    const { robotPosition, robotRotationY, cameraMode } = useStore.getState();
    const rx = robotPosition[0];
    const rz = robotPosition[2];

    // In overview mode with OrbitControls, don't override — let user freely control
    if (cameraMode === 'overview') {
      return;
    }

    if (cameraMode === 'third-person') {
      const dist = 3.2;
      const height = 2.4;
      const behindX = rx - Math.sin(robotRotationY) * dist;
      const behindZ = rz - Math.cos(robotRotationY) * dist;

      const targetPos = new THREE.Vector3(behindX + 0.25, height, behindZ);
      smoothPos.current.lerp(targetPos, 0.05);
      camera.position.copy(smoothPos.current);

      const lookAheadX = rx + Math.sin(robotRotationY) * 2;
      const lookAheadZ = rz + Math.cos(robotRotationY) * 2;
      const targetLook = new THREE.Vector3(lookAheadX, 1.1, lookAheadZ);
      smoothLook.current.lerp(targetLook, 0.05);
      camera.lookAt(smoothLook.current);

    } else if (cameraMode === 'first-person') {
      const eyeHeight = 1.55;
      const eyeX = rx + Math.sin(robotRotationY) * 0.12;
      const eyeZ = rz + Math.cos(robotRotationY) * 0.12;

      const targetPos = new THREE.Vector3(eyeX, eyeHeight, eyeZ);
      smoothPos.current.lerp(targetPos, 0.1);
      camera.position.copy(smoothPos.current);

      const lookDist = 5;
      const lookX = rx + Math.sin(robotRotationY) * lookDist;
      const lookZ = rz + Math.cos(robotRotationY) * lookDist;
      const targetLook = new THREE.Vector3(lookX, 1.0, lookZ);
      smoothLook.current.lerp(targetLook, 0.08);
      camera.lookAt(smoothLook.current);
    }
  });

  return null;
}
