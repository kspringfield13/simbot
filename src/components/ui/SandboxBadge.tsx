import { useSandbox } from '../../stores/useSandbox';

export function SandboxBadge() {
  const sandboxMode = useSandbox((s) => s.sandboxMode);

  if (!sandboxMode) return null;

  return (
    <div className="pointer-events-none fixed left-4 bottom-4 z-50 flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-black/70 px-4 py-2 backdrop-blur-md">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
        </span>
        <span className="text-sm font-medium text-amber-200">
          Sandbox
        </span>
        <span className="text-xs text-amber-400/60">
          CREATIVE
        </span>
      </div>
    </div>
  );
}
