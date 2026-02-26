import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useStore } from '../../stores/useStore';
import { useTaskRunner } from '../../hooks/useTaskRunner';
import { useVoice } from '../../hooks/useVoice';
import { SpeedControls } from './SpeedControls';
import type { RobotTheme } from '../../types';
import { RoomStatus } from './RoomStatus';
import { formatSimClock } from '../../systems/TimeSystem';

const themes: { id: RobotTheme; color: string }[] = [
  { id: 'blue', color: '#1a8cff' },
  { id: 'red', color: '#e63946' },
  { id: 'green', color: '#2dd4bf' },
  { id: 'gold', color: '#f59e0b' },
];

function ThemePicker() {
  const robotTheme = useStore((s) => s.robotTheme);
  const setRobotTheme = useStore((s) => s.setRobotTheme);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 backdrop-blur-md transition-all"
        title="Robot theme"
      >
        <span className="h-3.5 w-3.5 rounded-full" style={{ background: themes.find(t => t.id === robotTheme)?.color }} />
      </button>
      {open && (
        <div className="absolute right-0 top-11 flex gap-1 rounded-full bg-black/70 p-1 backdrop-blur-xl border border-white/10">
          {themes.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setRobotTheme(t.id); setOpen(false); if (navigator.vibrate) navigator.vibrate(8); }}
              className={`h-7 w-7 rounded-full transition-all ${robotTheme === t.id ? 'ring-2 ring-white/50 scale-110' : 'opacity-60 hover:opacity-100'}`}
              style={{ background: t.color }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
  const modeIcon = cameraMode === 'follow' ? '🎯' : cameraMode === 'pov' ? '👤' : '👁';
  const nextMode = cameraMode === 'follow' ? 'pov' : cameraMode === 'pov' ? 'overview' : 'follow';
  const modeLabel = cameraMode === 'follow' ? 'First person' : cameraMode === 'pov' ? 'Free roam' : 'Follow robot';

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

      {/* Top-right: theme + camera toggle + speed */}
      <div className="absolute right-3 top-0 z-20 flex items-center gap-2 pt-[max(8px,env(safe-area-inset-top))]">
        <ThemePicker />
        <SpeedControls />
        <button
          type="button"
          onClick={() => setCameraMode(nextMode)}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/60 hover:text-white/90 backdrop-blur-md transition-all"
          title={modeLabel}
        >
          {modeIcon}
        </button>
      </div>

      <RoomStatus />

      {/* Bottom controls — minimal */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 pb-[max(24px,env(safe-area-inset-bottom))]">
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
