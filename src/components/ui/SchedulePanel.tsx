import { useState } from 'react';
import { useStore } from '../../stores/useStore';
import { ROBOT_CONFIGS } from '../../config/robots';
import { ROBOT_IDS } from '../../types';
import type { RobotId } from '../../types';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_OPTIONS = [0, 15, 30, 45];

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

export function SchedulePanel() {
  const showSchedulePanel = useStore((s) => s.showSchedulePanel);
  const setShowSchedulePanel = useStore((s) => s.setShowSchedulePanel);
  const scheduledTasks = useStore((s) => s.scheduledTasks);
  const addScheduledTask = useStore((s) => s.addScheduledTask);
  const removeScheduledTask = useStore((s) => s.removeScheduledTask);
  const toggleScheduledTask = useStore((s) => s.toggleScheduledTask);
  const activeRobotId = useStore((s) => s.activeRobotId);

  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [command, setCommand] = useState('');
  const [robotId, setRobotId] = useState<RobotId>(activeRobotId);

  if (!showSchedulePanel) return null;

  const handleAdd = () => {
    const trimmed = command.trim();
    if (!trimmed) return;
    addScheduledTask({
      id: crypto.randomUUID(),
      command: trimmed,
      timeMinutes: hour * 60 + minute,
      assignedTo: robotId,
      enabled: true,
    });
    setCommand('');
  };

  const sorted = [...scheduledTasks].sort((a, b) => a.timeMinutes - b.timeMinutes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900/95 p-5 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/90">Daily Schedule</h2>
          <button
            type="button"
            onClick={() => setShowSchedulePanel(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Add new task form */}
        <div className="mb-4 space-y-2 rounded-xl border border-white/5 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            {/* Time selectors */}
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="h-8 rounded-lg border border-white/10 bg-black/40 px-2 text-xs text-white outline-none"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h === 0 ? '12' : h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}
                </option>
              ))}
            </select>
            <select
              value={minute}
              onChange={(e) => setMinute(Number(e.target.value))}
              className="h-8 rounded-lg border border-white/10 bg-black/40 px-2 text-xs text-white outline-none"
            >
              {MINUTES_OPTIONS.map((m) => (
                <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
              ))}
            </select>

            {/* Robot selector */}
            <select
              value={robotId}
              onChange={(e) => setRobotId(e.target.value as RobotId)}
              className="h-8 rounded-lg border border-white/10 bg-black/40 px-2 text-xs text-white outline-none"
            >
              {ROBOT_IDS.map((id) => (
                <option key={id} value={id}>{ROBOT_CONFIGS[id].name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="e.g. vacuum living room"
              className="h-8 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white outline-none placeholder:text-white/25"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!command.trim()}
              className="h-8 rounded-lg bg-white/15 px-3 text-xs font-medium text-white transition-colors hover:bg-white/25 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>

        {/* Task list */}
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {sorted.length === 0 ? (
            <p className="py-4 text-center text-xs text-white/30">
              No scheduled tasks yet. Add a daily routine above.
            </p>
          ) : (
            sorted.map((task) => {
              const config = ROBOT_CONFIGS[task.assignedTo];
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                    task.enabled ? 'bg-white/5' : 'bg-white/[0.02] opacity-50'
                  }`}
                >
                  {/* Enable/disable toggle */}
                  <button
                    type="button"
                    onClick={() => toggleScheduledTask(task.id)}
                    className={`h-4 w-4 shrink-0 rounded border transition-colors ${
                      task.enabled
                        ? 'border-emerald-500 bg-emerald-500/30'
                        : 'border-white/20 bg-transparent'
                    }`}
                  />

                  {/* Time */}
                  <span className="w-16 shrink-0 text-xs font-mono text-white/60">
                    {formatTime(task.timeMinutes)}
                  </span>

                  {/* Robot dot */}
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: config.color }}
                    title={config.name}
                  />

                  {/* Command */}
                  <span className="flex-1 truncate text-xs text-white/80">
                    {task.command}
                  </span>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeScheduledTask(task.id)}
                    className="shrink-0 text-white/20 hover:text-red-400 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
