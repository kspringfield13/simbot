import { useState } from 'react';
import { useStore } from '../../stores/useStore';
import { FLOOR_PLAN_PRESETS } from '../../config/floorPlans';
import { generateRandomFloorPlan, saveCustomFloorPlan, loadCustomFloorPlans, deleteCustomFloorPlan } from '../../utils/proceduralFloorPlan';

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
  const [customPlans, setCustomPlans] = useState(() => loadCustomFloorPlans());
  const [generating, setGenerating] = useState(false);

  if (!show) return null;

  const handleGenerate = () => {
    setGenerating(true);
    // Brief visual feedback
    setTimeout(() => {
      const plan = generateRandomFloorPlan();
      saveCustomFloorPlan(plan);
      setCustomPlans(loadCustomFloorPlans());
      setFloorPlan(plan.id);
      setGenerating(false);
    }, 150);
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomFloorPlan(id);
    setCustomPlans(loadCustomFloorPlans());
    if (currentId === id) {
      setFloorPlan('house');
    }
  };

  const allPresets = [...FLOOR_PLAN_PRESETS, ...customPlans];

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

        {/* Generate Random Layout button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition-all hover:border-emerald-400/50 hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {/* Dice icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`}>
            <rect x="2" y="2" width="20" height="20" rx="3" />
            <circle cx="8" cy="8" r="1" fill="currentColor" />
            <circle cx="16" cy="8" r="1" fill="currentColor" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
            <circle cx="8" cy="16" r="1" fill="currentColor" />
            <circle cx="16" cy="16" r="1" fill="currentColor" />
          </svg>
          {generating ? 'Generating...' : 'Generate Random Layout'}
        </button>

        {/* Presets grid */}
        <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto pr-1">
          {allPresets.map((preset) => {
            const isActive = preset.id === currentId;
            const isCustom = preset.id.startsWith('random-');
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
                      : isCustom
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {isCustom ? 'R' : (PLAN_ICONS[preset.id] ?? '?')}
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
                    {isCustom && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        Generated
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {preset.description} &middot; {preset.rooms.length} room{preset.rooms.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {preset.furniture.length} items
                  </span>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCustom(preset.id, e)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-red-500/20 hover:text-red-400"
                      title="Delete custom layout"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
