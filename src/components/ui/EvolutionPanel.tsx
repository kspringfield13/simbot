import { useStore } from '../../stores/useStore';
import { ROBOT_CONFIGS } from '../../config/robots';
import { useRobotDisplayName } from '../../stores/useRobotNames';
import {
  getStageLabel,
  getStageColor,
  getStageIndex,
  getNextStageThreshold,
  getDominantTask,
} from '../../utils/evolution';
import type { RobotId, EvolutionStage } from '../../types';
import { ROBOT_IDS } from '../../types';

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
  mowing: 'Mowing',
  watering: 'Watering',
  'leaf-blowing': 'Leaf Blowing',
  weeding: 'Weeding',
  'feeding-fish': 'Fish Care',
  'feeding-hamster': 'Hamster Care',
  visiting: 'Visiting',
};

const STAGES: EvolutionStage[] = ['newborn', 'junior', 'seasoned', 'veteran', 'legendary'];

function StageTimeline({ currentStage }: { currentStage: EvolutionStage }) {
  const currentIdx = getStageIndex(currentStage);
  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage, idx) => {
        const reached = idx <= currentIdx;
        const color = getStageColor(stage);
        return (
          <div key={stage} className="flex items-center gap-1">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold transition-all ${
                reached ? 'ring-1' : 'opacity-30'
              }`}
              style={{
                background: reached ? `${color}33` : 'transparent',
                color: reached ? color : '#666',
                border: `1px solid ${reached ? color : '#333'}`,
                boxShadow: reached ? `0 0 0 2px ${color}33` : 'none',
              }}
              title={getStageLabel(stage)}
            >
              {idx + 1}
            </div>
            {idx < STAGES.length - 1 && (
              <div
                className="h-px w-3"
                style={{ background: idx < currentIdx ? color : '#333' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RobotEvolutionCard({ robotId }: { robotId: RobotId }) {
  const evo = useStore((s) => s.robotEvolutions[robotId]);
  const config = ROBOT_CONFIGS[robotId];
  const customColor = useStore((s) => s.robotColors[robotId]);
  const displayColor = customColor ?? config.color;
  const displayName = useRobotDisplayName(robotId);

  const stageColor = getStageColor(evo.stage);
  const stageLabel = getStageLabel(evo.stage);
  const nextThreshold = getNextStageThreshold(evo.stage);
  const progress = nextThreshold
    ? Math.min(100, (evo.totalTasksCompleted / nextThreshold) * 100)
    : 100;

  const dominantTask = getDominantTask(evo.taskSpecialty);
  const dominantCount = dominantTask ? (evo.taskSpecialty[dominantTask] ?? 0) : 0;

  // Top 3 task specialties
  const topTasks = Object.entries(evo.taskSpecialty)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
    .slice(0, 3);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ background: displayColor, boxShadow: `0 0 6px ${displayColor}66` }}
          />
          <span className="text-sm font-bold text-white">{displayName}</span>
        </div>
        <div
          className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider"
          style={{ background: `${stageColor}22`, color: stageColor, border: `1px solid ${stageColor}44` }}
        >
          {stageLabel}
        </div>
      </div>

      {/* Stage timeline */}
      <div className="mb-3">
        <StageTimeline currentStage={evo.stage} />
      </div>

      {/* Progress bar to next stage */}
      {nextThreshold && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className="text-white/40">Next evolution</span>
            <span className="text-white/60">{evo.totalTasksCompleted}/{nextThreshold} tasks</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: stageColor }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mb-2 grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-lg bg-white/5 px-2 py-1.5">
          <div className="text-white/30">Tasks Done</div>
          <div className="text-sm font-bold text-white">{evo.totalTasksCompleted}</div>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-1.5">
          <div className="text-white/30">Work Time</div>
          <div className="text-sm font-bold text-white">{Math.round(evo.totalWorkTime)}s</div>
        </div>
      </div>

      {/* Top specialties */}
      {topTasks.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-white/30">Specialties</div>
          {topTasks.map(([taskType, count]) => {
            const pct = evo.totalTasksCompleted > 0 ? ((count ?? 0) / evo.totalTasksCompleted) * 100 : 0;
            return (
              <div key={taskType} className="flex items-center gap-2">
                <span className="w-16 truncate text-[10px] text-white/50">
                  {TASK_LABELS[taskType] ?? taskType}
                </span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: stageColor }}
                  />
                </div>
                <span className="text-[9px] text-white/40">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Dominant task flavor text */}
      {dominantTask && dominantCount >= 5 && (
        <div className="mt-2 rounded-lg bg-white/5 px-2 py-1.5 text-[10px] italic text-white/40">
          Specialist in {TASK_LABELS[dominantTask]?.toLowerCase() ?? dominantTask} ({dominantCount} completions)
        </div>
      )}
    </div>
  );
}

export function EvolutionPanel() {
  const show = useStore((s) => s.showEvolutionPanel);
  const setShow = useStore((s) => s.setShowEvolutionPanel);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900 to-black p-4 shadow-2xl">
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
          <h2 className="text-lg font-bold text-white">Robot Evolution</h2>
          <p className="text-xs text-white/40">
            Robots evolve as they complete tasks. Each stage brings visual changes and new glow effects.
          </p>
        </div>

        {/* Robot cards */}
        <div className="space-y-3">
          {ROBOT_IDS.map((id) => (
            <RobotEvolutionCard key={id} robotId={id} />
          ))}
        </div>

        {/* Legend with visual descriptions */}
        <div className="mt-4 rounded-xl border border-white/5 bg-white/5 p-3">
          <div className="mb-2 text-[10px] font-bold text-white/50">Evolution Stages</div>
          <div className="space-y-2">
            {STAGES.map((stage, idx) => {
              const color = getStageColor(stage);
              const thresholds = [0, 10, 40, 100, 200];
              const visuals: Record<string, string> = {
                newborn: 'Base appearance — no accessories',
                junior: 'Glowing antenna + subtle size increase',
                seasoned: 'Shoulder accent lights + color shift',
                veteran: 'Orbiting particle ring + glow pulse',
                legendary: 'Crown halo + dense particle ring + max glow',
              };
              return (
                <div key={stage} className="flex items-start gap-2 rounded-lg bg-white/5 px-2 py-1.5">
                  <div
                    className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[8px] font-bold"
                    style={{ background: `${color}33`, color, border: `1px solid ${color}66` }}
                  >
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold" style={{ color }}>{getStageLabel(stage)}</span>
                      <span className="text-[9px] text-white/30">{thresholds[idx]}+ tasks</span>
                    </div>
                    <div className="text-[9px] text-white/40">{visuals[stage]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
