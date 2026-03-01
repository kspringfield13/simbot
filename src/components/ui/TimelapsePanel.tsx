import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore } from '../../stores/useStore';
import { ROBOT_CONFIGS } from '../../config/robots';
import type { RobotId, TimelapseEvent } from '../../types';
import { ROBOT_IDS } from '../../types';
import { getRobotDisplayName } from '../../stores/useRobotNames';

function formatSimTime(simMinutes: number): string {
  const dayMin = ((simMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(dayMin / 60);
  const m = Math.floor(dayMin % 60);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function formatDuration(simMinutes: number): string {
  const h = Math.floor(simMinutes / 60);
  const m = Math.round(simMinutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/** Extract per-robot trails up to a given sim time */
function getTrails(
  events: TimelapseEvent[],
  upToSimMinutes: number,
): Record<RobotId, [number, number, number][]> {
  const trails: Record<string, [number, number, number][]> = {};
  for (const rid of ROBOT_IDS) trails[rid] = [];

  for (const ev of events) {
    if (ev.type !== 'position' || !ev.robotId || !ev.position) continue;
    if (ev.simMinutes > upToSimMinutes) break;
    trails[ev.robotId].push(ev.position);
  }

  return trails as Record<RobotId, [number, number, number][]>;
}

/** Get task events visible at current playback time */
function getVisibleTaskEvents(
  events: TimelapseEvent[],
  currentSim: number,
  windowMinutes: number,
): TimelapseEvent[] {
  return events.filter(
    (ev) =>
      (ev.type === 'task-start' || ev.type === 'task-complete') &&
      ev.simMinutes <= currentSim &&
      ev.simMinutes >= currentSim - windowMinutes,
  );
}

function TrailCanvas({
  events,
  currentSimMinutes,
}: {
  events: TimelapseEvent[];
  currentSimMinutes: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const trails = getTrails(events, currentSimMinutes);

    // Map 3D coords to 2D canvas — x maps to canvas x, z maps to canvas y
    // Determine bounds from all position events
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const evts of Object.values(trails)) {
      for (const p of evts) {
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[2] < minZ) minZ = p[2];
        if (p[2] > maxZ) maxZ = p[2];
      }
    }

    if (!isFinite(minX)) return; // No trail data

    const padX = (maxX - minX) * 0.1 || 5;
    const padZ = (maxZ - minZ) * 0.1 || 5;
    minX -= padX; maxX += padX;
    minZ -= padZ; maxZ += padZ;

    const toCanvasX = (x: number) => ((x - minX) / (maxX - minX)) * W;
    const toCanvasY = (z: number) => ((z - minZ) / (maxZ - minZ)) * H;

    for (const rid of ROBOT_IDS) {
      const points = trails[rid];
      if (points.length < 2) continue;

      const color = ROBOT_CONFIGS[rid].color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.7;

      ctx.beginPath();
      ctx.moveTo(toCanvasX(points[0][0]), toCanvasY(points[0][2]));
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(toCanvasX(points[i][0]), toCanvasY(points[i][2]));
      }
      ctx.stroke();

      // Draw current position dot
      const last = points[points.length - 1];
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(toCanvasX(last[0]), toCanvasY(last[2]), 5, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText(getRobotDisplayName(rid), toCanvasX(last[0]) + 7, toCanvasY(last[2]) + 3);
    }
    ctx.globalAlpha = 1;
  }, [events, currentSimMinutes]);

  return (
    <canvas
      ref={canvasRef}
      width={260}
      height={180}
      style={{
        width: '100%',
        height: 180,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    />
  );
}

export function TimelapsePanel() {
  const showTimelapse = useStore((s) => s.showTimelapse);
  const setShowTimelapse = useStore((s) => s.setShowTimelapse);
  const playback = useStore((s) => s.timelapsePlayback);
  const events = useStore((s) => s.timelapseEvents);
  const startPlayback = useStore((s) => s.startTimelapsePlayback);
  const stopPlayback = useStore((s) => s.stopTimelapsePlayback);
  const setPlaying = useStore((s) => s.setTimelapsePlaybackPlaying);
  const setSpeed = useStore((s) => s.setTimelapsePlaybackSpeed);
  const setPlaybackTime = useStore((s) => s.setTimelapsePlaybackTime);

  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);

  // Playback loop using requestAnimationFrame
  useEffect(() => {
    if (!playback || !playback.playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = (timestamp: number) => {
      const dt = lastFrameRef.current ? (timestamp - lastFrameRef.current) / 1000 : 0;
      lastFrameRef.current = timestamp;

      const pb = useStore.getState().timelapsePlayback;
      if (!pb || !pb.playing) return;

      const nextSim = pb.currentSimMinutes + dt * pb.speed;
      if (nextSim >= pb.endSimMinutes) {
        // Reached end
        setPlaybackTime(pb.endSimMinutes);
        setPlaying(false);
        return;
      }
      setPlaybackTime(nextSim);
      rafRef.current = requestAnimationFrame(tick);
    };

    lastFrameRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playback?.playing, playback?.speed, setPlaybackTime, setPlaying]);

  const handleClose = useCallback(() => {
    stopPlayback();
    setShowTimelapse(false);
  }, [stopPlayback, setShowTimelapse]);

  const handleScrub = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPlaybackTime(parseFloat(e.target.value));
    },
    [setPlaybackTime],
  );

  const visibleTaskEvents = useMemo(() => {
    if (!playback) return [];
    return getVisibleTaskEvents(events, playback.currentSimMinutes, 15);
  }, [events, playback?.currentSimMinutes]);

  if (!showTimelapse) return null;

  const hasEvents = events.length > 0;
  const duration = hasEvents
    ? events[events.length - 1].simMinutes - events[0].simMinutes
    : 0;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        background: 'rgba(0,0,0,0.92)',
        color: '#e0e0e0',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 18,
        fontSize: 13,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        width: 300,
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
          Timelapse
        </span>
        <button
          onClick={handleClose}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16 }}
        >
          ✕
        </button>
      </div>

      {!hasEvents ? (
        <div style={{ color: '#888', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
          No events recorded yet. Let the simulation run for a while to build up timelapse data.
        </div>
      ) : !playback ? (
        <>
          <div style={{ color: '#aaa', fontSize: 12, marginBottom: 12 }}>
            {events.length} events recorded over {formatDuration(duration)}.
          </div>
          <button
            onClick={startPlayback}
            style={{
              width: '100%',
              padding: '10px 0',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Replay Timelapse
          </button>
        </>
      ) : (
        <>
          {/* Trail visualization */}
          <TrailCanvas events={events} currentSimMinutes={playback.currentSimMinutes} />

          {/* Current time */}
          <div style={{ textAlign: 'center', margin: '10px 0 6px', fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {formatSimTime(playback.currentSimMinutes)}
          </div>

          {/* Scrubber */}
          <input
            type="range"
            min={playback.startSimMinutes}
            max={playback.endSimMinutes}
            step={0.5}
            value={playback.currentSimMinutes}
            onChange={handleScrub}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#8b5cf6' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#777', marginBottom: 10 }}>
            <span>{formatSimTime(playback.startSimMinutes)}</span>
            <span>{formatSimTime(playback.endSimMinutes)}</span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {/* Play/Pause */}
            <button
              onClick={() => {
                if (!playback.playing && playback.currentSimMinutes >= playback.endSimMinutes) {
                  setPlaybackTime(playback.startSimMinutes);
                }
                setPlaying(!playback.playing);
              }}
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(139,92,246,0.3)',
                border: '1px solid rgba(139,92,246,0.4)',
                borderRadius: '50%',
                color: '#c4b5fd',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              {playback.playing ? '⏸' : '▶'}
            </button>

            {/* Stop */}
            <button
              onClick={stopPlayback}
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%',
                color: '#999',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              ⏹
            </button>

            {/* Speed buttons */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {([30, 60, 120] as const).map((sp) => (
                <button
                  key={sp}
                  onClick={() => setSpeed(sp)}
                  style={{
                    padding: '4px 8px',
                    background: playback.speed === sp ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${playback.speed === sp ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 6,
                    color: playback.speed === sp ? '#c4b5fd' : '#888',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>

          {/* Event feed */}
          {visibleTaskEvents.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
              <div style={{ color: '#999', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Recent Activity
              </div>
              {visibleTaskEvents.slice(-4).map((ev, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 0',
                    fontSize: 11,
                    color: '#bbb',
                  }}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: ev.robotId ? ROBOT_CONFIGS[ev.robotId].color : '#888', flexShrink: 0 }}
                  />
                  <span style={{ color: ev.type === 'task-complete' ? '#4ade80' : '#facc15' }}>
                    {ev.type === 'task-complete' ? '✓' : '→'}
                  </span>
                  <span>
                    {ev.robotId ? getRobotDisplayName(ev.robotId) : '?'}{' '}
                    {ev.type === 'task-start' ? 'started' : 'finished'}{' '}
                    {ev.taskType ?? 'task'}
                    {ev.roomId ? ` in ${ev.roomId}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 10, fontSize: 10, color: '#555', lineHeight: 1.4 }}>
        Records robot positions, task events, and room changes. Up to 24 sim-hours stored.
      </div>
    </div>
  );
}

export function TimelapseButton() {
  const showTimelapse = useStore((s) => s.showTimelapse);
  const setShowTimelapse = useStore((s) => s.setShowTimelapse);
  const eventCount = useStore((s) => s.timelapseEvents.length);
  const isPlaying = useStore((s) => s.timelapsePlayback?.playing ?? false);

  return (
    <button
      type="button"
      onClick={() => setShowTimelapse(!showTimelapse)}
      className={`pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-full border text-lg backdrop-blur-md transition-all ${
        showTimelapse || isPlaying
          ? 'border-violet-400/50 bg-violet-500/30 hover:bg-violet-500/50'
          : 'border-white/10 bg-black/50 hover:bg-black/70'
      }`}
      title="Timelapse Replay"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
      {eventCount > 0 && !showTimelapse && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-violet-400 px-1 text-[9px] font-bold text-black">
          {eventCount > 999 ? '999+' : eventCount}
        </span>
      )}
      {isPlaying && (
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-violet-500">
          <span className="animate-ping absolute h-full w-full rounded-full bg-violet-400 opacity-50" />
        </span>
      )}
    </button>
  );
}
