import { useCallback, useRef, useState } from 'react';
import { useStore } from '../../stores/useStore';
import { useRobotNames } from '../../stores/useRobotNames';
import { loadLeaderboard } from '../../systems/Leaderboard';
import { loadPersonalities } from '../../systems/Personality';

const SAVE_VERSION = 1;

/** All localStorage keys used by SimBot */
const STORAGE_KEYS = {
  furniturePositions: 'simbot-furniture-positions',
  scheduledTasks: 'simbot-scheduled-tasks',
  roomLayout: 'simbot-room-layout',
  customWalls: 'simbot-custom-walls',
  shop: 'simbot-shop',
  crafting: 'simbot-crafting',
  devices: 'simbot-devices',
  friendships: 'simbot-friendships',
  roomDecorations: 'simbot-room-decorations',
  robotNames: 'simbot-robot-names',
  leaderboard: 'simbot-leaderboard',
  personality: 'simbot-personality',
  floorPlan: 'simbot-floor-plan',
  cameraPresets: 'simbot-camera-presets',
} as const;

interface SaveData {
  version: number;
  savedAt: string;
  store: {
    robots: ReturnType<typeof useStore.getState>['robots'];
    simMinutes: number;
    simSpeed: number;
    roomNeeds: ReturnType<typeof useStore.getState>['roomNeeds'];
    totalTasksCompleted: number;
    tasksByType: ReturnType<typeof useStore.getState>['tasksByType'];
    tasksByRoom: ReturnType<typeof useStore.getState>['tasksByRoom'];
    taskExperience: ReturnType<typeof useStore.getState>['taskExperience'];
    coins: number;
    purchasedUpgrades: string[];
    robotColors: ReturnType<typeof useStore.getState>['robotColors'];
    homeEventHistory: ReturnType<typeof useStore.getState>['homeEventHistory'];
    diaryEntries: ReturnType<typeof useStore.getState>['diaryEntries'];
    diaryDay: number;
    weather: ReturnType<typeof useStore.getState>['weather'];
    currentSeason: ReturnType<typeof useStore.getState>['currentSeason'];
    seasonalDecorations: boolean;
  };
  localStorage: Record<string, string | null>;
}

function collectSaveData(): SaveData {
  const s = useStore.getState();

  // Collect all localStorage entries
  const localStorageData: Record<string, string | null> = {};
  for (const [, key] of Object.entries(STORAGE_KEYS)) {
    try {
      localStorageData[key] = localStorage.getItem(key);
    } catch {
      localStorageData[key] = null;
    }
  }

  return {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    store: {
      robots: s.robots,
      simMinutes: s.simMinutes,
      simSpeed: s.simSpeed,
      roomNeeds: s.roomNeeds,
      totalTasksCompleted: s.totalTasksCompleted,
      tasksByType: s.tasksByType,
      tasksByRoom: s.tasksByRoom,
      taskExperience: s.taskExperience,
      coins: s.coins,
      purchasedUpgrades: s.purchasedUpgrades,
      robotColors: s.robotColors,
      homeEventHistory: s.homeEventHistory,
      diaryEntries: s.diaryEntries,
      diaryDay: s.diaryDay,
      weather: s.weather,
      currentSeason: s.currentSeason,
      seasonalDecorations: s.seasonalDecorations,
    },
    localStorage: localStorageData,
  };
}

