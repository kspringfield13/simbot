import { Suspense, useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { GLBModel } from './GLBModel';
import { getActiveFurniture } from '../../utils/furnitureRegistry';
import type { FurniturePiece } from '../../utils/furnitureRegistry';
import { getFloorPlan } from '../../config/floorPlans';
import { useStore } from '../../stores/useStore';
import { getRoomFromPoint } from '../../utils/homeLayout';
import { ROBOT_IDS } from '../../types';
import { getRoomTheme } from '../../config/roomThemes';
import type { RoomThemeId } from '../../config/roomThemes';

// ── TV Channel Overlay: cycles static/news/sports when robot in room ──

const TV_CHANNELS = ['static', 'news', 'sports'] as const;
type TVChannel = (typeof TV_CHANNELS)[number];
const CHANNEL_CYCLE_SECS = 6;

const channelColors: Record<TVChannel, string> = {
  static: '#1a1a1a',
  news: '#0d1b4a',
  sports: '#0a3d1a',
};

function TVChannelOverlay({ roomId }: { roomId: string }) {
  const robots = useStore((s) => s.robots);
  const channelIdxRef = useRef(0);
  const timerRef = useRef(0);
  const [channel, setChannel] = useState<TVChannel>('news');
  const screenRef = useRef<THREE.Mesh>(null);

  let robotInRoom = false;
  for (const rid of ROBOT_IDS) {
    const pos = robots[rid]?.position;
    if (pos && getRoomFromPoint(pos[0], pos[2]) === roomId) {
      robotInRoom = true;
      break;
    }
  }

  useFrame((_, delta) => {
    if (!robotInRoom) return;
    timerRef.current += delta;
    if (timerRef.current >= CHANNEL_CYCLE_SECS) {
      timerRef.current = 0;
      channelIdxRef.current = (channelIdxRef.current + 1) % TV_CHANNELS.length;
      setChannel(TV_CHANNELS[channelIdxRef.current]);
    }
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial;
      if (channel === 'static') {
        mat.emissiveIntensity = 0.3 + Math.random() * 0.5;
      } else {
        mat.emissiveIntensity = 0.6 + Math.sin(timerRef.current * 2) * 0.1;
      }
    }
  });

  if (!robotInRoom) return null;

  const col = channelColors[channel];

  return (
    <group position={[0, 2.5, 0.16]}>
      <mesh ref={screenRef}>
        <planeGeometry args={[1.7, 1.0]} />
        <meshStandardMaterial
          color={col}
          emissive={col}
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>
      <Html
        center
        position={[0, 0, 0.01]}
        distanceFactor={5}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div style={{
          width: '140px',
          height: '84px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '9px',
          lineHeight: 1.3,
          textAlign: 'center',
        }}>
          {channel === 'static' && (
            <>
              <div style={{ fontSize: '12px', opacity: 0.5, letterSpacing: '3px' }}>NO SIGNAL</div>
              <div style={{ fontSize: '7px', opacity: 0.25, marginTop: '4px' }}>
                {'█▓░█▓░█▓░█▓░█▓░█▓░'}
              </div>
            </>
          )}
          {channel === 'news' && (
            <>
              <div style={{ fontSize: '7px', color: '#ef5350', fontWeight: 'bold', letterSpacing: '1px' }}>
                BREAKING NEWS
              </div>
              <div style={{ fontSize: '8px', marginTop: '4px', fontWeight: 'bold' }}>
                Robot Assistants Set
              </div>
              <div style={{ fontSize: '8px' }}>
                New Efficiency Record
              </div>
              <div style={{
                fontSize: '6px', marginTop: '6px', color: '#64b5f6',
                borderTop: '1px solid #444', paddingTop: '3px', width: '100%',
              }}>
                SIMBOT NEWS 24/7
              </div>
            </>
          )}
          {channel === 'sports' && (
            <>
              <div style={{ fontSize: '7px', color: '#ffd54f', fontWeight: 'bold', letterSpacing: '1px' }}>
                SPORTS CENTER
              </div>
              <div style={{ fontSize: '9px', marginTop: '4px', fontWeight: 'bold' }}>
                ROBOTS 42 — HUMANS 38
              </div>
              <div style={{ fontSize: '7px', color: '#aaa' }}>
                Q4 · 2:30 remaining
              </div>
              <div style={{
                fontSize: '6px', marginTop: '6px', color: '#81c784',
                borderTop: '1px solid #444', paddingTop: '3px', width: '100%',
              }}>
                ROBO LEAGUE FINALS
              </div>
            </>
          )}
        </div>
      </Html>
      <pointLight color={col} intensity={0.4} distance={5} position={[0, 0, 0.8]} />
    </group>
  );
}

