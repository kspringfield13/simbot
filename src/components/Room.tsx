import type { Room as RoomType } from '../types';

export function Room({ room }: { room: RoomType }) {
  const hw = room.size[0] / 2;
  const hd = room.size[1] / 2;
  const cx = room.position[0];
  const cz = room.position[2];
  const bh = 0.06;
  const bt = 0.02;
  const bc = '#3a3530';

  return (
    <group>
      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[cx, 0.001, cz]}
        receiveShadow
      >
        <planeGeometry args={room.size} />
        <meshStandardMaterial
          color={room.color}
          roughness={room.id === 'bathroom' ? 0.25 : room.id === 'kitchen' ? 0.35 : 0.7}
          metalness={room.id === 'bathroom' ? 0.08 : 0.02}
        />
      </mesh>

      {/* Baseboards */}
      <mesh position={[cx, bh / 2, cz - hd + bt / 2]}>
        <boxGeometry args={[room.size[0], bh, bt]} />
        <meshStandardMaterial color={bc} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[cx, bh / 2, cz + hd - bt / 2]}>
        <boxGeometry args={[room.size[0], bh, bt]} />
        <meshStandardMaterial color={bc} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[cx - hw + bt / 2, bh / 2, cz]}>
        <boxGeometry args={[bt, bh, room.size[1]]} />
        <meshStandardMaterial color={bc} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[cx + hw - bt / 2, bh / 2, cz]}>
        <boxGeometry args={[bt, bh, room.size[1]]} />
        <meshStandardMaterial color={bc} roughness={0.6} metalness={0.05} />
      </mesh>
    </group>
  );
}
