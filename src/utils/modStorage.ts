import type { RobotMod, BehaviorMod, SkinMod } from '../types';

const MODS_STORAGE_KEY = 'simbot-mods';
const MAX_MODS = 50;

/** Load all mods from localStorage */
export function loadMods(): RobotMod[] {
  try {
    const raw = localStorage.getItem(MODS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_MODS);
  } catch {
    return [];
  }
}

/** Save all mods to localStorage */
export function saveMods(mods: RobotMod[]): void {
  try {
    localStorage.setItem(MODS_STORAGE_KEY, JSON.stringify(mods.slice(0, MAX_MODS)));
  } catch {
    // localStorage full or unavailable
  }
}

/** Add a new mod */
export function addMod(mods: RobotMod[], mod: RobotMod): RobotMod[] {
  const updated = [mod, ...mods].slice(0, MAX_MODS);
  saveMods(updated);
  return updated;
}

/** Update an existing mod */
export function updateMod(mods: RobotMod[], modId: string, updates: Partial<RobotMod>): RobotMod[] {
  const updated = mods.map((m) =>
    m.id === modId ? { ...m, ...updates, updatedAt: Date.now() } as RobotMod : m,
  );
  saveMods(updated);
  return updated;
}

/** Remove a mod */
export function removeMod(mods: RobotMod[], modId: string): RobotMod[] {
  const updated = mods.filter((m) => m.id !== modId);
  saveMods(updated);
  return updated;
}

/** Toggle a mod's enabled state */
export function toggleMod(mods: RobotMod[], modId: string): RobotMod[] {
  const updated = mods.map((m) =>
    m.id === modId ? { ...m, enabled: !m.enabled, updatedAt: Date.now() } as RobotMod : m,
  );
  saveMods(updated);
  return updated;
}

/** Get active mods for a specific robot */
export function getActiveModsForRobot(mods: RobotMod[], robotId: string): RobotMod[] {
  return mods.filter(
    (m) => m.enabled && (m.targetRobot === 'all' || m.targetRobot === robotId),
  );
}

/** Get behavior mods only */
export function getBehaviorMods(mods: RobotMod[]): BehaviorMod[] {
  return mods.filter((m): m is BehaviorMod => m.type === 'behavior');
}

/** Get skin mods only */
export function getSkinMods(mods: RobotMod[]): SkinMod[] {
  return mods.filter((m): m is SkinMod => m.type === 'skin');
}

/** Generate a unique mod ID */
export function generateModId(): string {
  return `mod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
