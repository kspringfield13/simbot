import { useStore } from '../../stores/useStore';
import type { SimSpeed } from '../../stores/useStore';

const speeds: { label: string; value: SimSpeed }[] = [
  { label: '⏸', value: 0 },
  { label: '›', value: 1 },
  { label: '››', value: 2 },
  { label: '›››', value: 3 },
];

export function SpeedControls() {
  const simSpeed = useStore((s) => s.simSpeed);
  const setSimSpeed = useStore((s) => s.setSimSpeed);

  return (
    <div className="flex gap-0.5 rounded-full bg-white/5 p-0.5">
      {speeds.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => { if (navigator.vibrate) navigator.vibrate(8); setSimSpeed(s.value); }}
          className={`h-9 min-w-9 rounded-full px-2 text-xs font-medium transition-colors ${
            simSpeed === s.value
              ? 'bg-white text-black'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
