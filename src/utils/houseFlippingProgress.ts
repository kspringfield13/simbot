import type { FlipHistoryEntry } from '../config/houseFlipping';

const STORAGE_KEY = 'simbot-house-flipping';

export interface HouseFlippingData {
  history: FlipHistoryEntry[];
  ownedHousesJson: string; // Serialized OwnedHouse[] to avoid circular type dep
  marketSeed: number;
  lastRefreshedAt: number;
}

export function loadHouseFlippingData(): HouseFlippingData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {
    history: [],
    ownedHousesJson: '[]',
    marketSeed: Date.now(),
    lastRefreshedAt: Date.now(),
  };
}

export function saveHouseFlippingData(data: HouseFlippingData): void {
  try {
    // Keep last 100 history entries
    const trimmed = { ...data, history: data.history.slice(0, 100) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* ignore quota errors */ }
}

export function getFlipStats(history: FlipHistoryEntry[]) {
  const totalFlips = history.length;
  const totalProfit = history.reduce((sum, h) => sum + h.profit, 0);
  const profitable = history.filter((h) => h.profit > 0).length;
  const bestFlip = history.length > 0 ? Math.max(...history.map((h) => h.profit)) : 0;
  const avgProfit = totalFlips > 0 ? Math.round(totalProfit / totalFlips) : 0;
  return { totalFlips, totalProfit, profitable, bestFlip, avgProfit };
}
