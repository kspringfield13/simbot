import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Room as RoomType } from '../../types';
import { useStore } from '../../stores/useStore';

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

export function Room({ room }: { room: RoomType }) {
  const editMode = useStore((s) => s.editMode);
  const editSelectedRoomId = useStore((s) => s.editSelectedRoomId);
  const setEditSelectedRoomId = useStore((s) => s.setEditSelectedRoomId);
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

  const isSelected = editMode && editSelectedRoomId === room.id;
  const hw = room.size[0] / 2;
  const hd = room.size[1] / 2;
  const bh = 0.04;
  const bt = 0.015;

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

  return (
    <group>
      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[room.position[0], 0.001, room.position[2]]}
        receiveShadow
        onClick={editMode ? (e) => { e.stopPropagation(); setEditSelectedRoomId(room.id); } : undefined}
        onPointerOver={editMode ? (e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; } : undefined}
        onPointerOut={editMode ? () => { setHovered(false); document.body.style.cursor = 'auto'; } : undefined}
      >
        <planeGeometry args={room.size} />
        <meshStandardMaterial
          color={room.color || '#4a4644'}
          roughness={0.75}
          metalness={0.02}
          emissive={isSelected ? '#3b82f6' : hovered && editMode ? '#1e40af' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : hovered ? 0.15 : 0}
        />
      </mesh>

      {/* Selection border */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[room.position[0], 0.005, room.position[2]]}>
          <planeGeometry args={[room.size[0] + 0.4, room.size[1] + 0.4]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.12} />
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

      {/* Resize handles when selected in edit mode */}
      {isSelected && (
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
