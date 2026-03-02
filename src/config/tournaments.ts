import type { RobotId, TaskType } from '../types';
import { ROBOT_CONFIGS } from './robots';

// ── Types ──────────────────────────────────────────────

export type TournamentTier = 'bronze' | 'silver' | 'gold' | 'diamond';
export type TournamentType = 'speed' | 'efficiency' | 'endurance';

export const TOURNAMENT_TYPE_META: Record<TournamentType, { label: string; emoji: string; description: string; color: string }> = {
  speed: { label: 'Speed Clean', emoji: '\u26A1', description: 'Pure speed — fastest bot wins', color: '#f59e0b' },
  efficiency: { label: 'Efficiency', emoji: '\uD83C\uDFAF', description: 'Thorough cleaning — precision over pace', color: '#10b981' },
  endurance: { label: 'Endurance', emoji: '\uD83D\uDCAA', description: 'Marathon clean — stamina and consistency', color: '#8b5cf6' },
};

export interface TournamentDefinition {
  id: string;
  name: string;
  emoji: string;
  tier: TournamentTier;
  type: TournamentType;
  description: string;
  entryFee: number;
  prizePool: number;
  /** Number of participants (must be power of 2) */
  bracketSize: 4 | 8;
  /** Room types that matches take place in */
  matchRooms: string[];
  /** Task types used in speed challenges */
  taskTypes: TaskType[];
  /** Base seconds per match */
  baseMatchDuration: number;
}

export interface TournamentContestant {
  id: string;
  name: string;
  color: string;
  isPlayer: boolean;
  /** Effective speed rating 0-100 */
  speed: number;
  /** Effective efficiency rating 0-100 */
  efficiency: number;
  robotId?: RobotId;
}

export interface BracketMatch {
  id: string;
  round: number;
  matchIndex: number;
  contestant1: TournamentContestant | null;
  contestant2: TournamentContestant | null;
  winner: TournamentContestant | null;
  time1: number | null;
  time2: number | null;
  status: 'pending' | 'ready' | 'simulating' | 'complete';
}

export interface TournamentInstance {
  definitionId: string;
  name: string;
  tier: TournamentTier;
  type: TournamentType;
  emoji: string;
  brackets: BracketMatch[];
  contestants: TournamentContestant[];
  playerRobotId: RobotId;
  currentRound: number;
  totalRounds: number;
  status: 'registration' | 'in_progress' | 'complete';
  winnerId: string | null;
  prizePool: number;
  startedAt: number;
}

export interface TournamentHistoryEntry {
  tournamentId: string;
  tournamentName: string;
  tier: TournamentTier;
  type: TournamentType;
  emoji: string;
  playerRobotId: RobotId;
  placement: number;
  totalContestants: number;
  prizeWon: number;
  completedAt: number;
  winnerId: string;
  winnerName: string;
  /** Trophy awarded (if any) */
  trophy: string | null;
}

// ── NPC Opponents ──────────────────────────────────────

const NPC_OPPONENTS: Omit<TournamentContestant, 'id'>[] = [
  { name: 'Dusty', color: '#9ca3af', isPlayer: false, speed: 55, efficiency: 60 },
  { name: 'Bolt', color: '#fbbf24', isPlayer: false, speed: 75, efficiency: 50 },
  { name: 'Scrubber', color: '#34d399', isPlayer: false, speed: 45, efficiency: 80 },
  { name: 'Turbo', color: '#f87171', isPlayer: false, speed: 85, efficiency: 40 },
  { name: 'Whisk', color: '#a78bfa', isPlayer: false, speed: 60, efficiency: 70 },
  { name: 'Polaris', color: '#38bdf8', isPlayer: false, speed: 70, efficiency: 65 },
  { name: 'Blaze', color: '#fb923c', isPlayer: false, speed: 80, efficiency: 55 },
  { name: 'Glimmer', color: '#f472b6', isPlayer: false, speed: 50, efficiency: 75 },
  { name: 'Rumble', color: '#64748b', isPlayer: false, speed: 65, efficiency: 62 },
  { name: 'Nova', color: '#c084fc', isPlayer: false, speed: 72, efficiency: 58 },
  { name: 'Sprocket', color: '#facc15', isPlayer: false, speed: 58, efficiency: 68 },
  { name: 'Zenith', color: '#2dd4bf', isPlayer: false, speed: 78, efficiency: 72 },
];

// ── Tournament Definitions ─────────────────────────────

