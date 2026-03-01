import { useStore } from '../../stores/useStore';
import { ROBOT_CONFIGS } from '../../config/robots';
import { getPersonalityTraits } from '../../systems/Personality';
import { ROBOT_IDS } from '../../types';
import type { RobotId, TaskType } from '../../types';
import { useRobotDisplayName, getRobotDisplayName } from '../../stores/useRobotNames';

const ROBOT_EMOJI: Record<RobotId, string> = {
  sim: '🤖',
  chef: '👨‍🍳',
  sparkle: '✨',
};

const TASK_EMOJI: Record<string, string> = {
  cleaning: '🧹',
  vacuuming: '🧽',
  dishes: '🍽️',
  laundry: '👕',
  organizing: '📦',
  cooking: '🍳',
  'bed-making': '🛏️',
  scrubbing: '🪣',
  sweeping: '🧹',
  'grocery-list': '📝',
  general: '⚙️',
  seasonal: '🎄',
};

const ROOM_EMOJI: Record<string, string> = {
  'living-room': '🛋️',
  kitchen: '🍳',
  hallway: '🚪',
  laundry: '🧺',
  bedroom: '🛏️',
  bathroom: '🚿',
};

const TASK_LABELS: Record<string, string> = {
  cleaning: 'Cleaning',
  vacuuming: 'Vacuuming',
  dishes: 'Dishes',
  laundry: 'Laundry',
  organizing: 'Organizing',
  cooking: 'Cooking',
  'bed-making': 'Bed Making',
  scrubbing: 'Scrubbing',
  sweeping: 'Sweeping',
  'grocery-list': 'Grocery List',
  general: 'General',
  seasonal: 'Seasonal',
};

const ROOM_LABELS: Record<string, string> = {
  'living-room': 'Living Room',
  kitchen: 'Kitchen',
  hallway: 'Hallway',
  laundry: 'Laundry',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
};

function strengthColor(strength: number): string {
  if (strength >= 0.7) return '#f59e0b'; // gold
  if (strength >= 0.4) return '#60a5fa'; // blue
  return '#a78bfa'; // purple
}

function strengthBgColor(strength: number): string {
  if (strength >= 0.7) return 'rgba(245, 158, 11, 0.12)';
  if (strength >= 0.4) return 'rgba(96, 165, 250, 0.10)';
  return 'rgba(167, 139, 250, 0.08)';
}

