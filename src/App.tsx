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
import { SeasonToast } from './components/ui/SeasonToast';
import { ChatPanel } from './components/ui/ChatPanel';
import { BatteryIndicator } from './components/ui/BatteryIndicator';
import { ShareButton } from './components/ui/ShareButton';
import { SpectatorBadge } from './components/ui/SpectatorBadge';
import { ShopPanel } from './components/ui/ShopPanel';
import { CraftingPanel } from './components/ui/CraftingPanel';
import { DevicePanel } from './components/ui/DevicePanel';
import { DiaryPanel } from './components/ui/DiaryPanel';
import { FloorPlanSelector } from './components/ui/FloorPlanSelector';
import { LeaderboardPanel } from './components/ui/LeaderboardPanel';
import { PersonalityPanel } from './components/ui/PersonalityPanel';
import { LeaderboardTracker } from './components/systems/LeaderboardTracker';
import { PersonalityTracker } from './components/systems/PersonalityTracker';
import { HomeEventTracker } from './components/systems/HomeEventTracker';
import { DisasterTracker } from './components/systems/DisasterTracker';
import { SocialTracker } from './components/systems/SocialTracker';
import { EventBanner } from './components/ui/EventBanner';
import { DisasterBanner } from './components/ui/DisasterBanner';
import { SocialPanel, SocialButton } from './components/ui/SocialPanel';
import { TimelapsePanel, TimelapseButton } from './components/ui/TimelapsePanel';
import { TimelapseRecorder } from './components/systems/TimelapseRecorder';
import { InstallPrompt } from './components/ui/InstallPrompt';
import { AccessibilityPanel } from './components/ui/AccessibilityPanel';
import { ScreenReaderAnnouncer } from './components/ui/ScreenReaderAnnouncer';
import { DecoratePanel } from './components/ui/DecoratePanel';
import { TaskTimelinePanel, TimelineButton } from './components/ui/TaskTimelinePanel';
import { NotificationSystem } from './components/ui/NotificationSystem';
import { NotificationTracker } from './components/systems/NotificationTracker';
import { StatsPanel } from './components/ui/StatsPanel';
import { CameraPresetsPanel } from './components/ui/CameraPresetsPanel';
import { SkillTreePanel } from './components/ui/SkillTreePanel';
import { ThemeSelectorPanel } from './components/ui/ThemeSelectorPanel';
import { PetPanel } from './components/ui/PetPanel';
import { ChallengePanel, ChallengeTimer, ChallengeResultsModal } from './components/ui/ChallengePanel';
import { ChallengeSystem } from './components/systems/ChallengeSystem';
import { FurnitureCraftingSystem } from './components/systems/FurnitureCraftingSystem';
import { FurnitureCraftingPanel } from './components/ui/FurnitureCraftingPanel';
import { SecurityTracker } from './components/systems/SecurityTracker';
import { StoryDirectorTracker } from './components/systems/StoryDirectorTracker';
import { SecurityPanel } from './components/ui/SecurityPanel';
import { EvolutionPanel } from './components/ui/EvolutionPanel';
import { SmartSchedulePanel } from './components/ui/SmartSchedulePanel';
import { SmartScheduleTracker } from './components/systems/SmartScheduleTracker';
import { MiniGamesPanel } from './components/ui/MiniGamesPanel';
import { CookingMiniGame } from './components/ui/CookingMiniGame';
import { RepairMiniGame } from './components/ui/RepairMiniGame';
import { GardenMiniGame } from './components/ui/GardenMiniGame';
import { MiniGameTrigger } from './components/systems/MiniGameTrigger';
import { FloorSelector } from './components/ui/FloorSelector';
import { INTRUDER_CONFIGS, type IntruderType } from './config/security';
import { useStore } from './stores/useStore';
import { useAccessibility } from './stores/useAccessibility';
import { musicEngine } from './systems/MusicEngine';
import { moodMusicEngine } from './systems/MoodMusicEngine';
import { MoodMusicSystem } from './components/systems/MoodMusicSystem';
import { useSpectatorHost, useSpectatorViewer } from './hooks/useSpectator';

