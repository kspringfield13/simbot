import { useMemo } from 'react';
import { getEffectiveRooms } from '../../utils/homeLayout';
import { getFloorPlan } from '../../config/floorPlans';
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
import { SmartDevices } from './SmartDevices';

export function HomeScene() {
  const roomLayout = useStore((s) => s.roomLayout);
  const editMode = useStore((s) => s.editMode);
  const floorPlanId = useStore((s) => s.floorPlanId);

  const plan = useMemo(() => getFloorPlan(floorPlanId), [floorPlanId]);

  const effectiveRooms = useMemo(
    () => getEffectiveRooms(roomLayout.overrides, roomLayout.addedRooms, roomLayout.deletedRoomIds, floorPlanId),
    [roomLayout, floorPlanId],
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

      {/* Room ceiling lights — warm per-room ambiance (dynamic per floor plan) */}
      {plan.lights.map((light, i) => (
        <pointLight
          key={`light-${i}`}
          position={light.position}
          intensity={light.intensity}
          color={light.color}
          distance={light.distance}
          decay={2}
        />
      ))}

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
      <SmartDevices />
      <Robot />
      <PetCat />
      <VisitorNPC />
      <VisitorSystem />
      <SeasonalDecorations />
      <WeatherEffects />
    </>
  );
}
