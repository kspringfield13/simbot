import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../../stores/useStore';
import type { Group } from 'three';

/** Visitor figure stands just outside the south wall */
const VISITOR_POSITION: [number, number, number] = [0, 0, -20.5];

/** Package sits just inside the door */
const PACKAGE_POSITION: [number, number, number] = [0.5, 0, -19];

export function VisitorNPC() {
  const visitorEvent = useStore((s) => s.visitorEvent);
  const groupRef = useRef<Group>(null);

  // Gentle idle sway
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(Date.now() * 0.0015) * 0.12;
    }
  });

  if (!visitorEvent) return null;

  return (
    <>
      {/* Package box for delivery events */}
      {visitorEvent.type === 'package' && (
        <group position={PACKAGE_POSITION}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.6, 0.5, 0.4]} />
            <meshStandardMaterial color="#8B6914" roughness={0.9} />
          </mesh>
          {/* Tape stripe */}
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.62, 0.06, 0.42]} />
            <meshStandardMaterial color="#c4a44a" roughness={0.8} />
          </mesh>
        </group>
      )}

      {/* Visitor figure for visitor events */}
      {visitorEvent.type === 'visitor' && (
        <group ref={groupRef} position={VISITOR_POSITION}>
          {/* Legs */}
          <mesh position={[-0.12, 0.4, 0]} castShadow>
            <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
            <meshStandardMaterial color="#2d4a6f" />
          </mesh>
          <mesh position={[0.12, 0.4, 0]} castShadow>
            <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
            <meshStandardMaterial color="#2d4a6f" />
          </mesh>

          {/* Body */}
          <mesh position={[0, 1.1, 0]} castShadow>
            <capsuleGeometry args={[0.22, 0.5, 4, 8]} />
            <meshStandardMaterial color="#c75a3a" />
          </mesh>

          {/* Arms */}
          <mesh position={[-0.32, 1.0, 0]} castShadow>
            <capsuleGeometry args={[0.06, 0.4, 4, 8]} />
            <meshStandardMaterial color="#c75a3a" />
          </mesh>
          <mesh position={[0.32, 1.0, 0]} castShadow>
            <capsuleGeometry args={[0.06, 0.4, 4, 8]} />
            <meshStandardMaterial color="#c75a3a" />
          </mesh>

          {/* Head */}
          <mesh position={[0, 1.65, 0]} castShadow>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color="#e8c4a0" />
          </mesh>
        </group>
      )}
    </>
  );
}