function ColorblindFilters() {
  return (
    <svg className="sr-only" aria-hidden="true">
      <defs>
        <filter id="cb-protanopia">
          <feColorMatrix type="matrix" values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0" />
        </filter>
        <filter id="cb-deuteranopia">
          <feColorMatrix type="matrix" values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0" />
        </filter>
        <filter id="cb-tritanopia">
          <feColorMatrix type="matrix" values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0" />
        </filter>
      </defs>
    </svg>
  );
}

function AccessibilityButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-black/70"
      title="Accessibility settings"
      aria-label="Accessibility settings"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <circle cx="12" cy="4.5" r="2.5" />
        <path d="M12 7v6" />
        <path d="M8 21l4-8 4 8" />
        <path d="M6 12h12" />
      </svg>
    </button>
  );
}

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

function MoodMusicToggle() {
  const moodMusicEnabled = useStore((s) => s.moodMusicEnabled);
  const setMoodMusicEnabled = useStore((s) => s.setMoodMusicEnabled);
  const moodLabel = useStore((s) => s.moodMusicLabel);

  const toggle = useCallback(() => {
    const nowEnabled = moodMusicEngine.toggle();
    setMoodMusicEnabled(nowEnabled);
  }, [setMoodMusicEnabled]);

  return (
    <div className="pointer-events-auto flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggle}
        className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg backdrop-blur-md transition-all ${
          moodMusicEnabled
            ? 'border-teal-400/50 bg-teal-500/30 hover:bg-teal-500/50'
            : 'border-white/10 bg-black/50 hover:bg-black/70'
        }`}
        title={moodMusicEnabled ? 'Mute mood music' : 'Play mood music'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </button>
      {moodMusicEnabled && moodLabel && (
        <span className="whitespace-nowrap rounded-full border border-teal-400/30 bg-black/60 px-2.5 py-1 text-[11px] text-teal-200 backdrop-blur-md">
          {moodLabel}
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

function CameraPresetsButton() {
  const setShow = useStore((s) => s.setShowCameraPresets);
  const autoTourActive = useStore((s) => s.autoTourActive);

  return (
    <button
      type="button"
      onClick={() => setShow(true)}
      className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border text-lg backdrop-blur-md transition-all ${
        autoTourActive
          ? 'border-amber-400/50 bg-amber-500/30 hover:bg-amber-500/50'
          : 'border-white/10 bg-black/50 hover:bg-black/70'
      }`}
      title="Camera presets"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${autoTourActive ? 'text-amber-300' : 'text-white'}`}>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </svg>
    </button>
  );
}

function ScreenshotButton() {
  const setScreenshotMode = useStore((s) => s.setScreenshotMode);
  const setScreenshotData = useStore((s) => s.setScreenshotData);

  const takeScreenshot = useCallback(() => {
    setScreenshotMode(true);
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

function DecorateButton() {
  const decorateMode = useStore((s) => s.decorateMode);
  const setDecorateMode = useStore((s) => s.setDecorateMode);

  return (
    <button
      type="button"
      onClick={() => setDecorateMode(!decorateMode)}
      className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border text-lg backdrop-blur-md transition-all ${
        decorateMode
          ? 'border-pink-400/50 bg-pink-500/30 hover:bg-pink-500/50'
          : 'border-white/10 bg-black/50 hover:bg-black/70'
      }`}
      title={decorateMode ? 'Exit decorate mode' : 'Decorate rooms'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <path d="M18.37 2.63a2.12 2.12 0 0 1 3 3L14 13l-4 1 1-4 7.37-7.37z" />
        <path d="M9 3.5H5a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h13.5a2 2 0 0 0 2-2V15" />
      </svg>
    </button>
  );
}

function DecorateResetButton() {
  const decorateMode = useStore((s) => s.decorateMode);
  const resetRoomDecorations = useStore((s) => s.resetRoomDecorations);

  if (!decorateMode) return null;

  return (
    <button
      type="button"
      onClick={() => resetRoomDecorations()}
      className="pointer-events-auto flex h-10 items-center justify-center rounded-full border border-red-400/30 bg-black/50 px-3 text-xs text-red-300 backdrop-blur-md transition-all hover:bg-red-500/30"
      title="Reset all room decorations"
    >
      Reset
    </button>
  );
}