// ── Fridge Door: opens during grocery-list / cooking tasks ────

function FridgeDoorOverlay() {
  const tasks = useStore((s) => s.tasks);
  const doorAngleRef = useRef(0);
  const pivotRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const isOpen = tasks.some(
    (t) => (t.taskType === 'grocery-list' || t.taskType === 'cooking')
      && (t.status === 'walking' || t.status === 'working'),
  );

  useFrame((_, delta) => {
    const target = isOpen ? -1.2 : 0; // ~70° open
    doorAngleRef.current += (target - doorAngleRef.current) * 3 * delta;
    if (pivotRef.current) {
      pivotRef.current.rotation.y = doorAngleRef.current;
    }
    if (glowRef.current) {
      const ti = isOpen ? 0.5 : 0;
      glowRef.current.intensity += (ti - glowRef.current.intensity) * 3 * delta;
    }
  });

  return (
    <group>
      {/* Interior glow visible when door swings open */}
      <pointLight
        ref={glowRef}
        color="#fff5cc"
        intensity={0}
        distance={4}
        position={[0, 1.5, 0.3]}
      />
      {/* Door pivot at right edge of fridge front face */}
      <group ref={pivotRef} position={[0.45, 0, 0.45]}>
        <mesh position={[-0.45, 1.7, 0]}>
          <boxGeometry args={[0.9, 3.2, 0.08]} />
          <meshStandardMaterial color="#e0e0e0" metalness={0.4} roughness={0.3} />
        </mesh>
        {/* Door handle */}
        <mesh position={[-0.78, 1.7, 0.06]}>
          <boxGeometry args={[0.04, 0.45, 0.06]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// ── Oven Glow: orange glow when cooking task is active ────────

function OvenGlowOverlay() {
  const tasks = useStore((s) => s.tasks);
  const glowRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const burnerRef = useRef<THREE.Mesh>(null);

  const isCooking = tasks.some(
    (t) => t.taskType === 'cooking' && t.status === 'working',
  );

  useFrame((_, delta) => {
    const t = Date.now() * 0.003;
    const pulse = Math.sin(t) * 0.2;

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      const target = isCooking ? 1.5 + pulse : 0;
      mat.emissiveIntensity += (target - mat.emissiveIntensity) * 3 * delta;
      mat.opacity += ((isCooking ? 0.7 : 0) - mat.opacity) * 3 * delta;
    }
    if (burnerRef.current) {
      const mat = burnerRef.current.material as THREE.MeshStandardMaterial;
      const target = isCooking ? 1.2 + pulse * 0.5 : 0;
      mat.emissiveIntensity += (target - mat.emissiveIntensity) * 3 * delta;
      mat.opacity += ((isCooking ? 0.6 : 0) - mat.opacity) * 3 * delta;
    }
    if (lightRef.current) {
      const target = isCooking ? 0.8 + pulse * 0.15 : 0;
      lightRef.current.intensity += (target - lightRef.current.intensity) * 3 * delta;
    }
  });

  return (
    <group>
      {/* Oven door glow — front face, lower area */}
      <mesh ref={glowRef} position={[0, 0.6, 0.45]}>
        <planeGeometry args={[0.8, 0.45]} />
        <meshStandardMaterial
          color="#ff6600"
          emissive="#ff4400"
          emissiveIntensity={0}
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>
      {/* Burner ring on stovetop */}
      <mesh ref={burnerRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.35, 0]}>
        <ringGeometry args={[0.2, 0.4, 24]} />
        <meshStandardMaterial
          color="#ff4400"
          emissive="#ff3300"
          emissiveIntensity={0}
          transparent
          opacity={0}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Orange point light */}
      <pointLight
        ref={lightRef}
        color="#ff6600"
        intensity={0}
        distance={5}
        decay={2}
        position={[0, 1.0, 0.6]}
      />
    </group>
  );
}

