import type { Room as RoomType } from '../types';

export function Room({ room }: { room: RoomType }) {
  return (
    <group>
      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[room.position[0], 0.001, room.position[2]]}
        receiveShadow
      >
        <planeGeometry args={room.size} />
        <meshStandardMaterial color={room.color} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Floor trim/baseboard effect - subtle border */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[room.position[0], 0.002, room.position[2]]}
      >
        <planeGeometry args={[room.size[0] - 0.1, room.size[1] - 0.1]} />
        <meshStandardMaterial
          color={room.color}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* Furniture */}
      {room.furniture.map((f) => (
        <group key={f.id}>
          <mesh position={f.position} castShadow receiveShadow>
            <boxGeometry args={f.size} />
            <meshStandardMaterial
              color={f.color}
              metalness={
                f.id.includes('fridge') || f.id.includes('sink') || f.id.includes('mirror')
                  ? 0.7
                  : f.id.includes('counter') || f.id.includes('vanity')
                  ? 0.3
                  : 0.05
              }
              roughness={
                f.id.includes('fridge') || f.id.includes('mirror')
                  ? 0.15
                  : f.id.includes('counter')
                  ? 0.3
                  : 0.75
              }
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
