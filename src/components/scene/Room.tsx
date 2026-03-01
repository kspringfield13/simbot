import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Room as RoomType } from '../../types';
import { useStore } from '../../stores/useStore';
import { getFloorOption, getWallpaperOption } from '../../config/decorations';
import type { RoomDecoration } from '../../config/decorations';

type DragEdge = 'left' | 'right' | 'top' | 'bottom';

function ResizeHandle({
  position,
  args,
  edge,
  onDragStart,
}: {
  position: [number, number, number];
  args: [number, number, number];
  edge: DragEdge;
  onDragStart: (edge: DragEdge) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isHoriz = edge === 'left' || edge === 'right';

  return (
    <mesh
      position={position}
      onPointerDown={(e) => {
        e.stopPropagation();
        onDragStart(edge);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = isHoriz ? 'ew-resize' : 'ns-resize';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <boxGeometry args={args} />
      <meshBasicMaterial
        color={hovered ? '#60a5fa' : '#3b82f6'}
        transparent
        opacity={hovered ? 0.7 : 0.35}
      />
    </mesh>
  );
}

/** Create a canvas texture for wallpaper patterns */
function createWallpaperTexture(wallpaperId: string, tileSize = 128): THREE.CanvasTexture | null {
  const wp = getWallpaperOption(wallpaperId);
  if (!wp) return null;

  const canvas = document.createElement('canvas');
  canvas.width = tileSize;
  canvas.height = tileSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  ctx.fillStyle = wp.baseColor;
  ctx.fillRect(0, 0, tileSize, tileSize);

  ctx.fillStyle = wp.patternColor;
  ctx.strokeStyle = wp.patternColor;
  ctx.lineWidth = 2;

  const s = tileSize;

  switch (wp.pattern) {
    case 'stripes':
      for (let x = 0; x < s; x += s / 5) {
        ctx.fillRect(x, 0, s / 10, s);
      }
      break;
    case 'checks': {
      const cs = s / 4;
      for (let y = 0; y < s; y += cs) {
        for (let x = 0; x < s; x += cs) {
          if ((Math.round(x / cs) + Math.round(y / cs)) % 2 === 0) {
            ctx.fillRect(x, y, cs, cs);
          }
        }
      }
      break;
    }
    case 'herringbone': {
      const bw = s / 6;
      const bh = s / 3;
      for (let row = -1; row < 6; row++) {
        for (let col = -1; col < 6; col++) {
          const ox = col * bw;
          const oy = row * bh + (col % 2 === 0 ? 0 : bh / 2);
          ctx.save();
          ctx.translate(ox + bw / 2, oy + bh / 2);
          ctx.rotate(col % 2 === 0 ? Math.PI / 6 : -Math.PI / 6);
          ctx.fillRect(-bw / 2 + 1, -bh / 2 + 1, bw - 2, bh - 2);
          ctx.restore();
        }
      }
      break;
    }
    case 'dots': {
      const gap = s / 5;
      const r = s / 16;
      for (let y = gap; y < s; y += gap) {
        for (let x = gap; x < s; x += gap) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'diamonds': {
      const ds = s / 4;
      for (let y = 0; y < s; y += ds) {
        for (let x = 0; x < s; x += ds) {
          ctx.beginPath();
          ctx.moveTo(x + ds / 2, y);
          ctx.lineTo(x + ds, y + ds / 2);
          ctx.lineTo(x + ds / 2, y + ds);
          ctx.lineTo(x, y + ds / 2);
          ctx.closePath();
          ctx.fill();
        }
      }
      break;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

// Cache textures to avoid recreation
const textureCache = new Map<string, THREE.CanvasTexture>();

function getOrCreateWallpaperTexture(wallpaperId: string): THREE.CanvasTexture | null {
  if (textureCache.has(wallpaperId)) return textureCache.get(wallpaperId)!;
  const tex = createWallpaperTexture(wallpaperId);
  if (tex) textureCache.set(wallpaperId, tex);
  return tex;
}

/** Inner wall panels for a room to show wall color/wallpaper */
function RoomWallPanels({
  room,
  deco,
}: {
  room: RoomType;
  deco: RoomDecoration;
}) {
  const wallHeight = 3.6;
  const inset = 0.02; // slightly inside room boundary
  const hw = room.size[0] / 2;
  const hd = room.size[1] / 2;
  const cx = room.position[0];
  const cz = room.position[2];

  const hasWallpaper = !!deco.wallpaperId;
  const wallColor = hasWallpaper ? '#ffffff' : (deco.wallColor ?? '#e8e2d6');

  const texture = useMemo(() => {
    if (!deco.wallpaperId) return null;
    return getOrCreateWallpaperTexture(deco.wallpaperId);
  }, [deco.wallpaperId]);

  // Wall panels: front (negative Z), back (positive Z), left (negative X), right (positive X)
  const panels: { pos: [number, number, number]; rot: [number, number, number]; size: [number, number] }[] = [
    // Front wall (facing +Z, at -Z edge of room)
    { pos: [cx, wallHeight / 2, cz - hd + inset], rot: [0, 0, 0], size: [room.size[0], wallHeight] },
    // Back wall (facing -Z, at +Z edge of room)
    { pos: [cx, wallHeight / 2, cz + hd - inset], rot: [0, Math.PI, 0], size: [room.size[0], wallHeight] },
    // Left wall (facing +X, at -X edge of room)
    { pos: [cx - hw + inset, wallHeight / 2, cz], rot: [0, Math.PI / 2, 0], size: [room.size[1], wallHeight] },
    // Right wall (facing -X, at +X edge of room)
    { pos: [cx + hw - inset, wallHeight / 2, cz], rot: [0, -Math.PI / 2, 0], size: [room.size[1], wallHeight] },
  ];

  return (
    <>
      {panels.map((panel, i) => {
        const wallTex = texture ? texture.clone() : null;
        if (wallTex) {
          // Scale repeats based on panel size
          wallTex.repeat.set(panel.size[0] / 3, panel.size[1] / 3);
          wallTex.needsUpdate = true;
        }
        return (
          <mesh key={i} position={panel.pos} rotation={panel.rot}>
            <planeGeometry args={panel.size} />
            <meshStandardMaterial
              color={wallColor}
              map={wallTex}
              roughness={hasWallpaper ? 0.7 : 0.8}
              metalness={0.01}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </>
  );
}

export function Room({ room }: { room: RoomType }) {
  const editMode = useStore((s) => s.editMode);
  const decorateMode = useStore((s) => s.decorateMode);
  const editSelectedRoomId = useStore((s) => s.editSelectedRoomId);
  const decorateSelectedRoomId = useStore((s) => s.decorateSelectedRoomId);
  const setEditSelectedRoomId = useStore((s) => s.setEditSelectedRoomId);
  const setDecorateSelectedRoomId = useStore((s) => s.setDecorateSelectedRoomId);
  const roomDecorations = useStore((s) => s.roomDecorations);
  const [hovered, setHovered] = useState(false);
  const [dragEdge, setDragEdge] = useState<DragEdge | null>(null);

  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const mouseVec = useMemo(() => new THREE.Vector2(), []);
  const targetVec = useMemo(() => new THREE.Vector3(), []);

  const fixedEdgeRef = useRef(0);
  const fixedAxisRef = useRef({ pos: 0, size: 0 });
  const roomIdRef = useRef(room.id);
  roomIdRef.current = room.id;
  const dragEdgeRef = useRef<DragEdge | null>(null);

  const isEditSelected = editMode && editSelectedRoomId === room.id;
  const isDecorateSelected = decorateMode && decorateSelectedRoomId === room.id;
  const isInteractive = editMode || decorateMode;
  const hw = room.size[0] / 2;
  const hd = room.size[1] / 2;
  const bh = 0.04;
  const bt = 0.015;

  // Decoration data
  const deco = roomDecorations[room.id] ?? { wallColor: null, floorId: null, wallpaperId: null };
  const hasDecoration = deco.wallColor || deco.floorId || deco.wallpaperId;

  // Floor appearance
  const floorOption = deco.floorId ? getFloorOption(deco.floorId) : null;
  const floorColor = floorOption ? floorOption.color : (room.color || '#4a4644');
  const floorRoughness = floorOption ? floorOption.roughness : 0.75;
  const floorMetalness = floorOption ? floorOption.metalness : 0.02;

  const handleDragStart = useCallback(
    (edge: DragEdge) => {
      const rHw = room.size[0] / 2;
      const rHd = room.size[1] / 2;
      let fixed: number;
      switch (edge) {
        case 'left':
          fixed = room.position[0] + rHw;
          fixedAxisRef.current = { pos: room.position[2], size: room.size[1] };
          break;
        case 'right':
          fixed = room.position[0] - rHw;
          fixedAxisRef.current = { pos: room.position[2], size: room.size[1] };
          break;
        case 'top':
          fixed = room.position[2] + rHd;
          fixedAxisRef.current = { pos: room.position[0], size: room.size[0] };
          break;
        case 'bottom':
          fixed = room.position[2] - rHd;
          fixedAxisRef.current = { pos: room.position[0], size: room.size[0] };
          break;
      }
      fixedEdgeRef.current = fixed;
      dragEdgeRef.current = edge;
      setDragEdge(edge);
      document.body.style.cursor =
        edge === 'left' || edge === 'right' ? 'ew-resize' : 'ns-resize';
    },
    [room.position, room.size],
  );

  useEffect(() => {
    if (!dragEdge) return;

    const handleMove = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouseVec.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(mouseVec, camera);
      const hit = raycaster.ray.intersectPlane(groundPlane, targetVec);
      if (!hit) return;

      const fixed = fixedEdgeRef.current;
      const other = fixedAxisRef.current;
      const edge = dragEdgeRef.current!;
      const MIN_SIZE = 4;
      let newPos: [number, number, number];
      let newSize: [number, number];

      switch (edge) {
        case 'left': {
          const nl = Math.min(hit.x, fixed - MIN_SIZE);
          const w = fixed - nl;
          newPos = [nl + w / 2, 0, other.pos];
          newSize = [w, other.size];
          break;
        }
        case 'right': {
          const nr = Math.max(hit.x, fixed + MIN_SIZE);
          const w = nr - fixed;
          newPos = [fixed + w / 2, 0, other.pos];
          newSize = [w, other.size];
          break;
        }
        case 'top': {
          const nt = Math.min(hit.z, fixed - MIN_SIZE);
          const d = fixed - nt;
          newPos = [other.pos, 0, nt + d / 2];
          newSize = [other.size, d];
          break;
        }
        case 'bottom': {
          const nb = Math.max(hit.z, fixed + MIN_SIZE);
          const d = nb - fixed;
          newPos = [other.pos, 0, fixed + d / 2];
          newSize = [other.size, d];
          break;
        }
        default:
          return;
      }

      useStore.getState().updateRoomBounds(roomIdRef.current, newPos, newSize);
    };

    const handleUp = () => {
      dragEdgeRef.current = null;
      setDragEdge(null);
      document.body.style.cursor = 'auto';
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragEdge, camera, gl, raycaster, groundPlane, mouseVec, targetVec]);

  const handleClick = isInteractive
    ? (e: THREE.Event & { stopPropagation: () => void }) => {
        e.stopPropagation();
        if (editMode) setEditSelectedRoomId(room.id);
        if (decorateMode) setDecorateSelectedRoomId(room.id);
      }
    : undefined;

  const handlePointerOver = isInteractive
    ? (e: THREE.Event & { stopPropagation: () => void }) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }
    : undefined;

  const handlePointerOut = isInteractive
    ? () => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }
    : undefined;

  // Emissive glow
  let emissiveColor = '#000000';
  let emissiveIntensity = 0;
  if (isEditSelected) {
    emissiveColor = '#3b82f6';
    emissiveIntensity = 0.3;
  } else if (isDecorateSelected) {
    emissiveColor = '#ec4899';
    emissiveIntensity = 0.25;
  } else if (hovered && editMode) {
    emissiveColor = '#1e40af';
    emissiveIntensity = 0.15;
  } else if (hovered && decorateMode) {
    emissiveColor = '#9d174d';
    emissiveIntensity = 0.12;
  }

  return (
    <group>
      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[room.position[0], 0.001, room.position[2]]}
        receiveShadow
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <planeGeometry args={room.size} />
        <meshStandardMaterial
          color={floorColor}
          roughness={floorRoughness}
          metalness={floorMetalness}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Selection border */}
      {isEditSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[room.position[0], 0.005, room.position[2]]}>
          <planeGeometry args={[room.size[0] + 0.4, room.size[1] + 0.4]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.12} />
        </mesh>
      )}

      {/* Decorate selection border */}
      {isDecorateSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[room.position[0], 0.005, room.position[2]]}>
          <planeGeometry args={[room.size[0] + 0.4, room.size[1] + 0.4]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.15} />
        </mesh>
      )}

      {/* Subtle baseboards */}
      <mesh position={[room.position[0], bh / 2, room.position[2] - hd + bt / 2]}>
        <boxGeometry args={[room.size[0], bh, bt]} />
        <meshStandardMaterial color="#332f2b" roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[room.position[0], bh / 2, room.position[2] + hd - bt / 2]}>
        <boxGeometry args={[room.size[0], bh, bt]} />
        <meshStandardMaterial color="#332f2b" roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[room.position[0] - hw + bt / 2, bh / 2, room.position[2]]}>
        <boxGeometry args={[bt, bh, room.size[1]]} />
        <meshStandardMaterial color="#332f2b" roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[room.position[0] + hw - bt / 2, bh / 2, room.position[2]]}>
        <boxGeometry args={[bt, bh, room.size[1]]} />
        <meshStandardMaterial color="#332f2b" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Wall panels — shown when room has wall color or wallpaper decoration */}
      {hasDecoration && (deco.wallColor || deco.wallpaperId) && (
        <RoomWallPanels room={room} deco={deco} />
      )}

      {/* Resize handles when selected in edit mode */}
      {isEditSelected && (
        <>
          <ResizeHandle
            position={[room.position[0] - hw, 0.15, room.position[2]]}
            args={[0.5, 0.3, room.size[1]]}
            edge="left"
            onDragStart={handleDragStart}
          />
          <ResizeHandle
            position={[room.position[0] + hw, 0.15, room.position[2]]}
            args={[0.5, 0.3, room.size[1]]}
            edge="right"
            onDragStart={handleDragStart}
          />
          <ResizeHandle
            position={[room.position[0], 0.15, room.position[2] - hd]}
            args={[room.size[0], 0.3, 0.5]}
            edge="top"
            onDragStart={handleDragStart}
          />
          <ResizeHandle
            position={[room.position[0], 0.15, room.position[2] + hd]}
            args={[room.size[0], 0.3, 0.5]}
            edge="bottom"
            onDragStart={handleDragStart}
          />
        </>
      )}
    </group>
  );
}