export function PersonalityPanel() {
  const show = useStore((s) => s.showPersonality);
  const setShow = useStore((s) => s.setShowPersonality);
  const activeRobotId = useStore((s) => s.activeRobotId);
  const setActiveRobotId = useStore((s) => s.setActiveRobotId);
  const personality = useStore((s) => s.personalities[s.activeRobotId]);
  const activeDisplayName = useRobotDisplayName(activeRobotId);

  if (!show) return null;

  const traits = getPersonalityTraits(personality);

  // Top tasks sorted by count
  const taskEntries = Object.entries(personality.taskCounts) as [TaskType, number][];
  taskEntries.sort(([, a], [, b]) => b - a);

  // Top rooms sorted by time
  const roomEntries = Object.entries(personality.roomTimeMins) as [string, number][];
  roomEntries.sort(([, a], [, b]) => b - a);

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShow(false)}
        onKeyDown={(e) => { if (e.key === 'Escape') setShow(false); }}
        role="button"
        tabIndex={-1}
        aria-label="Close personality panel"
      />

      {/* Panel */}
      <div className="relative z-10 flex w-[440px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-xl" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🧬</span>
            <span className="text-sm font-semibold text-white">{activeDisplayName}'s Personality</span>
            <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300/70">
              {personality.totalTasksDone} tasks learned
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="text-white/50 transition-colors hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Robot tabs */}
        <div className="flex border-b border-white/10">
          {ROBOT_IDS.map((rid) => {
            const rc = ROBOT_CONFIGS[rid];
            const isActive = rid === activeRobotId;
            const p = useStore.getState().personalities[rid];
            const traitCount = getPersonalityTraits(p).length;
            return (
              <button
                key={rid}
                type="button"
                onClick={() => setActiveRobotId(rid)}
                className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs transition-all ${
                  isActive
                    ? 'border-b-2 bg-white/5 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
                style={isActive ? { borderBottomColor: rc.color } : undefined}
              >
                <span>{ROBOT_EMOJI[rid]}</span>
                <span>{getRobotDisplayName(rid)}</span>
                {traitCount > 0 && (
                  <span className="rounded-full bg-purple-500/20 px-1.5 text-[9px] text-purple-300/80">{traitCount}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ maxHeight: '65vh' }}>
          {/* Personality Traits */}
          <div className="mb-5">
            <div className="mb-3 text-[11px] uppercase tracking-wider text-white/40">
              Developed Traits
            </div>
            {traits.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] py-8 text-center">
                <span className="text-2xl">🌱</span>
                <p className="text-xs text-white/30">
                  {personality.totalTasksDone === 0
                    ? `${activeDisplayName} hasn't completed any tasks yet.`
                    : `${activeDisplayName} is still developing preferences...`}
                </p>
                <p className="text-[10px] text-white/20">Traits emerge as robots complete more tasks and spend time in rooms.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {traits.map((trait) => (
                  <div
                    key={`${trait.type}-${trait.key}`}
                    className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors"
                    style={{
                      borderColor: `${strengthColor(trait.strength)}22`,
                      backgroundColor: strengthBgColor(trait.strength),
                    }}
                  >
                    <span className="text-base">
                      {trait.type === 'task' ? (TASK_EMOJI[trait.key] ?? '⚙️') : (ROOM_EMOJI[trait.key] ?? '🏠')}
                    </span>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-white/90">{trait.label}</div>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.round(trait.strength * 100)}%`,
                            backgroundColor: strengthColor(trait.strength),
                            opacity: 0.7,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: strengthColor(trait.strength) }}>
                      {Math.round(trait.strength * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Task Experience */}
          {taskEntries.length > 0 && (
            <div className="mb-5">
              <div className="mb-3 text-[11px] uppercase tracking-wider text-white/40">
                Task Experience
              </div>
              <div className="space-y-1.5">
                {taskEntries.slice(0, 8).map(([taskType, count]) => {
                  const maxCount = taskEntries[0][1];
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={taskType} className="flex items-center gap-2">
                      <span className="w-4 text-center text-[10px]">{TASK_EMOJI[taskType] ?? '⚙️'}</span>
                      <span className="w-20 text-[11px] text-white/60">{TASK_LABELS[taskType] ?? taskType}</span>
                      <div className="flex-1">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-purple-400/60 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-6 text-right font-mono text-[10px] text-white/40">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Room Time */}
          {roomEntries.length > 0 && (
            <div>
              <div className="mb-3 text-[11px] uppercase tracking-wider text-white/40">
                Time Spent by Room
              </div>
              <div className="space-y-1.5">
                {roomEntries.slice(0, 6).map(([roomId, mins]) => {
                  const maxMins = roomEntries[0][1];
                  const pct = maxMins > 0 ? (mins / maxMins) * 100 : 0;
                  const hours = Math.floor(mins / 60);
                  const remMins = Math.round(mins % 60);
                  const timeStr = hours > 0 ? `${hours}h ${remMins}m` : `${remMins}m`;
                  return (
                    <div key={roomId} className="flex items-center gap-2">
                      <span className="w-4 text-center text-[10px]">{ROOM_EMOJI[roomId] ?? '🏠'}</span>
                      <span className="w-20 text-[11px] text-white/60">{ROOM_LABELS[roomId] ?? roomId}</span>
                      <div className="flex-1">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-teal-400/60 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-10 text-right font-mono text-[10px] text-white/40">{timeStr}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 px-5 py-2">
          <p className="text-center text-[10px] text-white/20">
            Personality persists across sessions
          </p>
        </div>
      </div>
    </div>
  );
}
