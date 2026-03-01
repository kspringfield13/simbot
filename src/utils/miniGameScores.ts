// ── Mini-Game High Scores (localStorage) ─────────────────────────────

const STORAGE_KEY = 'simbot-minigame-scores';

export type MiniGameId = 'cooking' | 'repair' | 'garden';

export interface MiniGameScore {
  bestScore: number;
  bestStars: number;
  gamesPlayed: number;
}

type MiniGameScores = Partial<Record<MiniGameId, MiniGameScore>>;

function loadScores(): MiniGameScores {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveScores(scores: MiniGameScores): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch { /* quota exceeded — ignore */ }
}

export function getMiniGameHighScore(gameId: MiniGameId): MiniGameScore | null {
  const scores = loadScores();
  return scores[gameId] ?? null;
}

export function getAllMiniGameScores(): MiniGameScores {
  return loadScores();
}

/** Save score. Returns true if it's a new best score. */
export function saveMiniGameHighScore(gameId: MiniGameId, score: number, stars: number): boolean {
  const scores = loadScores();
  const prev = scores[gameId];
  const isNewBest = !prev || score > prev.bestScore;

  scores[gameId] = {
    bestScore: Math.max(score, prev?.bestScore ?? 0),
    bestStars: Math.max(stars, prev?.bestStars ?? 0),
    gamesPlayed: (prev?.gamesPlayed ?? 0) + 1,
  };

  saveScores(scores);
  return isNewBest;
}
