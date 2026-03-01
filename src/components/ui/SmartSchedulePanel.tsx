import { useStore } from '../../stores/useStore';
import {
  formatTimeOfDay,
  getPeriodLabel,
  getRoomPriority,
  getConfidenceLevel,
  getConfidencePercent,
  type RoomPattern,
} from '../../systems/SmartSchedule';

const ROOM_LABELS: Record<string, string> = {
  'living-room': 'Living Room',
  kitchen: 'Kitchen',
  hallway: 'Hallway',
  laundry: 'Laundry',
  bedroom: 'Master Bedroom',
  bathroom: 'Master Bathroom',
  yard: 'Yard',
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
  mowing: 'Mowing',
  watering: 'Watering',
  'leaf-blowing': 'Leaf Blowing',
  weeding: 'Weeding',
};

const PERIOD_COLORS: Record<string, string> = {
  morning: '#fbbf24',
  afternoon: '#f97316',
  evening: '#8b5cf6',
  night: '#3b82f6',
};

function ConfidenceBadge({ level, percent }: { level: string; percent: number }) {
  const colors: Record<string, string> = {
    low: '#ef4444',
    medium: '#f59e0b',
    high: '#22c55e',
  };
  const color = colors[level] ?? '#666';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
      <span className="text-[10px] capitalize" style={{ color }}>
        {level} ({percent}%)
      </span>
    </div>
  );
}

function HourlyChart({ data, peakHour }: { data: number[]; peakHour: number }) {
  const max = Math.max(1, ...data);
  return (
    <div className="flex items-end gap-px" style={{ height: 40 }}>
      {data.map((val, hour) => {
        const height = (val / max) * 100;
        const isPeak = hour === peakHour;
        return (
          <div
            key={hour}
            className="flex-1 rounded-t-sm transition-all"
            style={{
              height: `${Math.max(2, height)}%`,
              background: isPeak ? '#22c55e' : val > 0 ? '#6366f1' : '#ffffff08',
              opacity: val > 0 ? 0.8 + (val / max) * 0.2 : 0.3,
            }}
            title={`${String(hour).padStart(2, '0')}:00 — ${val} tasks`}
          />
        );
      })}
    </div>
  );
}

