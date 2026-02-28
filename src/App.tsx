import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback, useState } from 'react';
import { HomeScene } from './components/scene/HomeScene';
import { PhotoModeEffects } from './components/scene/PhotoModeEffects';
import { RobotTerminal } from './components/ui/RobotTerminal';
import { RobotScreenTracker } from './components/ui/ReactionsOverlay';
import { EmojiReaction } from './components/ui/EmojiReaction';
import { ScreenshotModal } from './components/ui/ScreenshotModal';
import { PhotoModeOverlay } from './components/ui/PhotoModeOverlay';
import { TutorialOverlay } from './components/ui/TutorialOverlay';
import { TaskProcessor } from './components/systems/TaskProcessor';
import { ScheduleSystem } from './components/systems/ScheduleSystem';
import { BatterySystem } from './components/systems/BatterySystem';
import { MusicSystem } from './components/systems/MusicSystem';
import { VisitorToast } from './components/ui/VisitorToast';
import { ChatPanel } from './components/ui/ChatPanel';
import { BatteryIndicator } from './components/ui/BatteryIndicator';
import { useStore } from './stores/useStore';
import { musicEngine } from './systems/MusicEngine';

function MusicToggle() {
  const musicEnabled = useStore((s) => s.musicEnabled);
  const setMusicEnabled = useStore((s) => s.setMusicEnabled);
  const genreLabel = useStore((s) => s.musicGenreLabel);

  const toggle = useCallback(() => {
    const nowEnabled = musicEngine.toggle();
    setMusicEnabled(nowEnabled);
  }, [setMusicEnabled]);

  return (
    <div className="pointer-events-auto flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggle}
        className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg backdrop-blur-md transition-all ${
          musicEnabled
            ? 'border-purple-400/50 bg-purple-500/30 hover:bg-purple-500/50'
            : 'border-white/10 bg-black/50 hover:bg-black/70'
        }`}
        title={musicEnabled ? 'Mute music' : 'Play music'}
      >
        🎵
      </button>
      {musicEnabled && genreLabel && (
        <span className="whitespace-nowrap rounded-full border border-purple-400/30 bg-black/60 px-2.5 py-1 text-[11px] text-purple-200 backdrop-blur-md">
          {genreLabel}
        </span>
      )}
    </div>
  );
}

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

function PhotoModeButton() {
  const setPhotoMode = useStore((s) => s.setPhotoMode);

  return (
    <button
      type="button"
      onClick={() => setPhotoMode(true)}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-black/70"
      title="Photo mode"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <circle cx="12" cy="10" r="3.5" />
        <circle cx="18" cy="6" r="1" fill="currentColor" />
        <line x1="2" y1="20" x2="7" y2="17" />
        <line x1="22" y1="20" x2="17" y2="17" />
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

function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-sm font-bold text-white/60 backdrop-blur-md transition-all hover:bg-black/70 hover:text-white/90"
      title="Show tutorial"
    >
      ?
    </button>
  );
}

function App() {
  const screenshotMode = useStore((s) => s.screenshotMode);
  const photoMode = useStore((s) => s.photoMode);
  const [showTutorial, setShowTutorial] = useState(false);

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
        <MusicSystem />
        <RobotScreenTracker />
        <PhotoModeEffects />
      </Canvas>

      <TaskProcessor />
      <ScheduleSystem />
      <BatterySystem />

      {/* Hide all overlays during screenshot capture or photo mode */}
      {!screenshotMode && !photoMode && (
        <>
          <RobotTerminal />
          <EmojiReaction />
          <div
            className="pointer-events-none fixed right-4 top-4 z-30 flex gap-2"
            style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <MusicToggle />
            <ResetFurnitureButton />
            <RearrangeButton />
            <PhotoModeButton />
            <ScreenshotButton />
            <CameraToggle />
            <HelpButton onClick={() => setShowTutorial(true)} />
          </div>
        </>
      )}

      <VisitorToast />
      <ScreenshotModal />
      {!screenshotMode && !photoMode && <ChatPanel />}
      {!screenshotMode && !photoMode && <BatteryIndicator />}

      <PhotoModeOverlay />
      <TutorialOverlay forceOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
}

export default App;
