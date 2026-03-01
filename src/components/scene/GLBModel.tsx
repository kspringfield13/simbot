import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

interface GLBModelProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
  tintColor?: string;
  emissiveColor?: string;
  emissiveIntensity?: number;
}

export function GLBModel({ url, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, castShadow = true, receiveShadow = true, tintColor, emissiveColor, emissiveIntensity = 0 }: GLBModelProps) {
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
        // Clone material so tinting doesn't affect the shared original
        if (child.material) {
          child.material = child.material.clone();
        }
      }
    });
    return clone;
  }, [scene, castShadow, receiveShadow]);

  // Apply tint/emissive as a separate effect so it updates when theme changes
  useMemo(() => {
    if (!tintColor && !emissiveColor) return;
    const tint = tintColor ? new THREE.Color(tintColor) : null;
    const emissive = emissiveColor ? new THREE.Color(emissiveColor) : null;
    cloned.traverse((child: any) => {
      if (child.isMesh && child.material) {
        if (tint) child.material.color.multiply(tint);
        if (emissive) {
          child.material.emissive = emissive;
          child.material.emissiveIntensity = emissiveIntensity;
        }
      }
    });
  }, [cloned, tintColor, emissiveColor, emissiveIntensity]);

  return (
    <primitive
      object={cloned}
      position={position}
      rotation={rotation}
      scale={typeof scale === 'number' ? [scale, scale, scale] : scale}
    />
  );
}
