import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { ROBOT_IDS } from '../../types';
import { getMiniGameHighScore, saveMiniGameHighScore, type MiniGameScore } from '../../utils/miniGameScores';

// ── Garden Mini-Game: Plant / Water / Harvest Tending ─────────────────

interface Plant {
  id: string;
  name: string;
  emoji: string;
  seedEmoji: string;
  growTime: number; // seconds to grow
  waterNeeded: number; // times to water
  value: number; // coins per harvest
}

interface PlotState {
  plantId: string | null;
  stage: 'empty' | 'planted' | 'growing' | 'ready' | 'withered';
  waterCount: number;
  growTimer: number; // seconds remaining
  witherTimer: number; // seconds until wither after ready
}

type GamePhase = 'ready' | 'playing' | 'results';

const PLANTS: Plant[] = [
  { id: 'tomato', name: 'Tomato', emoji: '🍅', seedEmoji: '🌱', growTime: 8, waterNeeded: 2, value: 5 },
  { id: 'carrot', name: 'Carrot', emoji: '🥕', seedEmoji: '🌱', growTime: 6, waterNeeded: 1, value: 3 },
  { id: 'sunflower', name: 'Sunflower', emoji: '🌻', seedEmoji: '🌱', growTime: 10, waterNeeded: 3, value: 8 },
  { id: 'strawberry', name: 'Strawberry', emoji: '🍓', seedEmoji: '🌱', growTime: 7, waterNeeded: 2, value: 6 },
  { id: 'corn', name: 'Corn', emoji: '🌽', seedEmoji: '🌱', growTime: 12, waterNeeded: 3, value: 10 },
  { id: 'pepper', name: 'Pepper', emoji: '🌶️', seedEmoji: '🌱', growTime: 9, waterNeeded: 2, value: 7 },
];

const PLOT_COUNT = 6;
const GAME_DURATION = 60; // seconds
const WITHER_TIME = 8; // seconds to harvest before withering

function getStars(harvested: number): number {
  if (harvested >= 5) return 3;
  if (harvested >= 3) return 2;
  if (harvested >= 1) return 1;
  return 0;
}

function StarRating({ stars, size = 'text-2xl' }: { stars: number; size?: string }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((i) => (
        <span key={i} className={`${size} ${i <= stars ? 'opacity-100' : 'opacity-20'}`}>
          {i <= stars ? '⭐' : '☆'}
        </span>
      ))}
    </div>
  );
}

