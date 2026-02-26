import { useEffect, useState } from 'react';
import { useStore } from '../../stores/useStore';

export function VisitorToast() {
  const visitorToast = useStore((s) => s.visitorToast);
  const [visible, setVisible] = useState(false);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (visitorToast) {
      setDisplayText(visitorToast);
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [visitorToast]);

  if (!visible && !displayText) return null;

  return (
    <div
      className={`pointer-events-none fixed left-1/2 top-6 z-50 -translate-x-1/2 transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
      onTransitionEnd={() => {
        if (!visible) setDisplayText('');
      }}
    >
      <div className="rounded-xl border border-white/10 bg-black/70 px-5 py-3 text-sm text-white shadow-lg backdrop-blur-md">
        {displayText}
      </div>
    </div>
  );
}
