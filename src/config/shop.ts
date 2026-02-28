import type { RobotId } from '../types';

export interface ShopUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'speed' | 'battery' | 'efficiency';
  level: number;
  requires?: string; // prerequisite upgrade ID
}

export interface ShopColor {
  id: string;
  name: string;
  hex: string;
  cost: number;
}

export const UPGRADES: ShopUpgrade[] = [
  // Speed upgrades — reduce task work duration
  { id: 'speed-1', name: 'Quick Servos', description: 'Tasks complete 15% faster', cost: 25, category: 'speed', level: 1 },
  { id: 'speed-2', name: 'Turbo Servos', description: 'Tasks complete 30% faster', cost: 50, category: 'speed', level: 2, requires: 'speed-1' },
  { id: 'speed-3', name: 'Hyper Servos', description: 'Tasks complete 45% faster', cost: 100, category: 'speed', level: 3, requires: 'speed-2' },

  // Battery upgrades — slower battery drain
  { id: 'battery-1', name: 'Battery Pack', description: 'Battery drains 25% slower', cost: 30, category: 'battery', level: 1 },
  { id: 'battery-2', name: 'Power Cell', description: 'Battery drains 50% slower', cost: 60, category: 'battery', level: 2, requires: 'battery-1' },
  { id: 'battery-3', name: 'Fusion Core', description: 'Battery drains 75% slower', cost: 120, category: 'battery', level: 3, requires: 'battery-2' },

  // Efficiency — less energy used per task
  { id: 'efficiency-1', name: 'Smart Routing', description: 'Uses 20% less energy on tasks', cost: 40, category: 'efficiency', level: 1 },
  { id: 'efficiency-2', name: 'Eco Mode', description: 'Uses 40% less energy on tasks', cost: 80, category: 'efficiency', level: 2, requires: 'efficiency-1' },
  { id: 'efficiency-3', name: 'Zero Waste', description: 'Uses 60% less energy on tasks', cost: 150, category: 'efficiency', level: 3, requires: 'efficiency-2' },
];

export const ROBOT_COLORS: ShopColor[] = [
  { id: 'color-red', name: 'Ruby', hex: '#ef4444', cost: 15 },
  { id: 'color-green', name: 'Emerald', hex: '#22c55e', cost: 15 },
  { id: 'color-gold', name: 'Gold', hex: '#eab308', cost: 20 },
  { id: 'color-purple', name: 'Amethyst', hex: '#a855f7', cost: 20 },
  { id: 'color-pink', name: 'Rose', hex: '#ec4899', cost: 15 },
  { id: 'color-cyan', name: 'Frost', hex: '#06b6d4', cost: 15 },
];

/** Coin reward for completing a task based on its work duration (seconds). Returns 5–15. */
export function getTaskCoinReward(workDuration: number): number {
  return Math.min(15, Math.max(5, Math.round(5 + workDuration * 0.4)));
}

/** Speed multiplier from purchased shop upgrades. Returns e.g. 0.55 for 45% faster. */
export function getShopSpeedMultiplier(purchasedUpgrades: string[]): number {
  if (purchasedUpgrades.includes('speed-3')) return 0.55;
  if (purchasedUpgrades.includes('speed-2')) return 0.70;
  if (purchasedUpgrades.includes('speed-1')) return 0.85;
  return 1;
}

/** Battery drain multiplier from purchased upgrades. Returns e.g. 0.25 for 75% slower drain. */
export function getBatteryDrainMultiplier(purchasedUpgrades: string[]): number {
  if (purchasedUpgrades.includes('battery-3')) return 0.25;
  if (purchasedUpgrades.includes('battery-2')) return 0.50;
  if (purchasedUpgrades.includes('battery-1')) return 0.75;
  return 1;
}

/** Energy usage multiplier from purchased upgrades. */
export function getEnergyMultiplier(purchasedUpgrades: string[]): number {
  if (purchasedUpgrades.includes('efficiency-3')) return 0.40;
  if (purchasedUpgrades.includes('efficiency-2')) return 0.60;
  if (purchasedUpgrades.includes('efficiency-1')) return 0.80;
  return 1;
}

/** Get custom color for a robot, or null for default. */
export function getRobotCustomColor(
  robotColors: Partial<Record<RobotId, string>>,
  robotId: RobotId,
): string | null {
  return robotColors[robotId] ?? null;
}
