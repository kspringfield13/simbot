import { useState } from 'react';
import { useStore } from '../../stores/useStore';
import {
  ROBOT_PARTS,
  getPartsForSlot,
  getPartById,
  calculateRobotStats,
  getRarityColor,
  type PartSlot,
  type RobotPart,
} from '../../config/crafting';

type Tab = 'parts' | 'assemble' | 'robots';

const SLOT_LABELS: Record<PartSlot, { icon: string; label: string }> = {
  head: { icon: '🧠', label: 'Heads' },
  body: { icon: '🦾', label: 'Bodies' },
  arms: { icon: '🤖', label: 'Arms' },
  legs: { icon: '🦿', label: 'Legs' },
};

const SLOTS: PartSlot[] = ['head', 'body', 'arms', 'legs'];

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-[11px] text-white/50">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: pct > 60 ? '#4ade80' : pct > 30 ? '#facc15' : '#9ca3af',
          }}
        />
      </div>
      <span className="w-10 text-right text-[11px] font-medium text-white/60">
        +{Math.round(value * 100)}%
      </span>
    </div>
  );
}

function PartCard({
  part,
  owned,
  selected,
  canAfford,
  onBuy,
  onSelect,
  flash,
}: {
  part: RobotPart;
  owned: boolean;
  selected: boolean;
  canAfford: boolean;
  onBuy: () => void;
  onSelect: () => void;
  flash: boolean;
}) {
  const rarityColor = getRarityColor(part.rarity);

  return (
    <button
      type="button"
      onClick={owned ? onSelect : canAfford ? onBuy : undefined}
      className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all ${
        selected
          ? 'border-cyan-400/50 bg-cyan-400/15 ring-1 ring-cyan-400/30'
          : owned
            ? 'border-white/10 bg-white/5 hover:bg-white/10'
            : canAfford
              ? 'border-white/10 bg-white/[0.03] hover:bg-white/5'
              : 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
      } ${flash ? 'scale-[1.02] border-yellow-400/50 bg-yellow-400/10' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{part.name}</span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
              style={{ backgroundColor: `${rarityColor}20`, color: rarityColor }}
            >
              {part.rarity}
            </span>
            {owned && (
              <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[9px] font-bold text-green-400">
                OWNED
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-white/35">{part.description}</p>
          <div className="mt-1.5 flex gap-3 text-[10px] text-white/40">
            <span>SPD +{Math.round(part.speedBonus * 100)}%</span>
            <span>BAT +{Math.round(part.batteryBonus * 100)}%</span>
            <span>EFF +{Math.round(part.efficiencyBonus * 100)}%</span>
          </div>
        </div>
        {!owned && (
          <div className="flex items-center gap-1 rounded-lg bg-yellow-400/15 px-2 py-1 text-[11px] font-semibold text-yellow-300">
            <span>🪙</span>
            <span>{part.cost}</span>
          </div>
        )}
      </div>
    </button>
  );
}

function RobotPreview({
  headId,
  bodyId,
  armsId,
  legsId,
}: {
  headId: string | null;
  bodyId: string | null;
  armsId: string | null;
  legsId: string | null;
}) {
  const head = headId ? getPartById(headId) : null;
  const body = bodyId ? getPartById(bodyId) : null;
  const arms = armsId ? getPartById(armsId) : null;
  const legs = legsId ? getPartById(legsId) : null;

  const partIds = [headId, bodyId, armsId, legsId].filter(Boolean) as string[];
  const stats = calculateRobotStats(partIds);
  const allSelected = head && body && arms && legs;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-white/30">
        Robot Preview
      </div>

      {/* Visual preview - ASCII art style robot */}
      <div className="mb-4 flex justify-center">
        <div className="flex flex-col items-center gap-0.5 font-mono text-sm">
          <div
            className={`flex h-10 w-14 items-center justify-center rounded-t-xl border-2 transition-all ${
              head ? 'border-cyan-400/50 bg-cyan-400/15' : 'border-white/10 bg-white/[0.03]'
            }`}
            title={head?.name ?? 'No head'}
          >
            <span className="text-xs">{head ? '🧠' : '?'}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-l-lg border-2 transition-all ${
                arms ? 'border-cyan-400/50 bg-cyan-400/15' : 'border-white/10 bg-white/[0.03]'
              }`}
              title={arms?.name ?? 'No arms'}
            >
              <span className="text-[10px]">{arms ? '🤖' : '?'}</span>
            </div>
            <div
              className={`flex h-12 w-14 items-center justify-center border-2 transition-all ${
                body ? 'border-cyan-400/50 bg-cyan-400/15' : 'border-white/10 bg-white/[0.03]'
              }`}
              title={body?.name ?? 'No body'}
            >
              <span className="text-xs">{body ? '🦾' : '?'}</span>
            </div>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-r-lg border-2 transition-all ${
                arms ? 'border-cyan-400/50 bg-cyan-400/15' : 'border-white/10 bg-white/[0.03]'
              }`}
              title={arms?.name ?? 'No arms'}
            >
              <span className="text-[10px]">{arms ? '🤖' : '?'}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <div
              className={`flex h-10 w-6 items-center justify-center rounded-b-lg border-2 transition-all ${
                legs ? 'border-cyan-400/50 bg-cyan-400/15' : 'border-white/10 bg-white/[0.03]'
              }`}
              title={legs?.name ?? 'No legs'}
            >
              <span className="text-[10px]">{legs ? '🦿' : '?'}</span>
            </div>
            <div
              className={`flex h-10 w-6 items-center justify-center rounded-b-lg border-2 transition-all ${
                legs ? 'border-cyan-400/50 bg-cyan-400/15' : 'border-white/10 bg-white/[0.03]'
              }`}
              title={legs?.name ?? 'No legs'}
            >
              <span className="text-[10px]">{legs ? '🦿' : '?'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Part names */}
      <div className="mb-3 grid grid-cols-2 gap-1 text-[10px]">
        {SLOTS.map((slot) => {
          const part = slot === 'head' ? head : slot === 'body' ? body : slot === 'arms' ? arms : legs;
          return (
            <div key={slot} className="flex items-center gap-1 text-white/40">
              <span>{SLOT_LABELS[slot].icon}</span>
              <span className={part ? 'text-white/70' : ''}>{part?.name ?? 'Empty'}</span>
            </div>
          );
        })}
      </div>

      {/* Combined stats */}
      {partIds.length > 0 && (
        <div className="space-y-1.5">
          <StatBar label="Speed" value={stats.speedBonus} max={0.5} />
          <StatBar label="Battery" value={stats.batteryBonus} max={0.35} />
          <StatBar label="Efficiency" value={stats.efficiencyBonus} max={0.45} />
        </div>
      )}

      {!allSelected && (
        <p className="mt-2 text-center text-[10px] text-white/25">
          Select one part per slot to build
        </p>
      )}
    </div>
  );
}

export function CraftingPanel() {
  const showCrafting = useStore((s) => s.showCrafting);
  const setShowCrafting = useStore((s) => s.setShowCrafting);
  const coins = useStore((s) => s.coins);
  const ownedParts = useStore((s) => s.ownedParts);
  const customRobots = useStore((s) => s.customRobots);
  const purchasePart = useStore((s) => s.purchasePart);
  const buildCustomRobot = useStore((s) => s.buildCustomRobot);
  const deployCustomRobot = useStore((s) => s.deployCustomRobot);
  const deleteCustomRobot = useStore((s) => s.deleteCustomRobot);

  const [tab, setTab] = useState<Tab>('parts');
  const [partSlotFilter, setPartSlotFilter] = useState<PartSlot>('head');
  const [flashItem, setFlashItem] = useState<string | null>(null);

  // Assembly state
  const [selectedHead, setSelectedHead] = useState<string | null>(null);
  const [selectedBody, setSelectedBody] = useState<string | null>(null);
  const [selectedArms, setSelectedArms] = useState<string | null>(null);
  const [selectedLegs, setSelectedLegs] = useState<string | null>(null);
  const [robotName, setRobotName] = useState('');

  if (!showCrafting) return null;

  const handleBuyPart = (partId: string, cost: number) => {
    const ok = purchasePart(partId, cost);
    if (ok) {
      setFlashItem(partId);
      setTimeout(() => setFlashItem(null), 600);
    }
  };

  const getSelectedForSlot = (slot: PartSlot) => {
    if (slot === 'head') return selectedHead;
    if (slot === 'body') return selectedBody;
    if (slot === 'arms') return selectedArms;
    return selectedLegs;
  };

  const setSelectedForSlot = (slot: PartSlot, id: string | null) => {
    if (slot === 'head') setSelectedHead(id);
    else if (slot === 'body') setSelectedBody(id);
    else if (slot === 'arms') setSelectedArms(id);
    else setSelectedLegs(id);
  };

  const canBuild = selectedHead && selectedBody && selectedArms && selectedLegs && robotName.trim();

  const handleBuild = () => {
    if (!canBuild) return;
    buildCustomRobot(robotName.trim(), selectedHead!, selectedBody!, selectedArms!, selectedLegs!);
    setSelectedHead(null);
    setSelectedBody(null);
    setSelectedArms(null);
    setSelectedLegs(null);
    setRobotName('');
    setTab('robots');
  };

  const ownedPartsForSlot = (slot: PartSlot) =>
    getPartsForSlot(slot).filter((p) => ownedParts.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowCrafting(false)}
      />

      {/* Panel */}
      <div className="relative w-[480px] max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-900/95 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔧</span>
            <h2 className="text-lg font-semibold text-white">Crafting Workshop</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1">
              <span className="text-sm">🪙</span>
              <span className="text-sm font-bold text-yellow-300">{coins}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCrafting(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            type="button"
            onClick={() => setTab('parts')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'parts'
                ? 'border-b-2 border-cyan-400 text-cyan-300'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            Parts Shop
          </button>
          <button
            type="button"
            onClick={() => setTab('assemble')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'assemble'
                ? 'border-b-2 border-green-400 text-green-300'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            Assemble
          </button>
          <button
            type="button"
            onClick={() => setTab('robots')}
            className={`relative flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'robots'
                ? 'border-b-2 border-purple-400 text-purple-300'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            My Robots
            {customRobots.length > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-purple-500/30 px-1 text-[9px] font-bold text-purple-300">
                {customRobots.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4">

          {/* ── Parts Shop ─────────────────────────── */}
          {tab === 'parts' && (
            <div className="space-y-3">
              {/* Slot filter */}
              <div className="flex gap-1.5">
                {SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setPartSlotFilter(slot)}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium transition-all ${
                      partSlotFilter === slot
                        ? 'border border-white/20 bg-white/10 text-white'
                        : 'border border-white/5 bg-white/[0.03] text-white/40 hover:text-white/70'
                    }`}
                  >
                    <span>{SLOT_LABELS[slot].icon}</span>
                    <span>{SLOT_LABELS[slot].label}</span>
                  </button>
                ))}
              </div>

              {/* Parts list */}
              <div className="space-y-1.5">
                {getPartsForSlot(partSlotFilter).map((part) => {
                  const owned = ownedParts.includes(part.id);
                  const canAfford = coins >= part.cost;
                  return (
                    <PartCard
                      key={part.id}
                      part={part}
                      owned={owned}
                      selected={false}
                      canAfford={canAfford}
                      onBuy={() => handleBuyPart(part.id, part.cost)}
                      onSelect={() => {}}
                      flash={flashItem === part.id}
                    />
                  );
                })}
              </div>

              <p className="text-center text-[10px] text-white/20">
                Owned: {ownedParts.length}/{ROBOT_PARTS.length} parts
              </p>
            </div>
          )}

          {/* ── Assemble ───────────────────────────── */}
          {tab === 'assemble' && (
            <div className="space-y-4">
              {/* Preview */}
              <RobotPreview
                headId={selectedHead}
                bodyId={selectedBody}
                armsId={selectedArms}
                legsId={selectedLegs}
              />

              {/* Slot selectors */}
              {SLOTS.map((slot) => {
                const owned = ownedPartsForSlot(slot);
                const current = getSelectedForSlot(slot);

                return (
                  <div key={slot}>
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                      {SLOT_LABELS[slot].icon} {SLOT_LABELS[slot].label}
                    </div>
                    {owned.length === 0 ? (
                      <p className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-white/25">
                        No {slot} parts owned — buy from Parts Shop
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {owned.map((part) => (
                          <PartCard
                            key={part.id}
                            part={part}
                            owned={true}
                            selected={current === part.id}
                            canAfford={true}
                            onBuy={() => {}}
                            onSelect={() =>
                              setSelectedForSlot(slot, current === part.id ? null : part.id)
                            }
                            flash={false}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Robot name + Build button */}
              <div className="space-y-2 border-t border-white/10 pt-3">
                <input
                  type="text"
                  value={robotName}
                  onChange={(e) => setRobotName(e.target.value)}
                  placeholder="Name your robot..."
                  maxLength={20}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-400/40"
                />
                <button
                  type="button"
                  disabled={!canBuild}
                  onClick={handleBuild}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                    canBuild
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 active:scale-[0.98]'
                      : 'cursor-not-allowed bg-white/5 text-white/20'
                  }`}
                >
                  🔧 Build Robot
                </button>
              </div>
            </div>
          )}

          {/* ── My Robots ──────────────────────────── */}
          {tab === 'robots' && (
            <div className="space-y-3">
              {customRobots.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mb-2 text-3xl">🤖</div>
                  <p className="text-sm text-white/40">No custom robots yet</p>
                  <p className="mt-1 text-xs text-white/25">
                    Buy parts and assemble your first robot!
                  </p>
                </div>
              ) : (
                customRobots.map((robot) => {
                  const stats = calculateRobotStats([
                    robot.headId,
                    robot.bodyId,
                    robot.armsId,
                    robot.legsId,
                  ]);
                  const head = getPartById(robot.headId);
                  const body = getPartById(robot.bodyId);
                  const arms = getPartById(robot.armsId);
                  const legs = getPartById(robot.legsId);

                  return (
                    <div
                      key={robot.id}
                      className={`rounded-xl border p-4 transition-all ${
                        robot.deployed
                          ? 'border-green-500/40 bg-green-500/10'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{robot.name}</span>
                            {robot.deployed && (
                              <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[9px] font-bold text-green-400">
                                DEPLOYED
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-white/35">
                            <span>🧠 {head?.name ?? '?'}</span>
                            <span>🦾 {body?.name ?? '?'}</span>
                            <span>🤖 {arms?.name ?? '?'}</span>
                            <span>🦿 {legs?.name ?? '?'}</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => deployCustomRobot(robot.id)}
                            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                              robot.deployed
                                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                            }`}
                          >
                            {robot.deployed ? 'Recall' : 'Deploy'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCustomRobot(robot.id)}
                            className="rounded-lg bg-white/5 px-2 py-1.5 text-[11px] text-white/30 transition-all hover:bg-red-500/20 hover:text-red-300"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="mt-3 space-y-1">
                        <StatBar label="Speed" value={stats.speedBonus} max={0.5} />
                        <StatBar label="Battery" value={stats.batteryBonus} max={0.35} />
                        <StatBar label="Efficiency" value={stats.efficiencyBonus} max={0.45} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-white/10 px-5 py-3">
          <p className="text-center text-[11px] text-white/25">
            {tab === 'parts'
              ? 'Buy parts to use in robot assembly'
              : tab === 'assemble'
                ? 'Select one part per slot, name your robot, then build'
                : 'Deploy a robot to activate its stat bonuses'}
          </p>
        </div>
      </div>
    </div>
  );
}
