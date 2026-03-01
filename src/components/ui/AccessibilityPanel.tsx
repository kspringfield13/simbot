import { useAccessibility, type ColorblindMode } from '../../stores/useAccessibility';
import { useSandbox } from '../../stores/useSandbox';
import { useStore } from '../../stores/useStore';

const colorblindOptions: { value: ColorblindMode; label: string; description: string }[] = [
  { value: 'none', label: 'None', description: 'Default colors' },
  { value: 'protanopia', label: 'Protanopia', description: 'Red-blind' },
  { value: 'deuteranopia', label: 'Deuteranopia', description: 'Green-blind' },
  { value: 'tritanopia', label: 'Tritanopia', description: 'Blue-blind' },
];

function Toggle({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10">
      <div className="min-w-0">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-white/50">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
          checked ? 'bg-cyan-500' : 'bg-white/20'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}

export function AccessibilityPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const colorblindMode = useAccessibility((s) => s.colorblindMode);
  const reducedMotion = useAccessibility((s) => s.reducedMotion);
  const highContrast = useAccessibility((s) => s.highContrast);
  const screenReaderEnabled = useAccessibility((s) => s.screenReaderEnabled);
  const setColorblindMode = useAccessibility((s) => s.setColorblindMode);
  const setReducedMotion = useAccessibility((s) => s.setReducedMotion);
  const setHighContrast = useAccessibility((s) => s.setHighContrast);
  const setScreenReaderEnabled = useAccessibility((s) => s.setScreenReaderEnabled);

  const sandboxMode = useSandbox((s) => s.sandboxMode);
  const setSandboxMode = useSandbox((s) => s.setSandboxMode);
  const activateSandbox = useStore((s) => s.activateSandbox);

  const handleSandboxToggle = (enabled: boolean) => {
    setSandboxMode(enabled);
    if (enabled) activateSandbox();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="Accessibility Settings"
        aria-modal="true"
        className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Accessibility</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close accessibility settings"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {/* Colorblind mode */}
          <div className="rounded-lg border border-white/5 bg-white/5 px-4 py-3">
            <div className="mb-2 text-sm font-medium text-white">Colorblind Mode</div>
            <div className="text-xs text-white/50 mb-2">Applies a color correction filter to the canvas</div>
            <div className="grid grid-cols-2 gap-2">
              {colorblindOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setColorblindMode(opt.value)}
                  aria-pressed={colorblindMode === opt.value}
                  className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    colorblindMode === opt.value
                      ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-[10px] opacity-60">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          <Toggle
            checked={reducedMotion}
            onChange={setReducedMotion}
            label="Reduced Motion"
            description="Disables particles, slows animations, removes camera effects"
          />

          <Toggle
            checked={highContrast}
            onChange={setHighContrast}
            label="High Contrast"
            description="Stronger outlines and bolder text for better visibility"
          />

          <Toggle
            checked={screenReaderEnabled}
            onChange={setScreenReaderEnabled}
            label="Screen Reader Announcements"
            description="Announces robot actions and room status changes"
          />
        </div>

        {/* Sandbox Mode */}
        <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-500/5 px-4 py-3">
          <div className="mb-2 text-sm font-medium text-amber-200">Sandbox Mode</div>
          <div className="text-xs text-amber-200/50 mb-3">Unlimited coins, all items unlocked, no battery drain. A creative playground!</div>
          <Toggle
            checked={sandboxMode}
            onChange={handleSandboxToggle}
            label="Enable Sandbox"
            description="Unlock everything and remove resource limits"
          />
        </div>

        <div className="mt-4 rounded-lg border border-white/5 bg-white/5 px-4 py-3">
          <div className="text-xs text-white/40">
            <strong className="text-white/60">Keyboard:</strong> Tab to navigate, Enter/Space to activate, Escape to close panels.
          </div>
        </div>
      </div>
    </div>
  );
}
