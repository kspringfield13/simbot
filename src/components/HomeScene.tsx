import { OrbitControls, Grid } from '@react-three/drei';
import { Room } from './Room';
import { Robot } from './Robot';
import { rooms } from '../utils/homeLayout';

export function HomeScene() {
  return (
    <>
      {/* Camera Controls - touch friendly */}
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={25}
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.05}
      />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 15, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#4a6fa5" />
      <pointLight position={[5, 5, 5]} intensity={0.3} color="#ff6b6b" />

      {/* Ground grid */}
      <Grid
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1a1a3e"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#2a2a5e"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        position={[0, -0.01, 0]}
      />

      {/* Base floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0a0a1a" />
      </mesh>

      {/* Rooms */}
      {rooms.map((room) => (
        <Room key={room.id} room={room} />
      ))}

      {/* Robot */}
      <Robot />

      {/* Fog for atmosphere */}
      <fog attach="fog" args={['#0a0a1a', 15, 35]} />
    </>
  );
}