export const TOURNAMENTS: TournamentDefinition[] = [
  // ── Speed Clean ─────────────────────────────────
  {
    id: 'kitchen-dash',
    name: 'Kitchen Dash Cup',
    emoji: '\uD83C\uDF73',
    tier: 'bronze',
    type: 'speed',
    description: 'Speed-clean the kitchen! Fastest bot wins.',
    entryFee: 10,
    prizePool: 50,
    bracketSize: 4,
    matchRooms: ['kitchen'],
    taskTypes: ['dishes', 'cooking', 'sweeping'],
    baseMatchDuration: 35,
  },
  {
    id: 'sparkle-sprint',
    name: 'Sparkle Sprint',
    emoji: '\u26A1',
    tier: 'silver',
    type: 'speed',
    description: 'Lightning-fast bathroom and bedroom blitz. Pure velocity.',
    entryFee: 25,
    prizePool: 120,
    bracketSize: 8,
    matchRooms: ['bathroom', 'bedroom'],
    taskTypes: ['scrubbing', 'bed-making', 'cleaning'],
    baseMatchDuration: 40,
  },
  // ── Efficiency ──────────────────────────────────
  {
    id: 'precision-clean',
    name: 'Precision Clean Open',
    emoji: '\uD83C\uDFAF',
    tier: 'bronze',
    type: 'efficiency',
    description: 'Clean every corner perfectly. Thoroughness beats speed.',
    entryFee: 10,
    prizePool: 50,
    bracketSize: 4,
    matchRooms: ['living-room', 'bedroom'],
    taskTypes: ['cleaning', 'organizing', 'vacuuming'],
    baseMatchDuration: 55,
  },
  {
    id: 'garden-grand-prix',
    name: 'Garden Grand Prix',
    emoji: '\uD83C\uDF3B',
    tier: 'silver',
    type: 'efficiency',
    description: 'Outdoor mastery — precise watering, exact trimming, zero waste.',
    entryFee: 25,
    prizePool: 120,
    bracketSize: 8,
    matchRooms: ['yard'],
    taskTypes: ['mowing', 'watering', 'weeding', 'leaf-blowing'],
    baseMatchDuration: 60,
  },
  // ── Endurance ───────────────────────────────────
  {
    id: 'whole-home-marathon',
    name: 'Whole Home Marathon',
    emoji: '\uD83C\uDFE0',
    tier: 'gold',
    type: 'endurance',
    description: 'Marathon clean — every room, every task. Stamina is king.',
    entryFee: 50,
    prizePool: 300,
    bracketSize: 8,
    matchRooms: ['kitchen', 'living-room', 'bathroom', 'bedroom', 'yard'],
    taskTypes: ['cleaning', 'vacuuming', 'dishes', 'cooking', 'scrubbing', 'sweeping'],
    baseMatchDuration: 90,
  },
  {
    id: 'diamond-championship',
    name: 'Diamond Championship',
    emoji: '\uD83D\uDC8E',
    tier: 'diamond',
    type: 'endurance',
    description: 'The ultimate endurance test. Only legends survive all rooms.',
    entryFee: 100,
    prizePool: 600,
    bracketSize: 8,
    matchRooms: ['kitchen', 'living-room', 'bathroom', 'bedroom', 'yard', 'laundry'],
    taskTypes: ['cleaning', 'vacuuming', 'dishes', 'cooking', 'scrubbing', 'sweeping', 'laundry', 'organizing'],
    baseMatchDuration: 110,
  },
];

// ── Helpers ────────────────────────────────────────────

const TIER_COLORS: Record<TournamentTier, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  diamond: '#b9f2ff',
};

export function getTierColor(tier: TournamentTier): string {
  return TIER_COLORS[tier];
}

function makeContestantFromRobot(robotId: RobotId): TournamentContestant {
  const cfg = ROBOT_CONFIGS[robotId];
  return {
    id: `player-${robotId}`,
    name: cfg.name,
    color: cfg.color,
    isPlayer: true,
    speed: Math.round(cfg.playfulness * 50 + cfg.curiosity * 30 + 20),
    efficiency: Math.round(cfg.diligence * 50 + cfg.sensitivity * 30 + 20),
    robotId,
  };
}

