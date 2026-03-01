import { useStore } from '../../stores/useStore';
import {
  getConfidenceLevel,
  getConfidencePercent,
  getRoomPriority,
  getAutoScheduleEntries,
  formatTimeOfDay,
  getPeriodLabel,
  type AIInsight,
  type RobotEfficiency,
} from '../../systems/SmartSchedule';

const ROOM_LABELS: Record<string, string> = {
  'living-room': 'Living Room',
  kitchen: 'Kitchen',
  hallway: 'Hallway',
  laundry: 'Laundry',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  yard: 'Yard',
  'f2-bedroom': 'Upstairs Bedroom',
  'f2-office': 'Office',
  'f2-balcony': 'Balcony',
};

const ROBOT_LABELS: Record<string, string> = {
  sim: 'Sim',
  chef: 'Chef',
  sparkle: 'Sparkle',
};

const ROBOT_COLORS: Record<string, string> = {
  sim: '#3b82f6',
  chef: '#ef4444',
  sparkle: '#a855f7',
};

const CATEGORY_ICONS: Record<string, string> = {
  room: '🏠',
  timing: '⏰',
  robot: '🤖',
  efficiency: '⚡',
  trend: '📈',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  low: '#ef4444',
  medium: '#f59e0b',
  high: '#22c55e',
};

