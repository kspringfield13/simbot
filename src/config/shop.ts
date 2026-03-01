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

/** Speed multiplier from purchased shop upgrades + deployed custom robot bonus. Lower = faster. */
export function getShopSpeedMultiplier(purchasedUpgrades: string[], craftingBonus = 0): number {
  let base = 1;
  if (purchasedUpgrades.includes('speed-3')) base = 0.55;
  else if (purchasedUpgrades.includes('speed-2')) base = 0.70;
  else if (purchasedUpgrades.includes('speed-1')) base = 0.85;
  // Apply crafting bonus: e.g. 0.20 bonus -> multiply by 0.80
  return Math.max(0.20, base * (1 - craftingBonus));
}

/** Battery drain multiplier from purchased upgrades + deployed custom robot bonus. Lower = less drain. */
export function getBatteryDrainMultiplier(purchasedUpgrades: string[], craftingBonus = 0): number {
  let base = 1;
  if (purchasedUpgrades.includes('battery-3')) base = 0.25;
  else if (purchasedUpgrades.includes('battery-2')) base = 0.50;
  else if (purchasedUpgrades.includes('battery-1')) base = 0.75;
  return Math.max(0.10, base * (1 - craftingBonus));
}

/** Energy usage multiplier from purchased upgrades + deployed custom robot bonus. */
export function getEnergyMultiplier(purchasedUpgrades: string[], craftingBonus = 0): number {
  let base = 1;
  if (purchasedUpgrades.includes('efficiency-3')) base = 0.40;
  else if (purchasedUpgrades.includes('efficiency-2')) base = 0.60;
  else if (purchasedUpgrades.includes('efficiency-1')) base = 0.80;
  return Math.max(0.15, base * (1 - craftingBonus));
}

/** Get custom color for a robot, or null for default. */
export function getRobotCustomColor(
  robotColors: Partial<Record<RobotId, string>>,
  robotId: RobotId,
): string | null {
  return robotColors[robotId] ?? null;
}
