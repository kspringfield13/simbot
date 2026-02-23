import { OrbitControls } from '@react-three/drei';
import { Room } from './Room';
import { Robot } from './Robot';
import { Walls } from './Walls';
import { CameraFollow } from './CameraFollow';
import { rooms } from '../utils/homeLayout';

export function HomeScene() {
  return (
    <>
      {/* Camera follows robot with orbit override */}
      <CameraFollow />
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.3}
        minPolarAngle={0.3}
        minDistance={4}
        maxDistance={25}
        enableDamping
        dampingFactor={0.05}
        enablePan={false}
      />

      {/* Lighting — warm realistic interior */}
      <ambientLight intensity={0.35} color="#f8f0e0" />
      <hemisphereLight color="#ffeedd" groundColor="#221a10" intensity={0.3} />

      {/* Main sun light */}
      <directionalLight
        position={[6, 18, 8]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
        color="#fff8f0"
      />

      {/* Room accent lights — simulating ceiling fixtures */}
      <pointLight position={[-3, 2.6, -2]} intensity={0.5} color="#ffe8c0" distance={7} decay={2} />
      <pointLight position={[4.2, 2.6, -2]} intensity={0.6} color="#fff0d0" distance={7} decay={2} />
      <pointLight position={[-3.5, 2.6, 5]} intensity={0.35} color="#e0e0ff" distance={7} decay={2} />
      <pointLight position={[4, 2.6, 5]} intensity={0.45} color="#f0f5ff" distance={7} decay={2} />
      <pointLight position={[0.5, 2.6, 1.5]} intensity={0.3} color="#ffe0b0" distance={5} decay={2} />

      {/* Base ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 1]} receiveShadow>
        <planeGeometry args={[20, 16]} />
        <meshStandardMaterial color="#1a1815" roughness={0.95} />
      </mesh>

      {/* Exterior */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 1]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0c0b0a" roughness={1} />
      </mesh>

      {/* Rooms */}
      {rooms.map((room) => (
        <Room key={room.id} room={room} />
      ))}

      {/* Walls */}
      <Walls />

      {/* Robot */}
      <Robot />

      {/* Fog */}
      <fog attach="fog" args={['#0c0b0a', 20, 45]} />
    </>
  );
}