export function LearnedPatternsPanel() {
  const data = useStore((s) => s.smartScheduleData);
  const enabled = useStore((s) => s.smartScheduleEnabled);

  const confidence = getConfidenceLevel(data);
  const confidencePercent = getConfidencePercent(data);
  const sortedRooms = getRoomPriority(data.roomPatterns);
  const autoEntries = getAutoScheduleEntries(data);
  const insights = data.insights ?? [];
  const robotEfficiency = data.robotEfficiency ?? {};
  const confColor = CONFIDENCE_COLORS[confidence] ?? '#666';

  const hasData = data.events.length > 0;

  if (!hasData) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0', color: '#666' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🧠</div>
        <div style={{ fontSize: 12, color: '#888' }}>AI is learning...</div>
        <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>
          Complete tasks so the AI can discover patterns.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Learning Status */}
      <div style={{
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>
            AI Confidence
          </span>
          <span style={{ fontSize: 10, color: confColor, fontWeight: 600, textTransform: 'capitalize' }}>
            {confidence} ({confidencePercent}%)
          </span>
        </div>
        <div style={{
          height: 4,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${confidencePercent}%`,
            background: confColor,
            borderRadius: 2,
            transition: 'width 0.5s',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#666' }}>
          <span>{data.events.length} events tracked</span>
          <span>{data.totalUserCommands} user commands</span>
        </div>
      </div>

      {/* Smart Schedule Status */}
      <div style={{
        padding: '8px 12px',
        background: enabled ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        border: `1px solid ${enabled ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)'}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: enabled ? '#4ade80' : '#888', fontWeight: 600 }}>
            Smart Schedule {enabled ? 'Active' : 'Inactive'}
          </span>
          <span style={{ fontSize: 10, color: '#666' }}>
            {autoEntries.length} auto-task{autoEntries.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div>
          <div style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            AI Insights
          </div>
          {insights.slice(0, 5).map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      {/* Dirt Rate Rankings */}
      {sortedRooms.length > 0 && (
        <div>
          <div style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Room Dirt Rates
          </div>
          {sortedRooms.slice(0, 5).map((pattern, i) => {
            const label = ROOM_LABELS[pattern.roomId] ?? pattern.roomId;
            const maxRate = Math.max(1, ...sortedRooms.map((p) => p.avgDirtyRate));
            const barWidth = (pattern.avgDirtyRate / maxRate) * 100;
            const barColor = barWidth > 66 ? '#ef4444' : barWidth > 33 ? '#f59e0b' : '#22c55e';
            return (
              <div key={pattern.roomId} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: '#ccc' }}>
                    <span style={{ color: '#555', fontSize: 10 }}>#{i + 1}</span> {label}
                  </span>
                  <span style={{ color: '#888', fontFamily: 'monospace', fontSize: 10 }}>
                    {pattern.avgDirtyRate.toFixed(1)}/hr
                  </span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <div style={{
                    height: '100%',
                    width: `${barWidth}%`,
                    background: barColor,
                    borderRadius: 2,
                    transition: 'width 0.5s',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Optimal Schedule */}
      {autoEntries.length > 0 && (
        <div>
          <div style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Learned Schedule
          </div>
          {autoEntries.map((entry) => {
            const period = getPeriodLabel(Math.floor(entry.optimalTime / 60));
            const periodColors: Record<string, string> = {
              morning: '#fbbf24',
              afternoon: '#f97316',
              evening: '#8b5cf6',
              night: '#3b82f6',
            };
            return (
              <div key={`${entry.roomId}:${entry.taskType}`} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 6,
              }}>
                <span style={{ fontSize: 11, color: '#bbb' }}>{entry.command}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#00b8e8' }}>
                    {formatTimeOfDay(entry.optimalTime)}
                  </span>
                  <span style={{
                    fontSize: 8,
                    padding: '1px 5px',
                    borderRadius: 4,
                    color: periodColors[period] ?? '#888',
                    background: `${periodColors[period] ?? '#888'}15`,
                    textTransform: 'capitalize',
                  }}>
                    {period}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Robot Efficiency */}
      {Object.keys(robotEfficiency).length > 0 && (
        <div>
          <div style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Robot Efficiency
          </div>
          {Object.entries(robotEfficiency).map(([robotId, entries]) => {
            if (!entries || entries.length === 0) return null;
            const sorted = [...entries].sort((a, b) => b.completionCount - a.completionCount);
            const robotName = ROBOT_LABELS[robotId] ?? robotId;
            const robotColor = ROBOT_COLORS[robotId] ?? '#888';
            const totalTasks = sorted.reduce((sum, e) => sum + e.completionCount, 0);
            return (
              <div key={robotId} style={{
                marginBottom: 8,
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: robotColor }}>
                    {robotName}
                  </span>
                  <span style={{ fontSize: 10, color: '#666' }}>
                    {totalTasks} task{totalTasks !== 1 ? 's' : ''} tracked
                  </span>
                </div>
                {sorted.slice(0, 3).map((entry) => (
                  <RobotEfficiencyRow key={entry.taskType} entry={entry} robotColor={robotColor} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const icon = CATEGORY_ICONS[insight.category] ?? '💡';
  const importanceColor = insight.importance >= 0.7
    ? 'rgba(99,102,241,0.15)'
    : insight.importance >= 0.4
      ? 'rgba(255,255,255,0.05)'
      : 'rgba(255,255,255,0.03)';
  const borderColor = insight.importance >= 0.7
    ? 'rgba(99,102,241,0.2)'
    : 'rgba(255,255,255,0.05)';

  return (
    <div style={{
      padding: '8px 10px',
      marginBottom: 4,
      background: importanceColor,
      border: `1px solid ${borderColor}`,
      borderRadius: 6,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
    }}>
      <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: 10, color: '#ccc', lineHeight: 1.4 }}>{insight.text}</span>
    </div>
  );
}

function RobotEfficiencyRow({ entry, robotColor }: { entry: RobotEfficiency; robotColor: string }) {
  const TASK_LABELS: Record<string, string> = {
    cleaning: 'Cleaning',
    vacuuming: 'Vacuuming',
    dishes: 'Dishes',
    laundry: 'Laundry',
    organizing: 'Organizing',
    cooking: 'Cooking',
    'bed-making': 'Bed Making',
    scrubbing: 'Scrubbing',
    sweeping: 'Sweeping',
    mowing: 'Mowing',
    watering: 'Watering',
    'leaf-blowing': 'Leaf Blowing',
    weeding: 'Weeding',
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
      <span style={{ fontSize: 10, color: '#999' }}>
        {TASK_LABELS[entry.taskType] ?? entry.taskType}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 9, color: '#666' }}>
          {entry.completionCount}x
        </span>
        <span style={{
          fontSize: 9,
          fontFamily: 'monospace',
          color: robotColor,
          opacity: 0.7,
        }}>
          ~{entry.avgWorkDuration.toFixed(0)}s
        </span>
      </div>
    </div>
  );
}
