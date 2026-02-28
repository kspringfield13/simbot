import { useEffect, useState } from 'react';
import { useStore } from '../../stores/useStore';

const SEASON_COLORS: Record<string, string> = {
  spring: 'border-green-400/40 bg-green-900/60',
  summer: 'border-yellow-400/40 bg-yellow-900/60',
  fall: 'border-orange-400/40 bg-orange-900/60',
  winter: 'border-blue-400/40 bg-blue-900/60',
};

export function SeasonToast() {
  const seasonToast = useStore((s) => s.seasonToast);
  const currentSeason = useStore((s) => s.currentSeason);
  const setSeasonToast = useStore((s) => s.setSeasonToast);
  const [visible, setVisible] = useState(false);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (seasonToast) {
      setDisplayText(seasonToast);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setSeasonToast(null), 600);
      }, 4000);

      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [seasonToast, setSeasonToast]);

  if (!visible && !displayText) return null;

  const colorClass = SEASON_COLORS[currentSeason] ?? 'border-white/10 bg-black/70';

  return (
    <div
      className={`pointer-events-none fixed left-1/2 top-14 z-50 -translate-x-1/2 transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'
      }`}
      onTransitionEnd={() => {
        if (!visible) setDisplayText('');
      }}
    >
      <div className={`rounded-xl border px-6 py-3 text-base font-medium text-white shadow-lg backdrop-blur-md ${colorClass}`}>
        {displayText}
      </div>
    </div>
  );
}
