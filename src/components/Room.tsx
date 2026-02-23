import type { Room as RoomType } from '../types';

export function Room({ room }: { room: RoomType }) {
  return (
    <group position={room.position}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={room.size} />
        <meshStandardMaterial color={room.color} />
      </mesh>

      {/* Room label */}
      {/* Walls will be implied by color boundaries */}

      {/* Furniture */}
      {room.furniture.map((f) => (
        <mesh key={f.id} position={f.position} castShadow receiveShadow>
          <boxGeometry args={f.size} />
          <meshStandardMaterial
            color={f.color}
            metalness={f.id.includes('fridge') || f.id.includes('sink') ? 0.6 : 0.1}
            roughness={f.id.includes('fridge') || f.id.includes('sink') ? 0.3 : 0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
