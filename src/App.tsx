import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { getEffectiveRooms } from './utils/homeLayout';
import { useStore } from './stores/useStore';
import { Room } from './components/scene/Room';
import { Walls } from './components/scene/Walls';
import { Robot } from './components/scene/Robot';
import { RobotTerminal } from './components/ui/RobotTerminal';
import { TaskProcessor } from './components/systems/TaskProcessor';
import { AIBrain } from './systems/AIBrain';
import { TimeSystem } from './systems/TimeSystem';
import { CameraController } from './components/camera/CameraController';
import { ROBOT_IDS } from './types';

function MinimalHomeScene() {
  const roomLayout = useStore((s) => s.roomLayout);
  const floorPlanId = useStore((s) => s.floorPlanId);

  const effectiveRooms = getEffectiveRooms(
    roomLayout.overrides, roomLayout.addedRooms, roomLayout.deletedRoomIds, floorPlanId,
  );

  return (
    <>
      <TimeSystem />
      {ROBOT_IDS.map((id) => (
        <AIBrain key={id} robotId={id} />
      ))}
      <CameraController />

      <ambientLight intensity={0.8} />
      <hemisphereLight color="#ffffff" groundColor="#8888aa" intensity={0.5} />
      <directionalLight position={[10, 25, 10]} intensity={1.0} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-far={60} shadow-camera-left={-25} shadow-camera-right={25}
        shadow-camera-top={25} shadow-camera-bottom={-25}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#3d3a36" roughness={0.8} />
      </mesh>

      {effectiveRooms.map((room) => (
        <Room key={room.id} room={room} />
      ))}
      <Walls />
      <Robot />
    </>
  );
}

function CameraToggle() {
  const cameraMode = useStore((s) => s.cameraMode);
  const setCameraMode = useStore((s) => s.setCameraMode);
  return (
    <button
      type="button"
      onClick={() => setCameraMode(cameraMode === 'follow' ? 'overview' : 'follow')}
      style={{
        position: 'fixed', top: 16, right: 16, zIndex: 30,
        width: 44, height: 44, borderRadius: '50%',
        background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
        color: 'white', fontSize: 20, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {cameraMode === 'follow' ? '🔒' : '🔓'}
    </button>
  );
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas
        shadows
        camera={{ position: [0, 20, 20], fov: 50, near: 0.1, far: 500 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <MinimalHomeScene />
        </Suspense>
      </Canvas>
      <TaskProcessor />
      <RobotTerminal />
      <CameraToggle />
    </div>
  );
}

export default App;
