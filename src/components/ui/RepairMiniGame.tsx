import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../../stores/useStore';

// ── Repair Mini-Game: Pipe/Wire Puzzle ────────────────────────────────

// Grid-based connection puzzle. Rotate tiles to connect pipe/wire from source to drain.
// Each tile has openings on 0-4 sides (top/right/bottom/left). Player rotates tiles.

type Direction = 'top' | 'right' | 'bottom' | 'left';

interface Tile {
  openings: Direction[];
  rotation: number; // 0, 1, 2, 3 (number of 90° clockwise rotations)
  isSource: boolean;
  isDrain: boolean;
  connected: boolean;
}

type GamePhase = 'ready' | 'playing' | 'success' | 'failed';

const GRID_SIZE = 5;

function rotateDirection(dir: Direction, times: number): Direction {
  const order: Direction[] = ['top', 'right', 'bottom', 'left'];
  const idx = order.indexOf(dir);
  return order[(idx + times) % 4];
}

function getEffectiveOpenings(tile: Tile): Direction[] {
  return tile.openings.map((d) => rotateDirection(d, tile.rotation));
}

function opposite(dir: Direction): Direction {
  const map: Record<Direction, Direction> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  return map[dir];
}

// Tile shapes
const TILE_SHAPES: Direction[][] = [
  ['top', 'bottom'],           // straight vertical
  ['left', 'right'],           // straight horizontal
  ['top', 'right'],            // elbow
  ['right', 'bottom'],         // elbow
  ['bottom', 'left'],          // elbow
  ['top', 'left'],             // elbow
  ['top', 'right', 'bottom'],  // T-piece
  ['right', 'bottom', 'left'], // T-piece
  ['top', 'right', 'bottom', 'left'], // cross
];

function generatePuzzle(): Tile[][] {
  const grid: Tile[][] = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      const isSource = r === 0 && c === 0;
      const isDrain = r === GRID_SIZE - 1 && c === GRID_SIZE - 1;

      // Pick a random shape
      const shape = TILE_SHAPES[Math.floor(Math.random() * TILE_SHAPES.length)];
      // Random initial rotation (scramble)
      const rotation = Math.floor(Math.random() * 4);

      grid[r][c] = {
        openings: [...shape],
        rotation,
        isSource,
        isDrain,
        connected: false,
      };
    }
  }

  // Ensure source has a right/bottom opening and drain has top/left
  grid[0][0].openings = ['right', 'bottom'];
  grid[0][0].rotation = 0;
  grid[GRID_SIZE - 1][GRID_SIZE - 1].openings = ['top', 'left'];
  grid[GRID_SIZE - 1][GRID_SIZE - 1].rotation = 0;

  return grid;
}

function checkConnections(grid: Tile[][]): Tile[][] {
  // BFS from source
  const visited = new Set<string>();
  const queue: [number, number][] = [[0, 0]];
  visited.add('0,0');

  const dirDelta: Record<Direction, [number, number]> = {
    top: [-1, 0],
    bottom: [1, 0],
    left: [0, -1],
    right: [0, 1],
  };

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const tile = grid[r][c];
    const openings = getEffectiveOpenings(tile);

    for (const dir of openings) {
      const [dr, dc] = dirDelta[dir];
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
      const key = `${nr},${nc}`;
      if (visited.has(key)) continue;

      const neighbor = grid[nr][nc];
      const neighborOpenings = getEffectiveOpenings(neighbor);
      if (neighborOpenings.includes(opposite(dir))) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }

  // Mark connected tiles
  return grid.map((row, r) =>
    row.map((tile, c) => ({
      ...tile,
      connected: visited.has(`${r},${c}`),
    })),
  );
}

function renderTileShape(tile: Tile, size: number) {
  const openings = getEffectiveOpenings(tile);
  const half = size / 2;
  const pipeWidth = size * 0.3;
  const halfPipe = pipeWidth / 2;

  const paths: React.ReactElement[] = [];

  // Center hub
  paths.push(
    <rect
      key="hub"
      x={half - halfPipe}
      y={half - halfPipe}
      width={pipeWidth}
      height={pipeWidth}
      rx={2}
      fill={tile.connected ? (tile.isSource ? '#22d3ee' : tile.isDrain ? '#a78bfa' : '#4ade80') : '#6b7280'}
    />,
  );

  for (const dir of openings) {
    const color = tile.connected ? (tile.isSource ? '#22d3ee' : tile.isDrain ? '#a78bfa' : '#4ade80') : '#6b7280';
    switch (dir) {
      case 'top':
        paths.push(<rect key="top" x={half - halfPipe} y={0} width={pipeWidth} height={half} rx={1} fill={color} />);
        break;
      case 'bottom':
        paths.push(<rect key="bottom" x={half - halfPipe} y={half} width={pipeWidth} height={half} rx={1} fill={color} />);
        break;
      case 'left':
        paths.push(<rect key="left" x={0} y={half - halfPipe} width={half} height={pipeWidth} rx={1} fill={color} />);
        break;
      case 'right':
        paths.push(<rect key="right" x={half} y={half - halfPipe} width={half} height={pipeWidth} rx={1} fill={color} />);
        break;
    }
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%">
      {paths}
    </svg>
  );
}

