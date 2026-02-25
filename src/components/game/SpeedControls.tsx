import { useStore } from '../../stores/useStore';
import type { SimSpeed } from '../../stores/useStore';

const speedOptions: { label: string; value: SimSpeed }[] = [
  { label: 'Pause', value: 0 },
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '3x', value: 3 },
];

export function SpeedControls() {
  const simSpeed = useStore((state) => state.simSpeed);
  const setSimSpeed = useStore((state) => state.setSimSpeed);

  return (
    <div className="grid grid-cols-4 gap-1 rounded-xl bg-black/45 p-1 backdrop-blur-md">
      {speedOptions.map((option) => (
        <button
          key={option.label}
          type="button"
          onClick={() => setSimSpeed(option.value)}
          className={`h-11 min-w-11 rounded-lg px-2 text-xs font-semibold transition ${
            simSpeed === option.value
              ? 'bg-cyan-500/30 text-cyan-100'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
