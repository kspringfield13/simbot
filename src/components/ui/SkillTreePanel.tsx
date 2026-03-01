import { useStore } from '../../stores/useStore';
import { useRobotDisplayName } from '../../stores/useRobotNames';
import {
  SKILL_DEFINITIONS,
  SPECIALIZATION_META,
  canUnlockSkill,
  getSkillProgress,
  getSkillsBySpecialization,
} from '../../config/skills';
import type { SkillDefinition, SkillSpecialization, RobotId } from '../../types';
import { ROBOT_IDS } from '../../types';

// ── Node positions for the tree layout ──────────────────────
// Each specialization column is 200px wide. Nodes are laid out by row/col.
const NODE_W = 130;
const NODE_H = 56;
const COL_W = 200;
const ROW_GAP = 80;
const TREE_PAD_TOP = 20;

function getNodeX(col: number): number {
  return col === 0 ? COL_W / 2 - NODE_W / 2 : COL_W / 2 + 30;
}

function getNodeY(row: number): number {
  return TREE_PAD_TOP + row * ROW_GAP;
}

function getNodeCenter(col: number, row: number): { cx: number; cy: number } {
  return {
    cx: getNodeX(col) + NODE_W / 2,
    cy: getNodeY(row) + NODE_H / 2,
  };
}

// ── SVG line between parent and child nodes ──────────────────
function TreeLine({
  parent,
  child,
  unlocked,
}: {
  parent: { col: number; row: number };
  child: { col: number; row: number };
  unlocked: boolean;
}) {
  const p = getNodeCenter(parent.col, parent.row);
  const c = getNodeCenter(child.col, child.row);

  return (
    <line
      x1={p.cx}
      y1={p.cy + NODE_H / 2 - 4}
      x2={c.cx}
      y2={c.cy - NODE_H / 2 + 4}
      stroke={unlocked ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'}
      strokeWidth={unlocked ? 2 : 1}
      strokeDasharray={unlocked ? undefined : '4 4'}
    />
  );
}

// ── Single skill node ──────────────────────────────────────
function SkillNode({
  skill,
  isUnlocked,
  canUnlock,
  progress,
  color,
  onUnlock,
}: {
  skill: SkillDefinition;
  isUnlocked: boolean;
  canUnlock: boolean;
  progress: { current: number; required: number };
  color: string;
  onUnlock: () => void;
}) {
  const pct = Math.round((progress.current / progress.required) * 100);

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: getNodeX(skill.col),
        top: getNodeY(skill.row),
        width: NODE_W,
      }}
    >
      <button
        type="button"
        onClick={canUnlock ? onUnlock : undefined}
        disabled={!canUnlock}
        className={`relative w-full rounded-lg border px-2 py-1.5 text-center transition-all ${
          isUnlocked
            ? 'border-opacity-60 bg-opacity-20 shadow-lg'
            : canUnlock
              ? 'animate-pulse cursor-pointer border-opacity-40 bg-opacity-10 hover:bg-opacity-20'
              : 'cursor-default border-white/5 bg-white/5 opacity-40'
        }`}
        style={{
          borderColor: isUnlocked ? color : canUnlock ? color : undefined,
          backgroundColor: isUnlocked
            ? `${color}22`
            : canUnlock
              ? `${color}11`
              : undefined,
          boxShadow: isUnlocked ? `0 0 12px ${color}33` : undefined,
        }}
        title={skill.description}
      >
        {/* Skill name */}
        <div
          className="text-[10px] font-bold leading-tight"
          style={{ color: isUnlocked ? color : canUnlock ? color : 'rgba(255,255,255,0.35)' }}
        >
          {skill.name}
        </div>

        {/* Bonuses */}
        <div className="mt-0.5 flex items-center justify-center gap-1.5 text-[8px]">
          {skill.speedBonus > 0 && (
            <span className={isUnlocked ? 'text-green-300' : 'text-white/25'}>
              +{Math.round(skill.speedBonus * 100)}% spd
            </span>
          )}
          {skill.qualityBonus > 0 && (
            <span className={isUnlocked ? 'text-blue-300' : 'text-white/25'}>
              +{Math.round(skill.qualityBonus * 100)}% qual
            </span>
          )}
        </div>

        {/* Progress bar */}
        {!isUnlocked && (
          <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor: canUnlock ? color : 'rgba(255,255,255,0.2)',
              }}
            />
          </div>
        )}

        {/* Count label */}
        <div className="mt-0.5 text-[7px] text-white/30">
          {isUnlocked ? 'UNLOCKED' : `${progress.current}/${progress.required}`}
        </div>

        {/* Unlock ready indicator */}
        {canUnlock && (
          <div
            className="absolute -right-1 -top-1 h-3 w-3 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
          />
        )}
      </button>
    </div>
  );
}

