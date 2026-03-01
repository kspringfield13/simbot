import { useStore } from '../../stores/useStore';
import { FLOOR_PLAN_PRESETS } from '../../config/floorPlans';

const PLAN_ICONS: Record<string, string> = {
  studio: 'S',
  apartment: 'A',
  house: 'H',
  loft: 'L',
  mansion: 'M',
};

export function FloorPlanSelector() {
  const show = useStore((s) => s.showFloorPlanSelector);
  const setShow = useStore((s) => s.setShowFloorPlanSelector);
  const currentId = useStore((s) => s.floorPlanId);
  const setFloorPlan = useStore((s) => s.setFloorPlan);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShow(false)}
      />

      {/* Panel */}
      <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-gray-900/95 p-5 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Floor Plans</h2>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-xs text-gray-400">
          Choose a layout for your home. Switching resets room edits and furniture positions.
        </p>

        {/* Presets grid */}
        <div className="flex flex-col gap-2">
          {FLOOR_PLAN_PRESETS.map((preset) => {
            const isActive = preset.id === currentId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  if (!isActive) setFloorPlan(preset.id);
                }}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                  isActive
                    ? 'border-blue-400/50 bg-blue-500/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    isActive
                      ? 'bg-blue-500/30 text-blue-300'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {PLAN_ICONS[preset.id] ?? '?'}
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{preset.name}</span>
                    {isActive && (
                      <span className="rounded-full bg-blue-500/30 px-2 py-0.5 text-[10px] font-medium text-blue-300">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {preset.description} &middot; {preset.rooms.length} room{preset.rooms.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Room count badge */}
                <div className="shrink-0 text-xs text-gray-500">
                  {preset.furniture.length} items
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
