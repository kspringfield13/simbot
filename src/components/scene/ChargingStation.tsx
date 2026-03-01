import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../stores/useStore';
import { ROBOT_IDS } from '../../types';
import { ROBOT_CONFIGS } from '../../config/robots';
import { getActiveChargingPosition } from '../../utils/battery';

/**
 * 3D charging station in the hallway.
 * Shows a glowing pad with a lightning bolt indicator.
 * Pulses green when a robot is actively charging nearby.
 */
export function ChargingStation() {
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const pillarRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const s = useStore.getState();
    const anyCharging = ROBOT_IDS.some((id) => s.robots[id].isCharging);
    const t = performance.now() / 1000;

    // Pulsing glow on the base pad
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      const baseIntensity = anyCharging ? 0.8 : 0.3;
      const pulse = anyCharging ? Math.sin(t * 3) * 0.3 : Math.sin(t * 1.5) * 0.1;
      mat.emissiveIntensity = baseIntensity + pulse;
    }

    // Spinning ring when charging
    if (ringRef.current) {
      ringRef.current.rotation.y += anyCharging ? 0.03 : 0.005;
    }

    // Pillar glow pulse
    if (pillarRef.current) {
      const mat = pillarRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = anyCharging ? 0.5 + Math.sin(t * 4) * 0.2 : 0.15;
    }
  });

  const [px, , pz] = getActiveChargingPosition();

  // Find which robots are charging for the label
  const chargingRobots = useStore((s) =>
    ROBOT_IDS.filter((id) => s.robots[id].isCharging)
  );

  return (
    <group position={[px, 0, pz]}>
      {/* Base platform — circular pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <circleGeometry args={[1.8, 32]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Glowing ring on floor */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[1.2, 1.6, 32]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Inner charging circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.3, 0.5, 16]} />
        <meshStandardMaterial
          color="#00cc66"
          emissive="#00cc66"
          emissiveIntensity={0.4}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Central pillar */}
      <mesh ref={pillarRef} position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.6, 12]} />
        <meshStandardMaterial
          color="#2a2a4e"
          emissive="#00ff88"
          emissiveIntensity={0.15}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Top cap */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.15, 0.1, 12]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Spinning ring indicator */}
      <mesh ref={ringRef} position={[0, 1.3, 0]}>
        <torusGeometry args={[0.35, 0.03, 8, 24]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={0.5}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Point light for ambient glow */}
      <pointLight
        position={[0, 1.0, 0]}
        color="#00ff88"
        intensity={0.4}
        distance={6}
        decay={2}
      />

      {/* Label */}
      <Html center distanceFactor={12} position={[0, 2.2, 0]} transform>
        <div className="pointer-events-none rounded-full bg-black/60 px-2 py-0.5 text-[8px] font-bold tracking-wider text-emerald-400 whitespace-nowrap backdrop-blur-sm">
          CHARGING STATION
        </div>
      </Html>

      {/* Show charging robot names */}
      {chargingRobots.length > 0 && (
        <Html center distanceFactor={10} position={[0, 1.9, 0]} transform>
          <div className="pointer-events-none flex gap-1">
            {chargingRobots.map((id) => (
              <div
                key={id}
                className="rounded-full px-1.5 py-0.5 text-[7px] font-bold"
                style={{
                  backgroundColor: `${ROBOT_CONFIGS[id].color}33`,
                  color: ROBOT_CONFIGS[id].color,
                  border: `1px solid ${ROBOT_CONFIGS[id].color}55`,
                }}
              >
                {ROBOT_CONFIGS[id].name}
              </div>
            ))}
          </div>
        </Html>
      )}
    </group>
  );
}
