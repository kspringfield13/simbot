import { useEffect } from 'react';
import { useStore } from '../../stores/useStore';

/** Renders floating "+N" coin animations when tasks complete. Auto-removes after animation ends. */
export function CoinAnimationOverlay() {
  const animations = useStore((s) => s.coinAnimations);
  const removeCoinAnimation = useStore((s) => s.removeCoinAnimation);

  // Auto-remove animations after 2s
  useEffect(() => {
    if (animations.length === 0) return;
    const timers = animations.map((a) => {
      const age = Date.now() - a.createdAt;
      const remaining = Math.max(0, 2000 - age);
      return window.setTimeout(() => removeCoinAnimation(a.id), remaining);
    });
    return () => timers.forEach(clearTimeout);
  }, [animations, removeCoinAnimation]);

  if (animations.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {animations.map((anim, i) => {
        // Stagger horizontally so multiple animations don't overlap
        const offsetX = 50 + (i % 3 - 1) * 60;
        return (
          <div
            key={anim.id}
            className="absolute animate-coin-float"
            style={{
              left: `${offsetX}%`,
              top: '45%',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex items-center gap-1 rounded-full border border-yellow-400/40 bg-black/70 px-3 py-1.5 shadow-lg backdrop-blur-sm">
              <span className="text-base">🪙</span>
              <span className="text-sm font-bold text-yellow-300">+{anim.amount}</span>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes coin-float {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(0) scale(0.7);
          }
          15% {
            opacity: 1;
            transform: translateX(-50%) translateY(-10px) scale(1.1);
          }
          30% {
            transform: translateX(-50%) translateY(-25px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-80px) scale(0.8);
          }
        }
        .animate-coin-float {
          animation: coin-float 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
