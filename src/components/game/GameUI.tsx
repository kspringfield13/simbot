import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useStore } from '../../stores/useStore';
import { useTaskRunner } from '../../hooks/useTaskRunner';
import { useVoice } from '../../hooks/useVoice';
import { SpeedControls } from './SpeedControls';
// robot types imported via ROBOT_CONFIGS
import { RoomStatus } from './RoomStatus';
import { formatSimClock } from '../../systems/TimeSystem';

import { ROBOT_CONFIGS } from '../../config/robots';
import { ROBOT_IDS } from '../../types';
import type { WeatherType } from '../../types';

function RobotPicker() {
  const activeRobotId = useStore((s) => s.activeRobotId);
  const setActiveRobotId = useStore((s) => s.setActiveRobotId);
  const [open, setOpen] = useState(false);
  const config = ROBOT_CONFIGS[activeRobotId];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 backdrop-blur-md transition-all"
        title="Select robot"
      >
        <span className="h-3.5 w-3.5 rounded-full" style={{ background: config.color }} />
        <span className="text-[11px] text-white/70">{config.name}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-11 flex gap-1 rounded-full bg-black/70 p-1 backdrop-blur-xl border border-white/10">
          {ROBOT_IDS.map(id => {
            const c = ROBOT_CONFIGS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => { setActiveRobotId(id); setOpen(false); if (navigator.vibrate) navigator.vibrate(8); }}
                className={`h-7 w-7 rounded-full transition-all ${activeRobotId === id ? 'ring-2 ring-white/50 scale-110' : 'opacity-60 hover:opacity-100'}`}
                style={{ background: c.color }}
                title={c.name}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function SeasonToggle() {
  const seasonalDecorations = useStore((s) => s.seasonalDecorations);
  const setSeasonalDecorations = useStore((s) => s.setSeasonalDecorations);

  return (
    <button
      type="button"
      onClick={() => { setSeasonalDecorations(!seasonalDecorations); if (navigator.vibrate) navigator.vibrate(8); }}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 backdrop-blur-md transition-all ${
        seasonalDecorations ? 'text-white/60 hover:text-white/90' : 'text-white/30'
      }`}
      title={seasonalDecorations ? 'Disable seasonal decorations' : 'Enable seasonal decorations'}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    </button>
  );
}

const WEATHER_DISPLAY: Record<WeatherType, { icon: string; label: string }> = {
  sunny: { icon: '\u2600', label: 'Sunny' },
  rainy: { icon: '\uD83C\uDF27', label: 'Rainy' },
  snowy: { icon: '\u2744', label: 'Snowy' },
};

function WeatherIndicator() {
  const weather = useStore((s) => s.weather);
  const { icon, label } = WEATHER_DISPLAY[weather];

  return (
    <div
      className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 backdrop-blur-md"
      title={label}
    >
      <span className="text-sm leading-none">{icon}</span>
      <span className="text-[11px] text-white/50">{label}</span>
    </div>
  );
}

function MuteToggle() {
  const soundMuted = useStore((s) => s.soundMuted);
  const setSoundMuted = useStore((s) => s.setSoundMuted);

  return (
    <button
      type="button"
      onClick={() => { setSoundMuted(!soundMuted); if (navigator.vibrate) navigator.vibrate(8); }}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 backdrop-blur-md transition-all ${
        soundMuted ? 'text-white/30' : 'text-white/60 hover:text-white/90'
      }`}
      title={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        {soundMuted ? (
          <>
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </>
        ) : (
          <>
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M19.07 4.93a10 10 0 010 14.14" />
            <path d="M15.54 8.46a5 5 0 010 7.07" />
          </>
        )}
      </svg>
    </button>
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
  const robotState = useStore((s) => s.robots[s.activeRobotId].state);
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
      {/* Minimal top-left: time + weather + state */}
      <div className="pointer-events-none absolute left-4 top-0 z-20 pt-[max(8px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-white/50">{timeText}</span>
          <WeatherIndicator />
          <span className={`h-1.5 w-1.5 rounded-full ${
            robotState === 'idle' ? 'bg-white/25' : 'bg-emerald-400 animate-pulse'
          }`} />
        </div>
      </div>

      {/* Top-right: theme + mute + camera toggle + speed */}
      <div className="absolute right-3 top-0 z-20 flex items-center gap-2 pt-[max(8px,env(safe-area-inset-top))]">
        <RobotPicker />
        <SeasonToggle />
        <MuteToggle />
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
