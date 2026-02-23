import { useFrame, useThree } from '@react-three/fiber';
import { useStore } from '../stores/useStore';
import * as THREE from 'three';

export function CameraFollow() {
  const { camera } = useThree();
  const targetPos = new THREE.Vector3();
  const smoothPos = new THREE.Vector3();
  const offset = new THREE.Vector3(0, 12, 7);

  useFrame(() => {
    const { robotPosition } = useStore.getState();

    targetPos.set(
      robotPosition[0] + offset.x,
      offset.y,
      robotPosition[2] + offset.z
    );

    smoothPos.lerp(targetPos, 0.02);
    camera.position.copy(smoothPos);
    camera.lookAt(robotPosition[0], 0, robotPosition[2]);
  });

  return null;
}
