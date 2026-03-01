import { useMemo } from 'react';
import * as THREE from 'three';
import { getFloorPlan } from '../../config/floorPlans';
import { useStore } from '../../stores/useStore';

const S = 2;

export function Walls() {
  const floorPlanId = useStore((s) => s.floorPlanId);
  const plan = useMemo(() => getFloorPlan(floorPlanId), [floorPlanId]);

  return (
    <group>
      {plan.walls.map((wall, i) => {
        const dx = wall.end[0] - wall.start[0];
        const dz = wall.end[1] - wall.start[1];
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        const cx = (wall.start[0] + wall.end[0]) / 2;
        const cz = (wall.start[1] + wall.end[1]) / 2;

        return (
          <group key={i}>
            <mesh position={[cx, wall.height / 2, cz]} rotation={[0, angle, 0]} castShadow receiveShadow>
              <boxGeometry args={[wall.thickness, wall.height, length]} />
              <meshPhysicalMaterial color="#e8e2d6" roughness={0.85} metalness={0.02} transparent opacity={0.55} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[cx, wall.height - 0.02 * S, cz]} rotation={[0, angle, 0]}>
              <boxGeometry args={[wall.thickness + 0.03 * S, 0.04 * S, length]} />
              <meshStandardMaterial color="#d5cfc3" roughness={0.5} metalness={0.05} />
            </mesh>
            <mesh position={[cx, 0.04 * S, cz]} rotation={[0, angle, 0]}>
              <boxGeometry args={[wall.thickness + 0.02 * S, 0.08 * S, length]} />
              <meshStandardMaterial color="#3a3530" roughness={0.6} metalness={0.05} />
            </mesh>
          </group>
        );
      })}

      {/* Door frames */}
      {plan.doorFrames.map((frame, i) => {
        const jambW = 0.05 * S;
        const jambD = 0.14 * S;
        const halfGap = frame.gapWidth / 2;
        const fc = '#4a4035';

        if (frame.alongZ) {
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
                <boxGeometry args={[jambD, 0.08 * S, frame.gapWidth + jambW * 2]} />
                <meshStandardMaterial color={fc} roughness={0.5} metalness={0.08} />
              </mesh>
            </group>
          );
        }
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
              <boxGeometry args={[frame.gapWidth + jambW * 2, 0.08 * S, jambD]} />
              <meshStandardMaterial color={fc} roughness={0.5} metalness={0.08} />
            </mesh>
          </group>
        );
      })}

      {/* Ceiling planes */}
      {plan.ceilings.map((ceil, i) => (
        <mesh key={`ceil-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={ceil.pos}>
          <planeGeometry args={ceil.size} />
          <meshStandardMaterial color="#d8d0c4" transparent opacity={0.05} roughness={1} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
