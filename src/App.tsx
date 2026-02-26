import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { HomeScene } from './components/scene/HomeScene';
import { RobotTerminal } from './components/ui/RobotTerminal';
import { TaskProcessor } from './components/systems/TaskProcessor';
import { useStore } from './stores/useStore';

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
      <Canvas
        shadows
        camera={{ position: [0, 20, 20], fov: 50, near: 0.1, far: 500 }}
        gl={{
          antialias: true,
          toneMapping: 3,
          toneMappingExposure: 1.2,
        }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          console.log('[Canvas] WebGL context created', gl.info);
        }}
      >
        <Suspense fallback={null}>
          <HomeScene />
        </Suspense>
      </Canvas>

      <TaskProcessor />
      <RobotTerminal />
      <CameraToggle />
    </div>
  );
}

export default App;
