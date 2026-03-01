// @ts-nocheck
// ── Neighborhood Panel ────────────────────────────────────────
// Shows neighbor houses, visiting robots, and interaction status.

import { useStore } from '../../stores/useStore';
import { ROBOT_IDS } from '../../types';
import type { NeighborHouse } from '../../systems/Neighborhood';

function ResidentBadge({ name, personality, color }: { name: string; personality: string; color: string }) {
  const personalityEmoji: Record<string, string> = {
    friendly: '😊',
    grumpy: '😤',
    curious: '🤔',
    shy: '😶',
  };

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-white/80">{name}</span>
      <span className="text-[10px]">{personalityEmoji[personality] ?? '🤖'}</span>
    </div>
  );
}

function VisitingRobotRow({ robotId, houseId, interaction }: { robotId: string; houseId: string; interaction: string }) {
  const recallRobot = useStore((s) => s.recallRobot);
  const robotNames: Record<string, string> = { sim: 'Sim', chef: 'Chef', sparkle: 'Sparkle' };
  const robotColors: Record<string, string> = { sim: '#4fc3f7', chef: '#e57373', sparkle: '#81c784' };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: robotColors[robotId] ?? '#888' }} />
      <div className="flex-1">
        <div className="text-[11px] font-medium text-white/90">{robotNames[robotId] ?? robotId}</div>
        <div className="text-[9px] italic text-white/50">{interaction}</div>
      </div>
      <button
        type="button"
        onClick={() => recallRobot(robotId as 'sim' | 'chef' | 'sparkle')}
        className="rounded border border-orange-400/30 bg-orange-500/10 px-2 py-0.5 text-[9px] text-orange-300 transition-all hover:bg-orange-500/20"
      >
        Recall
      </button>
    </div>
  );
}

function HouseCard({ house }: { house: NeighborHouse }) {
  const setVisitingHouseId = useStore((s) => s.setVisitingHouseId);
  const sendRobotToVisit = useStore((s) => s.sendRobotToVisit);
  const activeVisits = useStore((s) => s.activeVisits);
  const activeRobotId = useStore((s) => s.activeRobotId);

  const isVisiting = activeVisits.some((v) => v.robotId === activeRobotId && v.houseId === house.id);
  const visitingHere = activeVisits.filter((v) => v.houseId === house.id);
  const canSend = !activeVisits.some((v) => v.robotId === activeRobotId);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg"
            style={{ backgroundColor: house.style.wallColor, border: `2px solid ${house.style.roofColor}` }}
          />
          <div>
            <div className="text-sm font-bold text-white">{house.name}</div>
            <div className="text-[10px] text-white/40">
              {house.style.stories}-story {house.style.hasGarage ? '+ garage' : ''} {house.style.hasPorch ? '+ porch' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Residents */}
      <div className="mb-2">
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-white/30">Residents</div>
        <div className="flex flex-wrap gap-1">
          {house.residents.map((r) => (
            <ResidentBadge key={r.id} name={r.name} personality={r.personality} color={r.color} />
          ))}
        </div>
      </div>

      {/* Visiting robots */}
      {visitingHere.length > 0 && (
        <div className="mb-2 space-y-1">
          <div className="text-[10px] font-medium uppercase tracking-wider text-white/30">Visiting</div>
          {visitingHere.map((v) => (
            <VisitingRobotRow key={v.robotId} robotId={v.robotId} houseId={v.houseId} interaction={v.interaction} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setVisitingHouseId(house.id)}
          className="flex-1 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2 py-1.5 text-[11px] font-medium text-cyan-200 transition-all hover:bg-cyan-500/20"
        >
          View Interior
        </button>
        <button
          type="button"
          onClick={() => sendRobotToVisit(activeRobotId, house.id)}
          disabled={!canSend}
          className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-all ${
            canSend
              ? 'border-green-400/30 bg-green-500/10 text-green-200 hover:bg-green-500/20'
              : 'border-white/10 bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          {isVisiting ? 'Already visiting' : canSend ? 'Send Robot' : 'Robot busy'}
        </button>
      </div>
    </div>
  );
}

export function NeighborhoodPanel() {
  const show = useStore((s) => s.showNeighborhoodPanel);
  const setShow = useStore((s) => s.setShowNeighborhoodPanel);
  const neighborHouses = useStore((s) => s.neighborHouses);
  const streetView = useStore((s) => s.streetView);
  const setStreetView = useStore((s) => s.setStreetView);
  const visitingHouseId = useStore((s) => s.visitingHouseId);
  const returnToPlayerHouse = useStore((s) => s.returnToPlayerHouse);
  const activeVisits = useStore((s) => s.activeVisits);

  if (!show) return null;

  return (
    <div className="pointer-events-auto fixed left-4 top-1/2 z-40 flex max-h-[85vh] w-80 -translate-y-1/2 flex-col rounded-2xl border border-white/10 bg-black/80 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-cyan-400">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-sm font-bold text-white">Neighborhood</span>
        </div>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white/60 hover:bg-white/10"
        >
          x
        </button>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 border-b border-white/10 px-4 py-2">
        <button
          type="button"
          onClick={() => setStreetView(true)}
          className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all ${
            streetView
              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
          }`}
        >
          Street View
        </button>
        <button
          type="button"
          onClick={() => returnToPlayerHouse()}
          className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all ${
            !streetView && !visitingHouseId
              ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
          }`}
        >
          My House
        </button>
      </div>

      {/* Currently viewing */}
      {visitingHouseId && (
        <div className="flex items-center justify-between border-b border-white/10 bg-cyan-500/10 px-4 py-2">
          <span className="text-[11px] text-cyan-200">
            Viewing: {neighborHouses.find((h) => h.id === visitingHouseId)?.name ?? 'Unknown'}
          </span>
          <button
            type="button"
            onClick={() => returnToPlayerHouse()}
            className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/70 hover:bg-white/10"
          >
            Return Home
          </button>
        </div>
      )}

      {/* Active visits summary */}
      {activeVisits.length > 0 && (
        <div className="border-b border-white/10 bg-green-500/5 px-4 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wider text-green-400/60">Active Visits</div>
          <div className="text-[11px] text-green-200">
            {activeVisits.length} robot{activeVisits.length > 1 ? 's' : ''} out visiting
          </div>
        </div>
      )}

      {/* House list */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-3">
          {neighborHouses.map((house) => (
            <HouseCard key={house.id} house={house} />
          ))}
        </div>
      </div>
    </div>
  );
}