function ThemeButton() {
  const setShow = useStore((s) => s.setShowThemeSelector);
  const globalTheme = useStore((s) => s.globalTheme);
  const isThemed = globalTheme !== 'default';

  return (
    <button
      type="button"
      onClick={() => setShow(true)}
      className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border text-lg backdrop-blur-md transition-all ${
        isThemed
          ? 'border-indigo-400/50 bg-indigo-500/30 hover:bg-indigo-500/50'
          : 'border-white/10 bg-black/50 hover:bg-black/70'
      }`}
      title="Room themes"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${isThemed ? 'text-indigo-300' : 'text-white'}`}>
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
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

function EditRoomsButton() {
  const editMode = useStore((s) => s.editMode);
  const setEditMode = useStore((s) => s.setEditMode);

  return (
    <button
      type="button"
      onClick={() => setEditMode(!editMode)}
      className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border text-lg backdrop-blur-md transition-all ${
        editMode
          ? 'border-blue-400/50 bg-blue-500/30 hover:bg-blue-500/50'
          : 'border-white/10 bg-black/50 hover:bg-black/70'
      }`}
      title={editMode ? 'Exit room editor' : 'Edit rooms'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    </button>
  );
}

function FloorPlanButton() {
  const setShow = useStore((s) => s.setShowFloorPlanSelector);

  return (
    <button
      type="button"
      onClick={() => setShow(true)}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-black/70"
      title="Choose floor plan"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    </button>
  );
}

function RoomEditorButtons() {
  const editMode = useStore((s) => s.editMode);
  const editSelectedRoomId = useStore((s) => s.editSelectedRoomId);
  const addNewRoom = useStore((s) => s.addNewRoom);
  const deleteEditRoom = useStore((s) => s.deleteEditRoom);
  const resetRoomLayout = useStore((s) => s.resetRoomLayout);

  if (!editMode) return null;

  return (
    <>
      <button
        type="button"
        onClick={addNewRoom}
        className="pointer-events-auto flex h-10 items-center gap-1 rounded-full border border-green-400/30 bg-black/50 px-3 text-xs text-green-300 backdrop-blur-md transition-all hover:bg-green-500/30"
        title="Add a new empty room"
      >
        + Add Room
      </button>
      {editSelectedRoomId && (
        <button
          type="button"
          onClick={() => deleteEditRoom(editSelectedRoomId)}
          className="pointer-events-auto flex h-10 items-center gap-1 rounded-full border border-red-400/30 bg-black/50 px-3 text-xs text-red-300 backdrop-blur-md transition-all hover:bg-red-500/30"
          title="Delete selected room"
        >
          Delete
        </button>
      )}
      <button
        type="button"
        onClick={resetRoomLayout}
        className="pointer-events-auto flex h-10 items-center gap-1 rounded-full border border-yellow-400/30 bg-black/50 px-3 text-xs text-yellow-300 backdrop-blur-md transition-all hover:bg-yellow-500/30"
        title="Reset all rooms to default layout"
      >
        Reset
      </button>
    </>
  );
}

function CoinDisplay() {
  const coins = useStore((s) => s.coins);

  return (
    <div className="pointer-events-none flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-black/50 px-3 py-2 backdrop-blur-md">
      <span className="text-sm">🪙</span>
      <span className="text-sm font-bold text-yellow-300">{coins}</span>
    </div>
  );
}

function ShopButton() {
  const setShowShop = useStore((s) => s.setShowShop);

  return (
    <button
      type="button"
      onClick={() => setShowShop(true)}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-black/70"
      title="Robot Shop"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    </button>
  );
}

function CraftingButton() {
  const setShowCrafting = useStore((s) => s.setShowCrafting);
  const customRobotCount = useStore((s) => s.customRobots.length);

  return (
    <button
      type="button"
      onClick={() => setShowCrafting(true)}
      className="pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/30 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-cyan-400/20"
      title="Crafting Workshop"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-cyan-300">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
      {customRobotCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-400 px-1 text-[9px] font-bold text-black">
          {customRobotCount}
        </span>
      )}
    </button>
  );
}

function FurnitureCraftingButton() {
  const setShow = useStore((s) => s.setShowFurnitureCrafting);
  const activeCraft = useStore((s) => s.activeFurnitureCraft);
  const itemCount = useStore((s) => s.craftedFurniture.filter((i) => !i.placed).length);

  return (
    <button
      type="button"
      onClick={() => setShow(true)}
      className={`pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-full border text-lg backdrop-blur-md transition-all ${
        activeCraft
          ? 'border-amber-400/50 bg-amber-500/30 animate-pulse hover:bg-amber-500/50'
          : 'border-amber-400/30 bg-black/50 hover:bg-amber-400/20'
      }`}
      title="Furniture Workshop"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${activeCraft ? 'text-amber-300' : 'text-amber-400'}`}>
        <path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" />
        <path d="M17.64 15L22 10.64" />
        <path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91" />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-black">
          {itemCount}
        </span>
      )}
    </button>
  );
}

