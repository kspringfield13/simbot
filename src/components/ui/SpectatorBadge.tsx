import { useStore } from '../../stores/useStore';

export function SpectatorBadge() {
  const isSpectating = useStore((s) => s.isSpectating);
  const isLive = useStore((s) => s.spectatorLive);

  if (!isSpectating) return null;

  return (
    <div className="pointer-events-none fixed left-4 top-4 z-50 flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-full border border-cyan-400/40 bg-black/70 px-4 py-2 backdrop-blur-md">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
              isLive ? 'bg-green-400' : 'bg-yellow-400'
            }`}
          />
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
              isLive ? 'bg-green-400' : 'bg-yellow-400'
            }`}
          />
        </span>
        <span className="text-sm font-medium text-white">
          Spectating
        </span>
        <span className="text-xs text-white/50">
          {isLive ? 'LIVE' : 'SNAPSHOT'}
        </span>
      </div>
    </div>
  );
}
