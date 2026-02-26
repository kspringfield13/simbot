import { useStore } from '../../stores/useStore';

export function ScreenshotModal() {
  const screenshotData = useStore((s) => s.screenshotData);
  const setScreenshotData = useStore((s) => s.setScreenshotData);

  if (!screenshotData) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `simbot-${Date.now()}.png`;
    link.href = screenshotData;
    link.click();
  };

  const handleShare = async () => {
    try {
      const res = await fetch(screenshotData);
      const blob = await res.blob();
      const file = new File([blob], 'simbot.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'SimBot Screenshot' });
        return;
      }
    } catch {
      // fall through to clipboard
    }

    // Fallback: copy image to clipboard
    try {
      const res = await fetch(screenshotData);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      alert('Image copied to clipboard!');
    } catch {
      alert('Unable to share or copy. Try downloading instead.');
    }
  };

  const handleClose = () => setScreenshotData(null);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative mx-4 flex max-h-[90vh] max-w-[90vw] flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-900/95 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <span className="text-sm font-medium text-white/70">Screenshot</span>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Image */}
        <div className="overflow-auto p-4">
          <img
            src={screenshotData}
            alt="SimBot screenshot"
            className="max-h-[65vh] w-full rounded-lg object-contain"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            Download
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
