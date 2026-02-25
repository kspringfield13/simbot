import { Line } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { roomAttentionLabel, roomOutlineColor } from '../../systems/RoomState';
import { useStore } from '../../stores/useStore';
import type { Room as RoomType } from '../../types';

export function Room({ room }: { room: RoomType }) {
  const setSelectedRoomId = useStore((state) => state.setSelectedRoomId);
  const requestCameraSnap = useStore((state) => state.requestCameraSnap);
  const setCameraMode = useStore((state) => state.setCameraMode);
  const selectedRoomId = useStore((state) => state.selectedRoomId);
  const roomNeed = useStore((state) => state.roomNeeds[room.id]);

  const lastTapRef = useRef(0);

  const cleanliness = roomNeed?.cleanliness ?? 100;
  const outlineColor = roomOutlineColor(cleanliness);
  const isSelected = selectedRoomId === room.id;

  const outlinePoints = useMemo(() => {
    const halfW = room.size[0] / 2;
    const halfD = room.size[1] / 2;
    const x = room.position[0];
    const z = room.position[2];
    const y = 0.02;

    return [
      [x - halfW + 0.04, y, z - halfD + 0.04],
      [x + halfW - 0.04, y, z - halfD + 0.04],
      [x + halfW - 0.04, y, z + halfD - 0.04],
      [x - halfW + 0.04, y, z + halfD - 0.04],
      [x - halfW + 0.04, y, z - halfD + 0.04],
    ] as [number, number, number][];
  }, [room.position, room.size]);

  const handleTap = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();

    const now = performance.now();
    const delta = now - lastTapRef.current;

    setSelectedRoomId(room.id);

    // Haptic feedback on supported devices
    if (navigator.vibrate) navigator.vibrate(10);

    if (delta > 0 && delta < 280) {
      setCameraMode('overview');
      requestCameraSnap([room.position[0], 0, room.position[2]]);
      if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
    }

    lastTapRef.current = now;
  };

  const hw = room.size[0] / 2;
  const hd = room.size[1] / 2;
  const bh = 0.06;
  const bt = 0.02;
  const bc = '#3a3530';

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[room.position[0], 0.001, room.position[2]]}
        receiveShadow
        onPointerDown={handleTap}
      >
        <planeGeometry args={room.size} />
        <meshStandardMaterial
          color={room.color}
          roughness={room.id === 'bathroom' ? 0.25 : room.id === 'kitchen' ? 0.35 : 0.7}
          metalness={room.id === 'bathroom' ? 0.08 : 0.02}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[room.position[0], 0.012, room.position[2]]}>
        <planeGeometry args={[room.size[0] - 0.06, room.size[1] - 0.06]} />
        <meshBasicMaterial
          color={outlineColor}
          transparent
          opacity={isSelected ? 0.14 : 0.06}
          depthWrite={false}
        />
      </mesh>

      <Line
        points={outlinePoints}
        color={outlineColor}
        transparent
        opacity={isSelected ? 0.9 : 0.58}
        lineWidth={isSelected ? 2.3 : 1.5}
      />

      <mesh position={[room.position[0], bh / 2, room.position[2] - hd + bt / 2]}>
        <boxGeometry args={[room.size[0], bh, bt]} />
        <meshStandardMaterial color={bc} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[room.position[0], bh / 2, room.position[2] + hd - bt / 2]}>
        <boxGeometry args={[room.size[0], bh, bt]} />
        <meshStandardMaterial color={bc} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[room.position[0] - hw + bt / 2, bh / 2, room.position[2]]}>
        <boxGeometry args={[bt, bh, room.size[1]]} />
        <meshStandardMaterial color={bc} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[room.position[0] + hw - bt / 2, bh / 2, room.position[2]]}>
        <boxGeometry args={[bt, bh, room.size[1]]} />
        <meshStandardMaterial color={bc} roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Used by RoomStatus panel state and interaction label in shared store */}
      <group userData={{ roomStatus: roomAttentionLabel(cleanliness) }} />
    </group>
  );
}