function SmartHomeButton() {
  const setShowDevicePanel = useStore((s) => s.setShowDevicePanel);

  return (
    <button
      type="button"
      onClick={() => setShowDevicePanel(true)}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-black/70"
      title="Smart Home"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    </button>
  );
}

function DiaryButton() {
  const setShowDiary = useStore((s) => s.setShowDiary);
  const entryCount = useStore((s) => {
    const rid = s.activeRobotId;
    return s.diaryEntries[rid]?.length ?? 0;
  });

  return (
    <button
      type="button"
      onClick={() => setShowDiary(true)}
      className="pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-black/70"
      title="Robot diary"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
      {entryCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-black">
          {entryCount}
        </span>
      )}
    </button>
  );
}

function PersonalityButton() {
  const setShowPersonality = useStore((s) => s.setShowPersonality);
  const traitCount = useStore((s) => {
    const rid = s.activeRobotId;
    const p = s.personalities[rid];
    if (!p || p.totalTasksDone < 3) return 0;
    const entries = Object.entries(p.taskCounts);
    if (entries.length === 0) return 0;
    return entries.filter(([, c]) => (c ?? 0) >= 2).length;
  });

  return (
    <button
      type="button"
      onClick={() => setShowPersonality(true)}
      className="pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-full border border-purple-400/30 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-purple-400/20"
      title="Robot personality"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-purple-300">
        <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <path d="M9 9h.01" />
        <path d="M15 9h.01" />
        <path d="M12 18v4" />
        <path d="M8 22h8" />
      </svg>
      {traitCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-purple-400 px-1 text-[9px] font-bold text-black">
          {traitCount}
        </span>
      )}
    </button>
  );
}

function SkillTreeButton() {
  const setShowSkillTree = useStore((s) => s.setShowSkillTree);
  const activeRobotId = useStore((s) => s.activeRobotId);
  const skillCount = useStore((s) => s.robotSkills[activeRobotId].unlockedSkills.length);

  return (
    <button
      type="button"
      onClick={() => setShowSkillTree(true)}
      className="pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/30 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-emerald-400/20"
      title="Skill tree"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-emerald-300">
        <path d="M12 22v-7" />
        <path d="M12 15c-2.5 0-5-1.5-5-5 0-2.5 1.5-4 3-5 .5-3 2-4 2-4s1.5 1 2 4c1.5 1 3 2.5 3 5 0 3.5-2.5 5-5 5z" />
        <path d="M8 9c-1-.5-2-.5-3 0" />
        <path d="M16 9c1-.5 2-.5 3 0" />
      </svg>
      {skillCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-400 px-1 text-[9px] font-bold text-black">
          {skillCount}
        </span>
      )}
    </button>
  );
}

function EvolutionButton() {
  const setShow = useStore((s) => s.setShowEvolutionPanel);
  const maxStage = useStore((s) => {
    let best = 0;
    const stageOrder = ['novice', 'apprentice', 'expert', 'master', 'legend'];
    for (const rid of ['sim', 'chef', 'sparkle'] as const) {
      const idx = stageOrder.indexOf(s.robotEvolutions[rid].stage);
      if (idx > best) best = idx;
    }
    return best;
  });
  const stageColors = ['#94a3b8', '#22d3ee', '#a78bfa', '#f59e0b', '#ef4444'];
  const color = stageColors[maxStage];

  return (
    <button
      type="button"
      onClick={() => setShow(true)}
      className="pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-full border bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-black/70"
      style={{ borderColor: `${color}50` }}
      title="Robot Evolution"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
      {maxStage > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-black"
          style={{ background: color }}
        >
          {maxStage}
        </span>
      )}
    </button>
  );
}

