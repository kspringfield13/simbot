import { BakeShadows, ContactShadows, Environment } from '@react-three/drei';
import { rooms } from '../../utils/homeLayout';
import { useStore } from '../../stores/useStore';
import { getTimeLighting } from '../../systems/TimeSystem';
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
import { ThoughtBubble } from '../game/ThoughtBubble';

export function HomeScene() {
  const simMinutes = useStore((state) => state.simMinutes);
  const cameraMode = useStore((state) => state.cameraMode);

  const lighting = getTimeLighting(simMinutes);

  return (
    <>
      <TimeSystem />
      <AIBrain />
      <CameraController />

      <ambientLight intensity={lighting.ambientIntensity} color={lighting.hemisphereColor} />
      <hemisphereLight color={lighting.hemisphereColor} groundColor="#1a150e" intensity={0.3} />

      <directionalLight
        position={[8, 20, 6]}
        intensity={lighting.sunIntensity}
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
        color={lighting.sunColor}
      />
      <directionalLight position={[-6, 10, -4]} intensity={0.25} color="#c8dbef" />

      <pointLight position={[-4, 2.5, -6]} intensity={0.6} color="#ffe8c0" distance={12} decay={2} />
      <pointLight position={[4, 2.5, -6]} intensity={0.7} color="#fff0d0" distance={12} decay={2} />
      <pointLight position={[-4, 2.5, 4]} intensity={0.45} color="#e0e0ff" distance={12} decay={2} />
      <pointLight position={[4, 2.5, 4]} intensity={0.55} color="#f0f5ff" distance={12} decay={2} />
      <pointLight position={[0, 2.5, -1]} intensity={0.35} color="#ffe0b0" distance={8} decay={2} />
      <pointLight position={[5, 2.5, -1]} intensity={0.3} color="#fff5e0" distance={4} decay={2} />

      <ContactShadows
        position={[0, 0, 1]}
        opacity={0.4}
        scale={30}
        blur={2.6}
        far={5}
        color="#000"
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, -1]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#1c1a17" roughness={0.85} metalness={0.05} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -1]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0e0d0c" roughness={1} />
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
      <ThoughtBubble />

      <Environment preset="apartment" background={false} environmentIntensity={0.15} />

      <fog
        attach="fog"
        args={[
          '#0c0b0a',
          cameraMode === 'overview' ? 20 : 12,
          cameraMode === 'overview' ? 48 : 34,
        ]}
      />

      <BakeShadows />
    </>
  );
}
