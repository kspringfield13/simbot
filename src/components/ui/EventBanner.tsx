import { useStore } from '../../stores/useStore';
import { getEventConfig, getEventRoomName } from '../../systems/HomeEvents';

const ROBOT_NAMES: Record<string, string> = {
  sim: 'Sim',
  chef: 'Chef',
  sparkle: 'Sparkle',
};

export function EventBanner() {
  const activeEvent = useStore((s) => s.activeHomeEvent);

  if (!activeEvent) return null;

  const config = getEventConfig(activeEvent.type);
  const roomName = getEventRoomName(activeEvent.roomId);

  const phaseLabel =
    activeEvent.phase === 'detection'
      ? 'DETECTED'
      : activeEvent.phase === 'response'
        ? 'RESPONDING'
        : 'RESOLVING';

  const respondingNames = activeEvent.respondingRobots
    .map((rid) => ROBOT_NAMES[rid] ?? rid)
    .join(', ');

  const bgColor =
    activeEvent.type === 'plumbing-leak'
      ? 'from-blue-600/90 to-blue-800/90'
      : activeEvent.type === 'power-outage'
        ? 'from-amber-600/90 to-amber-800/90'
        : 'from-red-600/90 to-red-800/90';

  const borderColor =
    activeEvent.type === 'plumbing-leak'
      ? 'border-blue-400/50'
      : activeEvent.type === 'power-outage'
        ? 'border-amber-400/50'
        : 'border-red-400/50';

  return (
    <div
      className={`pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 animate-pulse`}
    >
      <div
        className={`flex items-center gap-3 rounded-xl border ${borderColor} bg-gradient-to-r ${bgColor} px-5 py-3 shadow-2xl backdrop-blur-md`}
      >
        <span className="text-2xl">{config.emoji}</span>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-wider text-white">
              {config.bannerText(roomName)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                activeEvent.phase === 'resolution'
                  ? 'bg-green-500/30 text-green-200'
                  : 'bg-white/20 text-white/90'
              }`}
            >
              {phaseLabel}
            </span>
          </div>
          {respondingNames && (
            <span className="text-[11px] text-white/70">
              {activeEvent.phase === 'resolution'
                ? `Fixed by ${respondingNames}`
                : `Responding: ${respondingNames}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
