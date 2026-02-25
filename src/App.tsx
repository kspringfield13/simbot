import { Canvas } from '@react-three/fiber';
import { GameUI } from './components/game/GameUI';
import { HomeScene } from './components/scene/HomeScene';
import { RobotTerminal } from './components/ui/RobotTerminal';

function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
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

      <RobotTerminal />
      <GameUI />
    </div>
  );
}

export default App;
