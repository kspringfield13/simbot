import { walls } from '../utils/homeLayout';

export function Walls() {
  return (
    <group>
      {walls.map((wall, i) => {
        const dx = wall.end[0] - wall.start[0];
        const dz = wall.end[1] - wall.start[1];
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        const cx = (wall.start[0] + wall.end[0]) / 2;
        const cz = (wall.start[1] + wall.end[1]) / 2;

        return (
          <mesh
            key={i}
            position={[cx, wall.height / 2, cz]}
            rotation={[0, angle, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[wall.thickness, wall.height, length]} />
            <meshStandardMaterial
              color="#e8e0d0"
              roughness={0.9}
              metalness={0.02}
              transparent
              opacity={0.65}
            />
          </mesh>
        );
      })}

      {/* Ceiling planes - transparent */}
      {[
        { pos: [-3, 2.8, -2] as [number, number, number], size: [6, 5] as [number, number] },
        { pos: [4, 2.8, -2] as [number, number, number], size: [5, 5] as [number, number] },
        { pos: [-3, 2.8, 5] as [number, number, number], size: [6, 5] as [number, number] },
        { pos: [4, 2.8, 5] as [number, number, number], size: [4, 4] as [number, number] },
        { pos: [0.5, 2.8, 1.5] as [number, number, number], size: [2, 4] as [number, number] },
      ].map((ceil, i) => (
        <mesh key={`ceil-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={ceil.pos}>
          <planeGeometry args={ceil.size} />
          <meshStandardMaterial
            color="#d0c8b8"
            transparent
            opacity={0.08}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}
