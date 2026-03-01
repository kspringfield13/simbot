import { formatSimClock } from '../../systems/TimeSystem';
import { useStore } from '../../stores/useStore';
import { SEASON_ICONS, SEASON_LABELS, SEASON_MODIFIERS, DAYS_PER_SEASON, getDayInSeason } from '../../config/seasons';
import { getSimDay } from '../../systems/TimeSystem';

const SEASON_BADGE_COLORS: Record<string, string> = {
  spring: 'bg-green-500/20 text-green-300 border-green-400/30',
  summer: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  fall: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
  winter: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
};

export function TimeBar() {
  const simMinutes = useStore((s) => s.simMinutes);
  const robotState = useStore((s) => s.robots[s.activeRobotId].state);
  const currentSeason = useStore((s) => s.currentSeason);
  const activeTasks = useStore((s) =>
    s.tasks.filter((t) => t.status === 'queued' || t.status === 'walking' || t.status === 'working').length,
  );

  const { dayText, timeText } = formatSimClock(simMinutes);
  const day = getSimDay(simMinutes);
  const dayInSeason = getDayInSeason(day) + 1; // 1-based for display
  const seasonLabel = SEASON_LABELS[currentSeason];
  const seasonIcon = SEASON_ICONS[currentSeason];
  const seasonMod = SEASON_MODIFIERS[currentSeason];
  const badgeColor = SEASON_BADGE_COLORS[currentSeason] ?? 'bg-white/10 text-white/60 border-white/10';

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 p-3 pt-[max(8px,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between rounded-full border border-white/8 bg-black/70 px-4 py-2 backdrop-blur-xl">
        {/* Time */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium tracking-wide text-white/90">{timeText}</span>
          <span className="text-[10px] text-white/30">{dayText}</span>
        </div>

        {/* Season indicator */}
        <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 ${badgeColor}`}>
          <span className="text-xs">{seasonIcon}</span>
          <span className="text-[10px] font-medium tracking-wide">{seasonLabel}</span>
          <span className="text-[9px] opacity-60">
            {dayInSeason}/{DAYS_PER_SEASON}
          </span>
          <span className="text-[9px] opacity-50">{seasonMod.temperature}</span>
        </div>

        {/* Status dot + state */}
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${
            robotState === 'idle' ? 'bg-white/40' : 'bg-white animate-pulse'
          }`} />
          <span className="text-[10px] uppercase tracking-widest text-white/40">
            {robotState}
          </span>
        </div>

        {/* Task count */}
        {activeTasks > 0 && (
          <span className="text-[10px] text-white/30">{activeTasks} task{activeTasks > 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
}
