import { useMemo } from 'react';
import { useStore } from '../../stores/useStore';
import { getFloorPlan } from '../../config/floorPlans';
import type { FloorLevel } from '../../types';

export function FloorSelector() {
  const floorPlanId = useStore((s) => s.floorPlanId);
  const currentViewFloor = useStore((s) => s.currentViewFloor);
  const setCurrentViewFloor = useStore((s) => s.setCurrentViewFloor);

  const plan = useMemo(() => getFloorPlan(floorPlanId), [floorPlanId]);
  const floors = plan.floors;

  // Only show for multi-floor plans
  if (!floors || floors.length <= 1) return null;

  const floorLabels: Record<number, string> = {
    0: 'Ground',
    1: '2nd Floor',
  };

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-black/60 p-1.5 backdrop-blur-md">
      {/* Floor buttons - reversed so top floor is visually on top */}
      {[...floors].reverse().map((floor) => {
        const isActive = currentViewFloor === floor;
        return (
          <button
            key={floor}
            type="button"
            onClick={() => setCurrentViewFloor(floor as FloorLevel)}
            className={`flex h-9 min-w-[72px] items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all ${
              isActive
                ? 'bg-cyan-500/40 text-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.3)] border border-cyan-400/40'
                : 'text-white/60 hover:bg-white/10 hover:text-white/90 border border-transparent'
            }`}
            title={`View ${floorLabels[floor] ?? `Floor ${floor}`}`}
          >
            <span className="mr-1.5 text-[10px] opacity-70">F{floor + 1}</span>
            <span>{floorLabels[floor] ?? `Floor ${floor + 1}`}</span>
          </button>
        );
      })}

      {/* Stairs icon indicator */}
      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-white/30">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
          <path d="M2 14h3v-3h3v-3h3V5h3V2h-3v3H8v3H5v3H2v3z" />
        </svg>
      </div>
    </div>
  );
}
