import type { Room as RoomType, RoomId } from '../../types';

// Subtle floor variation per room — not colored, just warm/cool tones
const FLOOR_COLORS: Record<RoomId, string> = {
  'living-room': '#4a4644',  // warm
  kitchen: '#484848',         // neutral
  bedroom: '#444446',         // cool
  bathroom: '#464848',        // blue-cool
  hallway: '#454443',         // warm
  laundry: '#484646',         // neutral-cool
};

export function Room({ room }: { room: RoomType }) {
  const hw = room.size[0] / 2;
  const hd = room.size[1] / 2;
  const bh = 0.04;
  const bt = 0.015;

  return (
    <group>
      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[room.position[0], 0.001, room.position[2]]}
        receiveShadow
      >
        <planeGeometry args={room.size} />
        <meshStandardMaterial
          color={FLOOR_COLORS[room.id] ?? '#4a4644'}
          roughness={0.75}
          metalness={0.02}
        />
      </mesh>

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
    </group>
  );
}
