import { useMemo } from 'react';
import { useStore } from '../../stores/useStore';

const S = 2;

// Yard bounds (matches the yard room in floorPlans)
const YARD_CX = 0;
const YARD_CZ = 12 * S; // 24
const YARD_W = 16 * S;   // 32
const YARD_D = 8 * S;    // 16

const FENCE_HEIGHT = 1.4;
const FENCE_POST_RADIUS = 0.08;
const FENCE_RAIL_HEIGHT = 0.06;
const FENCE_COLOR = '#8B6914';
const FENCE_DARK = '#6B4F10';

function FencePost({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[FENCE_POST_RADIUS, FENCE_POST_RADIUS * 1.1, FENCE_HEIGHT, 6]} />
      <meshStandardMaterial color={FENCE_DARK} roughness={0.85} />
    </mesh>
  );
}

function FenceRail({ start, end, y }: { start: [number, number]; end: [number, number]; y: number }) {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const length = Math.sqrt(dx * dx + dz * dz);
  const cx = (start[0] + end[0]) / 2;
  const cz = (start[1] + end[1]) / 2;
  const angle = Math.atan2(dx, dz);

  return (
    <mesh position={[cx, y, cz]} rotation={[0, angle, 0]} castShadow>
      <boxGeometry args={[0.06, FENCE_RAIL_HEIGHT, length]} />
      <meshStandardMaterial color={FENCE_COLOR} roughness={0.8} />
    </mesh>
  );
}

function FenceSection({ start, end }: { start: [number, number]; end: [number, number] }) {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const length = Math.sqrt(dx * dx + dz * dz);
  const postCount = Math.max(2, Math.floor(length / 2.5) + 1);

  const posts = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < postCount; i++) {
      const t = i / (postCount - 1);
      arr.push([
        start[0] + dx * t,
        FENCE_HEIGHT / 2,
        start[1] + dz * t,
      ]);
    }
    return arr;
  }, [start, end, postCount, dx, dz]);

  return (
    <group>
      {posts.map((pos, i) => (
        <FencePost key={`post-${i}`} position={pos} />
      ))}
      <FenceRail start={start} end={end} y={FENCE_HEIGHT * 0.35} />
      <FenceRail start={start} end={end} y={FENCE_HEIGHT * 0.7} />
    </group>
  );
}

function Bush({ position, scale = 1, color = '#2d6b30' }: { position: [number, number, number]; scale?: number; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4 * scale, 0]} castShadow>
        <sphereGeometry args={[0.6 * scale, 8, 6]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0.3 * scale, 0.3 * scale, 0.2 * scale]} castShadow>
        <sphereGeometry args={[0.4 * scale, 8, 6]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    </group>
  );
}

function FlowerCluster({ position, color }: { position: [number, number, number]; color: string }) {
  const flowers = useMemo(() => {
    const arr: { pos: [number, number, number]; s: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const r = 0.2 + Math.random() * 0.3;
      arr.push({
        pos: [Math.cos(angle) * r, 0.15 + Math.random() * 0.1, Math.sin(angle) * r],
        s: 0.06 + Math.random() * 0.04,
      });
    }
    return arr;
  }, []);

  return (
    <group position={position}>
      {flowers.map((f, i) => (
        <mesh key={i} position={f.pos}>
          <sphereGeometry args={[f.s, 6, 4]} />
          <meshStandardMaterial color={color} roughness={0.6} emissive={color} emissiveIntensity={0.1} />
        </mesh>
      ))}
      {/* Leaves/stems */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.1, 8]} />
        <meshStandardMaterial color="#2a7a2e" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Tree({ position, height = 4, canopyRadius = 2 }: { position: [number, number, number]; height?: number; canopyRadius?: number }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, height * 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.22, height * 0.7, 8]} />
        <meshStandardMaterial color="#5c3d1a" roughness={0.9} />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, height * 0.65, 0]} castShadow>
        <sphereGeometry args={[canopyRadius, 10, 8]} />
        <meshStandardMaterial color="#2a6e2a" roughness={0.85} />
      </mesh>
      <mesh position={[canopyRadius * 0.4, height * 0.55, canopyRadius * 0.3]} castShadow>
        <sphereGeometry args={[canopyRadius * 0.7, 8, 6]} />
        <meshStandardMaterial color="#236b23" roughness={0.85} />
      </mesh>
    </group>
  );
}

function GardenBed({ position, size }: { position: [number, number, number]; size: [number, number] }) {
  return (
    <group position={position}>
      {/* Soil bed */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[size[0], 0.12, size[1]]} />
        <meshStandardMaterial color="#3d2b1a" roughness={0.95} />
      </mesh>
      {/* Border stones */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[size[0] + 0.2, 0.08, size[1] + 0.2]} />
        <meshStandardMaterial color="#6b6b6b" roughness={0.9} />
      </mesh>
    </group>
  );
}