// ── One specialization column ──────────────────────────────
function SpecializationTree({
  spec,
  robotId,
}: {
  spec: SkillSpecialization;
  robotId: RobotId;
}) {
  const meta = SPECIALIZATION_META[spec];
  const skills = getSkillsBySpecialization(spec);
  const unlockedSkills = useStore((s) => s.robotSkills[robotId].unlockedSkills);
  const taskCounts = useStore((s) => s.personalities[robotId].taskCounts);
  const unlockSkill = useStore((s) => s.unlockSkill);
  const addNotification = useStore((s) => s.addNotification);

  const maxRow = Math.max(...skills.map((s) => s.row));
  const treeHeight = TREE_PAD_TOP + (maxRow + 1) * ROW_GAP + 10;

  const handleUnlock = (skill: SkillDefinition) => {
    unlockSkill(robotId, skill.id);
    addNotification({
      type: 'achievement',
      title: 'Skill Unlocked!',
      message: `${skill.name} — ${skill.description}`,
    });
  };

  return (
    <div className="flex flex-col items-center">
      {/* Specialization header */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-base">{meta.icon}</span>
        <span className="text-xs font-bold" style={{ color: meta.color }}>
          {meta.name}
        </span>
      </div>

      {/* Tree container */}
      <div className="relative" style={{ width: COL_W, height: treeHeight }}>
        {/* SVG lines connecting nodes */}
        <svg
          className="pointer-events-none absolute inset-0"
          width={COL_W}
          height={treeHeight}
        >
          {skills.map((skill) => {
            if (!skill.prerequisiteId) return null;
            const parent = skills.find((s) => s.id === skill.prerequisiteId);
            if (!parent) return null;
            const parentUnlocked = unlockedSkills.includes(parent.id);
            return (
              <TreeLine
                key={`${parent.id}-${skill.id}`}
                parent={parent}
                child={skill}
                unlocked={parentUnlocked}
              />
            );
          })}
        </svg>

        {/* Skill nodes */}
        {skills.map((skill) => {
          const isUnlocked = unlockedSkills.includes(skill.id);
          const canUnlockNow = canUnlockSkill(skill, unlockedSkills, taskCounts);
          const progress = getSkillProgress(skill, taskCounts);

          return (
            <SkillNode
              key={skill.id}
              skill={skill}
              isUnlocked={isUnlocked}
              canUnlock={canUnlockNow}
              progress={progress}
              color={meta.color}
              onUnlock={() => handleUnlock(skill)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Robot tab selector ──────────────────────────────────────
function RobotTab({ robotId, isActive, onClick }: { robotId: RobotId; isActive: boolean; onClick: () => void }) {
  const displayName = useRobotDisplayName(robotId);
  const customColor = useStore((s) => s.robotColors[robotId]);
  const color = customColor ?? (robotId === 'sim' ? '#1a8cff' : robotId === 'chef' ? '#ff6b35' : '#22c55e');
  const skillCount = useStore((s) => s.robotSkills[robotId].unlockedSkills.length);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
        isActive
          ? 'border border-white/20 bg-white/10'
          : 'border border-transparent bg-white/5 hover:bg-white/10'
      }`}
      style={{ color: isActive ? color : 'rgba(255,255,255,0.5)' }}
    >
      {displayName}
      {skillCount > 0 && (
        <span
          className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-black"
          style={{ backgroundColor: color }}
        >
          {skillCount}
        </span>
      )}
    </button>
  );
}

// ── Stat summary for active robot ────────────────────────────
function SkillSummary({ robotId }: { robotId: RobotId }) {
  const unlockedSkills = useStore((s) => s.robotSkills[robotId].unlockedSkills);
  const totalSkills = SKILL_DEFINITIONS.length;
  const unlocked = unlockedSkills.length;

  // Count unlocked per specialization
  const specCounts: Record<SkillSpecialization, number> = { chef: 0, cleaning: 0, handyman: 0 };
  for (const id of unlockedSkills) {
    const skill = SKILL_DEFINITIONS.find((s) => s.id === id);
    if (skill) specCounts[skill.specialization]++;
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2">
      <div className="text-xs text-white/50">
        Skills: <span className="font-bold text-white">{unlocked}</span>/{totalSkills}
      </div>
      {(['chef', 'cleaning', 'handyman'] as const).map((spec) => {
        const meta = SPECIALIZATION_META[spec];
        const count = specCounts[spec];
        const max = getSkillsBySpecialization(spec).length;
        return (
          <div key={spec} className="flex items-center gap-1 text-[10px]">
            <span>{meta.icon}</span>
            <span style={{ color: count > 0 ? meta.color : 'rgba(255,255,255,0.3)' }}>
              {count}/{max}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main panel ──────────────────────────────────────────────
export function SkillTreePanel() {
  const show = useStore((s) => s.showSkillTree);
  const setShow = useStore((s) => s.setShowSkillTree);
  const activeRobotId = useStore((s) => s.activeRobotId);
  const setActiveRobotId = useStore((s) => s.setActiveRobotId);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-[720px] overflow-auto rounded-xl border border-white/10 bg-gradient-to-b from-slate-900 to-black p-5 shadow-2xl">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌳</span>
            <h2 className="text-lg font-bold text-white">Skill Tree</h2>
          </div>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Robot tabs */}
        <div className="mb-3 flex items-center gap-2">
          {ROBOT_IDS.map((id) => (
            <RobotTab
              key={id}
              robotId={id}
              isActive={activeRobotId === id}
              onClick={() => setActiveRobotId(id)}
            />
          ))}
        </div>

        {/* Summary */}
        <SkillSummary robotId={activeRobotId} />

        {/* Skill trees — three specializations side by side */}
        <div className="mt-4 flex justify-center gap-2">
          {(['chef', 'cleaning', 'handyman'] as const).map((spec) => (
            <SpecializationTree
              key={`${activeRobotId}-${spec}`}
              spec={spec}
              robotId={activeRobotId}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[9px] text-white/30">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            Ready to unlock
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full border border-white/20 bg-white/10" />
            Locked
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            Unlocked
          </div>
        </div>
      </div>
    </div>
  );
}
