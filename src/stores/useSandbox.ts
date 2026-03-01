import { create } from 'zustand';

const STORAGE_KEY = 'simbot-sandbox';

function loadSandbox(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveSandbox(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch { /* ignore quota errors */ }
}

export interface SandboxState {
  sandboxMode: boolean;
  setSandboxMode: (enabled: boolean) => void;
}

const initial = loadSandbox();

export const useSandbox = create<SandboxState>((set) => ({
  sandboxMode: initial,
  setSandboxMode: (enabled) => {
    saveSandbox(enabled);
    set({ sandboxMode: enabled });
  },
}));
