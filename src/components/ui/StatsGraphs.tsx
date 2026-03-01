import { useMemo } from 'react';
import { useStore } from '../../stores/useStore';
import { rooms } from '../../utils/homeLayout';

// Robot colors matching config/robots.ts
const ROBOT_COLORS: Record<string, string> = {
  sim: '#1a8cff',
  chef: '#f59e0b',
  sparkle: '#2dd4bf',
};

const ROBOT_LABELS: Record<string, string> = {
  sim: 'Sim',
  chef: 'Chef',
  sparkle: 'Sparkle',
};

// Distinct room colors for chart lines
const ROOM_COLORS: Record<string, string> = {
  'living-room': '#60a5fa',
  kitchen: '#fb923c',
  hallway: '#a78bfa',
  laundry: '#e879f9',
  bedroom: '#fbbf24',
  bathroom: '#34d399',
  yard: '#4ade80',
};

const AVG_COLOR = '#fff';

function formatTime(simMinutes: number): string {
  const h = Math.floor(simMinutes / 60) % 24;
  const m = Math.floor(simMinutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// ── SVG Line Chart ──────────────────────────────────────────────
interface Series {
  id: string;
  label: string;
  color: string;
  data: { x: number; y: number }[];
}

interface ChartProps {
  series: Series[];
  width: number;
  height: number;
  yLabel: string;
  yMax?: number;
  yMin?: number;
}

function LineChart({ series, width, height, yLabel, yMax: yMaxProp, yMin: yMinProp }: ChartProps) {
  const pad = { top: 8, right: 8, bottom: 28, left: 36 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    let xMin = Infinity, xMax = -Infinity;
    let yMinCalc = Infinity, yMaxCalc = -Infinity;
    for (const s of series) {
      for (const p of s.data) {
        if (p.x < xMin) xMin = p.x;
        if (p.x > xMax) xMax = p.x;
        if (p.y < yMinCalc) yMinCalc = p.y;
        if (p.y > yMaxCalc) yMaxCalc = p.y;
      }
    }
    if (!isFinite(xMin)) { xMin = 0; xMax = 1; }
    if (xMin === xMax) xMax = xMin + 1;
    const yMin = yMinProp ?? Math.max(0, Math.floor(yMinCalc / 10) * 10);
    const yMax = yMaxProp ?? Math.max(yMin + 10, Math.ceil(yMaxCalc / 10) * 10);
    return { xMin, xMax, yMin, yMax };
  }, [series, yMaxProp, yMinProp]);

  const sx = (x: number) => pad.left + ((x - xMin) / (xMax - xMin)) * w;
  const sy = (y: number) => pad.top + h - ((y - yMin) / (yMax - yMin)) * h;

  // Y-axis gridlines (4-5 lines)
  const yRange = yMax - yMin;
  const yStep = yRange <= 20 ? 5 : yRange <= 50 ? 10 : yRange <= 100 ? 20 : 25;
  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax; v += yStep) yTicks.push(v);

  // X-axis time labels (up to 5)
  const xTicks: number[] = [];
  const xStep = (xMax - xMin) / 4;
  if (xStep > 0) {
    for (let i = 0; i <= 4; i++) xTicks.push(xMin + xStep * i);
  } else {
    xTicks.push(xMin);
  }

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {/* Grid lines */}
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={pad.left} y1={sy(v)} x2={width - pad.right} y2={sy(v)}
            stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
          <text x={pad.left - 4} y={sy(v) + 3} textAnchor="end"
            fill="#666" fontSize={9} fontFamily="monospace">{v}</text>
        </g>
      ))}

      {/* X-axis labels */}
      {xTicks.map((v, i) => (
        <text key={i} x={sx(v)} y={height - 4} textAnchor="middle"
          fill="#666" fontSize={9} fontFamily="monospace">{formatTime(v)}</text>
      ))}

      {/* Y-axis label */}
      <text x={4} y={pad.top + h / 2} textAnchor="middle" fill="#555" fontSize={8}
        transform={`rotate(-90, 4, ${pad.top + h / 2})`}>{yLabel}</text>

      {/* Data lines */}
      {series.map((s) => {
        if (s.data.length < 2) return null;
        const d = s.data.map((p, i) =>
          `${i === 0 ? 'M' : 'L'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`
        ).join(' ');
        return (
          <path key={s.id} d={d} fill="none" stroke={s.color}
            strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
            opacity={0.85} />
        );
      })}

      {/* Latest value dots */}
      {series.map((s) => {
        if (s.data.length === 0) return null;
        const last = s.data[s.data.length - 1];
        return (
          <circle key={s.id + '-dot'} cx={sx(last.x)} cy={sy(last.y)}
            r={2.5} fill={s.color} />
        );
      })}
    </svg>
  );
}

