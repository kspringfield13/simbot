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
import { WindowGlow } from './WindowGlow';
import { DustMotes } from './DustMotes';
// ThoughtBubble removed — replaced by RobotTerminal overlay

const S = 2; // environment scale

export function HomeScene() {
  const simMinutes = useStore((state) => state.simMinutes);
  const cameraMode = useStore((state) => state.cameraMode);

  const lighting = getTimeLighting(simMinutes);

  return (
    <>
      <TimeSystem />
      <AIBrain />
      <CameraController />

      <ambientLight intensity={Math.max(lighting.ambientIntensity, 0.5)} color={lighting.hemisphereColor} />
      <hemisphereLight color={lighting.hemisphereColor} groundColor="#1a150e" intensity={0.3} />

      <directionalLight
        position={lighting.sunPosition}
        intensity={lighting.sunIntensity}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={80}
        shadow-camera-left={-20 * S}
        shadow-camera-right={20 * S}
        shadow-camera-top={20 * S}
        shadow-camera-bottom={-20 * S}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        color={lighting.sunColor}
      />
      <directionalLight position={[-6 * S, 10 * S, -4 * S]} intensity={0.25} color="#c8dbef" />

      <pointLight position={[-4 * S, 2.5 * S, -6 * S]} intensity={0.6} color="#ffe8c0" distance={12 * S} decay={2} />
      <pointLight position={[4 * S, 2.5 * S, -6 * S]} intensity={0.7} color="#fff0d0" distance={12 * S} decay={2} />
      <pointLight position={[-4 * S, 2.5 * S, 4 * S]} intensity={0.45} color="#e0e0ff" distance={12 * S} decay={2} />
      <pointLight position={[4 * S, 2.5 * S, 4 * S]} intensity={0.55} color="#f0f5ff" distance={12 * S} decay={2} />
      <pointLight position={[0, 2.5 * S, -1 * S]} intensity={0.35} color="#ffe0b0" distance={8 * S} decay={2} />
      <pointLight position={[5 * S, 2.5 * S, -1 * S]} intensity={0.3} color="#fff5e0" distance={4 * S} decay={2} />

      <ContactShadows
        position={[0, 0, -1 * S]}
        opacity={0.4}
        scale={50}
        blur={2.6}
        far={8}
        color="#000"
      />

      {/* House floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, -1 * S]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#3a3632" roughness={0.8} metalness={0.02} />
      </mesh>

      {/* Ground beyond house */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -1 * S]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1a1918" roughness={1} />
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
      <WindowGlow />
      <DustMotes />

      <Environment preset="apartment" background={false} environmentIntensity={0.4} />

      <fog
        attach="fog"
        args={[
          '#0c0b0a',
          cameraMode === 'overview' ? 50 * S : 30 * S,
          cameraMode === 'overview' ? 100 * S : 70 * S,
        ]}
      />

      <BakeShadows />
    </>
  );
}
