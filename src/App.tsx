import { Canvas } from '@react-three/fiber';
import { HomeScene } from './components/scene/HomeScene';
import { RobotTerminal } from './components/ui/RobotTerminal';
import { StatsPanel } from './components/ui/StatsPanel';
import { TaskProcessor } from './components/systems/TaskProcessor';
import { useAmbientSounds } from './hooks/useAmbientSounds';

function AmbientSounds() {
  useAmbientSounds();
  return null;
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
      <StatsPanel />
    </div>
  );
}

export default App;
