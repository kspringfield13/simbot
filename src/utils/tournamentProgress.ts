import type { TournamentHistoryEntry } from '../config/tournaments';

const STORAGE_KEY = 'simbot-tournament-history';

export function loadTournamentHistory(): TournamentHistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveTournamentResult(entry: TournamentHistoryEntry): void {
  try {
    const history = loadTournamentHistory();
    history.unshift(entry);
    // Keep last 50 entries
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
  } catch { /* ignore quota errors */ }
}

export function getTournamentStats(history: TournamentHistoryEntry[]) {
  const wins = history.filter((h) => h.placement === 1).length;
  const totalPrize = history.reduce((sum, h) => sum + h.prizeWon, 0);
  const bestPlacement = history.length > 0 ? Math.min(...history.map((h) => h.placement)) : 0;
  return { wins, totalPlayed: history.length, totalPrize, bestPlacement };
}
