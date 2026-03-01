import { create } from 'zustand';

export type ColorblindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface AccessibilityState {
  colorblindMode: ColorblindMode;
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderEnabled: boolean;

  setColorblindMode: (mode: ColorblindMode) => void;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setScreenReaderEnabled: (enabled: boolean) => void;
}

const STORAGE_KEY = 'simbot-accessibility';

interface StoredSettings {
  colorblindMode: ColorblindMode;
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderEnabled: boolean;
}

function loadSettings(): StoredSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {
    colorblindMode: 'none',
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    highContrast: false,
    screenReaderEnabled: false,
  };
}

function saveSettings(s: StoredSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { /* ignore quota errors */ }
}

const initial = loadSettings();

export const useAccessibility = create<AccessibilityState>((set) => ({
  colorblindMode: initial.colorblindMode,
  reducedMotion: initial.reducedMotion,
  highContrast: initial.highContrast,
  screenReaderEnabled: initial.screenReaderEnabled,

  setColorblindMode: (mode) =>
    set((s) => {
      const next = { colorblindMode: mode, reducedMotion: s.reducedMotion, highContrast: s.highContrast, screenReaderEnabled: s.screenReaderEnabled };
      saveSettings(next);
      return { colorblindMode: mode };
    }),

  setReducedMotion: (enabled) =>
    set((s) => {
      const next = { colorblindMode: s.colorblindMode, reducedMotion: enabled, highContrast: s.highContrast, screenReaderEnabled: s.screenReaderEnabled };
      saveSettings(next);
      return { reducedMotion: enabled };
    }),

  setHighContrast: (enabled) =>
    set((s) => {
      const next = { colorblindMode: s.colorblindMode, reducedMotion: s.reducedMotion, highContrast: enabled, screenReaderEnabled: s.screenReaderEnabled };
      saveSettings(next);
      return { highContrast: enabled };
    }),

  setScreenReaderEnabled: (enabled) =>
    set((s) => {
      const next = { colorblindMode: s.colorblindMode, reducedMotion: s.reducedMotion, highContrast: s.highContrast, screenReaderEnabled: enabled };
      saveSettings(next);
      return { screenReaderEnabled: enabled };
    }),
}));
