import { useState } from 'react';
import { useStore } from '../../stores/useStore';
import { ROBOT_CONFIGS } from '../../config/robots';
import { ROBOT_IDS } from '../../types';
import type { RobotId } from '../../types';
import {
  computeRobotScore,
  computeSessionScore,
  getRobotRankings,
  type RobotAllTimeStats,
  type RobotSessionStats,
} from '../../systems/Leaderboard';

type Tab = 'current' | 'alltime' | 'history';

const MEDAL_COLORS = [
  { bg: 'bg-yellow-400/20', border: 'border-yellow-400/40', text: 'text-yellow-300', icon: '🥇', label: 'gold' },
  { bg: 'bg-gray-300/15', border: 'border-gray-300/30', text: 'text-gray-300', icon: '🥈', label: 'silver' },
  { bg: 'bg-amber-600/15', border: 'border-amber-600/30', text: 'text-amber-400', icon: '🥉', label: 'bronze' },
] as const;

function formatTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatSimTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StatRow({ label, value, color = 'text-white' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-white/50">{label}</span>
      <span className={`text-xs font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'text-2xl px-4 py-1.5' : size === 'md' ? 'text-base px-3 py-1' : 'text-xs px-2 py-0.5';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ${sizeClass} ${
      score >= 200 ? 'bg-yellow-400/20 text-yellow-300' :
      score >= 100 ? 'bg-blue-400/20 text-blue-300' :
      score >= 50 ? 'bg-green-400/20 text-green-300' :
      'bg-white/10 text-white/60'
    }`}>
      {score}
    </span>
  );
}

