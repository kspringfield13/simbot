import { useState, useEffect, useCallback } from 'react';

const TUTORIAL_KEY = 'simbot-tutorial-completed';

interface TutorialStep {
  title: string;
  description: string;
  icon: string;
}

const STEPS: TutorialStep[] = [
  {
    title: 'Camera Controls',
    description:
      'Click and drag to orbit around the house. Scroll to zoom in and out. Right-click and drag to pan the view.',
    icon: '🎥',
  },
  {
    title: 'Room Navigation',
    description:
      'Click on any room to snap the camera to it. Each room has its own cleanliness level that robots work to maintain.',
    icon: '🏠',
  },
  {
    title: 'Speed Controls',
    description:
      'Use the speed buttons (1x, 10x, 60x) in the top-right to fast-forward time and watch your robots work faster.',
    icon: '⏩',
  },
  {
    title: 'Robot Picker',
    description:
      'Switch between robots using the picker in the top-right. Each robot has a unique color and battery level. Follow any robot you like!',
    icon: '🤖',
  },
  {
    title: 'Chat System',
    description:
      'Tap the chat bubble in the bottom-right to talk to your robot. Ask what it\'s doing, check house cleanliness, or send it to a room.',
    icon: '💬',
  },
  {
    title: 'Daily Schedule',
    description:
      'Open the schedule panel (clock icon, top-right) to set up recurring tasks. Assign robots to clean specific rooms at set times.',
    icon: '📅',
  },
];

export function TutorialOverlay({ forceOpen, onClose }: { forceOpen?: boolean; onClose?: () => void }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setStep(0);
      setExiting(false);
      setVisible(true);
      return;
    }
    try {
      if (!localStorage.getItem(TUTORIAL_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, [forceOpen]);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
      try {
        localStorage.setItem(TUTORIAL_KEY, '1');
      } catch {
        // ignore
      }
      onClose?.();
    }, 250);
  }, [onClose]);

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, step]);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-250 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />

      {/* Card */}
      <div
        className={`relative z-10 mx-4 w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-gray-900/95 shadow-2xl backdrop-blur-xl transition-transform duration-250 ${
          exiting ? 'scale-95' : 'scale-100'
        }`}
      >
        {/* Progress bar */}
        <div className="flex gap-1 px-5 pt-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? 'bg-cyan-400' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-5 pb-2 pt-5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-2xl">
            {current.icon}
          </div>
          <h3 className="mb-1.5 text-base font-semibold text-white">{current.title}</h3>
          <p className="text-sm leading-relaxed text-white/60">{current.description}</p>
        </div>

        {/* Step counter */}
        <div className="px-5 pb-1">
          <span className="text-[11px] text-white/30">
            {step + 1} of {STEPS.length}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-5 pb-5 pt-3">
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={prev}
                className="h-9 rounded-full border border-white/10 bg-white/5 px-4 text-xs font-medium text-white/70 transition-colors hover:bg-white/10"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="h-9 rounded-full px-4 text-xs font-medium text-white/30 transition-colors hover:text-white/60"
            >
              Skip
            </button>
          </div>
          <button
            type="button"
            onClick={next}
            className="h-9 rounded-full bg-cyan-500 px-5 text-xs font-semibold text-black transition-colors hover:bg-cyan-400"
          >
            {isLast ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
