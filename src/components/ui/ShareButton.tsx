import { useCallback, useState } from 'react';
import { useShareUrl } from '../../hooks/useSpectator';
import { useStore } from '../../stores/useStore';

export function ShareButton() {
  const generateUrl = useShareUrl();
  const viewerCount = useStore((s) => s.spectatorViewerCount);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = generateUrl();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SimBot - Watch my robots!',
          text: 'Check out my SimBot simulation',
          url,
        });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed — open prompt
      window.prompt('Copy this spectator link:', url);
    }
  }, [generateUrl]);

  return (
    <div className="pointer-events-auto flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleShare}
        className={`flex h-10 items-center gap-1.5 rounded-full border px-3 text-sm backdrop-blur-md transition-all ${
          copied
            ? 'border-green-400/50 bg-green-500/30 text-green-200'
            : 'border-white/10 bg-black/50 text-white hover:bg-black/70'
        }`}
        title="Share spectator link"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        {copied ? 'Copied!' : 'Share'}
      </button>
      {viewerCount > 0 && (
        <span className="whitespace-nowrap rounded-full border border-cyan-400/30 bg-black/60 px-2.5 py-1 text-[11px] text-cyan-200 backdrop-blur-md">
          {viewerCount} watching
        </span>
      )}
    </div>
  );
}