function RobotCard({
  robotId,
  stats,
  rank,
  score,
}: {
  robotId: RobotId;
  stats: RobotSessionStats | RobotAllTimeStats;
  rank: number;
  score: number;
}) {
  const cfg = ROBOT_CONFIGS[robotId];
  const robotColors = useStore((s) => s.robotColors);
  const color = robotColors[robotId] ?? cfg.color;
  const medal = rank < 3 ? MEDAL_COLORS[rank] : null;
  const tasks = 'tasksCompleted' in stats ? stats.tasksCompleted : (stats as RobotAllTimeStats).totalTasksCompleted;

  return (
    <div className={`rounded-xl border p-3 transition-all ${
      medal ? `${medal.bg} ${medal.border}` : 'border-white/10 bg-white/5'
    }`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {medal && <span className="text-lg">{medal.icon}</span>}
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className={`text-sm font-semibold ${medal ? medal.text : 'text-white'}`}>
            {cfg.name}
          </span>
        </div>
        <ScoreBadge score={score} size="sm" />
      </div>

      <div className="space-y-0.5">
        <StatRow label="Tasks" value={tasks} color="text-cyan-300" />
        <StatRow
          label="Avg Cleanliness"
          value={`${Math.round(stats.avgCleanliness)}%`}
          color={stats.avgCleanliness >= 70 ? 'text-green-400' : stats.avgCleanliness >= 40 ? 'text-yellow-400' : 'text-red-400'}
        />
        {'totalCleanTime' in stats && (
          <StatRow label="Time Working" value={formatSimTime(stats.totalCleanTime)} color="text-purple-300" />
        )}
        {'fastestTaskTime' in stats && (stats as RobotAllTimeStats).fastestTaskTime < Infinity && (
          <StatRow label="Best Avg Speed" value={`${Math.round((stats as RobotAllTimeStats).fastestTaskTime)}s`} color="text-purple-300" />
        )}
        <StatRow
          label="Task Types"
          value={Object.keys(stats.tasksByType).length}
          color="text-amber-300"
        />
      </div>
    </div>
  );
}

function CurrentSessionTab() {
  const sessionStats = useStore((s) => s.sessionStats);
  const simMinutes = useStore((s) => s.simMinutes);

  const ranked = ROBOT_IDS
    .map((rid) => ({ robotId: rid, score: computeRobotScore(sessionStats[rid]) }))
    .sort((a, b) => b.score - a.score);

  const totalScore = computeSessionScore(sessionStats);
  const totalTasks = ROBOT_IDS.reduce((sum, rid) => sum + sessionStats[rid].tasksCompleted, 0);

  return (
    <div className="space-y-3">
      {/* Session overview */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/30">Current Session</span>
          <ScoreBadge score={totalScore} />
        </div>
        <StatRow label="Total Tasks" value={totalTasks} color="text-cyan-300" />
        <StatRow label="Sim Time" value={formatSimTime(simMinutes)} color="text-purple-300" />
      </div>

      {/* Per-robot cards */}
      {ranked.map((r, i) => (
        <RobotCard
          key={r.robotId}
          robotId={r.robotId}
          stats={sessionStats[r.robotId]}
          rank={i}
          score={r.score}
        />
      ))}

      {totalTasks === 0 && (
        <div className="py-6 text-center text-xs text-white/30">
          No tasks completed yet this session.
          <br />Watch the robots work to start scoring!
        </div>
      )}
    </div>
  );
}

function AllTimeTab() {
  const lb = useStore((s) => s.leaderboardData);
  const rankings = getRobotRankings(lb);

  return (
    <div className="space-y-3">
      {/* Overall best */}
      <div className="rounded-xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/10 to-amber-600/10 p-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <span className="text-sm font-bold text-yellow-300">All-Time Best Score</span>
        </div>
        <div className="text-3xl font-black text-yellow-200">
          {lb.overallBestScore > 0 ? lb.overallBestScore : '—'}
        </div>
        <div className="mt-1 text-[10px] text-yellow-400/50">
          {lb.sessions.length} session{lb.sessions.length !== 1 ? 's' : ''} recorded
        </div>
      </div>

      {/* Robot rankings */}
      <div className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
        Robot Rankings
      </div>
      {rankings.map((r, i) => {
        const at = lb.allTime[r.robotId];
        return (
          <RobotCard
            key={r.robotId}
            robotId={r.robotId}
            stats={at}
            rank={i}
            score={at.bestSessionScore}
          />
        );
      })}

      {lb.sessions.length === 0 && (
        <div className="py-4 text-center text-xs text-white/30">
          Complete tasks to build your all-time record!
        </div>
      )}
    </div>
  );
}

function SessionHistoryTab() {
  const lb = useStore((s) => s.leaderboardData);
  const sessions = [...lb.sessions].reverse().slice(0, 20);

  if (sessions.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-white/30">
        No sessions recorded yet.
        <br />Play for a while and check back!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const isBest = session.id === lb.overallBestSessionId;
        const totalTasks = ROBOT_IDS.reduce((sum, rid) => sum + session.robotStats[rid].tasksCompleted, 0);

        return (
          <div
            key={session.id}
            className={`rounded-xl border p-3 transition-all ${
              isBest
                ? 'border-yellow-400/30 bg-yellow-400/10'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isBest && <span className="text-sm">🏆</span>}
                <span className="text-xs text-white/50">{formatTime(session.startedAt)}</span>
              </div>
              <ScoreBadge score={session.overallScore} size="sm" />
            </div>
            <div className="flex items-center gap-3 text-[11px] text-white/40">
              <span>{totalTasks} tasks</span>
              <span>{formatSimTime(session.simMinutesPlayed)} sim</span>
              {/* Mini robot scores */}
              <div className="ml-auto flex gap-1.5">
                {ROBOT_IDS.map((rid) => {
                  const cfg = ROBOT_CONFIGS[rid];
                  const rs = session.robotStats[rid];
                  return (
                    <span key={rid} className="flex items-center gap-0.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span className="text-[10px] text-white/50">{rs.tasksCompleted}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LeaderboardPanel() {
  const showLeaderboard = useStore((s) => s.showLeaderboard);
  const setShowLeaderboard = useStore((s) => s.setShowLeaderboard);
  const [tab, setTab] = useState<Tab>('current');

  if (!showLeaderboard) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowLeaderboard(false)}
      />

      {/* Panel */}
      <div className="relative w-[420px] max-h-[80vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-900/95 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏆</span>
            <h2 className="text-lg font-semibold text-white">Leaderboard</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowLeaderboard(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            type="button"
            onClick={() => setTab('current')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'current'
                ? 'border-b-2 border-blue-400 text-blue-300'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            Session
          </button>
          <button
            type="button"
            onClick={() => setTab('alltime')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'alltime'
                ? 'border-b-2 border-yellow-400 text-yellow-300'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            All-Time
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'history'
                ? 'border-b-2 border-purple-400 text-purple-300'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            History
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[55vh] overflow-y-auto p-4">
          {tab === 'current' && <CurrentSessionTab />}
          {tab === 'alltime' && <AllTimeTab />}
          {tab === 'history' && <SessionHistoryTab />}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 py-3">
          <p className="text-center text-[11px] text-white/25">
            Earn points: 10/task + cleanliness bonus + variety bonus
          </p>
        </div>
      </div>
    </div>
  );
}
