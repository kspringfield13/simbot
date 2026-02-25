import { formatSimClock } from '../../systems/TimeSystem';
import { useStore } from '../../stores/useStore';

const moodColor: Record<string, string> = {
  content: 'bg-emerald-400',
  focused: 'bg-cyan-400',
  curious: 'bg-amber-400',
  routine: 'bg-violet-400',
};

const moodLabel: Record<string, string> = {
  content: 'Content',
  focused: 'Focused',
  curious: 'Curious',
  routine: 'Routine',
};

const stateLabel: Record<string, string> = {
  idle: 'Idle',
  walking: 'Moving',
  working: 'Working',
};

export function TimeBar() {
  const simMinutes = useStore((state) => state.simMinutes);
  const robotMood = useStore((state) => state.robotMood);
  const robotState = useStore((state) => state.robotState);
  const activeTasks = useStore((state) =>
    state.tasks.filter((task) => task.status === 'queued' || task.status === 'walking' || task.status === 'working').length,
  );

  const { dayText, timeText } = formatSimClock(simMinutes);

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 p-3 pt-[max(12px,env(safe-area-inset-top))]">
      <div className="grid grid-cols-3 items-center gap-2 rounded-2xl border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-xl">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/60">Sim Time</p>
          <p className="text-sm font-semibold text-white">{timeText}</p>
          <p className="text-[10px] text-white/65">{dayText}</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${moodColor[robotMood] ?? 'bg-white/40'}`} />
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/60">Robot</p>
            <p className="text-xs font-semibold text-white">{stateLabel[robotState]} · {moodLabel[robotMood]}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/60">Queue</p>
          <p className="text-sm font-semibold text-white">{activeTasks}</p>
          <p className="text-[10px] text-white/65">Tasks</p>
        </div>
      </div>
    </div>
  );
}
