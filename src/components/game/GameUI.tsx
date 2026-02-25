import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useStore } from '../../stores/useStore';
import { useTaskRunner } from '../../hooks/useTaskRunner';
import { useVoice } from '../../hooks/useVoice';
import { SpeedControls } from './SpeedControls';
import { RoomStatus } from './RoomStatus';
import { formatSimClock } from '../../systems/TimeSystem';

export function GameUI() {
  const [cmd, setCmd] = useState('');
  const [showChat, setShowChat] = useState(false);

  const cameraMode = useStore((s) => s.cameraMode);
  const setCameraMode = useStore((s) => s.setCameraMode);
  const isListening = useStore((s) => s.isListening);
  const transcript = useStore((s) => s.transcript);
  const demoMode = useStore((s) => s.demoMode);
  const setDemoMode = useStore((s) => s.setDemoMode);
  const robotState = useStore((s) => s.robotState);
  const simMinutes = useStore((s) => s.simMinutes);

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

  const { timeText } = formatSimClock(simMinutes);
  const isFreeCam = cameraMode === 'overview';

  return (
    <>
      {/* Minimal top-left: time + state */}
      <div className="pointer-events-none absolute left-4 top-0 z-20 pt-[max(8px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white/50">{timeText}</span>
          <span className={`h-1.5 w-1.5 rounded-full ${
            robotState === 'idle' ? 'bg-white/25' : 'bg-emerald-400 animate-pulse'
          }`} />
        </div>
      </div>

      {/* Top-right: camera toggle + speed */}
      <div className="absolute right-3 top-0 z-20 flex items-center gap-2 pt-[max(8px,env(safe-area-inset-top))]">
        <SpeedControls />
        <button
          type="button"
          onClick={() => setCameraMode(isFreeCam ? 'follow' : 'overview')}
          className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
            isFreeCam
              ? 'border-white/20 bg-white/15 text-white'
              : 'border-white/8 bg-black/50 text-white/40 hover:text-white/70'
          } backdrop-blur-md`}
          title={isFreeCam ? 'Follow robot' : 'Free camera'}
        >
          {isFreeCam ? '👁' : '🎯'}
        </button>
      </div>

      <RoomStatus />

      {/* Bottom controls — minimal */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto mx-auto w-full max-w-md space-y-2">

          {/* Command input */}
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
                placeholder="Command..."
                autoFocus
                className="h-10 flex-1 rounded-full border border-white/8 bg-black/70 px-4 text-xs text-white outline-none placeholder:text-white/25 backdrop-blur-xl"
              />
              <button
                type="submit"
                className="h-10 rounded-full bg-white px-4 text-xs font-medium text-black"
              >
                Go
              </button>
            </form>
          )}

          {/* Bottom bar */}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setShowChat(!showChat)}
              className={`h-10 w-10 rounded-full border text-sm transition-all backdrop-blur-md ${
                showChat
                  ? 'border-white/20 bg-white/15 text-white'
                  : 'border-white/8 bg-black/50 text-white/30 hover:text-white/60'
              }`}
            >
              💬
            </button>
            <button
              type="button"
              onClick={() => setDemoMode(!demoMode)}
              className={`h-10 rounded-full border px-4 text-[11px] font-medium transition-all backdrop-blur-md ${
                demoMode
                  ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                  : 'border-white/8 bg-black/50 text-white/30 hover:text-white/60'
              }`}
            >
              {demoMode ? '● Auto' : 'Auto'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