function RoomInsightCard({ pattern }: { pattern: RoomPattern }) {
  const roomName = ROOM_LABELS[pattern.roomId] ?? pattern.roomId;
  const period = getPeriodLabel(pattern.peakHour);
  const periodColor = PERIOD_COLORS[period] ?? '#888';
  const dirtyBarWidth = Math.min(100, pattern.avgDirtyRate * 10);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-white">{roomName}</span>
        <span className="text-[10px] text-white/40">
          {pattern.totalTaskCount} total tasks
        </span>
      </div>

      {/* Dirty rate indicator */}
      <div className="mb-2">
        <div className="mb-1 flex items-center justify-between text-[10px]">
          <span className="text-white/40">Dirt accumulation rate</span>
          <span className="text-white/60">{pattern.avgDirtyRate.toFixed(1)}/hr</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${dirtyBarWidth}%`,
              background: dirtyBarWidth > 60 ? '#ef4444' : dirtyBarWidth > 30 ? '#f59e0b' : '#22c55e',
            }}
          />
        </div>
      </div>

      {/* Hourly activity chart */}
      <div className="mb-2">
        <div className="mb-1 text-[10px] text-white/40">Activity by hour</div>
        <HourlyChart data={pattern.hourlyActivity} peakHour={pattern.peakHour} />
        <div className="mt-0.5 flex justify-between text-[8px] text-white/20">
          <span>0h</span>
          <span>6h</span>
          <span>12h</span>
          <span>18h</span>
          <span>24h</span>
        </div>
      </div>

      {/* Insights grid */}
      <div className="mb-2 grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-lg bg-white/5 px-2 py-1.5">
          <div className="text-white/30">Peak Hour</div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-white">
              {String(pattern.peakHour).padStart(2, '0')}:00
            </span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[8px] font-bold capitalize"
              style={{ background: `${periodColor}22`, color: periodColor }}
            >
              {period}
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-1.5">
          <div className="text-white/30">Optimal Clean</div>
          <div className="text-sm font-bold text-white">
            {formatTimeOfDay(pattern.optimalCleanTime)}
          </div>
        </div>
      </div>

      {/* Top tasks */}
      {pattern.topTasks.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-white/30">Most common tasks</div>
          {pattern.topTasks.map(({ taskType, count }) => {
            const pct = pattern.totalTaskCount > 0
              ? (count / pattern.totalTaskCount) * 100
              : 0;
            return (
              <div key={taskType} className="flex items-center gap-2">
                <span className="w-16 truncate text-[10px] text-white/50">
                  {TASK_LABELS[taskType] ?? taskType}
                </span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: '#6366f1' }}
                  />
                </div>
                <span className="text-[9px] text-white/40">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* User interaction note */}
      {pattern.userInteractionCount > 0 && (
        <div className="mt-2 rounded-lg bg-indigo-500/10 px-2 py-1.5 text-[10px] text-indigo-300/70">
          User manually cleaned {pattern.userInteractionCount}x
          {pattern.avgDirtinessAtUserAction > 20 && (
            <> (avg {Math.round(pattern.avgDirtinessAtUserAction)}% dirty when triggered)</>
          )}
        </div>
      )}
    </div>
  );
}

export function SmartSchedulePanel() {
  const show = useStore((s) => s.showSmartSchedule);
  const setShow = useStore((s) => s.setShowSmartSchedule);
  const data = useStore((s) => s.smartScheduleData);

  if (!show) return null;

  const confidence = getConfidenceLevel(data);
  const confidencePercent = getConfidencePercent(data);
  const sortedRooms = getRoomPriority(data.roomPatterns);
  const hasPatterns = sortedRooms.length > 0;

  // Global hourly distribution
  const globalHourly = new Array(24).fill(0);
  for (const t of data.userInteractionTimes) {
    const hour = Math.floor(t / 60);
    globalHourly[hour]++;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900 to-black p-4 shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={() => setShow(false)}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
        >
          X
        </button>

        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">Smart Schedule AI</h2>
          <p className="text-xs text-white/40">
            Learning optimal cleaning patterns from activity data. Patterns improve as more tasks are completed.
          </p>
        </div>

        {/* Confidence & stats row */}
        <div className="mb-4 flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3">
          <div>
            <div className="text-[10px] text-white/30">Learning confidence</div>
            <ConfidenceBadge level={confidence} percent={confidencePercent} />
          </div>
          <div className="text-right">
            <div className="text-[10px] text-white/30">Events tracked</div>
            <div className="text-sm font-bold text-white">{data.events.length}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-white/30">User commands</div>
            <div className="text-sm font-bold text-white">{data.totalUserCommands}</div>
          </div>
        </div>

        {/* Global activity overview */}
        {data.userInteractionTimes.length > 0 && (
          <div className="mb-4 rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-white/60">Your Activity Pattern</span>
              <span className="text-[10px] text-white/30">
                Peak: {String(data.peakActivityHour).padStart(2, '0')}:00
              </span>
            </div>
            <HourlyChart data={globalHourly} peakHour={data.peakActivityHour} />
            <div className="mt-0.5 flex justify-between text-[8px] text-white/20">
              <span>12am</span>
              <span>6am</span>
              <span>12pm</span>
              <span>6pm</span>
              <span>12am</span>
            </div>
          </div>
        )}

        {/* Room insights */}
        {hasPatterns ? (
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-white/50">Room Insights (by dirt rate)</div>
            {sortedRooms.map((pattern) => (
              <RoomInsightCard key={pattern.roomId} pattern={pattern} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/5 bg-white/5 p-6 text-center">
            <div className="mb-2 text-2xl">🧠</div>
            <div className="text-sm text-white/50">Collecting data...</div>
            <div className="mt-1 text-[10px] text-white/30">
              The AI is observing cleaning patterns. Insights will appear after tasks are completed.
            </div>
          </div>
        )}

        {/* Predicted optimal schedule summary */}
        {hasPatterns && (
          <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
            <div className="mb-2 text-[11px] font-bold text-indigo-300/80">
              Predicted Optimal Schedule
            </div>
            <div className="space-y-1">
              {sortedRooms.map((p) => (
                <div key={p.roomId} className="flex items-center justify-between text-[10px]">
                  <span className="text-white/50">{ROOM_LABELS[p.roomId] ?? p.roomId}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white/70">
                      {formatTimeOfDay(p.optimalCleanTime)}
                    </span>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[8px] capitalize"
                      style={{
                        color: PERIOD_COLORS[getPeriodLabel(Math.floor(p.optimalCleanTime / 60))] ?? '#888',
                        background: `${PERIOD_COLORS[getPeriodLabel(Math.floor(p.optimalCleanTime / 60))] ?? '#888'}15`,
                      }}
                    >
                      {getPeriodLabel(Math.floor(p.optimalCleanTime / 60))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[9px] text-white/25">
              Times are predicted to clean just before peak activity, keeping rooms fresh when needed most.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
