import { useStore } from '../../stores/useStore';
import * as THREE from 'three';

const S = 2;

// Window positions along exterior walls (matching windowSpots from homeLayout)
const windows: { position: [number, number, number]; rotation: [number, number, number] }[] = [
  // Living room west wall windows
  { position: [-7.8 * S, 1.2 * S, -7 * S], rotation: [0, Math.PI / 2, 0] },
  { position: [-7.8 * S, 1.2 * S, -5 * S], rotation: [0, Math.PI / 2, 0] },
  // Kitchen north wall windows
  { position: [3 * S, 1.2 * S, -9.8 * S], rotation: [0, 0, 0] },
  { position: [5.5 * S, 1.2 * S, -9.8 * S], rotation: [0, 0, 0] },
  // Kitchen east wall window
  { position: [7.8 * S, 1.2 * S, -7 * S], rotation: [0, Math.PI / 2, 0] },
  // Bedroom south wall windows
  { position: [-5 * S, 1.2 * S, 7.8 * S], rotation: [0, 0, 0] },
  { position: [-3 * S, 1.2 * S, 7.8 * S], rotation: [0, 0, 0] },
  // Bathroom east wall window
  { position: [7.8 * S, 1.2 * S, 5 * S], rotation: [0, Math.PI / 2, 0] },
  // Bathroom south wall window
  { position: [4 * S, 1.2 * S, 7.8 * S], rotation: [0, 0, 0] },
];

function getWindowGlowColor(simMinutes: number): { color: string; intensity: number; opacity: number } {
  const hour = (simMinutes % 1440) / 60;

  // Stronger glow at dawn/dusk, subtle during day, very dim at night
  if (hour >= 6 && hour < 8) {
    // Dawn — warm golden glow
    return { color: '#ffb870', intensity: 1.2, opacity: 0.35 };
  }
  if (hour >= 8 && hour < 17) {
    // Daytime — soft white daylight
    return { color: '#e8f0ff', intensity: 0.6, opacity: 0.15 };
  }
  if (hour >= 17 && hour < 20) {
    // Dusk — amber sunset
    return { color: '#ff9050', intensity: 1.4, opacity: 0.4 };
  }
  // Night — faint cool moonlight
  return { color: '#6080b0', intensity: 0.3, opacity: 0.08 };
}

export function WindowGlow() {
  const simMinutes = useStore((state) => state.simMinutes);
  const glow = getWindowGlowColor(simMinutes);

  return (
    <group>
      {windows.map((win, i) => (
        <group key={i} position={win.position} rotation={win.rotation}>
          {/* Glow plane */}
          <mesh>
            <planeGeometry args={[1.2 * S, 1.4 * S]} />
            <meshStandardMaterial
              color={glow.color}
              emissive={glow.color}
              emissiveIntensity={glow.intensity}
              transparent
              opacity={glow.opacity}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          {/* Light source casting into room */}
          <pointLight
            color={glow.color}
            intensity={glow.intensity * 0.4}
            distance={6 * S}
            decay={2}
          />
        </group>
      ))}
    </group>
  );
}
