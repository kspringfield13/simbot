import { Canvas } from '@react-three/fiber';
import { HomeScene } from './components/HomeScene';
import { RoomLabels } from './components/RoomLabels';
import { VoicePanel } from './components/VoicePanel';
import { TaskBar } from './components/TaskBar';
import { useStore } from './stores/useStore';
import type { CameraMode } from './stores/useStore';

const cameraModes: { mode: CameraMode; icon: string; label: string }[] = [
  { mode: 'overview', icon: '🏠', label: 'Overview' },
  { mode: 'third-person', icon: '🎬', label: 'Follow' },
  { mode: 'first-person', icon: '👁', label: 'POV' },
];

function App() {
  const cameraMode = useStore((s) => s.cameraMode);
  const setCameraMode = useStore((s) => s.setCameraMode);
  const robotState = useStore((s) => s.robotState);

  return (
    <div className="h-screen w-screen bg-[#080810] flex flex-col md:flex-row overflow-hidden select-none">
      {/* Sidebar — chat & controls */}
      <div className="order-2 md:order-1 w-full md:w-80 lg:w-96 h-[38vh] md:h-full bg-[#0c0c18]/95 backdrop-blur-xl border-t md:border-t-0 md:border-r border-white/5 flex flex-col">
        <VoicePanel />
      </div>

      {/* 3D Viewport */}
      <div className="order-1 md:order-2 flex-1 relative h-[62vh] md:h-full touch-none">
        <Canvas
          shadows="soft"
          camera={{ position: [0, 16, 12], fov: 42 }}
          gl={{
            antialias: true,
            toneMapping: 3, // ACESFilmic
            toneMappingExposure: 1.1,
          }}
          dpr={[1, 2]}
        >
          <HomeScene />
          <RoomLabels />
        </Canvas>

        {/* Top bar — title + status */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 pointer-events-none">
          <div>
            <h1 className="text-white/90 font-semibold text-lg tracking-wide">
              SIM<span className="text-cyan-400">BOT</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${robotState === 'idle' ? 'bg-green-400' : robotState === 'walking' ? 'bg-yellow-400 animate-pulse' : 'bg-cyan-400 animate-pulse'}`} />
              <span className="text-[10px] text-white/40 uppercase tracking-wider">
                {robotState === 'idle' ? 'Standing by' : robotState === 'walking' ? 'Moving' : 'Working'}
              </span>
            </div>
          </div>
        </div>

        {/* Camera mode pills — compact horizontal on mobile, vertical on desktop */}
        <div className="absolute top-3 right-3 pointer-events-auto">
          <div className="flex md:flex-col gap-1 bg-black/40 backdrop-blur-md rounded-xl p-1 border border-white/5">
            {cameraModes.map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setCameraMode(mode)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  cameraMode === mode
                    ? 'bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-500/10'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <span className="text-xs">{icon}</span>
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Room legend — subtle, bottom right */}
        <div className="absolute bottom-16 right-3 pointer-events-none">
          <div className="flex md:flex-col gap-2 md:gap-1 text-[9px] text-white/25 font-mono">
            <span>🛋 Living</span>
            <span>🍳 Kitchen</span>
            <span>🛏 Bedroom</span>
            <span>🚿 Bath</span>
          </div>
        </div>

        {/* Task bar */}
        <TaskBar />
      </div>
    </div>
  );
}

export default App;
