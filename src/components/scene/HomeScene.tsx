import { Environment } from '@react-three/drei';
import { rooms } from '../../utils/homeLayout';
import { AIBrain } from '../../systems/AIBrain';
import { TimeSystem } from '../../systems/TimeSystem';
import { CameraController } from '../camera/CameraController';
import { Room } from './Room';
import { Walls } from './Walls';
import {
  BathroomFurniture,
  BedroomFurniture,
  HallwayDecor,
  KitchenFurniture,
  LaundryClosetFurniture,
  LivingRoomFurniture,
} from './FurnitureModels';
import { Robot } from './Robot';

export function HomeScene() {
  return (
    <>
      <TimeSystem />
      <AIBrain />
      <CameraController />

      {/* Strong ambient so scene is never dark */}
      <ambientLight intensity={0.8} color="#ffffff" />
      <hemisphereLight color="#ffffff" groundColor="#444444" intensity={0.5} />

      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#3d3a36" roughness={0.8} />
      </mesh>

      {rooms.map((room) => (
        <Room key={room.id} room={room} />
      ))}

      <Walls />
      <LivingRoomFurniture />
      <KitchenFurniture />
      <BedroomFurniture />
      <BathroomFurniture />
      <HallwayDecor />
      <LaundryClosetFurniture />

      <Robot />

      <Environment preset="apartment" background={false} environmentIntensity={0.5} />
    </>
  );
}
