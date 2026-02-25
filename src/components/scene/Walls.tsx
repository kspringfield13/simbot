import * as THREE from 'three';
import { walls } from '../../utils/homeLayout';

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
          <group key={i}>
            {/* Main wall */}
            <mesh
              position={[cx, wall.height / 2, cz]}
              rotation={[0, angle, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[wall.thickness, wall.height, length]} />
              <meshPhysicalMaterial
                color="#e8e2d6"
                roughness={0.85}
                metalness={0.02}
                transparent
                opacity={0.55}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Crown molding */}
            <mesh position={[cx, wall.height - 0.02, cz]} rotation={[0, angle, 0]}>
              <boxGeometry args={[wall.thickness + 0.03, 0.04, length]} />
              <meshStandardMaterial color="#d5cfc3" roughness={0.5} metalness={0.05} />
            </mesh>

            {/* Baseboard */}
            <mesh position={[cx, 0.04, cz]} rotation={[0, angle, 0]}>
              <boxGeometry args={[wall.thickness + 0.02, 0.08, length]} />
              <meshStandardMaterial color="#3a3530" roughness={0.6} metalness={0.05} />
            </mesh>
          </group>
        );
      })}

      {/* Door frames */}
      {[
        // Great room → hallway: z=-2, gap x=-3 to x=3.5
        { cx: 0.25, cz: -2, alongZ: false, gapWidth: 6.0, h: 2.4 },
        // Bedroom door: z=0, gap x=-2 to x=-0.5
        { cx: -1.25, cz: 0, alongZ: false, gapWidth: 1.2, h: 2.3 },
        // Bathroom door: z=0, gap x=1.5 to x=3
        { cx: 2.25, cz: 0, alongZ: false, gapWidth: 1.2, h: 2.3 },
        // Laundry closet opening: x=3.5, z=-2 to 0 (side entry)
        { cx: 3.5, cz: -1, alongZ: true, gapWidth: 1.0, h: 2.3 },
      ].map((frame, i) => {
        const jambW = 0.05;
        const jambD = 0.14;
        const halfGap = frame.gapWidth / 2;
        const fc = '#4a4035';

        if (frame.alongZ) {
          // Doorway along z-axis (jambs on z sides)
          return (
            <group key={`frame-${i}`}>
              <mesh position={[frame.cx, frame.h / 2, frame.cz - halfGap]} castShadow>
                <boxGeometry args={[jambD, frame.h, jambW]} />
                <meshStandardMaterial color={fc} roughness={0.5} metalness={0.08} />
              </mesh>
              <mesh position={[frame.cx, frame.h / 2, frame.cz + halfGap]} castShadow>
                <boxGeometry args={[jambD, frame.h, jambW]} />
                <meshStandardMaterial color={fc} roughness={0.5} metalness={0.08} />
              </mesh>
              <mesh position={[frame.cx, frame.h, frame.cz]} castShadow>
                <boxGeometry args={[jambD, 0.08, frame.gapWidth + jambW * 2]} />
                <meshStandardMaterial color={fc} roughness={0.5} metalness={0.08} />
              </mesh>
            </group>
          );
        } else {
          // Doorway along x-axis (jambs on x sides)
          return (
            <group key={`frame-${i}`}>
              <mesh position={[frame.cx - halfGap, frame.h / 2, frame.cz]} castShadow>
                <boxGeometry args={[jambW, frame.h, jambD]} />
                <meshStandardMaterial color={fc} roughness={0.5} metalness={0.08} />
              </mesh>
              <mesh position={[frame.cx + halfGap, frame.h / 2, frame.cz]} castShadow>
                <boxGeometry args={[jambW, frame.h, jambD]} />
                <meshStandardMaterial color={fc} roughness={0.5} metalness={0.08} />
              </mesh>
              <mesh position={[frame.cx, frame.h, frame.cz]} castShadow>
                <boxGeometry args={[frame.gapWidth + jambW * 2, 0.08, jambD]} />
                <meshStandardMaterial color={fc} roughness={0.5} metalness={0.08} />
              </mesh>
            </group>
          );
        }
      })}

      {/* Ceiling planes */}
      {[
        { pos: [-4, 2.8, -6] as [number, number, number], size: [8, 8] as [number, number] },   // Living
        { pos: [4, 2.8, -6] as [number, number, number], size: [8, 8] as [number, number] },    // Kitchen
        { pos: [-2, 2.8, -1] as [number, number, number], size: [12, 2] as [number, number] },  // Hallway
        { pos: [5, 2.8, -1] as [number, number, number], size: [3, 2] as [number, number] },    // Laundry
        { pos: [-4, 2.8, 4] as [number, number, number], size: [8, 8] as [number, number] },    // Bedroom
        { pos: [4, 2.8, 4] as [number, number, number], size: [8, 8] as [number, number] },     // Bathroom
      ].map((ceil, i) => (
        <mesh key={`ceil-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={ceil.pos}>
          <planeGeometry args={ceil.size} />
          <meshStandardMaterial color="#d8d0c4" transparent opacity={0.05} roughness={1} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
