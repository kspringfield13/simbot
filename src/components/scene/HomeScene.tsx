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

      <ambientLight intensity={0.7} />
      <hemisphereLight color="#ffffff" groundColor="#8888aa" intensity={0.4} />
      <directionalLight position={[10, 25, 10]} intensity={1.0} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-far={60} shadow-camera-left={-25} shadow-camera-right={25}
        shadow-camera-top={25} shadow-camera-bottom={-25}
      />
      <directionalLight position={[-8, 15, -5]} intensity={0.3} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
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
    </>
  );
}