// ── Legend ───────────────────────────────────────────────────────
function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: 6 }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 8, height: 8, borderRadius: 2,
            background: item.color, flexShrink: 0,
          }} />
          <span style={{ fontSize: 9, color: '#999' }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────
export function StatsGraphs() {
  const cleanlinessHistory = useStore((s) => s.cleanlinessHistory);
  const efficiencyHistory = useStore((s) => s.efficiencyHistory);

  const chartWidth = 224;
  const chartHeight = 130;

  // Build cleanliness series
  const activeRoomIds = useMemo(() => {
    const ids = new Set<string>();
    for (const point of cleanlinessHistory) {
      for (const id of Object.keys(point.rooms)) ids.add(id);
    }
    return Array.from(ids);
  }, [cleanlinessHistory]);

  const cleanlinessSeries: Series[] = useMemo(() => {
    const roomSeries: Series[] = activeRoomIds.map((id) => ({
      id,
      label: rooms.find((r) => r.id === id)?.name ?? id,
      color: ROOM_COLORS[id] ?? '#888',
      data: cleanlinessHistory.map((p) => ({ x: p.simMinutes, y: p.rooms[id] ?? 0 })),
    }));
    const avgSeries: Series = {
      id: 'average',
      label: 'Average',
      color: AVG_COLOR,
      data: cleanlinessHistory.map((p) => ({ x: p.simMinutes, y: p.average })),
    };
    return [...roomSeries, avgSeries];
  }, [cleanlinessHistory, activeRoomIds]);

  // Build efficiency series
  const efficiencySeries: Series[] = useMemo(() => {
    return Object.entries(ROBOT_COLORS).map(([id, color]) => ({
      id,
      label: ROBOT_LABELS[id] ?? id,
      color,
      data: efficiencyHistory.map((p) => ({ x: p.simMinutes, y: p.robots[id] ?? 0 })),
    }));
  }, [efficiencyHistory]);

  const hasData = cleanlinessHistory.length >= 2;

  return (
    <div>
      {/* Cleanliness Chart */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          color: '#999', fontSize: 11, textTransform: 'uppercase',
          letterSpacing: 1, marginBottom: 8,
        }}>
          Cleanliness Over Time
        </div>
        {hasData ? (
          <>
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 8,
              padding: '6px 0 0 0', overflow: 'hidden',
            }}>
              <LineChart
                series={cleanlinessSeries}
                width={chartWidth}
                height={chartHeight}
                yLabel="%"
                yMin={0}
                yMax={100}
              />
            </div>
            <Legend items={[
              ...activeRoomIds.map((id) => ({
                label: rooms.find((r) => r.id === id)?.name ?? id,
                color: ROOM_COLORS[id] ?? '#888',
              })),
              { label: 'Average', color: AVG_COLOR },
            ]} />
          </>
        ) : (
          <div style={{ color: '#555', fontSize: 11, textAlign: 'center', padding: '16px 0' }}>
            Collecting data... charts appear after a few sim-minutes.
          </div>
        )}
      </div>

      {/* Efficiency Chart */}
      <div>
        <div style={{
          color: '#999', fontSize: 11, textTransform: 'uppercase',
          letterSpacing: 1, marginBottom: 8,
        }}>
          Robot Efficiency (tasks/hr)
        </div>
        {hasData ? (
          <>
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 8,
              padding: '6px 0 0 0', overflow: 'hidden',
            }}>
              <LineChart
                series={efficiencySeries}
                width={chartWidth}
                height={chartHeight}
                yLabel="t/hr"
              />
            </div>
            <Legend items={Object.entries(ROBOT_COLORS).map(([id, color]) => ({
              label: ROBOT_LABELS[id] ?? id, color,
            }))} />
          </>
        ) : (
          <div style={{ color: '#555', fontSize: 11, textAlign: 'center', padding: '16px 0' }}>
            Collecting data... charts appear after a few sim-minutes.
          </div>
        )}
      </div>
    </div>
  );
}
