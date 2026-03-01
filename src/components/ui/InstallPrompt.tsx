import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Hide banner if app was installed
    window.addEventListener('appinstalled', () => {
      setShow(false);
      deferredPrompt = null;
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
    setInstalling(false);
    deferredPrompt = null;
  }, []);

  const handleDismiss = useCallback(() => {
    setShow(false);
    deferredPrompt = null;
  }, []);

  if (!show) return null;

  return (
    <div className="pointer-events-auto fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-[slideUp_0.3s_ease-out]">
      <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/30 bg-black/80 px-4 py-3 shadow-lg shadow-cyan-500/10 backdrop-blur-xl">
        {/* Robot icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-cyan-300">
            <rect x="5" y="4" width="14" height="12" rx="2" />
            <circle cx="9" cy="10" r="1.5" fill="currentColor" />
            <circle cx="15" cy="10" r="1.5" fill="currentColor" />
            <line x1="12" y1="1" x2="12" y2="4" />
            <circle cx="12" cy="1" r="1" fill="currentColor" />
            <path d="M8 16v2" /><path d="M16 16v2" />
          </svg>
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">Install SimBot</span>
          <span className="text-xs text-white/50">Add to home screen for offline use</span>
        </div>

        <div className="ml-2 flex gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg px-3 py-1.5 text-xs text-white/40 transition-colors hover:text-white/70"
          >
            Later
          </button>
          <button
            type="button"
            onClick={handleInstall}
            disabled={installing}
            className="rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-black transition-all hover:bg-cyan-400 disabled:opacity-50"
          >
            {installing ? 'Installing...' : 'Install'}
          </button>
        </div>
      </div>
    </div>
  );
}
