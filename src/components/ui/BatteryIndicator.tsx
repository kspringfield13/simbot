import { useStore } from '../../stores/useStore';
import { ROBOT_CONFIGS } from '../../config/robots';
import { ROBOT_IDS } from '../../types';
import type { RobotId } from '../../types';
import { useRobotDisplayName } from '../../stores/useRobotNames';

function BatteryIcon({ level, isCharging }: { level: number; isCharging: boolean }) {
  const fill = level > 50 ? '#4ade80' : level > 20 ? '#facc15' : '#f87171';

  return (
    <svg viewBox="0 0 24 14" className="h-3 w-5" fill="none">
      {/* Battery outline */}
      <rect x="0.5" y="0.5" width="20" height="13" rx="2" stroke="currentColor" strokeWidth="1" className="text-white/40" />
      {/* Terminal nub */}
      <rect x="21" y="4" width="2.5" height="6" rx="1" fill="currentColor" className="text-white/30" />
      {/* Fill level */}
      <rect
        x="2"
        y="2"
        width={Math.max(0, (level / 100) * 17)}
        height="10"
        rx="1"
        fill={fill}
        className={isCharging ? 'animate-pulse' : ''}
      />
      {/* Lightning bolt when charging */}
      {isCharging && (
        <path
          d="M11 1L8 7h3l-1 6 4-7h-3l2-5z"
          fill="#facc15"
          stroke="#000"
          strokeWidth="0.3"
        />
      )}
    </svg>
  );
}

function BatteryRow({ id }: { id: RobotId }) {
  const robot = useStore((s) => s.robots[id]);
  const config = ROBOT_CONFIGS[id];
  const displayName = useRobotDisplayName(id);
  const level = Math.round(robot.battery);
  const isLow = level < 20;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: config.color }}
      />
      <span className="w-12 text-[9px] text-white/50 truncate">{displayName}</span>
      <BatteryIcon level={level} isCharging={robot.isCharging} />
      <span
        className={`w-7 text-right text-[9px] font-mono ${
          isLow ? 'text-red-400 animate-pulse' : robot.isCharging ? 'text-emerald-400' : 'text-white/40'
        }`}
      >
        {level}%
      </span>
    </div>
  );
}

export function BatteryIndicator() {
  return (
    <div className="pointer-events-none fixed left-4 bottom-4 z-20 flex flex-col gap-1 rounded-xl border border-white/6 bg-black/50 p-2 backdrop-blur-md">
      {ROBOT_IDS.map((id) => (
        <BatteryRow key={id} id={id} />
      ))}
    </div>
  );
}
