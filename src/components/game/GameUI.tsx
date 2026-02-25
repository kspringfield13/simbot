import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useStore } from '../../stores/useStore';
import { useTaskRunner } from '../../hooks/useTaskRunner';
import { useVoice } from '../../hooks/useVoice';
import { SpeedControls } from './SpeedControls';
import { TimeBar } from './TimeBar';
import { RoomStatus } from './RoomStatus';
import type { CameraMode } from '../../types';

const cams: { mode: CameraMode; label: string }[] = [
  { mode: 'overview', label: 'Top' },
  { mode: 'follow', label: 'Follow' },
  { mode: 'pov', label: 'POV' },
];

export function GameUI() {
  const [cmd, setCmd] = useState('');
  const [showChat, setShowChat] = useState(false);

  const cameraMode = useStore((s) => s.cameraMode);
  const setCameraMode = useStore((s) => s.setCameraMode);
  const isListening = useStore((s) => s.isListening);
  const transcript = useStore((s) => s.transcript);
  const demoMode = useStore((s) => s.demoMode);
  const setDemoMode = useStore((s) => s.setDemoMode);
  const robotThought = useStore((s) => s.robotThought);

  const { submitCommand } = useTaskRunner();
  const { isSupported, startListening, stopListening } = useVoice();

  const prevListening = useRef(isListening);
  useEffect(() => {
    if (prevListening.current && !isListening && transcript.trim()) {
      submitCommand(transcript.trim(), 'user');
    }
    prevListening.current = isListening;
  }, [isListening, transcript, submitCommand]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const t = cmd.trim();
    if (!t) return;
    submitCommand(t, demoMode ? 'demo' : 'user');
    setCmd('');
  };

  return (
    <>
      {/* Top bar */}
      <TimeBar />
      <RoomStatus />

      {/* Bottom controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto mx-auto w-full max-w-lg space-y-2">

          {/* Thought preview */}
          {robotThought && !showChat && (
            <div className="truncate rounded-full border border-white/5 bg-black/60 px-4 py-1.5 text-center text-[10px] text-white/35 backdrop-blur-xl">
              "{robotThought}"
            </div>
          )}

          {/* Command input — toggled */}
          {showChat && (
            <form onSubmit={handleSubmit} className="flex gap-1.5">
              <button
                type="button"
                disabled={!isSupported}
                onClick={isListening ? stopListening : startListening}
                className={`h-10 w-10 shrink-0 rounded-full text-xs transition-colors ${
                  isListening
                    ? 'bg-white text-black'
                    : 'bg-white/8 text-white/50 hover:text-white/80'
                }`}
              >
                {isListening ? '■' : '🎤'}
              </button>

              <input
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                placeholder="Tell SimBot what to do..."
                autoFocus
                className="h-10 flex-1 rounded-full border border-white/8 bg-black/70 px-4 text-xs text-white outline-none placeholder:text-white/25 backdrop-blur-xl"
              />

              <button
                type="submit"
                className="h-10 rounded-full bg-white px-4 text-xs font-medium text-black hover:bg-white/90"
              >
                Go
              </button>
            </form>
          )}

          {/* Main control row */}
          <div className="flex items-center gap-2 rounded-2xl border border-white/6 bg-black/70 p-1.5 backdrop-blur-xl">
            {/* Camera modes */}
            <div className="flex gap-0.5 rounded-full bg-white/5 p-0.5">
              {cams.map((c) => (
                <button
                  key={c.mode}
                  type="button"
                  onClick={() => setCameraMode(c.mode)}
                  className={`h-9 rounded-full px-3 text-[11px] font-medium transition-colors ${
                    cameraMode === c.mode
                      ? 'bg-white text-black'
                      : 'text-white/35 hover:text-white/60'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Speed */}
            <SpeedControls />

            {/* Spacer */}
            <div className="flex-1" />

            {/* Command toggle */}
            <button
              type="button"
              onClick={() => setShowChat(!showChat)}
              className={`h-9 w-9 rounded-full text-xs transition-colors ${
                showChat ? 'bg-white text-black' : 'bg-white/8 text-white/40 hover:text-white/70'
              }`}
            >
              💬
            </button>

            {/* Demo */}
            <button
              type="button"
              onClick={() => setDemoMode(!demoMode)}
              className={`h-9 rounded-full px-3 text-[11px] font-medium transition-colors ${
                demoMode
                  ? 'bg-white text-black'
                  : 'bg-white/8 text-white/35 hover:text-white/60'
              }`}
            >
              {demoMode ? 'Stop' : 'Demo'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
