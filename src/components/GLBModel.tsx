import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';

interface GLBModelProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export function GLBModel({ url, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, castShadow = true, receiveShadow = true }: GLBModelProps) {
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
      }
    });
    return clone;
  }, [scene, castShadow, receiveShadow]);

  return (
    <primitive
      object={cloned}
      position={position}
      rotation={rotation}
      scale={typeof scale === 'number' ? [scale, scale, scale] : scale}
    />
  );
}
