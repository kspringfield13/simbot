import { useStore } from '../../stores/useStore';
import { getDisasterConfig, getDisasterRoomName } from '../../systems/DisasterEvents';

const ROBOT_NAMES: Record<string, string> = {
  sim: 'Sim',
  chef: 'Chef',
  sparkle: 'Sparkle',
};

export function DisasterBanner() {
  const disaster = useStore((s) => s.activeDisaster);

  if (!disaster) return null;

  const config = getDisasterConfig(disaster.type);
  const roomName = getDisasterRoomName(disaster.roomId);

  const phaseLabel =
    disaster.phase === 'detection'
      ? 'DETECTED'
      : disaster.phase === 'response'
        ? 'RESPONDING'
        : 'RESOLVING';

  const respondingNames = disaster.respondingRobots
    .map((rid) => ROBOT_NAMES[rid] ?? rid)
    .join(', ');

  // Severity-based color scheme
  const severityColors: Record<number, { bg: string; border: string; bar: string }> = {
    1: {
      bg: disaster.type === 'fire'
        ? 'from-orange-600/90 to-orange-800/90'
        : disaster.type === 'flood'
          ? 'from-blue-600/90 to-blue-800/90'
          : 'from-amber-600/90 to-amber-800/90',
      border: disaster.type === 'fire'
        ? 'border-orange-400/50'
        : disaster.type === 'flood'
          ? 'border-blue-400/50'
          : 'border-amber-400/50',
      bar: disaster.type === 'fire'
        ? 'bg-orange-400'
        : disaster.type === 'flood'
          ? 'bg-blue-400'
          : 'bg-amber-400',
    },
    2: {
      bg: disaster.type === 'fire'
        ? 'from-red-600/90 to-red-900/90'
        : disaster.type === 'flood'
          ? 'from-blue-700/90 to-indigo-900/90'
          : 'from-yellow-600/90 to-red-800/90',
      border: disaster.type === 'fire'
        ? 'border-red-400/60'
        : disaster.type === 'flood'
          ? 'border-indigo-400/60'
          : 'border-yellow-400/60',
      bar: disaster.type === 'fire'
        ? 'bg-red-400'
        : disaster.type === 'flood'
          ? 'bg-indigo-400'
          : 'bg-yellow-400',
    },
    3: {
      bg: disaster.type === 'fire'
        ? 'from-red-700/95 to-red-950/95'
        : disaster.type === 'flood'
          ? 'from-indigo-700/95 to-purple-950/95'
          : 'from-red-700/95 to-red-950/95',
      border: disaster.type === 'fire'
        ? 'border-red-300/70'
        : disaster.type === 'flood'
          ? 'border-purple-300/70'
          : 'border-red-300/70',
      bar: disaster.type === 'fire'
        ? 'bg-red-300'
        : disaster.type === 'flood'
          ? 'bg-purple-300'
          : 'bg-red-300',
    },
  };

  const severity = Math.min(3, Math.max(1, disaster.severity)) as 1 | 2 | 3;
  const colors = severityColors[severity];
  const severityLabel = config.severityLabels[severity];

  return (
    <div
      className={`pointer-events-none fixed left-1/2 top-16 z-50 -translate-x-1/2 ${disaster.severity >= 2 ? 'animate-pulse' : ''}`}
    >
      <div
        className={`flex flex-col gap-2 rounded-xl border ${colors.border} bg-gradient-to-r ${colors.bg} px-5 py-3 shadow-2xl backdrop-blur-md`}
        style={{ minWidth: 280 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.emoji}</span>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wider text-white">
                {config.bannerText(roomName, severity)}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                  disaster.phase === 'resolution'
                    ? 'bg-green-500/30 text-green-200'
                    : 'bg-white/20 text-white/90'
                }`}
              >
                {phaseLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {respondingNames && (
                <span className="text-[11px] text-white/70">
                  {disaster.phase === 'resolution'
                    ? `Handled by ${respondingNames}`
                    : `Responding: ${respondingNames}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Severity Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
            Severity
          </span>
          <div className="flex gap-1">
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                className={`h-2 w-5 rounded-full ${
                  level <= severity
                    ? level === 3
                      ? 'bg-red-400 shadow-red-400/50 shadow-sm'
                      : level === 2
                        ? 'bg-yellow-400'
                        : colors.bar
                    : 'bg-white/15'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-white/50">{severityLabel}</span>
        </div>

        {/* Progress Bar */}
        {disaster.phase === 'response' && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
              Response
            </span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className={`absolute left-0 top-0 h-full rounded-full ${colors.bar} transition-all duration-500`}
                style={{ width: `${disaster.progress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-white/80">
              {Math.round(disaster.progress)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
