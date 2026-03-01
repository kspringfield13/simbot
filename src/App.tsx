import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { HomeScene } from './components/scene/HomeScene';
import { StreetView } from './components/scene/StreetView';
import { RobotTerminal } from './components/ui/RobotTerminal';
import { NeighborhoodPanel } from './components/ui/NeighborhoodPanel';
import { NeighborhoodMap } from './components/ui/NeighborhoodMap';
import { ShopPanel } from './components/ui/ShopPanel';
import { BudgetPanel } from './components/ui/BudgetPanel';
import { CoinAnimationOverlay } from './components/ui/CoinAnimation';
import { TaskProcessor } from './components/systems/TaskProcessor';
import { VisitTracker } from './components/systems/VisitTracker';
import { TimeBar } from './components/game/TimeBar';
import { SeasonToast } from './components/ui/SeasonToast';
import { useStore } from './stores/useStore';

function CameraToggle() {
  const cameraMode = useStore((s) => s.cameraMode);
  const setCameraMode = useStore((s) => s.setCameraMode);
  const isFollowing = cameraMode === 'follow';

  return (
    <button
      type="button"
      onClick={() => setCameraMode(isFollowing ? 'overview' : 'follow')}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-black/70"
      title={isFollowing ? 'Free camera' : 'Follow robot'}
    >
      {isFollowing ? '🔒' : '🔓'}
    </button>
  );
}

function NeighborhoodToggle() {
  const showPanel = useStore((s) => s.showNeighborhoodPanel);
  const setShowPanel = useStore((s) => s.setShowNeighborhoodPanel);
  const streetView = useStore((s) => s.streetView);
  const setStreetView = useStore((s) => s.setStreetView);
  const activeVisits = useStore((s) => s.activeVisits);

  return (
    <div className="pointer-events-auto flex gap-1">
      <button
        type="button"
        onClick={() => setShowPanel(!showPanel)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-black/70"
        title="Neighborhood panel"
      >
        🏘️
        {activeVisits.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[8px] font-bold text-white">
            {activeVisits.length}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => setStreetView(!streetView)}
        className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg backdrop-blur-md transition-all ${
          streetView
            ? 'border-cyan-400/40 bg-cyan-500/30 hover:bg-cyan-500/40'
            : 'border-white/10 bg-black/50 hover:bg-black/70'
        }`}
        title={streetView ? 'Go inside' : 'Street view'}
      >
        🛣️
      </button>
    </div>
  );
}

function EconomyButtons() {
  const coins = useStore((s) => s.coins);
  const setShowShop = useStore((s) => s.setShowShop);
  const setShowBudgetPanel = useStore((s) => s.setShowBudgetPanel);

  return (
    <div className="pointer-events-auto flex items-center gap-1">
      {/* Coin balance badge */}
      <button
        type="button"
        onClick={() => setShowBudgetPanel(true)}
        className="flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-black/60 px-3 py-2 backdrop-blur-md transition-all hover:bg-black/80"
        title="Household budget"
      >
        <span className="text-sm">🪙</span>
        <span className="text-sm font-bold text-yellow-300">{coins}</span>
      </button>
      {/* Shop button */}
      <button
        type="button"
        onClick={() => setShowShop(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-black/70"
        title="SimCoin Shop"
      >
        🛍️
      </button>
    </div>
  );
}

function App() {
  const streetView = useStore((s) => s.streetView);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <Canvas
        shadows
        camera={{ position: [0, 20, 20], fov: 50, near: 0.1, far: 500 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          {streetView ? <StreetView /> : <HomeScene />}
        </Suspense>
      </Canvas>

      <TaskProcessor />
      <VisitTracker />
      <TimeBar />
      <SeasonToast />
      <RobotTerminal />
      <NeighborhoodPanel />
      <NeighborhoodMap />
      <ShopPanel />
      <BudgetPanel />
      <CoinAnimationOverlay />
      <div className="pointer-events-none fixed right-4 top-4 z-30 flex gap-2" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}>
        <EconomyButtons />
        <NeighborhoodToggle />
        <CameraToggle />
      </div>
    </div>
  );
}

export default App;
