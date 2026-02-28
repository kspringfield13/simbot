import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback } from 'react';
import { HomeScene } from './components/scene/HomeScene';
import { RobotTerminal } from './components/ui/RobotTerminal';
import { RobotScreenTracker } from './components/ui/ReactionsOverlay';
import { EmojiReaction } from './components/ui/EmojiReaction';
import { ScreenshotModal } from './components/ui/ScreenshotModal';
import { TaskProcessor } from './components/systems/TaskProcessor';
import { ScheduleSystem } from './components/systems/ScheduleSystem';
import { VisitorToast } from './components/ui/VisitorToast';
import { ChatPanel } from './components/ui/ChatPanel';
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

function ScreenshotButton() {
  const setScreenshotMode = useStore((s) => s.setScreenshotMode);
  const setScreenshotData = useStore((s) => s.setScreenshotData);

  const takeScreenshot = useCallback(() => {
    // Hide overlays
    setScreenshotMode(true);

    // Wait a frame for overlays to unmount, then capture
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png');
          setScreenshotData(dataUrl);
        }
        setScreenshotMode(false);
      });
    });
  }, [setScreenshotMode, setScreenshotData]);

  return (
    <button
      type="button"
      onClick={takeScreenshot}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-black/70"
      title="Take screenshot"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    </button>
  );
}

function RearrangeButton() {
  const rearrangeMode = useStore((s) => s.rearrangeMode);
  const setRearrangeMode = useStore((s) => s.setRearrangeMode);

  return (
    <button
      type="button"
      onClick={() => setRearrangeMode(!rearrangeMode)}
      className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border text-lg backdrop-blur-md transition-all ${
        rearrangeMode
          ? 'border-green-400/50 bg-green-500/30 hover:bg-green-500/50'
          : 'border-white/10 bg-black/50 hover:bg-black/70'
      }`}
      title={rearrangeMode ? 'Exit rearrange mode' : 'Rearrange furniture'}
    >
      🪑
    </button>
  );
}

function ResetFurnitureButton() {
  const rearrangeMode = useStore((s) => s.rearrangeMode);
  const resetFurnitureLayout = useStore((s) => s.resetFurnitureLayout);

  if (!rearrangeMode) return null;

  return (
    <button
      type="button"
      onClick={() => resetFurnitureLayout()}
      className="pointer-events-auto flex h-10 items-center justify-center rounded-full border border-red-400/30 bg-black/50 px-3 text-xs text-red-300 backdrop-blur-md transition-all hover:bg-red-500/30"
      title="Reset all furniture to default positions"
    >
      Reset
    </button>
  );
}

function App() {
  const screenshotMode = useStore((s) => s.screenshotMode);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <Canvas
        shadows
        camera={{ position: [0, 20, 20], fov: 50, near: 0.1, far: 500 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <HomeScene />
        </Suspense>
        <RobotScreenTracker />
      </Canvas>

      <TaskProcessor />
      <ScheduleSystem />

      {/* Hide all overlays during screenshot capture */}
      {!screenshotMode && (
        <>
          <RobotTerminal />
          <EmojiReaction />
          <div
            className="pointer-events-none fixed right-4 top-4 z-30 flex gap-2"
            style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <ResetFurnitureButton />
            <RearrangeButton />
            <ScreenshotButton />
            <CameraToggle />
          </div>
        </>
      )}

      <VisitorToast />
      <ScreenshotModal />
      {!screenshotMode && <ChatPanel />}
    </div>
  );
}

export default App;
