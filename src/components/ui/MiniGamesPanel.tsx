import { useStore } from '../../stores/useStore';
import { getAllMiniGameScores, type MiniGameId } from '../../utils/miniGameScores';

// ── Mini-Games Hub Panel ──────────────────────────────────────────────

interface MiniGameCard {
  id: MiniGameId;
  name: string;
  emoji: string;
  description: string;
  color: string;
  borderColor: string;
  hoverColor: string;
  taskTypes: string[];
  reward: string;
  onLaunch: () => void;
}

export function MiniGamesPanel() {
  const show = useStore((s) => s.showMiniGames);
  const setShow = useStore((s) => s.setShowMiniGames);
  const setShowCooking = useStore((s) => s.setShowCookingGame);
  const setShowRepair = useStore((s) => s.setShowRepairGame);
  const setShowGarden = useStore((s) => s.setShowGardenGame);

  if (!show) return null;

  const scores = getAllMiniGameScores();

  const games: MiniGameCard[] = [
    {
      id: 'cooking',
      name: 'Cooking Challenge',
      emoji: '🍳',
      description: 'Match ingredients in the right order before time runs out! Each recipe has a unique combo.',
      color: 'from-orange-500/20 to-amber-500/20',
      borderColor: 'border-orange-400/30',
      hoverColor: 'hover:border-orange-400/60',
      taskTypes: ['Cooking tasks'],
      reward: '12-25 coins',
      onLaunch: () => { setShow(false); setShowCooking(true); },
    },
    {
      id: 'repair',
      name: 'Pipe Repair Puzzle',
      emoji: '🔧',
      description: 'Rotate pipe tiles to connect water from source to drain. A logic puzzle with a time limit!',
      color: 'from-cyan-500/20 to-blue-500/20',
      borderColor: 'border-cyan-400/30',
      hoverColor: 'hover:border-cyan-400/60',
      taskTypes: ['Repair tasks'],
      reward: '15-35 coins',
      onLaunch: () => { setShow(false); setShowRepair(true); },
    },
    {
      id: 'garden',
      name: 'Garden Tending',
      emoji: '🌱',
      description: 'Plant seeds, water them, and harvest before they wither! Manage multiple plots for maximum yield.',
      color: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-400/30',
      hoverColor: 'hover:border-green-400/60',
      taskTypes: ['Garden tasks'],
      reward: '3-10 per plant',
      onLaunch: () => { setShow(false); setShowGarden(true); },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShow(false)} />
      <div className="relative w-[480px] max-h-[85vh] overflow-hidden rounded-2xl border border-violet-400/20 bg-gray-900/95 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎮</span>
            <span className="text-base font-semibold text-white">Mini-Games</span>
          </div>
          <button
            onClick={() => setShow(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-5" style={{ maxHeight: 'calc(85vh - 60px)' }}>
          <p className="mb-4 text-sm text-white/50">
            Play mini-games to earn bonus coins! Each game tests different skills.
          </p>

          <div className="flex flex-col gap-3">
            {games.map((game) => {
              const gameScore = scores[game.id];
              return (
                <button
                  key={game.id}
                  onClick={game.onLaunch}
                  className={`group relative overflow-hidden rounded-xl border ${game.borderColor} ${game.hoverColor} bg-gradient-to-br ${game.color} p-4 text-left transition-all active:scale-[0.98]`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{game.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white">{game.name}</h3>
                      <p className="mt-1 text-xs text-white/50 leading-relaxed">{game.description}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="flex items-center gap-1 rounded-full border border-yellow-400/20 bg-yellow-900/20 px-2 py-0.5 text-[10px] text-yellow-300">
                          🪙 {game.reward}
                        </span>
                        <span className="text-[10px] text-white/30">{game.taskTypes.join(', ')}</span>
                      </div>
                      {/* High score row */}
                      {gameScore && gameScore.gamesPlayed > 0 && (
                        <div className="mt-2 flex items-center gap-3 text-[10px]">
                          <span className="text-white/40">
                            Best: <span className="font-bold text-yellow-300">{gameScore.bestScore}</span>
                          </span>
                          <span className="text-white/30">
                            {'⭐'.repeat(gameScore.bestStars)}{'☆'.repeat(3 - gameScore.bestStars)}
                          </span>
                          <span className="text-white/25">
                            {gameScore.gamesPlayed} played
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition group-hover:bg-white/10 group-hover:text-white/80">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