function GrassPatches() {
  const patches = useMemo(() => {
    const arr: { pos: [number, number, number]; rot: number; s: number }[] = [];
    const halfW = YARD_W / 2 - 1;
    const minZ = YARD_CZ - YARD_D / 2 + 1;
    const maxZ = YARD_CZ + YARD_D / 2 - 1;
    for (let i = 0; i < 40; i++) {
      arr.push({
        pos: [
          YARD_CX + (Math.random() - 0.5) * halfW * 2,
          0.02,
          minZ + Math.random() * (maxZ - minZ),
        ],
        rot: Math.random() * Math.PI,
        s: 0.3 + Math.random() * 0.4,
      });
    }
    return arr;
  }, []);

  return (
    <>
      {patches.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={[-Math.PI / 2, 0, p.rot]}>
          <circleGeometry args={[p.s, 5]} />
          <meshStandardMaterial color="#4a7a3a" roughness={0.95} transparent opacity={0.5} />
        </mesh>
      ))}
    </>
  );
}

export function YardDecorations() {
  const floorPlanId = useStore((s) => s.floorPlanId);

  // Only show for the house preset (which has the yard)
  if (floorPlanId !== 'house') return null;

  const halfW = YARD_W / 2;
  const halfD = YARD_D / 2;
  const left = YARD_CX - halfW;
  const right = YARD_CX + halfW;
  const top = YARD_CZ - halfD;    // z = 16 (near house)
  const bottom = YARD_CZ + halfD; // z = 32 (far end)

  // Fence gate gap (back door area, center ~2S wide)
  const gateLeft = -1 * S;
  const gateRight = 1 * S;

  return (
    <group>
      {/* Grass texture patches for visual richness */}
      <GrassPatches />

      {/* Fence — three sides (left, right, bottom) + top with gate gap */}
      {/* Left fence */}
      <FenceSection start={[left, top]} end={[left, bottom]} />
      {/* Right fence */}
      <FenceSection start={[right, top]} end={[right, bottom]} />
      {/* Bottom fence (far end) */}
      <FenceSection start={[left, bottom]} end={[right, bottom]} />
      {/* Top fence (near house) — two sections with gate gap */}
      <FenceSection start={[left, top]} end={[gateLeft, top]} />
      <FenceSection start={[gateRight, top]} end={[right, top]} />

      {/* Trees */}
      <Tree position={[-12, 0, 20]} height={5} canopyRadius={2.2} />
      <Tree position={[11, 0, 28]} height={4} canopyRadius={1.8} />
      <Tree position={[-10, 0, 30]} height={3.5} canopyRadius={1.5} />

      {/* Bushes along fences */}
      <Bush position={[-14, 0, 22]} scale={1.2} color="#2d6b30" />
      <Bush position={[-14, 0, 26]} scale={0.9} color="#3a7a3e" />
      <Bush position={[14, 0, 20]} scale={1.0} color="#2d6b30" />
      <Bush position={[14, 0, 25]} scale={1.1} color="#347834" />
      <Bush position={[14, 0, 30]} scale={0.8} color="#3a7a3e" />

      {/* Garden beds */}
      <GardenBed position={[-6, 0, 28]} size={[4, 2.5]} />
      <GardenBed position={[6, 0, 22]} size={[3.5, 2]} />

      {/* Flower clusters */}
      <FlowerCluster position={[-6, 0.1, 27.5]} color="#e84393" />
      <FlowerCluster position={[-5, 0.1, 28.5]} color="#fdcb6e" />
      <FlowerCluster position={[-7, 0.1, 28.2]} color="#6c5ce7" />
      <FlowerCluster position={[5.5, 0.1, 21.5]} color="#e17055" />
      <FlowerCluster position={[6.5, 0.1, 22.5]} color="#00cec9" />
      <FlowerCluster position={[6, 0.1, 21.8]} color="#fd79a8" />

      {/* Porch / patio transition area — concrete slab between house and yard */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, top + 1.5]} receiveShadow>
        <planeGeometry args={[8, 3]} />
        <meshStandardMaterial color="#6b6560" roughness={0.85} metalness={0.02} />
      </mesh>
      {/* Patio border stones */}
      <mesh position={[0, 0.04, top + 3.05]}>
        <boxGeometry args={[8.2, 0.08, 0.1]} />
        <meshStandardMaterial color="#7a756e" roughness={0.9} />
      </mesh>
      <mesh position={[-4.05, 0.04, top + 1.5]}>
        <boxGeometry args={[0.1, 0.08, 3.2]} />
        <meshStandardMaterial color="#7a756e" roughness={0.9} />
      </mesh>
      <mesh position={[4.05, 0.04, top + 1.5]}>
        <boxGeometry args={[0.1, 0.08, 3.2]} />
        <meshStandardMaterial color="#7a756e" roughness={0.9} />
      </mesh>

      {/* Stepping stones path from patio to yard center */}
      {[20, 22].map((z) => (
        <mesh key={z} position={[0, 0.015, z]} rotation={[-Math.PI / 2, 0, Math.random() * 0.3]}>
          <circleGeometry args={[0.5, 8]} />
          <meshStandardMaterial color="#7a7a72" roughness={0.9} />
        </mesh>
      ))}

      {/* Small decorative stones near garden beds */}
      {[[-4, 0.04, 26.5], [-8, 0.04, 29], [8, 0.04, 23.5], [4, 0.04, 21]].map(([x, y, z], i) => (
        <mesh key={`stone-${i}`} position={[x, y, z]}>
          <sphereGeometry args={[0.2, 6, 4]} />
          <meshStandardMaterial color="#8a8a80" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}