function applySaveData(data: SaveData) {
  // Restore localStorage entries first (robot names, leaderboard, personality, etc.)
  for (const [key, value] of Object.entries(data.localStorage)) {
    try {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } catch { /* ignore quota errors */ }
  }

  // Restore zustand-persist robot names store by reloading from localStorage
  // The useRobotNames store uses zustand/persist with key 'simbot-robot-names'
  const namesRaw = data.localStorage['simbot-robot-names'];
  if (namesRaw) {
    try {
      const parsed = JSON.parse(namesRaw);
      const customNames = parsed?.state?.customNames ?? {};
      useRobotNames.setState({ customNames });
    } catch { /* ignore */ }
  }

  // Restore main store state
  useStore.setState({
    robots: data.store.robots,
    simMinutes: data.store.simMinutes,
    simSpeed: data.store.simSpeed as 0 | 1 | 10 | 60,
    roomNeeds: data.store.roomNeeds,
    totalTasksCompleted: data.store.totalTasksCompleted,
    tasksByType: data.store.tasksByType,
    tasksByRoom: data.store.tasksByRoom,
    taskExperience: data.store.taskExperience,
    coins: data.store.coins,
    purchasedUpgrades: data.store.purchasedUpgrades,
    robotColors: data.store.robotColors,
    homeEventHistory: data.store.homeEventHistory,
    diaryEntries: data.store.diaryEntries,
    diaryDay: data.store.diaryDay,
    weather: data.store.weather,
    currentSeason: data.store.currentSeason,
    seasonalDecorations: data.store.seasonalDecorations,
    // Restore persisted fields that are loaded from localStorage at init
    furniturePositions: safeJsonParse(data.localStorage[STORAGE_KEYS.furniturePositions], {}),
    scheduledTasks: safeJsonParse(data.localStorage[STORAGE_KEYS.scheduledTasks], []),
    roomLayout: safeJsonParse(data.localStorage[STORAGE_KEYS.roomLayout], { overrides: {}, addedRooms: [], deletedRoomIds: [] }),
    customWalls: safeJsonParse(data.localStorage[STORAGE_KEYS.customWalls], null),
    deviceStates: safeJsonParse(data.localStorage[STORAGE_KEYS.devices], {}),
    friendships: safeJsonParse(data.localStorage[STORAGE_KEYS.friendships], {}),
    roomDecorations: safeJsonParse(data.localStorage[STORAGE_KEYS.roomDecorations], {}),
    floorPlanId: data.localStorage[STORAGE_KEYS.floorPlan] ?? 'default',
    ownedParts: safeJsonParse(data.localStorage[STORAGE_KEYS.crafting], { ownedParts: [] }).ownedParts ?? [],
    customRobots: safeJsonParse(data.localStorage[STORAGE_KEYS.crafting], { customRobots: [] }).customRobots ?? [],
    cameraPresets: safeJsonParse(data.localStorage[STORAGE_KEYS.cameraPresets], []),
    personalities: loadPersonalities(),
    leaderboardData: loadLeaderboard(),
    // Clear transient state
    tasks: [],
    activeChats: [],
    activeHomeEvent: null,
    timelapseEvents: [],
    timelapsePlayback: null,
    notifications: [],
  });
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function downloadJson(data: SaveData) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `simbot-save-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function SaveLoadButtons() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'saved' | 'loaded' | 'error'>('idle');
  const addNotification = useStore((s) => s.addNotification);

  const handleSave = useCallback(() => {
    try {
      const data = collectSaveData();
      downloadJson(data);
      setStatus('saved');
      addNotification({ type: 'success', title: 'Game Saved', message: 'Save file downloaded successfully.' });
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      addNotification({ type: 'warning', title: 'Save Failed', message: 'Could not export save data.' });
      setTimeout(() => setStatus('idle'), 2000);
    }
  }, [addNotification]);

  const handleLoad = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as SaveData;
        if (!data.version || !data.store || !data.localStorage) {
          throw new Error('Invalid save file');
        }
        applySaveData(data);
        setStatus('loaded');
        addNotification({ type: 'success', title: 'Game Loaded', message: 'Save file restored successfully.' });
        setTimeout(() => setStatus('idle'), 2000);
      } catch {
        setStatus('error');
        addNotification({ type: 'warning', title: 'Load Failed', message: 'Invalid or corrupted save file.' });
        setTimeout(() => setStatus('idle'), 2000);
      }
    };
    reader.readAsText(file);

    // Reset input so the same file can be selected again
    e.target.value = '';
  }, [addNotification]);

  const statusColor = status === 'saved' || status === 'loaded' ? '#4ade80' : status === 'error' ? '#f87171' : '#999';
  const statusText = status === 'saved' ? 'Saved!' : status === 'loaded' ? 'Loaded!' : status === 'error' ? 'Error' : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        type="button"
        onClick={handleSave}
        style={{
          background: 'rgba(59,130,246,0.15)',
          color: '#93c5fd',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 6,
          padding: '6px 10px',
          fontSize: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
        title="Export sim state to JSON file"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Save
      </button>
      <button
        type="button"
        onClick={handleLoad}
        style={{
          background: 'rgba(168,85,247,0.15)',
          color: '#c4b5fd',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: 6,
          padding: '6px 10px',
          fontSize: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
        title="Import sim state from JSON file"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Load
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {statusText && (
        <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>{statusText}</span>
      )}
    </div>
  );
}