export function GardenMiniGame() {
  const show = useStore((s) => s.showGardenGame);
  const setShow = useStore((s) => s.setShowGardenGame);
  const addCoins = useStore((s) => s.addCoins);
  const recordTransaction = useStore((s) => s.recordTransaction);
  const addCoinAnimation = useStore((s) => s.addCoinAnimation);
  const addNotification = useStore((s) => s.addNotification);
  const updateRobotNeeds = useStore((s) => s.updateRobotNeeds);
  const robots = useStore((s) => s.robots);

  const [phase, setPhase] = useState<GamePhase>('ready');
  const [plots, setPlots] = useState<PlotState[]>([]);
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [tool, setTool] = useState<'seed' | 'water' | 'harvest'>('seed');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [harvested, setHarvested] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [stars, setStars] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [highScore, setHighScore] = useState<MiniGameScore | null>(null);
  const tickRef = useRef<number>(0);
  const timerRef = useRef<number>(0);

  // Load high score on mount
  useEffect(() => {
    if (show) {
      setHighScore(getMiniGameHighScore('garden'));
    }
  }, [show]);

  const startGame = useCallback(() => {
    setPlots(Array.from({ length: PLOT_COUNT }, () => ({
      plantId: null,
      stage: 'empty',
      waterCount: 0,
      growTimer: 0,
      witherTimer: 0,
    })));
    setSelectedSeed(PLANTS[0].id);
    setTool('seed');
    setTimeLeft(GAME_DURATION);
    setHarvested(0);
    setTotalCoins(0);
    setStars(0);
    setIsNewBest(false);
    setPhase('playing');
  }, []);

  // Game tick — advance grow timers & wither timers
  useEffect(() => {
    if (phase !== 'playing') return;

    tickRef.current = window.setInterval(() => {
      setPlots((prev) =>
        prev.map((plot) => {
          if (plot.stage === 'growing') {
            const newTimer = plot.growTimer - 0.5;
            if (newTimer <= 0) {
              return { ...plot, stage: 'ready', growTimer: 0, witherTimer: WITHER_TIME };
            }
            return { ...plot, growTimer: newTimer };
          }
          if (plot.stage === 'ready') {
            const newWither = plot.witherTimer - 0.5;
            if (newWither <= 0) {
              return { ...plot, stage: 'withered', witherTimer: 0 };
            }
            return { ...plot, witherTimer: newWither };
          }
          return plot;
        }),
      );
    }, 500);

    return () => clearInterval(tickRef.current);
  }, [phase]);

  // Main timer
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          clearInterval(tickRef.current);
          setPhase('results');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handlePlotClick = useCallback(
    (index: number) => {
      if (phase !== 'playing') return;

      setPlots((prev) => {
        const next = [...prev];
        const plot = { ...next[index] };

        if (tool === 'seed' && plot.stage === 'empty' && selectedSeed) {
          const plant = PLANTS.find((p) => p.id === selectedSeed)!;
          plot.plantId = selectedSeed;
          plot.stage = 'planted';
          plot.waterCount = 0;
          plot.growTimer = plant.growTime;
          plot.witherTimer = 0;
        } else if (tool === 'water' && (plot.stage === 'planted' || plot.stage === 'growing')) {
          const plant = PLANTS.find((p) => p.id === plot.plantId)!;
          plot.waterCount = Math.min(plot.waterCount + 1, plant.waterNeeded);
          if (plot.waterCount >= plant.waterNeeded && plot.stage === 'planted') {
            plot.stage = 'growing';
          }
        } else if (tool === 'harvest' && plot.stage === 'ready') {
          const plant = PLANTS.find((p) => p.id === plot.plantId)!;
          setHarvested((h) => h + 1);
          setTotalCoins((c) => c + plant.value);
          // Reset plot
          plot.plantId = null;
          plot.stage = 'empty';
          plot.waterCount = 0;
          plot.growTimer = 0;
          plot.witherTimer = 0;
        } else if (plot.stage === 'withered') {
          // Clear withered
          plot.plantId = null;
          plot.stage = 'empty';
          plot.waterCount = 0;
          plot.growTimer = 0;
          plot.witherTimer = 0;
        }

        next[index] = plot;
        return next;
      });
    },
    [phase, tool, selectedSeed],
  );

  // Award coins on results + sim state effects
  useEffect(() => {
    if (phase !== 'results') return;
    const earnedStars = getStars(harvested);
    setStars(earnedStars);

    if (totalCoins > 0) {
      addCoins(totalCoins);
      recordTransaction('income', 'bonus', totalCoins, `Mini-game: Garden (${harvested} plants)`);
      addCoinAnimation(totalCoins);

      // Save high score (use totalCoins as the score)
      const newBest = saveMiniGameHighScore('garden', totalCoins, earnedStars);
      setIsNewBest(newBest);
      setHighScore(getMiniGameHighScore('garden'));

      // Sim state: garden boosts all robots' happiness
      for (const rid of ROBOT_IDS) {
        if (robots[rid]) {
          const currentHappiness = robots[rid].needs.happiness;
          updateRobotNeeds(rid, { happiness: Math.min(100, currentHappiness + 5 + earnedStars * 3) });
        }
      }

      const starText = earnedStars === 3 ? 'Amazing Harvest!' : earnedStars === 2 ? 'Great Harvest!' : 'Garden Complete!';
      addNotification({
        type: 'success',
        title: starText,
        message: `Harvested ${harvested} plants for ${totalCoins} coins! ${'⭐'.repeat(earnedStars)}`,
      });
    } else {
      saveMiniGameHighScore('garden', 0, 0);
      setHighScore(getMiniGameHighScore('garden'));
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(tickRef.current);
    setPhase('ready');
    setShow(false);
  }, [setShow]);

  if (!show) return null;

  const timePct = (timeLeft / GAME_DURATION) * 100;
  const timeColor = timePct > 50 ? 'bg-green-500' : timePct > 25 ? 'bg-yellow-500' : 'bg-red-500';

  function getPlotEmoji(plot: PlotState): string {
    if (plot.stage === 'empty') return '';
    if (plot.stage === 'withered') return '🥀';
    if (plot.stage === 'ready') {
      const plant = PLANTS.find((p) => p.id === plot.plantId);
      return plant?.emoji ?? '🌿';
    }
    if (plot.stage === 'growing') return '🌿';
    return '🌱'; // planted
  }

  function getPlotLabel(plot: PlotState): string {
    if (plot.stage === 'empty') return 'Empty';
    const plant = PLANTS.find((p) => p.id === plot.plantId);
    if (plot.stage === 'planted') return `${plant?.name} (needs water)`;
    if (plot.stage === 'growing') return `${plant?.name} (${Math.ceil(plot.growTimer)}s)`;
    if (plot.stage === 'ready') return `${plant?.name} READY! (${Math.ceil(plot.witherTimer)}s)`;
    if (plot.stage === 'withered') return 'Withered (click to clear)';
    return '';
  }

  function getWaterProgress(plot: PlotState): number {
    if (!plot.plantId) return 0;
    const plant = PLANTS.find((p) => p.id === plot.plantId);
    if (!plant) return 0;
    return (plot.waterCount / plant.waterNeeded) * 100;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      <div className="relative w-[500px] max-h-[85vh] overflow-hidden rounded-2xl border border-green-400/20 bg-gray-900/95 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🌱</span>
            <span className="text-base font-semibold text-white">Garden Tending</span>
          </div>
          <div className="flex items-center gap-3">
            {highScore && (
              <span className="text-[10px] text-white/40">Best: {highScore.bestScore} {'⭐'.repeat(highScore.bestStars)}</span>
            )}
            <button onClick={close} className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white">
              ✕
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-5" style={{ maxHeight: 'calc(85vh - 60px)' }}>
          {/* Ready */}
          {phase === 'ready' && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="text-6xl">🌻</div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">Robot Garden</h3>
                <p className="mt-2 text-sm text-white/60">
                  Plant seeds, water them, and harvest before they wither!
                  Each plant earns coins. Manage your {PLOT_COUNT} plots wisely in {GAME_DURATION} seconds.
                </p>
                <div className="mt-3 flex items-center justify-center gap-1 text-xs text-white/40">
                  <span>⭐ 1+ harvest </span>
                  <span>⭐⭐ 3+ harvests </span>
                  <span>⭐⭐⭐ 5+ harvests</span>
                </div>
              </div>
              <button
                onClick={startGame}
                className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:from-green-400 hover:to-emerald-400"
              >
                Start Gardening!
              </button>
            </div>
          )}

          {/* Playing */}
          {phase === 'playing' && (
            <div className="flex flex-col gap-4">
              {/* Timer + Score */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 h-3 overflow-hidden rounded-full bg-gray-800">
                  <div className={`h-full ${timeColor} transition-all duration-1000`} style={{ width: `${timePct}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                    {timeLeft}s
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span>🪙</span>
                  <span className="font-bold text-yellow-300">{totalCoins}</span>
                </div>
              </div>

              {/* Tool selector */}
              <div className="flex gap-2">
                {(['seed', 'water', 'harvest'] as const).map((t) => {
                  const icons = { seed: '🌱', water: '💧', harvest: '🧺' };
                  const labels = { seed: 'Plant', water: 'Water', harvest: 'Harvest' };
                  const colors = {
                    seed: 'border-green-400/50 bg-green-900/30 text-green-300',
                    water: 'border-blue-400/50 bg-blue-900/30 text-blue-300',
                    harvest: 'border-amber-400/50 bg-amber-900/30 text-amber-300',
                  };
                  return (
                    <button
                      key={t}
                      onClick={() => setTool(t)}
                      className={`flex-1 rounded-lg border py-2 text-center text-sm font-medium transition ${
                        tool === t ? colors[t] : 'border-white/10 bg-gray-800/50 text-white/50 hover:bg-gray-700/50'
                      }`}
                    >
                      {icons[t]} {labels[t]}
                    </button>
                  );
                })}
              </div>

              {/* Seed selector (shown when plant tool active) */}
              {tool === 'seed' && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {PLANTS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedSeed(p.id)}
                      className={`flex flex-col items-center gap-0.5 rounded-lg border px-2.5 py-1.5 text-center transition shrink-0 ${
                        selectedSeed === p.id
                          ? 'border-green-400/50 bg-green-900/30'
                          : 'border-white/10 bg-gray-800/50 hover:border-green-400/30'
                      }`}
                    >
                      <span className="text-lg">{p.emoji}</span>
                      <span className="text-[9px] text-white/50">{p.name}</span>
                      <span className="text-[9px] text-yellow-400">🪙{p.value}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Garden plots */}
              <div className="grid grid-cols-3 gap-3">
                {plots.map((plot, i) => (
                  <button
                    key={i}
                    onClick={() => handlePlotClick(i)}
                    className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border p-4 transition-all active:scale-95 ${
                      plot.stage === 'empty'
                        ? 'border-white/10 bg-amber-950/20 hover:border-green-400/30'
                        : plot.stage === 'ready'
                        ? 'border-amber-400/50 bg-amber-900/20 animate-pulse'
                        : plot.stage === 'withered'
                        ? 'border-red-400/30 bg-red-950/20'
                        : 'border-green-400/20 bg-green-950/20'
                    }`}
                  >
                    <span className="text-3xl">{getPlotEmoji(plot) || '🟫'}</span>
                    <span className="text-[10px] text-white/50">{getPlotLabel(plot)}</span>
                    {/* Water progress bar */}
                    {(plot.stage === 'planted' || plot.stage === 'growing') && (
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                        <div
                          className="h-full bg-blue-400 transition-all"
                          style={{ width: `${getWaterProgress(plot)}%` }}
                        />
                      </div>
                    )}
                    {/* Grow progress bar */}
                    {plot.stage === 'growing' && plot.plantId && (
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                        <div
                          className="h-full bg-green-400 transition-all"
                          style={{
                            width: `${Math.max(0, 100 - (plot.growTimer / (PLANTS.find((p) => p.id === plot.plantId)?.growTime ?? 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                    {/* Wither countdown */}
                    {plot.stage === 'ready' && (
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                        <div
                          className="h-full bg-amber-400 transition-all"
                          style={{ width: `${(plot.witherTimer / WITHER_TIME) * 100}%` }}
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Instructions */}
              <p className="text-center text-xs text-white/30">
                {tool === 'seed' && 'Click an empty plot to plant a seed'}
                {tool === 'water' && 'Click a planted plot to water it'}
                {tool === 'harvest' && 'Click a ready plant to harvest it'}
              </p>
            </div>
          )}

          {/* Results */}
          {phase === 'results' && (
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="text-6xl">🌻</div>
              <StarRating stars={stars} />
              {isNewBest && totalCoins > 0 && <span className="text-xs font-bold text-yellow-400 animate-pulse">New Best!</span>}
              <h3 className="text-xl font-bold text-green-400">
                {harvested >= 5 ? 'Amazing Harvest!' : harvested >= 3 ? 'Great Harvest!' : harvested > 0 ? 'Garden Complete!' : 'Garden Time Over'}
              </h3>
              <p className="text-sm text-white/60">
                You harvested {harvested} plant{harvested !== 1 ? 's' : ''}!
              </p>
              {totalCoins > 0 && (
                <div className="flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-900/30 px-5 py-2">
                  <span>🪙</span>
                  <span className="text-lg font-bold text-yellow-300">+{totalCoins}</span>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={startGame}
                  className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-2.5 text-sm font-bold text-white transition hover:from-green-400 hover:to-emerald-400"
                >
                  Play Again
                </button>
                <button onClick={close} className="rounded-xl border border-white/10 px-6 py-2.5 text-sm text-white/60 transition hover:bg-white/5">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