function SmartScheduleButton() {
  const setShow = useStore((s) => s.setShowSmartSchedule);
  const eventCount = useStore((s) => s.smartScheduleData.events.length);

  return (
    <button
      type="button"
      onClick={() => setShow(true)}
      className="pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-full border border-indigo-400/30 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-indigo-400/20"
      title="Smart Schedule AI"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-indigo-300">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      {eventCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-400 px-1 text-[9px] font-bold text-black">
          {eventCount > 99 ? '99+' : eventCount}
        </span>
      )}
    </button>
  );
}

function MiniGamesButton() {
  const setShow = useStore((s) => s.setShowMiniGames);

  return (
    <button
      type="button"
      onClick={() => setShow(true)}
      className="pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-full border border-violet-400/30 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-violet-400/20"
      title="Mini-Games"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-violet-300">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="8.5" cy="12" r="1.5" />
        <circle cx="15.5" cy="12" r="1.5" />
        <path d="M6 12h5" />
        <path d="M8.5 9.5v5" />
      </svg>
    </button>
  );
}

function TrophyButton() {
  const setShowLeaderboard = useStore((s) => s.setShowLeaderboard);
  const totalTasks = useStore((s) => s.totalTasksCompleted);

  return (
    <button
      type="button"
      onClick={() => setShowLeaderboard(true)}
      className="pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-full border border-yellow-400/30 bg-black/50 text-lg backdrop-blur-md transition-all hover:bg-yellow-400/20"
      title="Leaderboard"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-yellow-300">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
      {totalTasks > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-yellow-400 px-1 text-[9px] font-bold text-black">
          {totalTasks > 99 ? '99+' : totalTasks}
        </span>
      )}
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

function PetButton() {
  const setShowPetPanel = useStore((s) => s.setShowPetPanel);
  const avgHappiness = useStore((s) => Math.round((s.petStates.fish.happiness + s.petStates.hamster.happiness) / 2));

  return (
    <button
      type="button"
      onClick={() => setShowPetPanel(true)}
      className={`pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-full border text-lg backdrop-blur-md transition-all ${
        avgHappiness < 40
          ? 'border-orange-400/50 bg-orange-500/30 hover:bg-orange-500/50'
          : 'border-amber-400/30 bg-black/50 hover:bg-amber-400/20'
      }`}
      title="Robot Pets"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${avgHappiness < 40 ? 'text-orange-300' : 'text-amber-300'}`}>
        <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217 1.5 2 2 2s1.5-1 2-1 1.5 1 2 1 1.863-.783 2-2c.074-.65-.109-1.632-.5-2.5" />
        <path d="M14 5.172C14 3.782 15.577 2.679 17.5 3c2.823.47 4.113 6.006 4 7-.137 1.217-1.5 2-2 2s-1.5-1-2-1-1.5 1-2 1-1.863-.783-2-2c-.074-.65.109-1.632.5-2.5" />
        <path d="M8 14v.5" />
        <path d="M16 14v.5" />
        <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
        <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306" />
      </svg>
    </button>
  );
}

function ChallengeButton() {
  const setShowChallengePanel = useStore((s) => s.setShowChallengePanel);
  const activeChallenge = useStore((s) => s.activeChallenge);

  return (
    <button
      type="button"
      onClick={() => setShowChallengePanel(true)}
      disabled={!!activeChallenge}
      className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border text-lg backdrop-blur-md transition-all ${
        activeChallenge
          ? 'border-orange-400/50 bg-orange-500/30 animate-pulse'
          : 'border-orange-400/30 bg-black/50 hover:bg-orange-500/30'
      }`}
      title="Time Challenges"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${activeChallenge ? 'text-orange-300' : 'text-orange-400'}`}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    </button>
  );
}

function DisasterButton() {
  const triggerDisaster = useStore((s) => s.triggerDisaster);
  const activeDisaster = useStore((s) => s.activeDisaster);

  return (
    <button
      type="button"
      onClick={() => triggerDisaster()}
      disabled={!!activeDisaster}
      className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border text-lg backdrop-blur-md transition-all ${
        activeDisaster
          ? 'border-red-400/50 bg-red-500/30 cursor-not-allowed opacity-60'
          : 'border-red-400/30 bg-black/50 hover:bg-red-500/30'
      }`}
      title={activeDisaster ? 'Disaster in progress...' : 'Trigger random disaster'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${activeDisaster ? 'text-red-400' : 'text-red-300'}`}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    </button>
  );
}

function SecurityButton() {
  const setShowSecurityPanel = useStore((s) => s.setShowSecurityPanel);
  const alarmState = useStore((s) => s.alarmState);
  const activeIntruder = useStore((s) => s.activeIntruder);

  const isAlert = alarmState === 'triggered' || !!activeIntruder;

  return (
    <button
      type="button"
      onClick={() => setShowSecurityPanel(true)}
      className={`pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-full border text-lg backdrop-blur-md transition-all ${
        isAlert
          ? 'border-red-400/50 bg-red-500/30 animate-pulse'
          : alarmState !== 'disarmed'
          ? 'border-cyan-400/30 bg-cyan-500/20 hover:bg-cyan-500/30'
          : 'border-cyan-400/30 bg-black/50 hover:bg-cyan-500/20'
      }`}
      title="Home Security"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${isAlert ? 'text-red-400' : 'text-cyan-300'}`}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      {isAlert && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
          !
        </span>
      )}
    </button>
  );
}

