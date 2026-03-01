import { useStore } from '../../stores/useStore';
import { ROBOT_CONFIGS } from '../../config/robots';
import type { RobotId } from '../../types';
import { ROBOT_IDS } from '../../types';

function getFriendshipLabel(level: number): string {
  if (level >= 80) return 'Best Friends';
  if (level >= 60) return 'Close Friends';
  if (level >= 40) return 'Good Friends';
  if (level >= 20) return 'Acquaintances';
  return 'Strangers';
}

function getFriendshipColor(level: number): string {
  if (level >= 80) return '#f472b6';
  if (level >= 60) return '#fb923c';
  if (level >= 40) return '#facc15';
  if (level >= 20) return '#60a5fa';
  return '#6b7280';
}

function getHeartIcons(level: number): string {
  if (level >= 80) return '❤️❤️❤️';
  if (level >= 60) return '❤️❤️🤍';
  if (level >= 40) return '❤️🤍🤍';
  if (level >= 20) return '🤍🤍🤍';
  return '🖤🖤🖤';
}

function PairRow({ robotA, robotB }: { robotA: RobotId; robotB: RobotId }) {
  const key = [robotA, robotB].sort().join('-');
  const friendship = useStore((s) => s.friendships[key]);
  const activeChat = useStore((s) =>
    s.activeChats.find(
      (c) =>
        (c.robotA === robotA && c.robotB === robotB) ||
        (c.robotA === robotB && c.robotB === robotA),
    ),
  );

  if (!friendship) return null;

  const configA = ROBOT_CONFIGS[robotA];
  const configB = ROBOT_CONFIGS[robotB];
  const level = friendship.level;
  const label = getFriendshipLabel(level);
  const color = getFriendshipColor(level);

  return (
    <div
      style={{
        padding: '10px 12px',
        background: activeChat ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        marginBottom: 8,
        border: activeChat ? '1px solid rgba(236,72,153,0.3)' : '1px solid transparent',
      }}
    >
      {/* Robot pair names */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: configA.color }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#e0e0e0' }}>
          {configA.name}
        </span>
        <span style={{ fontSize: 10, color: '#666' }}>&amp;</span>
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: configB.color }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#e0e0e0' }}>
          {configB.name}
        </span>
        {activeChat && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 9,
              color: '#ec4899',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Chatting
          </span>
        )}
      </div>

      {/* Hearts and label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 12 }}>{getHeartIcons(level)}</span>
        <span style={{ fontSize: 11, color, fontWeight: 500 }}>{label}</span>
      </div>

      {/* Friendship bar */}
      <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
        <div
          style={{
            position: 'absolute',
            inset: '0',
            width: `${level}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            borderRadius: 3,
            transition: 'width 0.5s ease',
          }}
        />
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 10, color: '#777' }}>
          Level {Math.round(level)}/100
        </span>
        <span style={{ fontSize: 10, color: '#777' }}>
          {friendship.totalChats} chats
        </span>
      </div>

      {/* Active chat preview */}
      {activeChat && activeChat.lines[activeChat.currentLineIndex] && (
        <div
          style={{
            marginTop: 8,
            padding: '6px 10px',
            background: 'rgba(236,72,153,0.08)',
            borderRadius: 6,
            fontSize: 10,
            color: '#ddd',
            fontStyle: 'italic',
          }}
        >
          <span style={{ fontWeight: 600, color: '#ec4899' }}>
            {ROBOT_CONFIGS[activeChat.lines[activeChat.currentLineIndex].speaker].name}:
          </span>{' '}
          "{activeChat.lines[activeChat.currentLineIndex].text}"
        </div>
      )}
    </div>
  );
}

export function SocialPanel() {
  const showSocial = useStore((s) => s.showSocial);
  const setShowSocial = useStore((s) => s.setShowSocial);

  if (!showSocial) return null;

  // Generate all unique pairs
  const pairs: [RobotId, RobotId][] = [];
  for (let i = 0; i < ROBOT_IDS.length; i++) {
    for (let j = i + 1; j < ROBOT_IDS.length; j++) {
      pairs.push([ROBOT_IDS[i], ROBOT_IDS[j]]);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        background: 'rgba(0,0,0,0.88)',
        color: '#e0e0e0',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 18,
        fontSize: 13,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        width: 280,
        maxHeight: '70vh',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
          💕 Social
        </span>
        <button
          onClick={() => setShowSocial(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          color: '#999',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        Friendships
      </div>

      {pairs.map(([a, b]) => (
        <PairRow key={`${a}-${b}`} robotA={a} robotB={b} />
      ))}

      <div style={{ marginTop: 8, fontSize: 10, color: '#666', lineHeight: 1.5 }}>
        Robots form friendships by spending time in the same room and chatting.
        Higher friendship means more frequent conversations and unique dialogue.
      </div>
    </div>
  );
}

export function SocialButton() {
  const showSocial = useStore((s) => s.showSocial);
  const setShowSocial = useStore((s) => s.setShowSocial);
  const activeChats = useStore((s) => s.activeChats);

  return (
    <button
      type="button"
      onClick={() => {
        setShowSocial(!showSocial);
        if (navigator.vibrate) navigator.vibrate(8);
      }}
      className={`pointer-events-auto relative flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition-all ${
        showSocial
          ? 'border-pink-500/30 bg-pink-500/20 text-pink-400'
          : 'border-white/10 bg-black/50 text-white/60 hover:text-white/90'
      }`}
      title="Robot Friendships"
    >
      💕
      {activeChats.length > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-pink-500">
          <span className="animate-ping absolute h-full w-full rounded-full bg-pink-400 opacity-50" />
        </span>
      )}
    </button>
  );
}
