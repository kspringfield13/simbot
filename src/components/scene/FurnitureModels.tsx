import { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLBModel } from './GLBModel';
import { FURNITURE_PIECES } from '../../utils/furnitureRegistry';
import type { FurniturePiece } from '../../utils/furnitureRegistry';
import { useStore } from '../../stores/useStore';
import { getRoomFromPoint } from '../../utils/homeLayout';

// ── Single interactive furniture group ─────────────────────────
function FurnitureGroup({ piece }: { piece: FurniturePiece }) {
  const groupRef = useRef<THREE.Group>(null);
  const initializedRef = useRef(false);

  const rearrangeMode = useStore((s) => s.rearrangeMode);
  const selectedId = useStore((s) => s.selectedFurnitureId);
  const positions = useStore((s) => s.furniturePositions);
  const selectFurniture = useStore((s) => s.selectFurniture);

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
        />
      ))}

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
  return (
    <Suspense fallback={null}>
      {FURNITURE_PIECES.map((piece) => (
        <FurnitureGroup key={piece.id} piece={piece} />
      ))}
      <FloorClickHandler />
    </Suspense>
  );
}
