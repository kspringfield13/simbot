import { useState, useEffect } from 'react';
import { useStore } from '../../stores/useStore';
import { CHALLENGES, getChallengesForRoom, getStarsForTime, type ChallengeDefinition } from '../../config/challenges';
import { getActiveRooms } from '../../utils/homeLayout';
import { findTaskTarget } from '../../utils/homeLayout';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function StarDisplay({ count, size = 20 }: { count: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3].map((i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={i <= count ? '#facc15' : 'rgba(255,255,255,0.15)'}
          style={{ width: size, height: size }}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// ── Challenge Selector Panel ─────────────────────────────────

export function ChallengePanel() {
  const showChallengePanel = useStore((s) => s.showChallengePanel);
  const setShowChallengePanel = useStore((s) => s.setShowChallengePanel);
  const activeChallenge = useStore((s) => s.activeChallenge);
  const bestTimes = useStore((s) => s.challengeBestTimes);
  const startChallenge = useStore((s) => s.startChallenge);
  const addTask = useStore((s) => s.addTask);
  const activeRobotId = useStore((s) => s.activeRobotId);

  const [selectedRoom, setSelectedRoom] = useState<string>('all');

  if (!showChallengePanel || activeChallenge) return null;

  const activeRooms = getActiveRooms();
  const roomIds = activeRooms.map((r) => r.id);
  const available = selectedRoom === 'all'
    ? CHALLENGES.filter((c) => roomIds.includes(c.roomId))
    : getChallengesForRoom(selectedRoom).filter((c) => roomIds.includes(c.roomId));

  const handleStart = (challenge: ChallengeDefinition) => {
    // Spawn all tasks for the challenge
    const taskIds: string[] = [];
    for (const t of challenge.tasks) {
      const target = findTaskTarget(t.command);
      if (!target) continue;
      const id = crypto.randomUUID();
      taskIds.push(id);
      addTask({
        id,
        command: t.command,
        source: 'user',
        targetRoom: target.roomId,
        targetPosition: target.position,
        status: 'queued',
        progress: 0,
        description: target.description,
        taskType: target.taskType,
        workDuration: target.workDuration,
        createdAt: Date.now(),
        assignedTo: activeRobotId,
      });
    }
    startChallenge(challenge, taskIds);
  };

  const roomName = (id: string) => activeRooms.find((r) => r.id === id)?.name ?? id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowChallengePanel(false)}
      />
      <div className="relative w-[440px] max-h-[80vh] overflow-hidden rounded-2xl border border-orange-400/20 bg-gray-900/95 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-orange-400">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-base font-semibold text-white">Time Challenges</span>
          </div>
          <button
            type="button"
            onClick={() => setShowChallengePanel(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Room filter */}
        <div className="flex gap-2 overflow-x-auto px-5 py-3 border-b border-white/5">
          <button
            type="button"
            onClick={() => setSelectedRoom('all')}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
              selectedRoom === 'all'
                ? 'bg-orange-500/30 text-orange-200 border border-orange-400/40'
                : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
            }`}
          >
            All
          </button>
          {activeRooms.map((room) => {
            const count = getChallengesForRoom(room.id).length;
            if (count === 0) return null;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoom(room.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  selectedRoom === room.id
                    ? 'bg-orange-500/30 text-orange-200 border border-orange-400/40'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                }`}
              >
                {room.name}
              </button>
            );
          })}
        </div>

        {/* Challenge list */}
        <div className="overflow-y-auto px-5 py-3 space-y-3" style={{ maxHeight: 'calc(80vh - 140px)' }}>
          {available.length === 0 && (
            <p className="text-center text-sm text-white/40 py-8">No challenges for this room.</p>
          )}
          {available.map((challenge) => {
            const best = bestTimes[challenge.id];
            return (
              <div
                key={challenge.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-orange-400/30 hover:bg-white/8"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{challenge.name}</h3>
                    <p className="text-xs text-white/40 mt-0.5">{roomName(challenge.roomId)}</p>
                  </div>
                  {best && <StarDisplay count={best.stars} size={16} />}
                </div>
                <p className="text-xs text-white/60 mb-3">{challenge.description}</p>

                {/* Star thresholds */}
                <div className="flex gap-4 mb-3 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <StarDisplay count={3} size={10} />
                    &lt;{formatTime(challenge.starThresholds[0])}
                  </span>
                  <span className="flex items-center gap-1">
                    <StarDisplay count={2} size={10} />
                    &lt;{formatTime(challenge.starThresholds[1])}
                  </span>
                  <span className="flex items-center gap-1">
                    <StarDisplay count={1} size={10} />
                    &lt;{formatTime(challenge.starThresholds[2])}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/30">
                    {challenge.tasks.length} task{challenge.tasks.length > 1 ? 's' : ''}
                    {best && ` · Best: ${formatTime(best.timeSeconds)}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStart(challenge)}
                    className="rounded-lg bg-orange-500/80 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-orange-500 active:scale-95"
                  >
                    Start
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Active Challenge Timer (HUD overlay) ─────────────────────

export function ChallengeTimer() {
  const activeChallenge = useStore((s) => s.activeChallenge);
  const cancelChallenge = useStore((s) => s.cancelChallenge);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeChallenge) { setElapsed(0); return; }
    const interval = setInterval(() => {
      setElapsed((Date.now() - activeChallenge.startedAt) / 1000);
    }, 100);
    return () => clearInterval(interval);
  }, [activeChallenge]);

  if (!activeChallenge) return null;

  const { challenge, tasksCompleted, totalTasks } = activeChallenge;
  const progress = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

  // Color based on which star threshold we're approaching
  const thresholds = challenge.starThresholds;
  const timerColor = elapsed <= thresholds[0] ? '#4ade80'
    : elapsed <= thresholds[1] ? '#facc15'
    : '#f87171';

  return (
    <div className="pointer-events-auto fixed left-1/2 top-4 z-50 -translate-x-1/2">
      <div className="flex flex-col items-center rounded-2xl border border-orange-400/30 bg-black/80 px-6 py-3 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-medium text-orange-300 uppercase tracking-wider">{challenge.name}</span>
          <button
            type="button"
            onClick={cancelChallenge}
            className="text-white/30 hover:text-red-400 transition-colors text-xs"
            title="Cancel challenge"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Timer */}
        <div className="text-3xl font-mono font-bold tabular-nums" style={{ color: timerColor }}>
          {formatTime(elapsed)}
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #f97316, #facc15)',
            }}
          />
        </div>

        <div className="mt-1 text-xs text-white/50">
          {tasksCompleted}/{totalTasks} tasks
        </div>

        {/* Potential stars */}
        <div className="mt-1">
          <StarDisplay count={getStarsForTime(challenge, elapsed)} size={14} />
        </div>
      </div>
    </div>
  );
}

// ── Challenge Results Modal ──────────────────────────────────

export function ChallengeResultsModal() {
  const result = useStore((s) => s.challengeResult);
  const dismiss = useStore((s) => s.dismissChallengeResult);
  const setShowChallengePanel = useStore((s) => s.setShowChallengePanel);

  if (!result) return null;

  const { challenge, timeSeconds, stars, isNewBest } = result;
  const coinReward = challenge.coinReward * stars;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={dismiss}
      />
      <div className="relative w-[360px] overflow-hidden rounded-2xl border border-orange-400/30 bg-gray-900/95 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
        {/* Glow effect */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: stars === 3
              ? 'radial-gradient(circle at 50% 0%, #facc15 0%, transparent 60%)'
              : stars === 2
              ? 'radial-gradient(circle at 50% 0%, #f97316 0%, transparent 60%)'
              : 'radial-gradient(circle at 50% 0%, #64748b 0%, transparent 60%)',
          }}
        />

        <div className="relative px-6 py-8 text-center">
          {/* Title */}
          <h2 className="text-lg font-bold text-white mb-1">Challenge Complete!</h2>
          <p className="text-sm text-orange-300 mb-6">{challenge.name}</p>

          {/* Stars */}
          <div className="flex justify-center mb-4">
            <StarDisplay count={stars} size={40} />
          </div>

          {/* Time */}
          <div className="text-4xl font-mono font-bold text-white mb-2 tabular-nums">
            {formatTime(timeSeconds)}
          </div>

          {isNewBest && (
            <div className="inline-block rounded-full bg-yellow-500/20 border border-yellow-400/30 px-3 py-1 text-xs font-semibold text-yellow-300 mb-4">
              New Best Time!
            </div>
          )}

          {/* Rewards */}
          <div className="mt-4 rounded-lg bg-white/5 border border-white/10 p-3 mb-6">
            <div className="flex items-center justify-center gap-2">
              <span className="text-yellow-400 text-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </span>
              <span className="text-white font-semibold">+{coinReward} coins</span>
              <span className="text-white/40 text-xs">({stars} stars x {challenge.coinReward})</span>
            </div>
          </div>

          {/* Star thresholds reference */}
          <div className="flex justify-center gap-4 mb-6 text-xs text-white/30">
            <span className="flex items-center gap-1">
              <StarDisplay count={3} size={8} />
              &lt;{formatTime(challenge.starThresholds[0])}
            </span>
            <span className="flex items-center gap-1">
              <StarDisplay count={2} size={8} />
              &lt;{formatTime(challenge.starThresholds[1])}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => { dismiss(); setShowChallengePanel(true); }}
              className="rounded-lg border border-orange-400/30 bg-orange-500/20 px-5 py-2 text-sm font-medium text-orange-200 transition-all hover:bg-orange-500/30"
            >
              More Challenges
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg bg-white/10 px-5 py-2 text-sm font-medium text-white/70 transition-all hover:bg-white/15"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
