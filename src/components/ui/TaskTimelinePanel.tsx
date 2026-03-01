import { useMemo, useCallback } from 'react';
import { useStore } from '../../stores/useStore';
import { ROBOT_CONFIGS } from '../../config/robots';
import { getRobotDisplayName } from '../../stores/useRobotNames';
import type { RobotId, TaskType, TimelapseEvent } from '../../types';
import { ROBOT_IDS } from '../../types';

// ── Task colors ───────────────────────────────────────────────
const TASK_COLORS: Record<TaskType, string> = {
  cleaning: '#60a5fa',
  vacuuming: '#818cf8',
  dishes: '#f59e0b',
  laundry: '#a78bfa',
  organizing: '#34d399',
  cooking: '#fb923c',
  'bed-making': '#c084fc',
  scrubbing: '#22d3ee',
  sweeping: '#38bdf8',
  'grocery-list': '#fbbf24',
  general: '#94a3b8',
  seasonal: '#f472b6',
  mowing: '#4ade80',
  watering: '#2dd4bf',
  'leaf-blowing': '#facc15',
  weeding: '#a3e635',
};

function formatTaskLabel(t: TaskType): string {
  return t.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Time helpers ──────────────────────────────────────────────
function formatSimTime(simMinutes: number): string {
  const dayMin = ((simMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(dayMin / 60);
  const m = Math.floor(dayMin % 60);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function formatDuration(mins: number): string {
  if (mins < 1) return '<1m';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ── Segment computation ───────────────────────────────────────
interface TaskSegment {
  robotId: RobotId;
  taskType: TaskType;
  roomId: string;
  startMin: number;
  endMin: number;
}

function buildSegments(events: TimelapseEvent[]): TaskSegment[] {
  // Track open tasks per robot
  const open: Partial<Record<RobotId, { taskType: TaskType; roomId: string; startMin: number }>> = {};
  const segments: TaskSegment[] = [];

  for (const ev of events) {
    if (!ev.robotId) continue;

    if (ev.type === 'task-start') {
      // Close any existing open segment for this robot
      const prev = open[ev.robotId];
      if (prev) {
        segments.push({
          robotId: ev.robotId,
          taskType: prev.taskType,
          roomId: prev.roomId,
          startMin: prev.startMin,
          endMin: ev.simMinutes,
        });
      }
      open[ev.robotId] = {
        taskType: ev.taskType ?? 'general',
        roomId: ev.roomId ?? '',
        startMin: ev.simMinutes,
      };
    } else if (ev.type === 'task-complete') {
      const prev = open[ev.robotId];
      if (prev) {
        segments.push({
          robotId: ev.robotId,
          taskType: prev.taskType,
          roomId: prev.roomId,
          startMin: prev.startMin,
          endMin: ev.simMinutes,
        });
        delete open[ev.robotId];
      } else {
        // No open segment — create a point segment
        segments.push({
          robotId: ev.robotId,
          taskType: ev.taskType ?? 'general',
          roomId: ev.roomId ?? '',
          startMin: ev.simMinutes - 2,
          endMin: ev.simMinutes,
        });
      }
    }
  }

  // Close still-open segments at current time
  const now = events.length > 0 ? events[events.length - 1].simMinutes : 0;
  for (const rid of ROBOT_IDS) {
    const o = open[rid];
    if (o) {
      segments.push({
        robotId: rid,
        taskType: o.taskType,
        roomId: o.roomId,
        startMin: o.startMin,
        endMin: now,
      });
    }
  }

  return segments;
}

// ── Stats ─────────────────────────────────────────────────────
interface RobotStats {
  totalTasks: number;
  totalMinutes: number;
  taskBreakdown: { taskType: TaskType; count: number; minutes: number }[];
}

function computeStats(segments: TaskSegment[], robotId: RobotId): RobotStats {
  const robotSegs = segments.filter((s) => s.robotId === robotId);
  const byType: Record<string, { count: number; minutes: number }> = {};

  for (const seg of robotSegs) {
    if (!byType[seg.taskType]) byType[seg.taskType] = { count: 0, minutes: 0 };
    byType[seg.taskType].count++;
    byType[seg.taskType].minutes += seg.endMin - seg.startMin;
  }

  const breakdown = Object.entries(byType)
    .map(([taskType, data]) => ({ taskType: taskType as TaskType, ...data }))
    .sort((a, b) => b.minutes - a.minutes);

  return {
    totalTasks: robotSegs.length,
    totalMinutes: robotSegs.reduce((sum, s) => sum + (s.endMin - s.startMin), 0),
    taskBreakdown: breakdown,
  };
}

// ── Robot timeline row ────────────────────────────────────────
function RobotRow({
  robotId,
  segments,
  rangeStart,
  rangeEnd,
  stats,
}: {
  robotId: RobotId;
  segments: TaskSegment[];
  rangeStart: number;
  rangeEnd: number;
  stats: RobotStats;
}) {
  const range = rangeEnd - rangeStart || 1;
  const robotSegs = segments.filter((s) => s.robotId === robotId);
  const color = ROBOT_CONFIGS[robotId].color;

  return (
    <div className="mb-3">
      {/* Robot header */}
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
          <span className="text-sm font-semibold text-white">
            {getRobotDisplayName(robotId)}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/40">
          <span>{stats.totalTasks} tasks</span>
          <span>{formatDuration(stats.totalMinutes)}</span>
        </div>
      </div>

      {/* Timeline bar */}
      <div
        className="group relative h-8 overflow-hidden rounded-lg bg-white/5"
      >
        {robotSegs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[10px] text-white/20">
            No tasks yet
          </div>
        ) : (
          robotSegs.map((seg, i) => {
            const left = ((seg.startMin - rangeStart) / range) * 100;
            const width = Math.max(((seg.endMin - seg.startMin) / range) * 100, 0.5);
            return (
              <div
                key={i}
                className="absolute top-1 bottom-1 rounded-sm transition-opacity hover:opacity-90"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: TASK_COLORS[seg.taskType],
                  opacity: 0.8,
                  minWidth: 3,
                }}
                title={`${formatTaskLabel(seg.taskType)} in ${seg.roomId.replace(/-/g, ' ')} (${formatSimTime(seg.startMin)} – ${formatSimTime(seg.endMin)})`}
              />
            );
          })
        )}
      </div>

      {/* Mini breakdown */}
      {stats.taskBreakdown.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
          {stats.taskBreakdown.slice(0, 4).map((b) => (
            <div key={b.taskType} className="flex items-center gap-1 text-[10px] text-white/40">
              <span
                className="inline-block h-1.5 w-1.5 rounded-sm"
                style={{ background: TASK_COLORS[b.taskType] }}
              />
              {formatTaskLabel(b.taskType)} ×{b.count}
            </div>
          ))}
          {stats.taskBreakdown.length > 4 && (
            <span className="text-[10px] text-white/25">+{stats.taskBreakdown.length - 4} more</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Hour markers ──────────────────────────────────────────────
function HourMarkers({ rangeStart, rangeEnd }: { rangeStart: number; rangeEnd: number }) {
  const range = rangeEnd - rangeStart || 1;
  const markers: { label: string; pct: number }[] = [];

  // Place a marker at each whole hour within the range
  const firstHour = Math.ceil(rangeStart / 60) * 60;
  for (let m = firstHour; m <= rangeEnd; m += 60) {
    const pct = ((m - rangeStart) / range) * 100;
    if (pct >= 0 && pct <= 100) {
      markers.push({ label: formatSimTime(m), pct });
    }
  }

  return (
    <div className="relative mb-2 h-5">
      {markers.map((mk, i) => (
        <div
          key={i}
          className="absolute text-[9px] text-white/25"
          style={{ left: `${mk.pct}%`, transform: 'translateX(-50%)' }}
        >
          {mk.label}
        </div>
      ))}
    </div>
  );
}

// ── Legend ─────────────────────────────────────────────────────
function TaskLegend({ usedTypes }: { usedTypes: TaskType[] }) {
  if (usedTypes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-white/5 pt-3">
      {usedTypes.map((t) => (
        <div key={t} className="flex items-center gap-1.5 text-[10px] text-white/40">
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{ background: TASK_COLORS[t] }}
          />
          {formatTaskLabel(t)}
        </div>
      ))}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────
export function TaskTimelinePanel() {
  const showTimeline = useStore((s) => s.showTimeline);
  const setShowTimeline = useStore((s) => s.setShowTimeline);
  const events = useStore((s) => s.timelapseEvents);

  const handleClose = useCallback(() => setShowTimeline(false), [setShowTimeline]);

  const { segments, rangeStart, rangeEnd, usedTypes } = useMemo(() => {
    const segs = buildSegments(events);
    if (segs.length === 0 && events.length === 0) {
      return { segments: segs, rangeStart: 0, rangeEnd: 1440, usedTypes: [] as TaskType[] };
    }

    // Determine time range from all events
    let min = Infinity;
    let max = -Infinity;
    for (const ev of events) {
      if (ev.simMinutes < min) min = ev.simMinutes;
      if (ev.simMinutes > max) max = ev.simMinutes;
    }
    // Pad a bit
    min = Math.max(0, min - 10);
    max = max + 10;

    const types = [...new Set(segs.map((s) => s.taskType))].sort();
    return { segments: segs, rangeStart: min, rangeEnd: max, usedTypes: types };
  }, [events]);

  const robotStats = useMemo(
    () => Object.fromEntries(ROBOT_IDS.map((rid) => [rid, computeStats(segments, rid)])) as Record<RobotId, RobotStats>,
    [segments],
  );

  const totalTasks = ROBOT_IDS.reduce((sum, rid) => sum + robotStats[rid].totalTasks, 0);

  if (!showTimeline) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative w-[520px] max-h-[80vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-900/95 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-sky-400">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Task Timeline</h2>
              <p className="text-[11px] text-white/40">
                {totalTasks > 0
                  ? `${totalTasks} tasks across ${formatDuration(rangeEnd - rangeStart)}`
                  : 'No task data yet'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: 'calc(80vh - 130px)' }}>
          {events.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mb-2 text-2xl">📋</div>
              <div className="text-sm text-white/40">No events recorded yet</div>
              <div className="mt-1 text-[11px] text-white/25">
                Let the simulation run for a while — task activity will appear here.
              </div>
            </div>
          ) : (
            <>
              {/* Time axis */}
              <HourMarkers rangeStart={rangeStart} rangeEnd={rangeEnd} />

              {/* Robot rows */}
              {ROBOT_IDS.map((rid) => (
                <RobotRow
                  key={rid}
                  robotId={rid}
                  segments={segments}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  stats={robotStats[rid]}
                />
              ))}

              {/* Legend */}
              <TaskLegend usedTypes={usedTypes} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 px-5 py-3">
          <div className="text-[10px] leading-relaxed text-white/25">
            Shows task activity from timelapse data. Colors represent task types. Segments show duration and timing.
          </div>
        </div>
      </div>
    </div>
  );
}

export function TimelineButton() {
  const showTimeline = useStore((s) => s.showTimeline);
  const setShowTimeline = useStore((s) => s.setShowTimeline);
  const events = useStore((s) => s.timelapseEvents);

  const taskEventCount = useMemo(
    () => events.filter((e) => e.type === 'task-start' || e.type === 'task-complete').length,
    [events],
  );

  return (
    <button
      type="button"
      onClick={() => setShowTimeline(!showTimeline)}
      className={`pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-full border text-lg backdrop-blur-md transition-all ${
        showTimeline
          ? 'border-sky-400/50 bg-sky-500/30 hover:bg-sky-500/50'
          : 'border-white/10 bg-black/50 hover:bg-black/70'
      }`}
      title="Task Timeline"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      {taskEventCount > 0 && !showTimeline && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sky-400 px-1 text-[9px] font-bold text-black">
          {taskEventCount > 99 ? '99+' : taskEventCount}
        </span>
      )}
    </button>
  );
}
