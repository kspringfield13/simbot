import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getEffectiveRooms } from '../../utils/homeLayout';
import { getFloorPlan } from '../../config/floorPlans';
import { useStore } from '../../stores/useStore';
import { AIBrain } from '../../systems/AIBrain';
import { ROBOT_IDS } from '../../types';
import { TimeSystem, getTimeLighting } from '../../systems/TimeSystem';
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
import { DisasterEffects } from './DisasterEffects';
import { RoomThemeEffects } from './RoomThemeEffects';
import { ChargingStation } from './ChargingStation';
import { SmartDevices } from './SmartDevices';
import { YardDecorations } from './YardDecorations';
import { OutsideNPCs } from './OutsideNPCs';
import { RobotPetsScene } from './RobotPets';

function DynamicSceneLighting() {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    const simMinutes = useStore.getState().simMinutes;
    const lighting = getTimeLighting(simMinutes);

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, lighting.ambientIntensity * 2.2, 0.03);
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = THREE.MathUtils.lerp(hemiRef.current.intensity, lighting.ambientIntensity * 1.4, 0.03);
      hemiRef.current.color.lerp(new THREE.Color(lighting.hemisphereColor), 0.03);
    }
    if (sunRef.current) {
      sunRef.current.intensity = THREE.MathUtils.lerp(sunRef.current.intensity, lighting.sunIntensity, 0.03);
      sunRef.current.color.lerp(new THREE.Color(lighting.sunColor), 0.03);
      sunRef.current.position.set(lighting.sunPosition[0], lighting.sunPosition[1], lighting.sunPosition[2]);
    }
    if (fillRef.current) {
      fillRef.current.intensity = THREE.MathUtils.lerp(fillRef.current.intensity, lighting.sunIntensity * 0.25, 0.03);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.7} />
      <hemisphereLight ref={hemiRef} color="#ffffff" groundColor="#8888aa" intensity={0.4} />
      <directionalLight ref={sunRef} position={[10, 25, 10]} intensity={1.0} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-far={60} shadow-camera-left={-25} shadow-camera-right={25}
        shadow-camera-top={25} shadow-camera-bottom={-25}
      />
      <directionalLight ref={fillRef} position={[-8, 15, -5]} intensity={0.3} />
    </>
  );
}

function DynamicCeilingLights({ lights }: { lights: { position: [number, number, number]; intensity: number; color: string; distance: number }[] }) {
  const lightsRef = useRef<(THREE.PointLight | null)[]>([]);

  useFrame(() => {
    const period = useStore.getState().simPeriod;
    const nightMult = period === 'night' ? 0.15 : period === 'evening' ? 0.6 : 1.0;

    for (let i = 0; i < lights.length; i++) {
      const light = lightsRef.current[i];
      if (light) {
        const target = lights[i].intensity * nightMult;
        light.intensity = THREE.MathUtils.lerp(light.intensity, target, 0.04);
      }
    }
  });

  return (
    <>
      {lights.map((light, i) => (
        <pointLight
          key={`light-${i}`}
          ref={(el) => { lightsRef.current[i] = el; }}
          position={light.position}
          intensity={light.intensity}
          color={light.color}
          distance={light.distance}
          decay={2}
        />
      ))}
    </>
  );
}

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

      <DynamicSceneLighting />
      <DynamicCeilingLights lights={plan.lights} />

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
      <YardDecorations />
      <OutsideNPCs />
      <RobotPetsScene />
      <RoomThemeEffects rooms={effectiveRooms} />
      <WeatherEffects />
      <DisasterEffects />
    </>
  );
}
