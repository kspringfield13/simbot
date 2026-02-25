import { useStore } from '../../stores/useStore';

const BARS: { key: 'energy' | 'happiness' | 'social' | 'boredom'; icon: string; color: string; invertColor?: boolean }[] = [
  { key: 'energy', icon: '⚡', color: '#facc15' },
  { key: 'happiness', icon: '😊', color: '#4ade80' },
  { key: 'social', icon: '💬', color: '#60a5fa' },
  { key: 'boredom', icon: '😴', color: '#f87171', invertColor: true },
];

export function NeedsIndicator() {
  const needs = useStore((s) => s.robotNeeds);

  return (
    <div className="absolute right-3 bottom-20 z-20 flex flex-col gap-1.5 rounded-xl border border-white/6 bg-black/50 p-2 backdrop-blur-md">
      {BARS.map(({ key, icon, color, invertColor }) => {
        const val = needs[key];
        // For boredom, low is good (invert display)
        const displayVal = invertColor ? 100 - val : val;
        const isLow = displayVal < 25;

        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`text-[10px] ${isLow ? 'animate-pulse' : ''}`}>{icon}</span>
            <div className="h-1 w-12 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${displayVal}%`,
                  backgroundColor: isLow ? '#f87171' : color,
                  opacity: isLow ? 1 : 0.6,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