function pickNPCs(count: number, tier: TournamentTier): TournamentContestant[] {
  const tierBonus: Record<TournamentTier, number> = { bronze: 0, silver: 8, gold: 15, diamond: 25 };
  const shuffled = [...NPC_OPPONENTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((npc, i) => ({
    ...npc,
    id: `npc-${i}-${Date.now()}`,
    speed: Math.min(100, npc.speed + tierBonus[tier] + Math.floor(Math.random() * 10 - 5)),
    efficiency: Math.min(100, npc.efficiency + tierBonus[tier] + Math.floor(Math.random() * 10 - 5)),
  }));
}

function createBrackets(contestants: TournamentContestant[]): { brackets: BracketMatch[]; totalRounds: number } {
  const size = contestants.length;
  const totalRounds = Math.log2(size);
  const brackets: BracketMatch[] = [];

  // Shuffle contestants for seeding
  const seeded = [...contestants].sort(() => Math.random() - 0.5);

  // First round matches
  for (let i = 0; i < size / 2; i++) {
    brackets.push({
      id: `r1-m${i}`,
      round: 1,
      matchIndex: i,
      contestant1: seeded[i * 2],
      contestant2: seeded[i * 2 + 1],
      winner: null,
      time1: null,
      time2: null,
      status: 'ready',
    });
  }

  // Later rounds (empty slots)
  let matchesInRound = size / 4;
  for (let r = 2; r <= totalRounds; r++) {
    for (let i = 0; i < matchesInRound; i++) {
      brackets.push({
        id: `r${r}-m${i}`,
        round: r,
        matchIndex: i,
        contestant1: null,
        contestant2: null,
        winner: null,
        time1: null,
        time2: null,
        status: 'pending',
      });
    }
    matchesInRound = Math.max(1, matchesInRound / 2);
  }

  return { brackets, totalRounds };
}

export function createTournament(def: TournamentDefinition, robotId: RobotId): TournamentInstance {
  const player = makeContestantFromRobot(robotId);
  const npcs = pickNPCs(def.bracketSize - 1, def.tier);
  const contestants = [player, ...npcs];
  const { brackets, totalRounds } = createBrackets(contestants);

  return {
    definitionId: def.id,
    name: def.name,
    tier: def.tier,
    type: def.type,
    emoji: def.emoji,
    brackets,
    contestants,
    playerRobotId: robotId,
    currentRound: 1,
    totalRounds,
    status: 'in_progress',
    winnerId: null,
    prizePool: def.prizePool,
    startedAt: Date.now(),
  };
}

/** Stat weights per tournament type */
const TYPE_WEIGHTS: Record<TournamentType, { speedW: number; effW: number; variance: number }> = {
  speed: { speedW: 0.45, effW: 0.05, variance: 8 },
  efficiency: { speedW: 0.05, effW: 0.45, variance: 6 },
  endurance: { speedW: 0.20, effW: 0.25, variance: 14 },
};

/** Simulate a single match — returns winning contestant */
export function simulateMatch(match: BracketMatch, baseDuration: number, type: TournamentType = 'speed'): BracketMatch {
  const c1 = match.contestant1!;
  const c2 = match.contestant2!;
  const w = TYPE_WEIGHTS[type];

  // Calculate completion times (lower is better) — weights differ per tournament type
  const variance = () => Math.random() * w.variance * 2 - w.variance;
  const time1 = Math.max(10, baseDuration - (c1.speed * w.speedW + c1.efficiency * w.effW) + variance());
  const time2 = Math.max(10, baseDuration - (c2.speed * w.speedW + c2.efficiency * w.effW) + variance());

  const roundedT1 = Math.round(time1 * 10) / 10;
  const roundedT2 = Math.round(time2 * 10) / 10;

  return {
    ...match,
    time1: roundedT1,
    time2: roundedT2,
    winner: roundedT1 <= roundedT2 ? c1 : c2,
    status: 'complete',
  };
}

/** Get trophy for placement */
export function getTrophy(placement: number, tier: TournamentTier): string | null {
  if (placement === 1) {
    const trophies: Record<TournamentTier, string> = {
      bronze: '\uD83E\uDD49', silver: '\uD83E\uDD48', gold: '\uD83C\uDFC6', diamond: '\uD83D\uDC8E',
    };
    return trophies[tier];
  }
  if (placement === 2) return '\uD83E\uDD48';
  if (placement <= 4) return '\uD83E\uDD49';
  return null;
}

/** Advance tournament to next round — populate next bracket slots */
export function advanceRound(tournament: TournamentInstance): TournamentInstance {
  const currentRound = tournament.currentRound;
  const nextRound = currentRound + 1;

  // Get completed matches from current round
  const currentMatches = tournament.brackets
    .filter((b) => b.round === currentRound && b.status === 'complete')
    .sort((a, b) => a.matchIndex - b.matchIndex);

  // Get next round matches
  const nextMatches = tournament.brackets.filter((b) => b.round === nextRound);

  if (nextMatches.length === 0) {
    // Tournament is over
    const finalMatch = currentMatches[0];
    return {
      ...tournament,
      status: 'complete',
      winnerId: finalMatch?.winner?.id ?? null,
    };
  }

  // Feed winners into next round
  const updatedBrackets = tournament.brackets.map((b) => {
    if (b.round !== nextRound) return b;
    const feedIndex = b.matchIndex;
    const feeder1 = currentMatches[feedIndex * 2];
    const feeder2 = currentMatches[feedIndex * 2 + 1];
    return {
      ...b,
      contestant1: feeder1?.winner ?? null,
      contestant2: feeder2?.winner ?? null,
      status: 'ready' as const,
    };
  });

  return {
    ...tournament,
    brackets: updatedBrackets,
    currentRound: nextRound,
  };
}

export function getPlayerPlacement(tournament: TournamentInstance, playerRobotId: RobotId): number {
  const playerId = `player-${playerRobotId}`;

  // Check if player won
  if (tournament.winnerId === playerId) return 1;

  // Find the round where the player lost
  const playerLossMatch = tournament.brackets.find(
    (b) =>
      b.status === 'complete' &&
      (b.contestant1?.id === playerId || b.contestant2?.id === playerId) &&
      b.winner?.id !== playerId
  );

  if (!playerLossMatch) return tournament.contestants.length; // Didn't play?

  const lostInRound = playerLossMatch.round;
  // Placement = number of contestants who lost in later rounds + 1
  // E.g. lost in round 1 of 3-round bracket = 5th-8th place
  const remaining = Math.pow(2, tournament.totalRounds - lostInRound);
  return remaining + 1;
}
