import { useStore } from '../../stores/useStore';
import { rooms } from '../../utils/homeLayout';
import { achievements, getUnlockedAchievements } from '../../systems/Achievements';
import { getEventConfig, getEventRoomName } from '../../systems/HomeEvents';
import { SaveLoadButtons } from './SaveLoadSystem';

const taskTypeLabels: Record<string, string> = {
  cleaning: '🧹 Cleaning',
  vacuuming: '🧽 Vacuuming',
  dishes: '🍽️ Dishes',
  laundry: '👕 Laundry',
  organizing: '📦 Organizing',
  cooking: '🍳 Cooking',
  'bed-making': '🛏️ Bed Making',
  scrubbing: '🪣 Scrubbing',
  sweeping: '🧹 Sweeping',
  'grocery-list': '📝 Grocery List',
  general: '⚙️ General',
};

export function StatsPanel() {
  const showStats = useStore((s) => s.showStats);
  const setShowStats = useStore((s) => s.setShowStats);
  const totalTasksCompleted = useStore((s) => s.totalTasksCompleted);
  const tasksByType = useStore((s) => s.tasksByType);
  const tasksByRoom = useStore((s) => s.tasksByRoom);
  const roomNeeds = useStore((s) => s.roomNeeds);
  const simMinutes = useStore((s) => s.simMinutes);
  const homeEventHistory = useStore((s) => s.homeEventHistory);
  const activeEvent = useStore((s) => s.activeHomeEvent);

  if (!showStats) {
    return (
      <button
        onClick={() => setShowStats(true)}
        style={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          background: 'rgba(0,0,0,0.7)',
          color: '#ccc',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 13,
          cursor: 'pointer',
          zIndex: 50,
          backdropFilter: 'blur(8px)',
        }}
      >
        📊 Stats
      </button>
    );
  }

  const hours = Math.floor(simMinutes / 60) % 24;
  const mins = Math.floor(simMinutes % 60);
  const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

  // Sort tasks by count descending
  const sortedTypes = Object.entries(tasksByType)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));

  const sortedRooms = Object.entries(tasksByRoom)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));

  // Average cleanliness
  const roomIds = Object.keys(roomNeeds);
  const avgCleanliness = roomIds.length > 0
    ? Math.round(roomIds.reduce((sum, id) => sum + (roomNeeds[id as keyof typeof roomNeeds]?.cleanliness ?? 0), 0) / roomIds.length)
    : 0;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        background: 'rgba(0,0,0,0.85)',
        color: '#e0e0e0',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 18,
        fontSize: 13,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        width: 260,
        maxHeight: '70vh',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>📊 Stats</span>
        <button
          onClick={() => setShowStats(false)}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16 }}
        >
          ✕
        </button>
      </div>

      {/* Overview */}
      <div style={{ marginBottom: 14, padding: '10px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#999' }}>Sim Time</span>
          <span style={{ color: '#00b8e8', fontFamily: 'monospace' }}>{timeStr}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#999' }}>Tasks Done</span>
          <span style={{ color: '#4ade80', fontWeight: 600 }}>{totalTasksCompleted}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#999' }}>Avg Cleanliness</span>
          <span style={{ color: avgCleanliness >= 74 ? '#4ade80' : avgCleanliness >= 45 ? '#facc15' : '#f87171', fontWeight: 600 }}>
            {avgCleanliness}%
          </span>
        </div>
      </div>

      {/* Tasks by Type */}
      {sortedTypes.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            By Task Type
          </div>
          {sortedTypes.map(([type, count]) => (
            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>{taskTypeLabels[type] ?? type}</span>
              <span style={{ color: '#00b8e8', fontFamily: 'monospace' }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tasks by Room */}
      {sortedRooms.length > 0 && (
        <div>
          <div style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            By Room
          </div>
          {sortedRooms.map(([roomId, count]) => {
            const roomName = rooms.find((r) => r.id === roomId)?.name ?? roomId;
            return (
              <div key={roomId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{roomName}</span>
                <span style={{ color: '#00b8e8', fontFamily: 'monospace' }}>{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {totalTasksCompleted === 0 && (
        <div style={{ color: '#666', textAlign: 'center', padding: '12px 0' }}>
          No tasks completed yet. Watch the robot work!
        </div>
      )}

      {/* Home Events */}
      {(homeEventHistory.length > 0 || activeEvent) && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Home Events ({homeEventHistory.length} resolved)
          </div>
          {activeEvent && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
              padding: '6px 8px', background: 'rgba(239,68,68,0.15)', borderRadius: 6,
            }}>
              <span style={{ fontSize: 16 }}>{getEventConfig(activeEvent.type).emoji}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f87171' }}>
                  {getEventConfig(activeEvent.type).label} — {activeEvent.phase.toUpperCase()}
                </div>
                <div style={{ fontSize: 10, color: '#999' }}>
                  {getEventRoomName(activeEvent.roomId)}
                </div>
              </div>
            </div>
          )}
          {homeEventHistory.slice(-5).reverse().map((entry) => {
            const cfg = getEventConfig(entry.type);
            const duration = Math.round(entry.resolvedAt - entry.startedAt);
            return (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                padding: '6px 8px', background: 'rgba(74,222,128,0.06)', borderRadius: 6,
              }}>
                <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#ccc' }}>
                    {cfg.label} in {getEventRoomName(entry.roomId)}
                  </div>
                  <div style={{ fontSize: 10, color: '#777' }}>
                    Fixed in {duration} min by {entry.respondingRobots.join(', ')}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: '#4ade80' }}>Resolved</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Achievements */}
      <div style={{ marginTop: 14 }}>
        <div style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Achievements ({getUnlockedAchievements({ totalTasksCompleted, tasksByType, tasksByRoom, simMinutes }).length}/{achievements.length})
        </div>
        {achievements.map((a) => {
          const unlocked = a.check({ totalTasksCompleted, tasksByType, tasksByRoom, simMinutes });
          return (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
                opacity: unlocked ? 1 : 0.35,
                padding: '6px 8px',
                background: unlocked ? 'rgba(74,222,128,0.08)' : 'transparent',
                borderRadius: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>{unlocked ? a.emoji : '🔒'}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: unlocked ? 600 : 400, color: unlocked ? '#fff' : '#888' }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 10, color: '#777' }}>{a.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save / Load */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Save / Load
        </div>
        <SaveLoadButtons />
      </div>
    </div>
  );
}
