import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Room as RoomType } from '../../types';
import { useStore } from '../../stores/useStore';
import { getRoomTheme } from '../../config/roomThemes';
import type { RoomThemeId } from '../../config/roomThemes';
import { useAccessibility } from '../../stores/useAccessibility';

/** Ambient point light + small decorative accent for a themed room */
function ThemedRoomLight({
  room,
  themeId,
}: {
  room: RoomType;
  themeId: RoomThemeId;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const accentRef = useRef<THREE.Mesh>(null);
  const theme = useMemo(() => getRoomTheme(themeId), [themeId]);
  const reducedMotion = useAccessibility((s) => s.reducedMotion);

  useFrame((_, delta) => {
    if (reducedMotion) return;

    // Gentle pulse on the accent glow
    if (accentRef.current) {
      const mat = accentRef.current.material as THREE.MeshStandardMaterial;
      const t = performance.now() * 0.001;
      const pulse = 0.8 + 0.2 * Math.sin(t * 2);
      mat.emissiveIntensity = theme.accentEmissiveIntensity * pulse;
    }

    // Subtle flicker for medieval torchlight
    if (lightRef.current && themeId === 'medieval') {
      const t = performance.now() * 0.001;
      const flicker = 0.85 + 0.15 * Math.sin(t * 8) * Math.cos(t * 13);
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity,
        theme.ambientLightIntensity * flicker,
        delta * 6,
      );
    }
  });

  if (themeId === 'default') return null;

  const cx = room.position[0];
  const cz = room.position[2];

  return (
    <group>
      {/* Theme ambient light */}
      <pointLight
        ref={lightRef}
        position={[cx, 2.5, cz]}
        color={theme.ambientLightColor}
        intensity={theme.ambientLightIntensity}
        distance={Math.max(room.size[0], room.size[1]) * 1.2}
        decay={2}
      />

      {/* Small decorative accent orb in corner */}
      {theme.accentEmissiveIntensity > 0 && (
        <mesh
          ref={accentRef}
          position={[cx + room.size[0] / 2 - 0.6, 0.3, cz + room.size[1] / 2 - 0.6]}
        >
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial
            color={theme.accentColor}
            emissive={theme.accentColor}
            emissiveIntensity={theme.accentEmissiveIntensity}
            transparent
            opacity={0.8}
            roughness={0.2}
            metalness={0.3}
          />
        </mesh>
      )}
    </group>
  );
}

/** Renders theme effects for all rooms */
export function RoomThemeEffects({ rooms }: { rooms: RoomType[] }) {
  const globalTheme = useStore((s) => s.globalTheme);
  const perRoomThemes = useStore((s) => s.perRoomThemes);

  return (
    <>
      {rooms.map((room) => {
        const themeId = perRoomThemes[room.id] ?? globalTheme;
        return (
          <ThemedRoomLight
            key={`theme-${room.id}`}
            room={room}
            themeId={themeId}
          />
        );
      })}
    </>
  );
}
