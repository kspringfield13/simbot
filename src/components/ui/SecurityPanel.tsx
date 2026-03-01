import { useState } from 'react';
import { useStore } from '../../stores/useStore';
import {
  SECURITY_CAMERAS,
  CAMERA_IDS,
  INTRUDER_CONFIGS,
  type CameraZoneId,
  type AlarmState,
  type IntruderType,
} from '../../config/security';

type Tab = 'cameras' | 'alarm' | 'patrol' | 'log';

const TABS: { id: Tab; label: string }[] = [
  { id: 'cameras', label: 'Cameras' },
  { id: 'alarm', label: 'Alarm' },
  { id: 'patrol', label: 'Patrol' },
  { id: 'log', label: 'Log' },
];

const ALARM_LABELS: Record<AlarmState, { label: string; color: string; bg: string }> = {
  disarmed: { label: 'Disarmed', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  'armed-home': { label: 'Armed (Home)', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)' },
  'armed-away': { label: 'Armed (Away)', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  triggered: { label: 'TRIGGERED!', color: '#ef4444', bg: 'rgba(239,68,68,0.2)' },
};

function CameraCard({ id, installed, onToggle }: { id: CameraZoneId; installed: boolean; onToggle: () => void }) {
  const cam = SECURITY_CAMERAS.find((c) => c.id === id)!;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: 10,
        border: `1px solid ${installed ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.06)'}`,
        background: installed ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.02)',
        marginBottom: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>{installed ? '\u{1F7E2}' : '\u{26AB}'}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: installed ? '#22d3ee' : '#666' }}>{cam.label}</div>
          <div style={{ fontSize: 10, color: '#666' }}>Covers: {cam.coverageRooms.join(', ')}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        style={{
          fontSize: 10,
          padding: '4px 10px',
          borderRadius: 6,
          border: 'none',
          background: installed ? 'rgba(239,68,68,0.15)' : 'rgba(34,211,238,0.15)',
          color: installed ? '#f87171' : '#22d3ee',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        {installed ? 'Remove' : 'Install'}
      </button>
    </div>
  );
}

function CamerasTab() {
  const installedCameras = useStore((s) => s.installedCameras);
  const installCamera = useStore((s) => s.installCamera);
  const uninstallCamera = useStore((s) => s.uninstallCamera);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
        Install cameras in rooms to detect intruders. Cameras with coverage reduce detection time.
      </div>
      <div style={{ fontSize: 11, color: '#22d3ee', marginBottom: 10, fontWeight: 600 }}>
        {installedCameras.length} / {CAMERA_IDS.length} cameras installed
      </div>
      {CAMERA_IDS.map((id) => (
        <CameraCard
          key={id}
          id={id}
          installed={installedCameras.includes(id)}
          onToggle={() => installedCameras.includes(id) ? uninstallCamera(id) : installCamera(id)}
        />
      ))}
    </div>
  );
}

