import { Canvas } from '@react-three/fiber';
import { HomeScene } from './components/HomeScene';
import { RoomLabels } from './components/RoomLabels';
import { VoicePanel } from './components/VoicePanel';
import { TaskBar } from './components/TaskBar';

function App() {
  return (
    <div className="h-screen w-screen bg-[#0a0a1a] flex flex-col md:flex-row overflow-hidden">
      {/* Voice Panel - sidebar on desktop, bottom sheet on mobile */}
      <div className="order-2 md:order-1 w-full md:w-80 h-[40vh] md:h-full bg-gray-950/95 border-t md:border-t-0 md:border-r border-cyan-900/30 flex flex-col">
        <VoicePanel />
      </div>

      {/* 3D Viewport */}
      <div className="order-1 md:order-2 flex-1 relative h-[60vh] md:h-full">
        <Canvas
          shadows
          camera={{ position: [0, 18, 10], fov: 45 }}
          gl={{ antialias: true }}
        >
          <HomeScene />
          <RoomLabels />
        </Canvas>

        {/* Room legend overlay */}
        <div className="absolute top-3 right-3 bg-gray-950/80 backdrop-blur rounded-lg px-3 py-2 border border-cyan-900/30">
          <h3 className="text-cyan-400 text-xs font-bold mb-1">ROOMS</h3>
          <div className="space-y-0.5 text-[10px] text-gray-400">
            <div>🛋 Living Room</div>
            <div>🍳 Kitchen</div>
            <div>🛏 Bedroom</div>
            <div>🚿 Bathroom</div>
          </div>
        </div>

        {/* Title */}
        <div className="absolute top-3 left-3 md:left-3">
          <h1 className="text-cyan-400 font-bold text-xl tracking-wider">
            SIM<span className="text-white">BOT</span>
          </h1>
          <p className="text-gray-600 text-[10px]">v1.0 • voice-controlled home simulation</p>
        </div>

        {/* Task bar */}
        <TaskBar />
      </div>
    </div>
  );
}

export default App;
