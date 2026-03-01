import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { HomeScene } from './components/scene/HomeScene';
import { StreetView } from './components/scene/StreetView';
import { RobotTerminal } from './components/ui/RobotTerminal';
import { NeighborhoodPanel } from './components/ui/NeighborhoodPanel';
import { NeighborhoodMap } from './components/ui/NeighborhoodMap';
import { ShopPanel } from './components/ui/ShopPanel';
import { BudgetPanel } from './components/ui/BudgetPanel';
import { CoinAnimationOverlay } from './components/ui/CoinAnimation';
import { CommunityGallery } from './components/ui/CommunityGallery';
import { EvolutionPanel } from './components/ui/EvolutionPanel';
import { TaskProcessor } from './components/systems/TaskProcessor';
import { VisitTracker } from './components/systems/VisitTracker';
import { TimeBar } from './components/game/TimeBar';
import { SeasonToast } from './components/ui/SeasonToast';
import { useStore } from './stores/useStore';
import { getShareFromUrl, decodeShareable, clearShareFromUrl, saveSharedCreation } from './utils/sharing';
import { saveFloorPlanId } from './config/floorPlans';
import { saveCustomFloorPlan } from './utils/proceduralFloorPlan';
import type { FloorPlanPreset } from './config/floorPlans';
import type { CustomRobot } from './config/crafting';

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
      {isFollowing ? '\u{1F512}' : '\u{1F513}'}
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
        {'\u{1F3D8}\uFE0F'}
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
        {'\u{1F6E3}\uFE0F'}
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
        <span className="text-sm">{'\u{1FA99}'}</span>
        <span className="text-sm font-bold text-yellow-300">{coins}</span>
      </button>
      {/* Shop button */}
      <button
        type="button"
        onClick={() => setShowShop(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-black/70"
        title="SimCoin Shop"
      >
        {'\u{1F6CD}\uFE0F'}
      </button>
    </div>
  );
}

function EvolutionButton() {
  const setShowEvolutionPanel = useStore((s) => s.setShowEvolutionPanel);

  return (
    <button
      type="button"
      onClick={() => setShowEvolutionPanel(true)}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-black/70"
      title="Robot Evolution"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    </button>
  );
}

function CommunityButton() {
  const setShowCommunityGallery = useStore((s) => s.setShowCommunityGallery);

  return (
    <button
      type="button"
      onClick={() => setShowCommunityGallery(true)}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-black/70"
      title="Community Gallery - Share & browse"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    </button>
  );
}

/** Handle ?share= URL parameter on mount */
function ShareImporter() {
  const addNotification = useStore((s) => s.addNotification);

  useEffect(() => {
    const encoded = getShareFromUrl();
    if (!encoded) return;

    const content = decodeShareable(encoded);
    clearShareFromUrl();

    if (!content) {
      addNotification({ type: 'warning', title: 'Invalid Share Link', message: 'The shared content could not be decoded.' });
      return;
    }

    if (content.type === 'floor-plan') {
      const plan = content.data as FloorPlanPreset;
      const id = `shared-${Date.now()}`;
      const savedPlan = { ...plan, id };
      saveCustomFloorPlan(savedPlan);
      saveFloorPlanId(savedPlan.id);
      useStore.setState({ floorPlanId: savedPlan.id });
      saveSharedCreation({
        id,
        type: 'floor-plan',
        name: content.name,
        sharedAt: new Date().toISOString(),
        content,
      });
      addNotification({ type: 'success', title: 'Floor Plan Imported', message: `"${content.name}" loaded. Refresh to see changes.` });
    } else if (content.type === 'robot-build') {
      const robot = content.data as CustomRobot;
      const newRobot = { ...robot, id: `imported-${Date.now()}`, deployed: false };
      const existing = useStore.getState().customRobots;
      useStore.setState({ customRobots: [...existing, newRobot] });
      try {
        const craftingRaw = localStorage.getItem('simbot-crafting');
        const crafting = craftingRaw ? JSON.parse(craftingRaw) : { ownedParts: [], customRobots: [] };
        crafting.customRobots = [...(crafting.customRobots || []), newRobot];
        localStorage.setItem('simbot-crafting', JSON.stringify(crafting));
      } catch { /* ignore */ }
      saveSharedCreation({
        id: newRobot.id,
        type: 'robot-build',
        name: content.name,
        sharedAt: new Date().toISOString(),
        content,
      });
      addNotification({ type: 'success', title: 'Robot Build Imported', message: `"${content.name}" added to your crafting panel.` });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
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
      <ShareImporter />
      <TimeBar />
      <SeasonToast />
      <RobotTerminal />
      <NeighborhoodPanel />
      <NeighborhoodMap />
      <ShopPanel />
      <BudgetPanel />
      <CoinAnimationOverlay />
      <CommunityGallery />
      <EvolutionPanel />
      <div className="pointer-events-none fixed right-4 top-4 z-30 flex gap-2" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}>
        <EconomyButtons />
        <EvolutionButton />
        <CommunityButton />
        <NeighborhoodToggle />
        <CameraToggle />
      </div>
    </div>
  );
}

export default App;
