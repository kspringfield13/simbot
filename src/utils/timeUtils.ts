// Pure time utility functions — no store dependency
// Extracted to break circular import: useStore → TimeSystem → useStore

import type { SimPeriod } from '../types';

export const MINUTES_PER_DAY = 24 * 60;

export function wrapMinutes(totalMinutes: number): number {
  const wrapped = totalMinutes % MINUTES_PER_DAY;
  return wrapped >= 0 ? wrapped : wrapped + MINUTES_PER_DAY;
}

export function getSimPeriod(simMinutes: number): SimPeriod {
  const minutes = wrapMinutes(simMinutes);
  const hour = Math.floor(minutes / 60);

  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export function getSimDay(simMinutes: number): number {
  return Math.floor(simMinutes / MINUTES_PER_DAY) + 1;
}
