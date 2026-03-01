import { useCallback, useState } from 'react';
import { useStore, BUILTIN_CAMERA_PRESETS } from '../../stores/useStore';

function SavePresetForm({ onSave }: { onSave: (name: string) => void }) {
  const [name, setName] = useState('');

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (trimmed) {
          onSave(trimmed);
          setName('');
        }
      }}
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Preset name..."
        maxLength={30}
        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-400/50"
      />
      <button
        type="submit"
        disabled={!name.trim()}
        className="rounded-lg border border-cyan-400/30 bg-cyan-500/20 px-3 py-2 text-sm text-cyan-300 transition-all hover:bg-cyan-500/30 disabled:opacity-30 disabled:hover:bg-cyan-500/20"
      >
        Save
      </button>
    </form>
  );
}

export function CameraPresetsPanel() {
  const show = useStore((s) => s.showCameraPresets);
  const setShow = useStore((s) => s.setShowCameraPresets);
  const customPresets = useStore((s) => s.cameraPresets);
  const saveCameraPreset = useStore((s) => s.saveCameraPreset);
  const deleteCameraPreset = useStore((s) => s.deleteCameraPreset);
  const loadCameraPreset = useStore((s) => s.loadCameraPreset);
  const activePresetId = useStore((s) => s.activeCameraPresetId);
  const autoTourActive = useStore((s) => s.autoTourActive);
  const setAutoTour = useStore((s) => s.setAutoTour);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShow(false)}
      />

      {/* Panel */}
      <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-gray-900/95 p-5 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Camera Presets</h2>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Auto-tour toggle */}
        <button
          type="button"
          onClick={() => setAutoTour(!autoTourActive)}
          className={`mb-4 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
            autoTourActive
              ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
              : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </span>
          <div className="flex-1">
            <div className="text-sm font-medium">Cinematic Auto-Tour</div>
            <div className="text-xs opacity-60">
              {autoTourActive ? 'Camera is touring automatically' : 'Smoothly cycle through all angles'}
            </div>
          </div>
          <div className={`h-5 w-9 rounded-full transition-colors ${autoTourActive ? 'bg-amber-400' : 'bg-gray-600'}`}>
            <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${autoTourActive ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>

        {/* Built-in presets */}
        <div className="mb-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Cinematic Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            {BUILTIN_CAMERA_PRESETS.map((preset) => {
              const isActive = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => loadCameraPreset(preset.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                    isActive
                      ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom presets */}
        <div className="mb-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Saved Presets {customPresets.length > 0 && <span className="text-gray-600">({customPresets.length})</span>}
          </h3>
          {customPresets.length === 0 ? (
            <p className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-3 text-center text-xs text-gray-500">
              No custom presets yet. Position the camera and save below.
            </p>
          ) : (
            <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
              {customPresets.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
                      isActive
                        ? 'border-cyan-400/50 bg-cyan-500/20'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => loadCameraPreset(preset.id)}
                      className={`flex-1 text-left text-sm ${isActive ? 'text-cyan-200' : 'text-gray-300 hover:text-white'}`}
                    >
                      {preset.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCameraPreset(preset.id)}
                      className="flex h-6 w-6 items-center justify-center rounded text-gray-500 transition-colors hover:bg-red-500/20 hover:text-red-400"
                      title="Delete preset"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Save current angle */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Save Current Angle</h3>
          <SavePresetInner onSave={saveCameraPreset} />
        </div>
      </div>
    </div>
  );
}

/** Inner component that accesses the R3F camera via a portal-safe method */
function SavePresetInner({ onSave }: { onSave: (name: string, position: [number, number, number], target: [number, number, number]) => void }) {
  const handleSave = useCallback((name: string) => {
    // Read camera state from the canvas element's Three.js instance
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    // Access the R3F store attached to the canvas
    const fiber = (canvas as any).__r3f;
    if (!fiber) return;

    const camera = fiber.store.getState().camera;
    const controls = fiber.store.getState().controls;

    const pos: [number, number, number] = [
      Math.round(camera.position.x * 100) / 100,
      Math.round(camera.position.y * 100) / 100,
      Math.round(camera.position.z * 100) / 100,
    ];

    const tgt: [number, number, number] = controls ? [
      Math.round(controls.target.x * 100) / 100,
      Math.round(controls.target.y * 100) / 100,
      Math.round(controls.target.z * 100) / 100,
    ] : [0, 0, 0];

    onSave(name, pos, tgt);
  }, [onSave]);

  return <SavePresetForm onSave={handleSave} />;
}
