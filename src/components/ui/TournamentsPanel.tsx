import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../stores/useStore';
import {
  TOURNAMENTS,
  TOURNAMENT_TYPE_META,
  createTournament,
  simulateMatch,
  advanceRound,
  getPlayerPlacement,
  getTierColor,
  getTrophy,
  type TournamentDefinition,
  type TournamentInstance,
  type TournamentContestant,
  type BracketMatch,
  type TournamentTier,
  type TournamentType,
} from '../../config/tournaments';
import { ROBOT_CONFIGS } from '../../config/robots';
import { loadTournamentHistory, saveTournamentResult, getTournamentStats } from '../../utils/tournamentProgress';
import type { TournamentHistoryEntry } from '../../config/tournaments';
import type { RobotId } from '../../types';
import { ROBOT_IDS } from '../../types';

type View = 'list' | 'registration' | 'bracket' | 'celebration' | 'history';

// ── Tier badge ─────────────────────────────────────────

function TierBadge({ tier }: { tier: TournamentTier }) {
  const color = getTierColor(tier);
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: `${color}30`, color, border: `1px solid ${color}50` }}
    >
      {tier}
    </span>
  );
}

function TypeBadge({ type }: { type: TournamentType }) {
  const meta = TOURNAMENT_TYPE_META[type];
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}40` }}
    >
      {meta.emoji} {meta.label}
    </span>
  );
}

// ── Bracket connector lines (SVG) ──────────────────────

function BracketConnectors({ totalRounds, bracketSize }: { totalRounds: number; bracketSize: number }) {
  const lines: React.ReactElement[] = [];
  const matchH = 72;
  const matchW = 152;
  const gapX = 40;
  const colW = matchW + gapX;

  for (let r = 0; r < totalRounds - 1; r++) {
    const matchesThisRound = bracketSize / Math.pow(2, r + 1);
    const matchesNextRound = matchesThisRound / 2;

    for (let m = 0; m < matchesNextRound; m++) {
      const topIdx = m * 2;
      const botIdx = m * 2 + 1;

      const thisSpacing = (bracketSize / matchesThisRound) * matchH;
      const nextSpacing = (bracketSize / matchesNextRound) * matchH;

      const x1 = r * colW + matchW;
      const y1Top = topIdx * thisSpacing + thisSpacing / 2;
      const y1Bot = botIdx * thisSpacing + thisSpacing / 2;

      const x2 = (r + 1) * colW;
      const y2 = m * nextSpacing + nextSpacing / 2;

      const midX = (x1 + x2) / 2;

      lines.push(
        <path
          key={`${r}-${m}`}
          d={`M${x1},${y1Top} H${midX} V${y2} H${x2} M${x1},${y1Bot} H${midX} V${y2}`}
          stroke="rgba(148,163,184,0.3)"
          strokeWidth={2}
          fill="none"
        />
      );
    }
  }

  const totalW = totalRounds * colW;
  const totalH = bracketSize * matchH;
  return (
    <svg className="pointer-events-none absolute inset-0" width={totalW} height={totalH} style={{ minWidth: totalW, minHeight: totalH }}>
      {lines}
    </svg>
  );
}

// ── Live race progress bars ──────────────────────────────

function RaceProgressBars({
  contestant1,
  contestant2,
}: {
  contestant1: TournamentContestant | null;
  contestant2: TournamentContestant | null;
}) {
  const [progress1, setProgress1] = useState(0);
  const [progress2, setProgress2] = useState(0);

  useEffect(() => {
    if (!contestant1 || !contestant2) return;
    const rate1 = contestant1.speed * 0.6 + contestant1.efficiency * 0.4;
    const rate2 = contestant2.speed * 0.6 + contestant2.efficiency * 0.4;
    const maxRate = Math.max(rate1, rate2);
    const norm1 = rate1 / maxRate;
    const norm2 = rate2 / maxRate;
    let frame: number;
    const start = performance.now();
    const duration = 750; // ms

    function tick() {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setProgress1(Math.min(ease * norm1 * 100 + Math.random() * 2, 100));
      setProgress2(Math.min(ease * norm2 * 100 + Math.random() * 2, 100));
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [contestant1, contestant2]);

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: contestant1?.color ?? '#888' }} />
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-none"
            style={{
              width: `${progress1}%`,
              backgroundColor: contestant1?.color ?? '#888',
              boxShadow: `0 0 6px ${contestant1?.color ?? '#888'}80`,
            }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: contestant2?.color ?? '#888' }} />
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-none"
            style={{
              width: `${progress2}%`,
              backgroundColor: contestant2?.color ?? '#888',
              boxShadow: `0 0 6px ${contestant2?.color ?? '#888'}80`,
            }}
          />
        </div>
      </div>
      <div className="text-center text-[9px] font-semibold text-amber-400 animate-pulse">Racing...</div>
    </div>
  );
}

// ── Single match card ──────────────────────────────────

function MatchCard({
  match,
  onSimulate,
  isPlayerMatch,
}: {
  match: BracketMatch;
  onSimulate: (match: BracketMatch) => void;
  isPlayerMatch: boolean;
}) {
  const c1 = match.contestant1;
  const c2 = match.contestant2;

  return (
    <div
      className={`relative w-[148px] rounded-lg border p-2 text-xs transition-all ${
        match.status === 'complete'
          ? 'border-slate-600/50 bg-slate-800/60'
          : match.status === 'ready'
            ? isPlayerMatch
              ? 'border-cyan-400/50 bg-cyan-900/20 shadow-lg shadow-cyan-500/10'
              : 'border-slate-500/50 bg-slate-800/80'
            : 'border-slate-700/30 bg-slate-900/40'
      }`}
    >
      {/* Contestant 1 */}
      <div className={`flex items-center gap-1.5 ${match.winner && match.winner.id === c1?.id ? 'font-bold text-green-300' : match.winner && match.winner.id !== c1?.id ? 'text-slate-500 line-through' : ''}`}>
        {c1 ? (
          <>
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: c1.color }} />
            <span className="truncate flex-1">{c1.name}</span>
            {match.time1 != null && <span className="text-[10px] tabular-nums text-slate-400">{match.time1.toFixed(1)}s</span>}
            {c1.isPlayer && <span className="text-[9px] text-cyan-400">YOU</span>}
          </>
        ) : (
          <span className="text-slate-600 italic">TBD</span>
        )}
      </div>

      {/* Result bars for completed matches */}
      {match.status === 'complete' && match.time1 != null && match.time2 != null && (
        <div className="my-1 space-y-0.5">
          <div className="h-1 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(20, 100 - (match.time1 / Math.max(match.time1, match.time2)) * 50)}%`,
                backgroundColor: match.winner?.id === c1?.id ? '#4ade80' : '#ef4444',
                opacity: match.winner?.id === c1?.id ? 1 : 0.4,
              }}
            />
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(20, 100 - (match.time2 / Math.max(match.time1, match.time2)) * 50)}%`,
                backgroundColor: match.winner?.id === c2?.id ? '#4ade80' : '#ef4444',
                opacity: match.winner?.id === c2?.id ? 1 : 0.4,
              }}
            />
          </div>
        </div>
      )}

      {match.status !== 'complete' && <div className="my-1 h-px bg-slate-700/50" />}

      {/* Contestant 2 */}
      <div className={`flex items-center gap-1.5 ${match.winner && match.winner.id === c2?.id ? 'font-bold text-green-300' : match.winner && match.winner.id !== c2?.id ? 'text-slate-500 line-through' : ''}`}>
        {c2 ? (
          <>
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: c2.color }} />
            <span className="truncate flex-1">{c2.name}</span>
            {match.time2 != null && <span className="text-[10px] tabular-nums text-slate-400">{match.time2.toFixed(1)}s</span>}
            {c2.isPlayer && <span className="text-[9px] text-cyan-400">YOU</span>}
          </>
        ) : (
          <span className="text-slate-600 italic">TBD</span>
        )}
      </div>

      {/* Simulate button for ready matches */}
      {match.status === 'ready' && (
        <button
          type="button"
          onClick={() => onSimulate(match)}
          className={`mt-1.5 w-full rounded py-1 text-[10px] font-semibold uppercase tracking-wider transition-all ${
            isPlayerMatch
              ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
              : 'bg-slate-600/30 text-slate-300 hover:bg-slate-600/50'
          }`}
        >
          {match.status === 'ready' ? 'Race!' : 'Watch'}
        </button>
      )}

      {match.status === 'simulating' && (
        <RaceProgressBars contestant1={c1} contestant2={c2} />
      )}
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────

export function TournamentsPanel() {
  const show = useStore((s) => s.showTournaments);
  const setShow = useStore((s) => s.setShowTournaments);
  const coins = useStore((s) => s.coins);
  const addCoins = useStore((s) => s.addCoins);
  const addCoinAnimation = useStore((s) => s.addCoinAnimation);
  const recordTransaction = useStore((s) => s.recordTransaction);
  const addNotification = useStore((s) => s.addNotification);

  const [view, setView] = useState<View>('list');
  const [selectedDef, setSelectedDef] = useState<TournamentDefinition | null>(null);
  const [selectedRobot, setSelectedRobot] = useState<RobotId>('sim');
  const [tournament, setTournament] = useState<TournamentInstance | null>(null);
  const [history, setHistory] = useState<TournamentHistoryEntry[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [celebration, setCelebration] = useState<{ placement: number; prize: number; winnerName: string } | null>(null);

  // Load history on open
  useEffect(() => {
    if (show) {
      setHistory(loadTournamentHistory());
      setView('list');
      setTournament(null);
      setCelebration(null);
    }
  }, [show]);

  // ── Registration ──────────────────────────────────

  const handleSelectTournament = (def: TournamentDefinition) => {
    setSelectedDef(def);
    setView('registration');
  };

  const handleEnter = useCallback(() => {
    if (!selectedDef) return;
    if (coins < selectedDef.entryFee) return;

    // Deduct entry fee
    addCoins(-selectedDef.entryFee);
    recordTransaction('expense', 'upgrade', selectedDef.entryFee, `Tournament entry: ${selectedDef.name}`);

    const t = createTournament(selectedDef, selectedRobot);
    setTournament(t);
    setView('bracket');
  }, [selectedDef, selectedRobot, coins, addCoins, recordTransaction]);

  // ── Match simulation ──────────────────────────────

  const simulateOne = useCallback(
    (match: BracketMatch) => {
      if (!tournament || !selectedDef || simulating) return;
      setSimulating(true);

      // Mark as simulating
      setTournament((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          brackets: prev.brackets.map((b) => (b.id === match.id ? { ...b, status: 'simulating' as const } : b)),
        };
      });

      // Simulate after progress bar animation completes
      setTimeout(() => {
        const result = simulateMatch(match, selectedDef.baseMatchDuration, selectedDef.type);
        setTournament((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            brackets: prev.brackets.map((b) => (b.id === match.id ? result : b)),
          };

          // Check if all matches in current round are complete
          const roundMatches = updated.brackets.filter((b) => b.round === updated.currentRound);
          const allDone = roundMatches.every((b) => b.status === 'complete');

          if (allDone) {
            // Advance to next round
            return advanceRound(updated);
          }
          return updated;
        });
        setSimulating(false);
      }, 1200);
    },
    [tournament, selectedDef, simulating]
  );

  // Auto-simulate NPC-only matches
  useEffect(() => {
    if (!tournament || tournament.status === 'complete' || simulating) return;

    const readyMatches = tournament.brackets.filter((b) => b.status === 'ready');
    const npcOnly = readyMatches.filter(
      (m) => m.contestant1 && m.contestant2 && !m.contestant1.isPlayer && !m.contestant2.isPlayer
    );

    if (npcOnly.length > 0 && !simulating) {
      // Queue up NPC matches with staggered delays
      const timer = setTimeout(() => {
        simulateOne(npcOnly[0]);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [tournament, simulating, simulateOne]);

  // Tournament completion
  useEffect(() => {
    if (!tournament || tournament.status !== 'complete' || celebration) return;

    const placement = getPlayerPlacement(tournament, tournament.playerRobotId);
    const prize = placement === 1 ? tournament.prizePool : placement === 2 ? Math.floor(tournament.prizePool * 0.4) : placement <= 4 ? Math.floor(tournament.prizePool * 0.1) : 0;

    const winner = tournament.contestants.find((c) => c.id === tournament.winnerId);

    if (prize > 0) {
      addCoins(prize);
      addCoinAnimation(prize);
      recordTransaction('income', 'task-reward', prize, `Tournament prize: ${tournament.name}`);
    }

    const trophy = getTrophy(placement, tournament.tier);

    const entry: TournamentHistoryEntry = {
      tournamentId: tournament.definitionId,
      tournamentName: tournament.name,
      tier: tournament.tier,
      type: tournament.type,
      emoji: tournament.emoji,
      playerRobotId: tournament.playerRobotId,
      placement,
      totalContestants: tournament.contestants.length,
      prizeWon: prize,
      completedAt: Date.now(),
      winnerId: tournament.winnerId ?? '',
      winnerName: winner?.name ?? 'Unknown',
      trophy,
    };
    saveTournamentResult(entry);
    setHistory((prev) => [entry, ...prev]);

    setCelebration({ placement, prize, winnerName: winner?.name ?? 'Unknown' });
    setView('celebration');

    if (placement === 1) {
      addNotification({
        type: 'achievement',
        title: 'Tournament Champion!',
        message: `${tournament.emoji} Won the ${tournament.name}! +${prize} coins`,
      });
    }
  }, [tournament, celebration, addCoins, addCoinAnimation, recordTransaction, addNotification]);

  if (!show) return null;

  const stats = getTournamentStats(history);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShow(false)} />

      {/* Panel */}
      <div className="relative flex max-h-[85vh] w-[560px] flex-col rounded-2xl border border-cyan-400/20 bg-gray-900/95 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-400/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{'\uD83C\uDFC6'}</span>
            <h2 className="text-lg font-bold text-cyan-50">Robot Tournaments</h2>
            {stats.wins > 0 && (
              <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                {stats.wins} {stats.wins === 1 ? 'Win' : 'Wins'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {view !== 'list' && view !== 'celebration' && (
              <button
                type="button"
                onClick={() => { setView('list'); setTournament(null); setCelebration(null); }}
                className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => setView('history')}
              className={`rounded-lg px-2 py-1 text-xs transition-colors ${view === 'history' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`}
            >
              History
            </button>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              {'\u2715'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {view === 'list' && <TournamentList coins={coins} onSelect={handleSelectTournament} stats={stats} />}
          {view === 'registration' && selectedDef && (
            <Registration
              def={selectedDef}
              coins={coins}
              selectedRobot={selectedRobot}
              onSelectRobot={setSelectedRobot}
              onEnter={handleEnter}
              onBack={() => setView('list')}
            />
          )}
          {view === 'bracket' && tournament && (
            <BracketView tournament={tournament} onSimulate={simulateOne} simulating={simulating} />
          )}
          {view === 'celebration' && celebration && tournament && (
            <CelebrationView
              placement={celebration.placement}
              prize={celebration.prize}
              winnerName={celebration.winnerName}
              tournament={tournament}
              onDone={() => { setView('list'); setTournament(null); setCelebration(null); }}
            />
          )}
          {view === 'history' && <HistoryView history={history} />}
        </div>
      </div>
    </div>
  );
}

// ── Tournament List View ───────────────────────────────

function TournamentList({
  coins,
  onSelect,
  stats,
}: {
  coins: number;
  onSelect: (def: TournamentDefinition) => void;
  stats: { wins: number; totalPlayed: number; totalPrize: number; bestPlacement: number; trophies: string[] };
}) {
  const [typeFilter, setTypeFilter] = useState<TournamentType | 'all'>('all');
  const filtered = typeFilter === 'all' ? TOURNAMENTS : TOURNAMENTS.filter((d) => d.type === typeFilter);

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      {stats.totalPlayed > 0 && (
        <div className="flex flex-wrap gap-3 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-xs text-slate-400">
          <span>{'\uD83C\uDFC6'} {stats.wins} wins</span>
          <span>{'\uD83C\uDFAE'} {stats.totalPlayed} played</span>
          <span>{'\uD83D\uDCB0'} {stats.totalPrize} earned</span>
          {stats.bestPlacement > 0 && <span>{'\u2B50'} Best: #{stats.bestPlacement}</span>}
          {stats.trophies.length > 0 && <span>{stats.trophies.slice(0, 5).join('')}</span>}
        </div>
      )}

      {/* Type filter tabs */}
      <div className="flex gap-1.5 rounded-lg border border-slate-700/30 bg-slate-800/30 p-1">
        {(['all', 'speed', 'efficiency', 'endurance'] as const).map((t) => {
          const active = typeFilter === t;
          const meta = t === 'all' ? null : TOURNAMENT_TYPE_META[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-all ${
                active ? 'bg-slate-700/80 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              style={active && meta ? { color: meta.color } : undefined}
            >
              {t === 'all' ? 'All' : `${meta!.emoji} ${meta!.label}`}
            </button>
          );
        })}
      </div>

      {/* Tournament cards */}
      {filtered.map((def) => {
        const canAfford = coins >= def.entryFee;
        const typeMeta = TOURNAMENT_TYPE_META[def.type];
        return (
          <button
            key={def.id}
            type="button"
            onClick={() => onSelect(def)}
            className="group w-full rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 text-left transition-all hover:border-cyan-400/30 hover:bg-slate-800/80"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{def.emoji}</span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-100">{def.name}</span>
                    <TierBadge tier={def.tier} />
                    <TypeBadge type={def.type} />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{def.description}</p>
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
              <span>{def.bracketSize} bots</span>
              <span>{'\uD83D\uDCB0'} {def.entryFee} entry</span>
              <span className="text-yellow-400">{'\uD83C\uDFC6'} {def.prizePool} prize</span>
              <span style={{ color: typeMeta.color }}>{typeMeta.description}</span>
              {!canAfford && <span className="text-red-400">Need {def.entryFee - coins} more coins</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Registration View ──────────────────────────────────

function Registration({
  def,
  coins,
  selectedRobot,
  onSelectRobot,
  onEnter,
  onBack,
}: {
  def: TournamentDefinition;
  coins: number;
  selectedRobot: RobotId;
  onSelectRobot: (id: RobotId) => void;
  onEnter: () => void;
  onBack: () => void;
}) {
  const canAfford = coins >= def.entryFee;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <span className="text-4xl">{def.emoji}</span>
        <h3 className="mt-2 text-xl font-bold text-slate-100">{def.name}</h3>
        <p className="mt-1 text-sm text-slate-400">{def.description}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <TierBadge tier={def.tier} />
          <TypeBadge type={def.type} />
          <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-400">
            {def.bracketSize}-bot bracket
          </span>
        </div>
        <p className="mt-2 text-xs" style={{ color: TOURNAMENT_TYPE_META[def.type].color }}>
          {TOURNAMENT_TYPE_META[def.type].description}
        </p>
      </div>

      {/* Prize info */}
      <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3 text-center">
        <div className="text-xs text-yellow-400/60">Prize Pool</div>
        <div className="text-2xl font-bold text-yellow-300">{def.prizePool} coins</div>
        <div className="mt-1 text-[10px] text-slate-500">
          1st: {def.prizePool} {'\u00B7'} 2nd: {Math.floor(def.prizePool * 0.4)} {'\u00B7'} 3rd-4th: {Math.floor(def.prizePool * 0.1)}
        </div>
      </div>

      {/* Robot selection */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-300">Choose Your Robot</h4>
        <div className="grid grid-cols-3 gap-2">
          {ROBOT_IDS.map((id) => {
            const cfg = ROBOT_CONFIGS[id];
            const isSelected = selectedRobot === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectRobot(id)}
                className={`rounded-lg border p-3 text-center transition-all ${
                  isSelected
                    ? 'border-cyan-400/50 bg-cyan-900/20 shadow-lg'
                    : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="mx-auto mb-1 h-4 w-4 rounded-full" style={{ backgroundColor: cfg.color }} />
                <div className="text-sm font-semibold text-slate-200">{cfg.name}</div>
                <div className="text-[10px] text-slate-500">{cfg.description}</div>
                <div className="mt-1 flex justify-center gap-1 text-[9px]">
                  <span className={def.type === 'speed' ? 'font-bold text-amber-400' : 'text-blue-400'}>
                    SPD:{Math.round(cfg.playfulness * 50 + cfg.curiosity * 30 + 20)}
                  </span>
                  <span className={def.type === 'efficiency' ? 'font-bold text-emerald-400' : 'text-green-400'}>
                    EFF:{Math.round(cfg.diligence * 50 + cfg.sensitivity * 30 + 20)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Enter button */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-slate-600 py-2.5 text-sm text-slate-400 transition-colors hover:bg-slate-700/50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onEnter}
          disabled={!canAfford}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
            canAfford
              ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
              : 'cursor-not-allowed bg-slate-700/30 text-slate-600'
          }`}
        >
          Enter ({def.entryFee} coins)
        </button>
      </div>
    </div>
  );
}

// ── Bracket View ───────────────────────────────────────

function BracketView({
  tournament,
  onSimulate,
  simulating,
}: {
  tournament: TournamentInstance;
  onSimulate: (match: BracketMatch) => void;
  simulating: boolean;
}) {
  const matchH = 72;
  const matchW = 152;
  const gapX = 40;
  const colW = matchW + gapX;

  const totalW = tournament.totalRounds * colW;
  const totalH = tournament.contestants.length * matchH;

  const roundLabels = [];
  for (let r = 1; r <= tournament.totalRounds; r++) {
    const label =
      r === tournament.totalRounds
        ? 'Final'
        : r === tournament.totalRounds - 1
          ? 'Semi-Final'
          : `Round ${r}`;
    roundLabels.push(label);
  }

  return (
    <div className="space-y-3">
      {/* Tournament header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg">{tournament.emoji}</span>
          <span className="font-semibold text-slate-200">{tournament.name}</span>
          <TierBadge tier={tournament.tier} />
          <TypeBadge type={tournament.type} />
        </div>
        <span className="text-xs text-slate-500">Round {tournament.currentRound} / {tournament.totalRounds}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-slate-700/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-500"
          style={{ width: `${(tournament.currentRound / tournament.totalRounds) * 100}%` }}
        />
      </div>

      {/* Round labels */}
      <div className="flex" style={{ width: totalW }}>
        {roundLabels.map((label, i) => (
          <div key={i} className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500" style={{ width: colW }}>
            {label}
          </div>
        ))}
      </div>

      {/* Bracket grid */}
      <div className="overflow-x-auto rounded-lg border border-slate-700/30 bg-slate-900/50 p-4">
        <div className="relative" style={{ width: totalW, height: totalH }}>
          <BracketConnectors totalRounds={tournament.totalRounds} bracketSize={tournament.contestants.length} />

          {/* Render match cards */}
          {Array.from({ length: tournament.totalRounds }, (_, rIdx) => {
            const round = rIdx + 1;
            const matches = tournament.brackets
              .filter((b) => b.round === round)
              .sort((a, b) => a.matchIndex - b.matchIndex);
            const matchesInRound = matches.length;
            const spacing = (tournament.contestants.length / matchesInRound) * matchH;

            return matches.map((match, mIdx) => {
              const x = rIdx * colW;
              const y = mIdx * spacing + (spacing - 68) / 2;
              const isPlayerMatch =
                match.contestant1?.isPlayer === true || match.contestant2?.isPlayer === true;

              return (
                <div key={match.id} className="absolute" style={{ left: x, top: y }}>
                  <MatchCard
                    match={match}
                    onSimulate={simulating ? () => {} : onSimulate}
                    isPlayerMatch={isPlayerMatch}
                  />
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}

// ── Celebration View ───────────────────────────────────

function CelebrationView({
  placement,
  prize,
  winnerName,
  tournament,
  onDone,
}: {
  placement: number;
  prize: number;
  winnerName: string;
  tournament: TournamentInstance;
  onDone: () => void;
}) {
  const isWinner = placement === 1;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative space-y-6 py-4 text-center">
      {/* Confetti animation */}
      {showConfetti && isWinner && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              className="absolute animate-bounce text-lg"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            >
              {['\u2728', '\uD83C\uDF1F', '\uD83C\uDFC6', '\uD83C\uDF89', '\u2B50'][i % 5]}
            </div>
          ))}
        </div>
      )}

      {/* Result */}
      <div>
        <div className="text-5xl">
          {isWinner ? '\uD83C\uDFC6' : placement === 2 ? '\uD83E\uDD48' : placement <= 4 ? '\uD83E\uDD49' : '\uD83C\uDFAE'}
        </div>
        <h3 className={`mt-3 text-2xl font-bold ${isWinner ? 'text-yellow-300' : 'text-slate-200'}`}>
          {isWinner ? 'Champion!' : `#${placement} Place`}
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          {tournament.emoji} {tournament.name}
        </p>
        <div className="mt-2 flex justify-center gap-2">
          <TierBadge tier={tournament.tier} />
          <TypeBadge type={tournament.type} />
        </div>
        {getTrophy(placement, tournament.tier) && (
          <div className="mt-3 text-center">
            <span className="text-3xl">{getTrophy(placement, tournament.tier)}</span>
            <div className="text-[10px] text-yellow-400/70 mt-1">Trophy earned!</div>
          </div>
        )}
      </div>

      {/* Winner announcement */}
      {!isWinner && (
        <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3">
          <div className="text-xs text-yellow-400/60">Tournament Winner</div>
          <div className="text-lg font-semibold text-yellow-300">{winnerName}</div>
        </div>
      )}

      {/* Prize */}
      {prize > 0 && (
        <div className="rounded-lg border border-green-400/20 bg-green-400/5 p-4">
          <div className="text-xs text-green-400/60">Prize Earned</div>
          <div className="text-3xl font-bold text-green-300">+{prize} coins</div>
        </div>
      )}

      {/* Placement details */}
      <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="text-slate-500">Placement</div>
            <div className="font-bold text-slate-200">#{placement} of {tournament.contestants.length}</div>
          </div>
          <div>
            <div className="text-slate-500">Tier</div>
            <div className="font-bold" style={{ color: getTierColor(tournament.tier) }}>
              {tournament.tier.charAt(0).toUpperCase() + tournament.tier.slice(1)}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Robot</div>
            <div className="font-bold text-slate-200">
              {ROBOT_CONFIGS[tournament.playerRobotId].name}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="w-full rounded-lg bg-cyan-500/20 py-3 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/30"
      >
        {isWinner ? 'Celebrate & Continue' : 'Back to Tournaments'}
      </button>
    </div>
  );
}

// ── History View ───────────────────────────────────────

function HistoryView({ history }: { history: TournamentHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        No tournament history yet. Enter your first tournament!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-300">Tournament History</h3>
      {history.map((entry, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-slate-700/30 bg-slate-800/40 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{entry.trophy ?? entry.emoji}</span>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 text-sm">
                <span className={entry.placement === 1 ? 'font-bold text-yellow-300' : 'text-slate-300'}>
                  #{entry.placement}
                </span>
                <span className="text-slate-400">{entry.tournamentName}</span>
                <TierBadge tier={entry.tier} />
                {entry.type && <TypeBadge type={entry.type} />}
              </div>
              <div className="text-[10px] text-slate-600">
                {ROBOT_CONFIGS[entry.playerRobotId].name} {'\u00B7'}{' '}
                {new Date(entry.completedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {entry.prizeWon > 0 && (
              <span className="text-xs font-semibold text-green-400">+{entry.prizeWon}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
