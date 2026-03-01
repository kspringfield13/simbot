// @ts-nocheck
// ── Street View Scene ─────────────────────────────────────────
// Renders the neighborhood street with house exteriors.
// Only shows when streetView is toggled on; the full interior
// HomeScene is NOT mounted to keep things performant.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../stores/useStore';
import type { NeighborHouse, HouseStyle } from '../../systems/Neighborhood';

// ── House Exterior ───────────────────────────────────────────────

function HouseExterior({ house, index }: { house: NeighborHouse; index: number }) {
  const setVisitingHouseId = useStore((s) => s.setVisitingHouseId);
  const { style } = house;
  const x = house.streetPosition * 28; // spacing between houses
  const groupRef = useRef<THREE.Group>(null);

  const baseW = style.width;
  const baseH = style.stories === 2 ? 10 : 6;
  const baseD = 12;

  return (
    <group ref={groupRef} position={[x, 0, 0]}>
      {/* Foundation */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[baseW + 1, 0.3, baseD + 1]} />
        <meshStandardMaterial color="#888880" roughness={0.9} />
      </mesh>

      {/* Main house body */}
      <mesh position={[0, baseH / 2 + 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[baseW, baseH, baseD]} />
        <meshStandardMaterial color={style.wallColor} roughness={0.7} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, baseH + 0.3 + 1.5, 0]} castShadow>
        <coneGeometry args={[baseW * 0.72, 3, 4]} />
        <meshStandardMaterial color={style.roofColor} roughness={0.8} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 1.8, baseD / 2 + 0.01]}>
        <boxGeometry args={[2.2, 3.2, 0.2]} />
        <meshStandardMaterial color={style.doorColor} roughness={0.5} />
      </mesh>

      {/* Door handle */}
      <mesh position={[0.7, 1.8, baseD / 2 + 0.15]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#c0a040" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Windows - front */}
      <Window position={[-3.5, baseH * 0.55 + 0.3, baseD / 2 + 0.01]} />
      <Window position={[3.5, baseH * 0.55 + 0.3, baseD / 2 + 0.01]} />

      {/* Second floor windows */}
      {style.stories === 2 && (
        <>
          <Window position={[-3.5, baseH * 0.8 + 0.3, baseD / 2 + 0.01]} />
          <Window position={[3.5, baseH * 0.8 + 0.3, baseD / 2 + 0.01]} />
          <Window position={[0, baseH * 0.8 + 0.3, baseD / 2 + 0.01]} />
        </>
      )}

      {/* Side windows */}
      <Window position={[baseW / 2 + 0.01, baseH * 0.55 + 0.3, -1]} rotation={[0, Math.PI / 2, 0]} />
      <Window position={[-baseW / 2 - 0.01, baseH * 0.55 + 0.3, -1]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Chimney */}
      {style.hasChimney && (
        <mesh position={[baseW * 0.3, baseH + 3.5, -1]} castShadow>
          <boxGeometry args={[1.5, 3, 1.5]} />
          <meshStandardMaterial color="#8b4513" roughness={0.9} />
        </mesh>
      )}

      {/* Porch */}
      {style.hasPorch && (
        <group position={[0, 0, baseD / 2 + 1.5]}>
          <mesh position={[0, 0.2, 0]} receiveShadow>
            <boxGeometry args={[baseW * 0.6, 0.4, 3]} />
            <meshStandardMaterial color="#a09080" roughness={0.8} />
          </mesh>
          {/* Porch pillars */}
          <mesh position={[-baseW * 0.25, 1.8, 1.2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 3.2, 8]} />
            <meshStandardMaterial color={style.trimColor} roughness={0.6} />
          </mesh>
          <mesh position={[baseW * 0.25, 1.8, 1.2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 3.2, 8]} />
            <meshStandardMaterial color={style.trimColor} roughness={0.6} />
          </mesh>
          {/* Porch roof */}
          <mesh position={[0, 3.5, 0.6]}>
            <boxGeometry args={[baseW * 0.65, 0.2, 3.5]} />
            <meshStandardMaterial color={style.roofColor} roughness={0.8} />
          </mesh>
        </group>
      )}

      {/* Garage */}
      {style.hasGarage && (
        <group position={[baseW / 2 + 2.5, 0, 0]}>
          <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
            <boxGeometry args={[5, 4.6, baseD - 2]} />
            <meshStandardMaterial color={style.wallColor} roughness={0.7} />
          </mesh>
          {/* Garage door */}
          <mesh position={[0, 1.8, (baseD - 2) / 2 + 0.01]}>
            <boxGeometry args={[3.8, 3.2, 0.15]} />
            <meshStandardMaterial color="#5a5a5a" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* Fence */}
      {style.fenceColor && (
        <>
          <Fence position={[-baseW / 2 - 0.5, 0, baseD / 2 + 4]} length={baseW + 1} color={style.fenceColor} />
        </>
      )}

      {/* Trim / baseboard */}
      <mesh position={[0, 0.35, baseD / 2 + 0.05]}>
        <boxGeometry args={[baseW + 0.2, 0.1, 0.1]} />
        <meshStandardMaterial color={style.trimColor} roughness={0.5} />
      </mesh>

      {/* House label + visit button */}
      <Html position={[0, baseH + 5, 0]} center distanceFactor={40}>
        <div
          className="pointer-events-auto flex flex-col items-center gap-1"
          style={{ userSelect: 'none' }}
        >
          <div className="whitespace-nowrap rounded-full border border-white/20 bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
            {house.name}
          </div>
          <button
            type="button"
            onClick={() => setVisitingHouseId(house.id)}
            className="rounded-full border border-cyan-400/40 bg-cyan-500/20 px-3 py-1 text-[10px] font-bold text-cyan-200 backdrop-blur-md transition-all hover:bg-cyan-500/40"
          >
            Visit
          </button>
          {house.visitingRobots.length > 0 && (
            <div className="rounded-full border border-green-400/30 bg-green-500/20 px-2 py-0.5 text-[9px] text-green-200">
              {house.visitingRobots.length} robot{house.visitingRobots.length > 1 ? 's' : ''} visiting
            </div>
          )}
        </div>
      </Html>

      {/* Visiting robots indicator at house */}
      {house.visitingRobots.map((robotId, i) => (
        <mesh key={robotId} position={[-2 + i * 2, 1.2, baseD / 2 + 3]} castShadow>
          <capsuleGeometry args={[0.4, 1, 8, 16]} />
          <meshStandardMaterial
            color={robotId === 'sim' ? '#4fc3f7' : robotId === 'chef' ? '#e57373' : '#81c784'}
            emissive={robotId === 'sim' ? '#4fc3f7' : robotId === 'chef' ? '#e57373' : '#81c784'}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

function Window({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Window frame */}
      <mesh>
        <boxGeometry args={[2.2, 2.2, 0.15]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.5} />
      </mesh>
      {/* Glass */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[1.8, 1.8, 0.08]} />
        <meshStandardMaterial color="#a8c8e8" roughness={0.2} metalness={0.1} transparent opacity={0.7} />
      </mesh>
      {/* Cross divider */}
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[0.08, 1.8, 0.05]} />
        <meshStandardMaterial color="#f5f0e8" />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[1.8, 0.08, 0.05]} />
        <meshStandardMaterial color="#f5f0e8" />
      </mesh>
    </group>
  );
}

function Fence({ position, length, color }: { position: [number, number, number]; length: number; color: string }) {
  const posts = Math.floor(length / 2);

  return (
    <group position={position}>
      {/* Rail */}
      <mesh position={[length / 2, 0.8, 0]}>
        <boxGeometry args={[length, 0.08, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[length / 2, 0.4, 0]}>
        <boxGeometry args={[length, 0.08, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Posts */}
      {Array.from({ length: posts + 1 }, (_, i) => (
        <mesh key={i} position={[i * 2, 0.5, 0]} castShadow>
          <boxGeometry args={[0.12, 1.0, 0.12]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// ── Player House Exterior ────────────────────────────────────────

function PlayerHouseExterior() {
  const returnToPlayerHouse = useStore((s) => s.returnToPlayerHouse);
  const setStreetView = useStore((s) => s.setStreetView);

  return (
    <group position={[0, 0, 0]}>
      {/* Foundation */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[21, 0.3, 17]} />
        <meshStandardMaterial color="#888880" roughness={0.9} />
      </mesh>

      {/* Main house body */}
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[20, 7.5, 16]} />
        <meshStandardMaterial color="#d4c5a9" roughness={0.7} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 8.5, 0]} castShadow>
        <coneGeometry args={[15, 4, 4]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.8} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 2, 8.01]}>
        <boxGeometry args={[2.8, 3.6, 0.2]} />
        <meshStandardMaterial color="#8b4513" roughness={0.5} />
      </mesh>

      {/* Windows */}
      <Window position={[-5, 4.5, 8.01]} />
      <Window position={[5, 4.5, 8.01]} />
      <Window position={[-5, 7, 8.01]} />
      <Window position={[5, 7, 8.01]} />

      {/* "Your House" label */}
      <Html position={[0, 13, 0]} center distanceFactor={40}>
        <div className="flex flex-col items-center gap-1">
          <div className="whitespace-nowrap rounded-full border border-amber-400/30 bg-black/70 px-3 py-1 text-xs font-bold text-amber-200 backdrop-blur-md">
            Your House
          </div>
          <button
            type="button"
            onClick={() => setStreetView(false)}
            className="rounded-full border border-amber-400/40 bg-amber-500/20 px-3 py-1 text-[10px] font-bold text-amber-200 backdrop-blur-md transition-all hover:bg-amber-500/40"
          >
            Go Inside
          </button>
        </div>
      </Html>
    </group>
  );
}

// ── Street / Road ────────────────────────────────────────────────

function Street() {
  return (
    <group>
      {/* Road surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0.02, 18]} receiveShadow>
        <planeGeometry args={[120, 8]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>

      {/* Road lines */}
      {Array.from({ length: 15 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-32 + i * 8, 0.03, 18]}>
          <planeGeometry args={[4, 0.2]} />
          <meshStandardMaterial color="#e8e080" roughness={0.8} />
        </mesh>
      ))}

      {/* Sidewalk - player side */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0.05, 13]} receiveShadow>
        <planeGeometry args={[120, 3]} />
        <meshStandardMaterial color="#a09888" roughness={0.85} />
      </mesh>

      {/* Sidewalk - far side */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0.05, 23]} receiveShadow>
        <planeGeometry args={[120, 3]} />
        <meshStandardMaterial color="#a09888" roughness={0.85} />
      </mesh>

      {/* Grass - player lawns */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0.01, 5]} receiveShadow>
        <planeGeometry args={[120, 14]} />
        <meshStandardMaterial color="#4a6a3a" roughness={0.9} />
      </mesh>

      {/* Grass - far side */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0.01, 28]} receiveShadow>
        <planeGeometry args={[120, 8]} />
        <meshStandardMaterial color="#4a6a3a" roughness={0.9} />
      </mesh>

      {/* Street lights */}
      {[-20, 10, 40].map((lx) => (
        <group key={lx} position={[lx, 0, 22]}>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.12, 0.15, 6, 8]} />
            <meshStandardMaterial color="#4a4a4a" metalness={0.5} />
          </mesh>
          <mesh position={[0.6, 5.8, 0]}>
            <boxGeometry args={[1.2, 0.3, 0.6]} />
            <meshStandardMaterial color="#4a4a4a" metalness={0.5} />
          </mesh>
          <pointLight position={[0.6, 5.5, 0]} intensity={0.4} color="#fff5d0" distance={20} decay={2} />
        </group>
      ))}

      {/* Trees along the far side */}
      {[-25, -10, 5, 20, 35, 50].map((tx) => (
        <group key={tx} position={[tx, 0, 30]}>
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.4, 5, 6]} />
            <meshStandardMaterial color="#5a3a20" roughness={0.9} />
          </mesh>
          <mesh position={[0, 6, 0]} castShadow>
            <sphereGeometry args={[2.5, 8, 8]} />
            <meshStandardMaterial color="#3a6a2a" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Mailboxes */}
      {[0, 28, 56].map((mx, i) => (
        <group key={i} position={[mx - 14, 0, 12]}>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.2, 6]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <boxGeometry args={[0.8, 0.5, 0.4]} />
            <meshStandardMaterial color={i === 0 ? '#3a5a8a' : '#8a3a3a'} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Main StreetView Component ────────────────────────────────────

export function StreetView() {
  const neighborHouses = useStore((s) => s.neighborHouses);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <hemisphereLight color="#87ceeb" groundColor="#4a6a3a" intensity={0.5} />
      <directionalLight
        position={[20, 30, 15]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={80}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <directionalLight position={[-10, 20, -10]} intensity={0.3} />

      {/* Sky color via fog */}
      <fog attach="fog" args={['#c8dce8', 60, 150]} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, -0.02, 15]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#5a7a4a" roughness={0.95} />
      </mesh>

      <Street />

      {/* Player's house */}
      <PlayerHouseExterior />

      {/* Neighbor houses */}
      {neighborHouses.map((house, i) => (
        <HouseExterior key={house.id} house={house} index={i} />
      ))}
    </>
  );
}