export function RepairMiniGame() {
  const show = useStore((s) => s.showRepairGame);
  const setShow = useStore((s) => s.setShowRepairGame);
  const addCoins = useStore((s) => s.addCoins);
  const recordTransaction = useStore((s) => s.recordTransaction);
  const addCoinAnimation = useStore((s) => s.addCoinAnimation);
  const addNotification = useStore((s) => s.addNotification);

  const [phase, setPhase] = useState<GamePhase>('ready');
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const timerRef = useRef<number>(0);

  const TIME_LIMIT = 60;
  const REWARD_BASE = 20;

  const startGame = useCallback(() => {
    const puzzle = generatePuzzle();
    const checked = checkConnections(puzzle);
    setGrid(checked);
    setMoves(0);
    setTimeLeft(TIME_LIMIT);
    setScore(0);
    setPhase('playing');
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase('failed');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const rotateTile = useCallback(
    (r: number, c: number) => {
      if (phase !== 'playing') return;
      // Don't rotate source/drain
      if (grid[r][c].isSource || grid[r][c].isDrain) return;

      setGrid((prev) => {
        const next = prev.map((row) => row.map((t) => ({ ...t })));
        next[r][c].rotation = (next[r][c].rotation + 1) % 4;
        const checked = checkConnections(next);

        // Check win: drain connected?
        if (checked[GRID_SIZE - 1][GRID_SIZE - 1].connected) {
          clearInterval(timerRef.current);
          setTimeout(() => setPhase('success'), 300);
        }

        return checked;
      });
      setMoves((m) => m + 1);
    },
    [phase, grid],
  );

  // Award on success
  useEffect(() => {
    if (phase !== 'success') return;
    const timeBonus = Math.floor(timeLeft * 0.5);
    const moveBonus = Math.max(0, 15 - Math.floor(moves / 3));
    const total = REWARD_BASE + timeBonus + moveBonus;
    setScore(total);
    addCoins(total);
    recordTransaction('income', 'bonus', total, 'Mini-game: Pipe Repair');
    addCoinAnimation(total);
    addNotification({ type: 'success', title: 'Pipes Connected!', message: `Repair complete! Earned ${total} coins!` });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback(() => {
    clearInterval(timerRef.current);
    setPhase('ready');
    setShow(false);
  }, [setShow]);

  if (!show) return null;

  const timePct = (timeLeft / TIME_LIMIT) * 100;
  const timeColor = timePct > 50 ? 'bg-green-500' : timePct > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      <div className="relative w-[460px] max-h-[85vh] overflow-hidden rounded-2xl border border-cyan-400/20 bg-gray-900/95 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔧</span>
            <span className="text-base font-semibold text-white">Pipe Repair Puzzle</span>
          </div>
          <button onClick={close} className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-5" style={{ maxHeight: 'calc(85vh - 60px)' }}>
          {/* Ready */}
          {phase === 'ready' && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="text-6xl">🔧</div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">Pipe Repair</h3>
                <p className="mt-2 text-sm text-white/60">
                  Rotate the pipe tiles to connect the water source (top-left)
                  to the drain (bottom-right). Click tiles to rotate them 90°.
                </p>
              </div>
              <button
                onClick={startGame}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:from-cyan-400 hover:to-blue-400"
              >
                Start Repair!
              </button>
            </div>
          )}

          {/* Playing */}
          {phase === 'playing' && (
            <div className="flex flex-col gap-4">
              {/* Timer + Stats */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 h-3 overflow-hidden rounded-full bg-gray-800">
                  <div className={`h-full ${timeColor} transition-all duration-1000`} style={{ width: `${timePct}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                    {timeLeft}s
                  </span>
                </div>
                <span className="text-xs text-white/50">Moves: {moves}</span>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-cyan-400" /> Source
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-purple-400" /> Drain
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-green-400" /> Connected
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-gray-500" /> Disconnected
                </span>
              </div>

              {/* Grid */}
              <div className="mx-auto grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, width: '100%', maxWidth: 380 }}>
                {grid.map((row, r) =>
                  row.map((tile, c) => (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => rotateTile(r, c)}
                      className={`aspect-square rounded-lg border transition-all ${
                        tile.isSource
                          ? 'border-cyan-400/50 bg-cyan-950/40'
                          : tile.isDrain
                          ? 'border-purple-400/50 bg-purple-950/40'
                          : tile.connected
                          ? 'border-green-400/30 bg-green-950/20'
                          : 'border-white/10 bg-gray-800/50 hover:border-white/30'
                      } ${!tile.isSource && !tile.isDrain ? 'cursor-pointer active:scale-90' : 'cursor-default'}`}
                    >
                      {renderTileShape(tile, 40)}
                    </button>
                  )),
                )}
              </div>
            </div>
          )}

          {/* Success */}
          {phase === 'success' && (
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="text-6xl">🎉</div>
              <h3 className="text-xl font-bold text-green-400">Pipes Connected!</h3>
              <p className="text-sm text-white/60">
                Repair complete in {moves} moves with {timeLeft}s to spare!
              </p>
              <div className="flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-900/30 px-5 py-2">
                <span>🪙</span>
                <span className="text-lg font-bold text-yellow-300">+{score}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={startGame}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2.5 text-sm font-bold text-white transition hover:from-cyan-400 hover:to-blue-400"
                >
                  Play Again
                </button>
                <button onClick={close} className="rounded-xl border border-white/10 px-6 py-2.5 text-sm text-white/60 transition hover:bg-white/5">
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Failed */}
          {phase === 'failed' && (
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="text-6xl">⏰</div>
              <h3 className="text-xl font-bold text-red-400">Time's Up!</h3>
              <p className="text-sm text-white/60">The pipes couldn't be connected in time.</p>
              <div className="flex gap-3">
                <button
                  onClick={startGame}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2.5 text-sm font-bold text-white transition hover:from-cyan-400 hover:to-blue-400"
                >
                  Try Again
                </button>
                <button onClick={close} className="rounded-xl border border-white/10 px-6 py-2.5 text-sm text-white/60 transition hover:bg-white/5">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
