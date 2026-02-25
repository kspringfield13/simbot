import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useStore } from '../../stores/useStore';
import { useTaskRunner } from '../../hooks/useTaskRunner';
import { useVoice } from '../../hooks/useVoice';
import { SpeedControls } from './SpeedControls';
import { TimeBar } from './TimeBar';
import { RoomStatus } from './RoomStatus';
import type { CameraMode } from '../../types';

const cameraModes: { mode: CameraMode; label: string }[] = [
  { mode: 'overview', label: 'Overview' },
  { mode: 'follow', label: 'Follow' },
  { mode: 'pov', label: 'POV' },
];

export function GameUI() {
  const [command, setCommand] = useState('');

  const cameraMode = useStore((state) => state.cameraMode);
  const setCameraMode = useStore((state) => state.setCameraMode);
  const isListening = useStore((state) => state.isListening);
  const transcript = useStore((state) => state.transcript);
  const demoMode = useStore((state) => state.demoMode);
  const setDemoMode = useStore((state) => state.setDemoMode);
  const messages = useStore((state) => state.messages);

  const { submitCommand } = useTaskRunner();
  const { isSupported, startListening, stopListening } = useVoice();

  const previousListening = useRef(isListening);

  useEffect(() => {
    if (previousListening.current && !isListening && transcript.trim()) {
      submitCommand(transcript.trim(), 'user');
    }

    previousListening.current = isListening;
  }, [isListening, transcript, submitCommand]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = command.trim();
    if (!trimmed) return;

    submitCommand(trimmed, demoMode ? 'demo' : 'user');
    setCommand('');
  };

  const latestMessage = messages[messages.length - 1];

  return (
    <>
      <TimeBar />
      <RoomStatus />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-black/58 p-3 backdrop-blur-2xl">
          <div className="mb-2 grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/45 p-1 backdrop-blur-md">
              {cameraModes.map((entry) => (
                <button
                  key={entry.mode}
                  type="button"
                  onClick={() => setCameraMode(entry.mode)}
                  className={`h-11 min-w-11 rounded-lg px-3 text-xs font-semibold transition ${
                    cameraMode === entry.mode
                      ? 'bg-cyan-500/30 text-cyan-100'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            <SpeedControls />
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-[auto_1fr_auto] gap-1.5">
            <button
              type="button"
              disabled={!isSupported}
              onClick={isListening ? stopListening : startListening}
              className={`h-11 min-w-11 rounded-xl px-3 text-xs font-semibold transition ${
                !isSupported
                  ? 'bg-white/10 text-white/35'
                  : isListening
                    ? 'bg-rose-500/70 text-white'
                    : 'bg-white/15 text-white/90 hover:bg-white/20'
              }`}
            >
              {isListening ? 'Stop' : 'Mic'}
            </button>

            <input
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder="Tell SimBot what to do..."
              className="h-11 w-full rounded-xl border border-white/10 bg-black/45 px-3 text-sm text-white outline-none placeholder:text-white/45"
            />

            <button
              type="submit"
              className="h-11 min-w-11 rounded-xl bg-cyan-500/70 px-4 text-xs font-semibold text-white hover:bg-cyan-500/85"
            >
              Send
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setDemoMode(!demoMode)}
              className={`h-11 min-w-11 rounded-xl px-3 text-xs font-semibold transition ${
                demoMode
                  ? 'bg-violet-500/65 text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              {demoMode ? 'Stop Demo' : 'Demo'}
            </button>

            <p className="truncate text-xs text-white/70">
              {latestMessage ? latestMessage.text : 'Tap a room for status. Double-tap to snap camera.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
