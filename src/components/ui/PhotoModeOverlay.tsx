import { useCallback, useEffect } from 'react';
import { useStore } from '../../stores/useStore';

type PhotoFilter = 'normal' | 'warm' | 'cool' | 'noir' | 'dreamy';

const FILTERS: { id: PhotoFilter; label: string; css: string }[] = [
  { id: 'normal', label: 'Normal', css: 'none' },
  { id: 'warm', label: 'Warm', css: 'sepia(0.35) saturate(1.4) brightness(1.05)' },
  { id: 'cool', label: 'Cool', css: 'saturate(0.85) hue-rotate(25deg) brightness(1.05)' },
  { id: 'noir', label: 'Noir', css: 'grayscale(1) contrast(1.25) brightness(0.9)' },
  { id: 'dreamy', label: 'Dreamy', css: 'saturate(1.3) brightness(1.12) contrast(0.85)' },
];

function getFilterCss(filter: PhotoFilter): string {
  return FILTERS.find((f) => f.id === filter)?.css ?? 'none';
}

export function PhotoModeOverlay() {
  const photoMode = useStore((s) => s.photoMode);
  const photoFilter = useStore((s) => s.photoFilter);
  const setPhotoMode = useStore((s) => s.setPhotoMode);
  const setPhotoFilter = useStore((s) => s.setPhotoFilter);

  // Escape to exit
  useEffect(() => {
    if (!photoMode) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPhotoMode(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [photoMode, setPhotoMode]);

  // Apply CSS filter to canvas for live preview
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    canvas.style.filter = photoMode ? getFilterCss(photoFilter) : 'none';
    return () => { canvas.style.filter = 'none'; };
  }, [photoMode, photoFilter]);

  const takePhoto = useCallback(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    const cssFilter = getFilterCss(photoFilter);

    let dataUrl: string;

    if (cssFilter !== 'none') {
      // Render through offscreen canvas to bake in the CSS filter
      const offscreen = document.createElement('canvas');
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;
      ctx.filter = cssFilter;
      ctx.drawImage(canvas, 0, 0);
      dataUrl = offscreen.toDataURL('image/png');
    } else {
      dataUrl = canvas.toDataURL('image/png');
    }

    const link = document.createElement('a');
    link.download = `simbot-photo-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, [photoFilter]);

  if (!photoMode) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col">
      {/* Cinematic letterbox bars */}
      <div className="pointer-events-none h-10 w-full bg-black/60" />

      {/* Top bar — exit button */}
      <div className="pointer-events-auto absolute right-4 top-3 z-50">
        <button
          type="button"
          onClick={() => setPhotoMode(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-white/20"
          title="Exit photo mode (Esc)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Photo mode label */}
      <div className="pointer-events-none absolute left-4 top-3">
        <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-xs font-medium tracking-wider text-white/80 backdrop-blur-md">
          PHOTO MODE
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom controls */}
      <div className="pointer-events-auto flex flex-col items-center gap-4 pb-2">
        {/* Filter pills */}
        <div className="flex gap-1.5 rounded-full border border-white/10 bg-black/50 p-1 backdrop-blur-md">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setPhotoFilter(f.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                photoFilter === f.id
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Shutter button */}
        <button
          type="button"
          onClick={takePhoto}
          className="group flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white/90 transition-all hover:scale-105 active:scale-95"
          title="Capture photo"
        >
          <div className="h-[52px] w-[52px] rounded-full bg-white transition-all group-hover:bg-white/90 group-active:bg-red-400" />
        </button>
      </div>

      {/* Bottom letterbox bar */}
      <div className="pointer-events-none h-10 w-full bg-black/60" />
    </div>
  );
}
