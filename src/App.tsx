import { Canvas } from '@react-three/fiber';
import { HomeScene } from './components/scene/HomeScene';
import { RobotTerminal } from './components/ui/RobotTerminal';
import { TaskProcessor } from './components/systems/TaskProcessor';
import { useAmbientSounds } from './hooks/useAmbientSounds';
import { useStore } from './stores/useStore';

function AmbientSounds() {
  useAmbientSounds();
  return null;
}

function CameraToggle() {
  const cameraMode = useStore((s) => s.cameraMode);
  const setCameraMode = useStore((s) => s.setCameraMode);
  const isFollowing = cameraMode === 'follow';

  return (
    <button
      type="button"
      onClick={() => setCameraMode(isFollowing ? 'overview' : 'follow')}
      className="pointer-events-auto fixed right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-black/70"
      style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
      title={isFollowing ? 'Free camera' : 'Follow robot'}
    >
      {isFollowing ? '🔒' : '🔓'}
    </button>
  );
}

function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <AmbientSounds />
      <Canvas
        shadows="soft"
        camera={{ position: [28, 32, 28], fov: 48, near: 0.1, far: 250 }}
        gl={{
          antialias: true,
          toneMapping: 3,
          toneMappingExposure: 1.1,
        }}
        dpr={[1, 2]}
      >
        <HomeScene />
      </Canvas>

      <TaskProcessor />
      <RobotTerminal />
      <CameraToggle />
    </div>
  );
}

export default App;
