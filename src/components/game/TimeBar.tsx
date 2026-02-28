import { formatSimClock } from '../../systems/TimeSystem';
import { useStore } from '../../stores/useStore';

export function TimeBar() {
  const simMinutes = useStore((s) => s.simMinutes);
  const robotState = useStore((s) => s.robots[s.activeRobotId].state);
  const activeTasks = useStore((s) =>
    s.tasks.filter((t) => t.status === 'queued' || t.status === 'walking' || t.status === 'working').length,
  );

  const { dayText, timeText } = formatSimClock(simMinutes);

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 p-3 pt-[max(8px,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-md items-center justify-between rounded-full border border-white/8 bg-black/70 px-4 py-2 backdrop-blur-xl">
        {/* Time */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium tracking-wide text-white/90">{timeText}</span>
          <span className="text-[10px] text-white/30">{dayText}</span>
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