function AlarmTab() {
  const alarmState = useStore((s) => s.alarmState);
  const setAlarmState = useStore((s) => s.setAlarmState);
  const addSecurityLog = useStore((s) => s.addSecurityLog);
  const simMinutes = useStore((s) => s.simMinutes);

  const info = ALARM_LABELS[alarmState];

  const handleSetAlarm = (newState: AlarmState) => {
    setAlarmState(newState);
    const logType = newState === 'disarmed' ? 'alarm-disarm' as const : 'alarm-arm' as const;
    addSecurityLog({ simMinutes, type: logType, message: `Alarm set to ${ALARM_LABELS[newState].label}` });
  };

  return (
    <div>
      {/* Current state indicator */}
      <div
        style={{
          textAlign: 'center',
          padding: 16,
          borderRadius: 12,
          border: `1px solid ${info.color}33`,
          background: info.bg,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 4 }}>
          {alarmState === 'triggered' ? '\u{1F6A8}' : alarmState === 'disarmed' ? '\u{1F513}' : '\u{1F512}'}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: info.color }}>{info.label}</div>
        {alarmState === 'triggered' && (
          <div style={{ fontSize: 10, color: '#f87171', marginTop: 4 }}>Intruder detected! Siren active.</div>
        )}
      </div>

      {/* Control buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          type="button"
          onClick={() => handleSetAlarm('disarmed')}
          disabled={alarmState === 'disarmed'}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: alarmState === 'disarmed' ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.1)',
            color: alarmState === 'disarmed' ? '#94a3b8' : '#cbd5e1',
            cursor: alarmState === 'disarmed' ? 'default' : 'pointer',
            fontSize: 12,
            fontWeight: 600,
            opacity: alarmState === 'disarmed' ? 0.5 : 1,
          }}
        >
          Disarm
        </button>
        <button
          type="button"
          onClick={() => handleSetAlarm('armed-home')}
          disabled={alarmState === 'armed-home'}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: alarmState === 'armed-home' ? 'rgba(34,211,238,0.2)' : 'rgba(34,211,238,0.1)',
            color: '#22d3ee',
            cursor: alarmState === 'armed-home' ? 'default' : 'pointer',
            fontSize: 12,
            fontWeight: 600,
            opacity: alarmState === 'armed-home' ? 0.5 : 1,
          }}
        >
          Arm (Home) — detect intruders, robots respond
        </button>
        <button
          type="button"
          onClick={() => handleSetAlarm('armed-away')}
          disabled={alarmState === 'armed-away'}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: alarmState === 'armed-away' ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.1)',
            color: '#f59e0b',
            cursor: alarmState === 'armed-away' ? 'default' : 'pointer',
            fontSize: 12,
            fontWeight: 600,
            opacity: alarmState === 'armed-away' ? 0.5 : 1,
          }}
        >
          Arm (Away) — full alarm with siren
        </button>
      </div>

      <div style={{ fontSize: 10, color: '#666', marginTop: 10 }}>
        Alarm auto-arms at 10 PM (night mode). Triggers reduce intruder flee time by 50%.
      </div>
    </div>
  );
}

function PatrolTab() {
  const patrolEnabled = useStore((s) => s.patrolEnabled);
  const setPatrolEnabled = useStore((s) => s.setPatrolEnabled);
  const simPeriod = useStore((s) => s.simPeriod);
  const activeIntruder = useStore((s) => s.activeIntruder);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>
        When enabled, robots patrol room-to-room during night hours (10 PM — 6 AM), checking each room for intruders.
      </div>

      {/* Toggle */}
      <button
        type="button"
        onClick={() => setPatrolEnabled(!patrolEnabled)}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 10,
          border: `1px solid ${patrolEnabled ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.1)'}`,
          background: patrolEnabled ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.03)',
          color: patrolEnabled ? '#22d3ee' : '#888',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span>{patrolEnabled ? '\u{1F6E1}\u{FE0F}' : '\u{1F4A4}'}</span>
        {patrolEnabled ? 'Patrol Active' : 'Patrol Disabled'}
      </button>

      {/* Status */}
      <div style={{
        padding: 12,
        borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Status</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span style={{ color: '#999' }}>Time of day</span>
          <span style={{ color: simPeriod === 'night' ? '#22d3ee' : '#f59e0b', fontWeight: 600 }}>
            {simPeriod === 'night' ? 'Night (patrol hours)' : `${simPeriod} (off-duty)`}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span style={{ color: '#999' }}>Mode</span>
          <span style={{ color: patrolEnabled && simPeriod === 'night' ? '#4ade80' : '#666', fontWeight: 600 }}>
            {patrolEnabled && simPeriod === 'night' ? 'Actively patrolling' : patrolEnabled ? 'Waiting for night' : 'Off'}
          </span>
        </div>
        {activeIntruder && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: '#999' }}>Alert</span>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>
              {INTRUDER_CONFIGS[activeIntruder.type as IntruderType]?.emoji} Intruder in {activeIntruder.roomId}!
            </span>
          </div>
        )}
      </div>

      {/* Patrol route */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Patrol route</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {['hallway', 'living-room', 'kitchen', 'bedroom', 'bathroom', 'laundry'].map((room) => (
            <span
              key={room}
              style={{
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.05)',
                color: '#aaa',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {room}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function LogTab() {
  const securityLog = useStore((s) => s.securityLog);
  const intruderHistory = useStore((s) => s.intruderHistory);

  const formatTime = (mins: number) => {
    const h = Math.floor((mins % 1440) / 60);
    const m = Math.floor(mins % 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const typeColors: Record<string, string> = {
    'camera-motion': '#22d3ee',
    'alarm-trigger': '#ef4444',
    'alarm-arm': '#f59e0b',
    'alarm-disarm': '#94a3b8',
    'patrol-check': '#4ade80',
    'intruder-detected': '#ef4444',
    'intruder-resolved': '#4ade80',
  };

  return (
    <div>
      {/* Intruder history summary */}
      {intruderHistory.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Intruder History ({intruderHistory.length} total)</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {intruderHistory.slice(-5).reverse().map((entry, i) => {
              const cfg = INTRUDER_CONFIGS[entry.type as IntruderType];
              return (
                <span
                  key={i}
                  style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'rgba(239,68,68,0.08)',
                    color: '#f87171',
                    border: '1px solid rgba(239,68,68,0.15)',
                  }}
                >
                  {cfg?.emoji ?? '?'} {entry.roomId} @ {formatTime(entry.detectedAt)}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Live log */}
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Security Log</div>
      {securityLog.length === 0 ? (
        <div style={{ fontSize: 11, color: '#555', textAlign: 'center', padding: 20 }}>No events yet. Logs appear when security events occur.</div>
      ) : (
        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
          {[...securityLog].reverse().map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
                borderLeft: `3px solid ${typeColors[entry.type] ?? '#666'}`,
                marginBottom: 4,
                fontSize: 11,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#ccc' }}>{entry.message}</span>
                <span style={{ color: '#555', fontSize: 10, whiteSpace: 'nowrap', marginLeft: 8 }}>{formatTime(entry.simMinutes)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SecurityPanel() {
  const show = useStore((s) => s.showSecurityPanel);
  const setShow = useStore((s) => s.setShowSecurityPanel);
  const [activeTab, setActiveTab] = useState<Tab>('cameras');

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0,0,0,0.92)',
        color: '#e0e0e0',
        border: '1px solid rgba(34,211,238,0.15)',
        borderRadius: 14,
        padding: 20,
        fontSize: 13,
        zIndex: 55,
        backdropFilter: 'blur(16px)',
        width: 340,
        maxHeight: '85vh',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20, color: '#22d3ee' }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Home Security
        </span>
        <button
          type="button"
          onClick={() => setShow(false)}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: '#999',
            width: 28,
            height: 28,
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          x
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '6px 0',
              borderRadius: 8,
              border: 'none',
              background: activeTab === tab.id ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.id ? '#22d3ee' : '#888',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'cameras' && <CamerasTab />}
      {activeTab === 'alarm' && <AlarmTab />}
      {activeTab === 'patrol' && <PatrolTab />}
      {activeTab === 'log' && <LogTab />}
    </div>
  );
}