// ── Single interactive furniture group ─────────────────────────
function FurnitureGroup({ piece }: { piece: FurniturePiece }) {
  const groupRef = useRef<THREE.Group>(null);
  const initializedRef = useRef(false);

  const rearrangeMode = useStore((s) => s.rearrangeMode);
  const selectedId = useStore((s) => s.selectedFurnitureId);
  const positions = useStore((s) => s.furniturePositions);
  const selectFurniture = useStore((s) => s.selectFurniture);
  const globalTheme = useStore((s) => s.globalTheme);
  const perRoomThemes = useStore((s) => s.perRoomThemes);

  // Resolve theme for this furniture's room
  const activeThemeId: RoomThemeId = perRoomThemes[piece.roomId] ?? globalTheme;
  const theme = useMemo(() => getRoomTheme(activeThemeId), [activeThemeId]);
  const isThemed = activeThemeId !== 'default';

  const isSelected = selectedId === piece.id;
  const override = positions[piece.id];
  const targetX = override ? override[0] : piece.defaultPosition[0];
  const targetZ = override ? override[1] : piece.defaultPosition[2];
  const y = piece.defaultPosition[1];

  // Smooth animated movement
  useFrame(() => {
    if (!groupRef.current) return;
    if (!initializedRef.current) {
      groupRef.current.position.set(targetX, y, targetZ);
      initializedRef.current = true;
      return;
    }
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.08);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.08);
  });

  const handleClick = (e: any) => {
    if (!rearrangeMode || !piece.movable) return;
    e.stopPropagation();
    selectFurniture(isSelected ? null : piece.id);
  };

  return (
    <group
      ref={groupRef}
      position={[targetX, y, targetZ]}
      onClick={handleClick}
      onPointerOver={(e: any) => {
        if (rearrangeMode && piece.movable) {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        if (rearrangeMode) document.body.style.cursor = 'auto';
      }}
    >
      {/* Render all sub-models */}
      {piece.models.map((model, i) => (
        <GLBModel
          key={i}
          url={model.url}
          position={model.offset}
          rotation={model.rotation}
          scale={model.scale}
          tintColor={isThemed ? theme.furnitureTint : undefined}
          emissiveColor={isThemed ? theme.furnitureEmissive : undefined}
          emissiveIntensity={isThemed ? theme.furnitureEmissiveIntensity : undefined}
        />
      ))}

      {/* Dynamic furniture state effects */}
      {piece.id === 'tv-stand' && <TVChannelOverlay roomId={piece.roomId} />}
      {piece.id === 'fridge' && <FridgeDoorOverlay />}
      {piece.id === 'stove' && <OvenGlowOverlay />}

      {/* Invisible click target — larger than the visible model */}
      {rearrangeMode && piece.movable && (
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[piece.obstacleRadius * 2, 3, piece.obstacleRadius * 2]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* Unselected ring indicator */}
      {rearrangeMode && !isSelected && piece.movable && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[piece.obstacleRadius - 0.1, piece.obstacleRadius, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.12} depthWrite={false} />
        </mesh>
      )}

      {/* Selected glow ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <ringGeometry args={[piece.obstacleRadius - 0.2, piece.obstacleRadius + 0.2, 32]} />
          <meshBasicMaterial color="#4ade80" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// ── Floor click handler for placing selected furniture ─────────
function FloorClickHandler() {
  const rearrangeMode = useStore((s) => s.rearrangeMode);
  const selectedId = useStore((s) => s.selectedFurnitureId);
  const moveFurniture = useStore((s) => s.moveFurniture);

  if (!rearrangeMode || !selectedId) return null;

  const handleClick = (e: any) => {
    e.stopPropagation();
    const { x, z } = e.point;
    const room = getRoomFromPoint(x, z);
    if (!room) return; // only allow placement inside rooms
    moveFurniture(selectedId, x, z);
  };

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 0]}
      onClick={handleClick}
      onPointerOver={() => { document.body.style.cursor = 'crosshair'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

// ── Main export: renders all furniture + floor click handler ───
export function AllFurniture() {
  const floorPlanId = useStore((s) => s.floorPlanId);
  const currentViewFloor = useStore((s) => s.currentViewFloor);
  const furniture = getActiveFurniture();

  const plan = useMemo(() => getFloorPlan(floorPlanId), [floorPlanId]);
  const hasMultiFloor = (plan.floors?.length ?? 0) > 1;

  // Build room→floor lookup
  const roomFloorMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const room of plan.rooms) {
      map[room.id] = room.floor ?? 0;
    }
    return map;
  }, [plan.rooms]);

  const visibleFurniture = hasMultiFloor
    ? furniture.filter(p => (roomFloorMap[p.roomId] ?? 0) === currentViewFloor)
    : furniture;

  return (
    <Suspense fallback={null}>
      {visibleFurniture.map((piece) => (
        <FurnitureGroup key={`${floorPlanId}-${piece.id}`} piece={piece} />
      ))}
      <FloorClickHandler />
    </Suspense>
  );
}