function IntruderBanner() {
  const activeIntruder = useStore((s) => s.activeIntruder);

  if (!activeIntruder) return null;

  const config = INTRUDER_CONFIGS[activeIntruder.type as IntruderType];
  if (!config) return null;

  const phaseLabels: Record<string, string> = {
    detected: 'INTRUDER DETECTED',
    responding: 'ROBOTS RESPONDING',
    resolved: 'THREAT RESOLVED',
  };

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2 animate-pulse"
      aria-live="assertive"
    >
      <div className={`rounded-xl border px-6 py-3 backdrop-blur-lg ${
        activeIntruder.phase === 'resolved'
          ? 'border-green-400/30 bg-green-900/80'
          : 'border-red-400/40 bg-red-900/80'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.emoji}</span>
          <div>
            <div className={`text-sm font-bold ${activeIntruder.phase === 'resolved' ? 'text-green-300' : 'text-red-300'}`}>
              {phaseLabels[activeIntruder.phase] ?? 'ALERT'}
            </div>
            <div className="text-xs text-white/70">
              {config.label} in {activeIntruder.roomId}
              {activeIntruder.alarmTriggered && ' — Alarm sounding!'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DisasterOverlay() {
  const disaster = useStore((s) => s.activeDisaster);
  const reducedMotion = useAccessibility((s) => s.reducedMotion);

  if (!disaster || reducedMotion) return null;

  const severity = disaster.severity as 1 | 2 | 3;

  if (disaster.type === 'earthquake') {
    return (
      <div
        className={`pointer-events-none fixed inset-0 z-[60] earthquake-shake-${severity}`}
        aria-hidden="true"
      />
    );
  }

  if (disaster.type === 'fire') {
    return (
      <div
        className={`pointer-events-none fixed inset-0 z-[60] ${severity >= 2 ? 'disaster-fire-overlay-severe' : 'disaster-fire-overlay'}`}
        aria-hidden="true"
      />
    );
  }

  if (disaster.type === 'flood') {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-[60] disaster-flood-overlay"
        aria-hidden="true"
      />
    );
  }

  return null;
}

function App() {
  const screenshotMode = useStore((s) => s.screenshotMode);
  const photoMode = useStore((s) => s.photoMode);
  const isSpectating = useStore((s) => s.isSpectating);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showA11y, setShowA11y] = useState(false);

  const colorblindMode = useAccessibility((s) => s.colorblindMode);
  const reducedMotion = useAccessibility((s) => s.reducedMotion);
  const highContrast = useAccessibility((s) => s.highContrast);

  useSpectatorHost();
  useSpectatorViewer();

  const a11yClasses = [
    'relative h-screen w-screen overflow-hidden bg-black',
    colorblindMode !== 'none' ? `colorblind-${colorblindMode}` : '',
    reducedMotion ? 'a11y-reduced-motion' : '',
    highContrast ? 'a11y-high-contrast' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={a11yClasses} role="application" aria-label="SimBot robot home simulation">
      <ColorblindFilters />
      <a href="#main-canvas" className="skip-link">Skip to simulation</a>

      <main id="main-canvas" role="main" aria-label="3D simulation canvas">
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
      </main>

      {/* Systems — disabled for spectators */}
      {!isSpectating && (
        <>
          <TaskProcessor />
          <ScheduleSystem />
          <SmartScheduleTracker />
          <BatterySystem />
          <LeaderboardTracker />
          <PersonalityTracker />
          <HomeEventTracker />
          <DisasterTracker />
          <SocialTracker />
          <TimelapseRecorder />
          <NotificationTracker />
          <MoodMusicSystem />
          <ChallengeSystem />
          <FurnitureCraftingSystem />
          <SecurityTracker />
          <StoryDirectorTracker />
          <MiniGameTrigger />
        </>
      )}

      {/* Screen reader announcements */}
      <ScreenReaderAnnouncer />

      {/* Spectator badge */}
      <SpectatorBadge />

      {/* Hide all overlays during screenshot capture or photo mode */}
      {!screenshotMode && !photoMode && !isSpectating && (
        <>
          <RobotTerminal />
          <EmojiReaction />
          <nav
            aria-label="Robot controls"
            className="pointer-events-none fixed right-4 top-4 z-30 flex flex-wrap gap-2"
            style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <CoinDisplay />
            <TrophyButton />
            <EvolutionButton />
            <SmartScheduleButton />
            <MiniGamesButton />
            <ShopButton />
            <CraftingButton />
            <FurnitureCraftingButton />
            <SmartHomeButton />
            <DiaryButton />
            <PersonalityButton />
            <SkillTreeButton />
            <SocialButton />
            <TimelapseButton />
            <TimelineButton />
            <ShareButton />
            <MusicToggle />
            <MoodMusicToggle />
            <FloorPlanButton />
            <RoomEditorButtons />
            <EditRoomsButton />
            <DecorateResetButton />
            <ThemeButton />
            <DecorateButton />
            <ResetFurnitureButton />
            <RearrangeButton />
            <PhotoModeButton />
            <ScreenshotButton />
            <CameraPresetsButton />
            <CameraToggle />
            <PetButton />
            <ChallengeButton />
            <DisasterButton />
            <SecurityButton />
            <AccessibilityButton onClick={() => setShowA11y(true)} />
            <HelpButton onClick={() => setShowTutorial(true)} />
          </nav>
        </>
      )}

      <VisitorToast />
      <SeasonToast />
      <EventBanner />
      <DisasterBanner />
      <IntruderBanner />
      <DisasterOverlay />
      <ScreenshotModal />
      {!screenshotMode && !photoMode && !isSpectating && <ChatPanel />}
      {!screenshotMode && !photoMode && !isSpectating && <BatteryIndicator />}

      <PhotoModeOverlay />
      <ShopPanel />
      <CraftingPanel />
      <DevicePanel />
      <DiaryPanel />
      <LeaderboardPanel />
      <PersonalityPanel />
      <SocialPanel />
      <TimelapsePanel />
      <FloorPlanSelector />
      <DecoratePanel />
      <TaskTimelinePanel />
      <CameraPresetsPanel />
      <SkillTreePanel />
      <ThemeSelectorPanel />
      <PetPanel />
      <ChallengePanel />
      <ChallengeResultsModal />
      <FurnitureCraftingPanel />
      <SecurityPanel />
      <EvolutionPanel />
      <SmartSchedulePanel />
      <MiniGamesPanel />
      <CookingMiniGame />
      <RepairMiniGame />
      <GardenMiniGame />
      <ChallengeTimer />
      <FloorSelector />
      <AccessibilityPanel open={showA11y} onClose={() => setShowA11y(false)} />
      {!isSpectating && (
        <TutorialOverlay forceOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      )}
      {!screenshotMode && !photoMode && !isSpectating && <StatsPanel />}
      <NotificationSystem />
      <InstallPrompt />
    </div>
  );
}

export default App;
