import { useEffect, useRef, useState } from 'react';
import { useStore, type NotificationType, type AppNotification } from '../../stores/useStore';

const ICON_MAP: Record<NotificationType, string> = {
  info: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
  warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
  success: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  achievement: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
};

const STYLE_MAP: Record<NotificationType, { border: string; bg: string; icon: string; glow: string }> = {
  info: {
    border: 'border-blue-400/40',
    bg: 'bg-blue-950/90',
    icon: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  warning: {
    border: 'border-amber-400/40',
    bg: 'bg-amber-950/90',
    icon: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
  success: {
    border: 'border-green-400/40',
    bg: 'bg-green-950/90',
    icon: 'text-green-400',
    glow: 'shadow-green-500/20',
  },
  achievement: {
    border: 'border-yellow-400/50',
    bg: 'bg-gradient-to-r from-yellow-950/95 to-amber-950/95',
    icon: 'text-yellow-300',
    glow: 'shadow-yellow-500/30',
  },
};

const AUTO_DISMISS_MS = 5000;
const MAX_VISIBLE = 3;

interface VisibleToast {
  notification: AppNotification;
  exiting: boolean;
}

export function NotificationSystem() {
  const notifications = useStore((s) => s.notifications);
  const dismissNotification = useStore((s) => s.dismissNotification);
  const [toasts, setToasts] = useState<VisibleToast[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Watch for new notifications and add to visible toasts
  useEffect(() => {
    for (const n of notifications) {
      if (seenIdsRef.current.has(n.id)) continue;
      seenIdsRef.current.add(n.id);

      setToasts((prev) => {
        const next = [...prev, { notification: n, exiting: false }];
        // If exceeding max, start exit animation on oldest
        if (next.length > MAX_VISIBLE) {
          const overflow = next.length - MAX_VISIBLE;
          for (let i = 0; i < overflow; i++) {
            next[i] = { ...next[i], exiting: true };
          }
        }
        return next;
      });

      // Auto-dismiss timer
      const timer = setTimeout(() => {
        startExit(n.id);
      }, AUTO_DISMISS_MS);
      timersRef.current.set(n.id, timer);
    }
  }, [notifications]);

  function startExit(id: string) {
    setToasts((prev) =>
      prev.map((t) => (t.notification.id === id ? { ...t, exiting: true } : t)),
    );
    // Remove after exit animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.notification.id !== id));
      dismissNotification(id);
      seenIdsRef.current.delete(id);
      const timer = timersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    }, 400);
  }

  function handleDismiss(id: string) {
    const timer = timersRef.current.get(id);
    if (timer) clearTimeout(timer);
    startExit(id);
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2"
      style={{ maxWidth: 360 }}
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.slice(-MAX_VISIBLE).map(({ notification: n, exiting }) => {
        const style = STYLE_MAP[n.type];
        return (
          <div
            key={n.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md transition-all duration-400 ${style.border} ${style.bg} ${style.glow} ${
              exiting
                ? 'translate-x-[120%] opacity-0'
                : 'translate-x-0 opacity-100'
            } ${n.type === 'achievement' ? 'ring-1 ring-yellow-400/20' : ''}`}
            role="alert"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`mt-0.5 h-5 w-5 flex-shrink-0 ${style.icon} ${
                n.type === 'achievement' ? 'animate-pulse' : ''
              }`}
            >
              <path d={ICON_MAP[n.type]} />
            </svg>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white">{n.title}</div>
              <div className="mt-0.5 text-xs text-white/60 leading-relaxed">{n.message}</div>
            </div>
            <button
              type="button"
              onClick={() => handleDismiss(n.id)}
              className="mt-0.5 flex-shrink-0 text-white/30 transition-colors hover:text-white/70"
              aria-label="Dismiss notification"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
