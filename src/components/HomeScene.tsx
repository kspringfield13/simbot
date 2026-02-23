import { OrbitControls } from '@react-three/drei';
import { Room } from './Room';
import { Robot } from './Robot';
import { Walls } from './Walls';
import { rooms } from '../utils/homeLayout';

export function HomeScene() {
  return (
    <>
      {/* Camera Controls - overhead angle for floor plan view */}
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.5}
        minPolarAngle={0.2}
        minDistance={6}
        maxDistance={30}
        target={[0.5, 0, 1.5]}
        enableDamping
        dampingFactor={0.05}
      />

      {/* Lighting - warm interior feel */}
      <ambientLight intensity={0.25} color="#f8f0e0" />
      <directionalLight
        position={[8, 20, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.001}
        color="#fff8f0"
      />

      {/* Room accent lights */}
      <pointLight position={[-3, 2.5, -2]} intensity={0.3} color="#ffe8c0" distance={8} />
      <pointLight position={[4, 2.5, -2]} intensity={0.35} color="#fff0d0" distance={8} />
      <pointLight position={[-3, 2.5, 5]} intensity={0.2} color="#e0e8ff" distance={8} />
      <pointLight position={[4, 2.5, 5]} intensity={0.25} color="#f0f8ff" distance={8} />

      {/* Base ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 1]} receiveShadow>
        <planeGeometry args={[20, 16]} />
        <meshStandardMaterial color="#1a1815" roughness={0.95} />
      </mesh>

      {/* Exterior ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 1]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0e0d0c" roughness={1} />
      </mesh>

      {/* Rooms */}
      {rooms.map((room) => (
        <Room key={room.id} room={room} />
      ))}

      {/* Walls */}
      <Walls />

      {/* Robot */}
      <Robot />

      {/* Fog for depth */}
      <fog attach="fog" args={['#0e0d0c', 18, 40]} />
    </>
  );
}
