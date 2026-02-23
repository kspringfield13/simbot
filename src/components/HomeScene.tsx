import { OrbitControls, Environment, ContactShadows, BakeShadows } from '@react-three/drei';
import { Room } from './Room';
import { Robot } from './Robot';
import { Walls } from './Walls';
import { CameraFollow } from './CameraFollow';
import { LivingRoomFurniture, KitchenFurniture, BedroomFurniture, BathroomFurniture, HallwayDecor } from './FurnitureModels';
import { rooms } from '../utils/homeLayout';
import { useStore } from '../stores/useStore';

export function HomeScene() {
  const cameraMode = useStore((s) => s.cameraMode);

  return (
    <>
      {/* Camera follows robot */}
      <CameraFollow />
      {/* OrbitControls always enabled — pinch zoom, pan, rotate freely */}
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        maxPolarAngle={Math.PI / 2.05}
        minPolarAngle={0.1}
        minDistance={1.5}
        maxDistance={30}
        enableDamping
        dampingFactor={0.08}
        zoomSpeed={0.8}
        rotateSpeed={0.6}
        panSpeed={0.5}
        touches={{ ONE: 1, TWO: 2 }} // ONE=rotate, TWO=dolly+pan
      />

      {/* === LIGHTING — PBR realistic interior === */}
      <ambientLight intensity={0.2} color="#f0e8d8" />
      <hemisphereLight color="#ffeedd" groundColor="#1a150e" intensity={0.25} />

      {/* Sun — warm key light */}
      <directionalLight
        position={[8, 20, 6]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={50}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        color="#fff5e6"
      />
      {/* Fill light — cooler, from opposite side */}
      <directionalLight position={[-6, 10, -4]} intensity={0.3} color="#d0e0f0" />

      {/* Room ceiling lights — warm interiors */}
      <pointLight position={[-3.5, 2.5, -2.5]} intensity={0.6} color="#ffe8c0" distance={10} decay={2} />
      <pointLight position={[3.5, 2.5, -2.5]} intensity={0.7} color="#fff0d0" distance={10} decay={2} />
      <pointLight position={[-3.5, 2.5, 4.5]} intensity={0.4} color="#e0e0ff" distance={10} decay={2} />
      <pointLight position={[3.5, 2.5, 4.5]} intensity={0.5} color="#f0f5ff" distance={10} decay={2} />
      <pointLight position={[0, 2.5, 1]} intensity={0.35} color="#ffe0b0" distance={8} decay={2} />

      {/* Contact shadows for grounding */}
      <ContactShadows
        position={[0, 0, 1]}
        opacity={0.4}
        scale={30}
        blur={2.5}
        far={5}
        color="#000"
      />

      {/* Base ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 1]} receiveShadow>
        <planeGeometry args={[30, 24]} />
        <meshStandardMaterial color="#1c1a17" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Exterior ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 1]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#0e0d0c" roughness={1} />
      </mesh>

      {/* Rooms */}
      {rooms.map((room) => (
        <Room key={room.id} room={room} />
      ))}

      {/* Walls */}
      <Walls />

      {/* GLB furniture models */}
      <LivingRoomFurniture />
      <KitchenFurniture />
      <BedroomFurniture />
      <BathroomFurniture />
      <HallwayDecor />

      {/* Robot */}
      <Robot />

      {/* Subtle environment for reflections */}
      <Environment preset="apartment" background={false} environmentIntensity={0.15} />

      {/* Fog — depth cue */}
      <fog attach="fog" args={['#0c0b0a', cameraMode === 'overview' ? 22 : 14, cameraMode === 'overview' ? 50 : 35]} />

      <BakeShadows />
    </>
  );
}
