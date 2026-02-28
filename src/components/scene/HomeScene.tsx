import { useMemo } from 'react';
import { getEffectiveRooms } from '../../utils/homeLayout';
import { useStore } from '../../stores/useStore';
import { AIBrain } from '../../systems/AIBrain';
import { ROBOT_IDS } from '../../types';
import { TimeSystem } from '../../systems/TimeSystem';
import { CameraController } from '../camera/CameraController';
import { Room } from './Room';
import { Walls } from './Walls';
import { AllFurniture } from './FurnitureModels';
import { Robot } from './Robot';
import { VisitorNPC } from './VisitorNPC';
import { SeasonalDecorations } from './SeasonalDecorations';
import { VisitorSystem } from '../../systems/VisitorSystem';
import { PetCat } from './PetCat';
import { WeatherEffects } from './WeatherEffects';
import { ChargingStation } from './ChargingStation';

export function HomeScene() {
  const roomLayout = useStore((s) => s.roomLayout);
  const editMode = useStore((s) => s.editMode);
  const effectiveRooms = useMemo(
    () => getEffectiveRooms(roomLayout.overrides, roomLayout.addedRooms, roomLayout.deletedRoomIds),
    [roomLayout],
  );

  return (
    <>
      <TimeSystem />
      {ROBOT_IDS.map((id) => (
        <AIBrain key={id} robotId={id} />
      ))}
      <CameraController />

      <ambientLight intensity={0.7} />
      <hemisphereLight color="#ffffff" groundColor="#8888aa" intensity={0.4} />
      <directionalLight position={[10, 25, 10]} intensity={1.0} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-far={60} shadow-camera-left={-25} shadow-camera-right={25}
        shadow-camera-top={25} shadow-camera-bottom={-25}
      />
      <directionalLight position={[-8, 15, -5]} intensity={0.3} />

      {/* Room ceiling lights — warm per-room ambiance */}
      <pointLight position={[-8, 4.5, -12]} intensity={0.5} color="#ffe8c0" distance={18} decay={2} />
      <pointLight position={[8, 4.5, -12]} intensity={0.6} color="#fff5e0" distance={18} decay={2} />
      <pointLight position={[-8, 4.5, 8]} intensity={0.4} color="#e8e0ff" distance={18} decay={2} />
      <pointLight position={[8, 4.5, 8]} intensity={0.5} color="#f0f5ff" distance={18} decay={2} />
      <pointLight position={[0, 4.5, -2]} intensity={0.3} color="#ffe0b0" distance={12} decay={2} />
      <pointLight position={[10, 4.5, -2]} intensity={0.3} color="#fff5e0" distance={8} decay={2} />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
        onClick={editMode ? () => useStore.getState().setEditSelectedRoomId(null) : undefined}
      >
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#3d3a36" roughness={0.8} />
      </mesh>

      {effectiveRooms.map((room) => (
        <Room key={room.id} room={room} />
      ))}

      <Walls />
      <AllFurniture />

      <ChargingStation />
      <Robot />
      <PetCat />
      <VisitorNPC />
      <VisitorSystem />
      <SeasonalDecorations />
      <WeatherEffects />
    </>
  );
}
