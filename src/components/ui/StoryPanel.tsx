// Story tab content — displays narrative arcs and story beats
// from the Robot AI Director system.

import { useStore } from '../../stores/useStore';
import {
  ARC_TYPE_EMOJI,
  PHASE_LABELS,
  TONE_COLORS,
  type StoryArc,
  type StoryBeat,
  type StoryPhase,
} from '../../systems/StoryDirector';

const phaseColors: Record<StoryPhase, string> = {
  setup: '#60a5fa',
  rising: '#f59e0b',
  climax: '#ef4444',
  resolution: '#4ade80',
};

function TensionBar({ tension }: { tension: number }) {
  const color = tension >= 75 ? '#ef4444' : tension >= 40 ? '#f59e0b' : '#60a5fa';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 9, color: '#777', minWidth: 42 }}>Tension</span>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
        <div style={{
          height: '100%',
          width: `${tension}%`,
          background: color,
          borderRadius: 2,
          transition: 'width 0.5s, background 0.5s',
        }} />
      </div>
      <span style={{ fontSize: 9, color, fontFamily: 'monospace', minWidth: 24, textAlign: 'right' }}>
        {tension}
      </span>
    </div>
  );
}

function BeatCard({ beat }: { beat: StoryBeat }) {
  return (
    <div style={{
      padding: '8px 10px',
      marginBottom: 6,
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 6,
      borderLeft: `3px solid ${TONE_COLORS[beat.tone]}`,
    }}>
      <div style={{ fontSize: 11, color: '#ddd', lineHeight: 1.4 }}>
        {beat.text}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: '#666' }}>
        <span style={{ color: phaseColors[beat.phase] }}>{PHASE_LABELS[beat.phase]}</span>
        <span>{beat.involvedRobots.join(', ')}</span>
      </div>
    </div>
  );
}

function ArcCard({ arc, expanded, onToggle }: { arc: StoryArc; expanded: boolean; onToggle: () => void }) {
  const isActive = !arc.resolvedAt;
  const emoji = ARC_TYPE_EMOJI[arc.type];
  const phaseColor = phaseColors[arc.phase];
  const recentBeats = expanded ? arc.beats.slice().reverse() : arc.beats.slice(-1).reverse();

  return (
    <div style={{
      marginBottom: 10,
      background: isActive ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
      borderRadius: 8,
      overflow: 'hidden',
      border: isActive ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.04)',
    }}>
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#e0e0e0',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: isActive ? '#fff' : '#999',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {arc.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{
              fontSize: 9,
              padding: '1px 5px',
              borderRadius: 3,
              background: `${phaseColor}22`,
              color: phaseColor,
              fontWeight: 600,
            }}>
              {isActive ? PHASE_LABELS[arc.phase] : 'Complete'}
            </span>
            <span style={{ fontSize: 9, color: '#666' }}>
              {arc.involvedRobots.join(' & ')}
            </span>
          </div>
        </div>
        <span style={{ fontSize: 10, color: '#555', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </button>

      {/* Tension bar for active arcs */}
      {isActive && (
        <div style={{ padding: '0 12px 8px' }}>
          <TensionBar tension={arc.tension} />
        </div>
      )}

      {/* Beats */}
      {recentBeats.length > 0 && (
        <div style={{ padding: '0 10px 10px' }}>
          {recentBeats.map((beat) => (
            <BeatCard key={beat.id} beat={beat} />
          ))}
          {!expanded && arc.beats.length > 1 && (
            <div style={{ textAlign: 'center', fontSize: 9, color: '#555', paddingTop: 2 }}>
              {arc.beats.length - 1} more beat{arc.beats.length - 1 > 1 ? 's' : ''}...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function StoryPanel() {
  const storyArcs = useStore((s) => s.storyArcs);
  const expandedArcId = useStore((s) => s.expandedStoryArcId);
  const setExpandedArcId = useStore((s) => s.setExpandedStoryArcId);

  const activeArcs = storyArcs.filter((a) => !a.resolvedAt);
  const completedArcs = storyArcs.filter((a) => a.resolvedAt).reverse();
  const totalBeats = storyArcs.reduce((sum, a) => sum + a.beats.length, 0);

  if (storyArcs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 12px' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📖</div>
        <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>No stories yet...</div>
        <div style={{ color: '#555', fontSize: 10 }}>
          The Director is watching. Drama will unfold as your robots work.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stats */}
      <div style={{
        marginBottom: 14,
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#999', fontSize: 11 }}>Active Arcs</span>
          <span style={{ color: '#f59e0b', fontWeight: 600, fontFamily: 'monospace' }}>{activeArcs.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#999', fontSize: 11 }}>Completed</span>
          <span style={{ color: '#4ade80', fontWeight: 600, fontFamily: 'monospace' }}>{completedArcs.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#999', fontSize: 11 }}>Story Beats</span>
          <span style={{ color: '#60a5fa', fontWeight: 600, fontFamily: 'monospace' }}>{totalBeats}</span>
        </div>
      </div>

      {/* Active arcs */}
      {activeArcs.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Now Playing
          </div>
          {activeArcs.map((arc) => (
            <ArcCard
              key={arc.id}
              arc={arc}
              expanded={expandedArcId === arc.id}
              onToggle={() => setExpandedArcId(expandedArcId === arc.id ? null : arc.id)}
            />
          ))}
        </div>
      )}

      {/* Completed arcs */}
      {completedArcs.length > 0 && (
        <div>
          <div style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Completed Storylines
          </div>
          {completedArcs.map((arc) => (
            <ArcCard
              key={arc.id}
              arc={arc}
              expanded={expandedArcId === arc.id}
              onToggle={() => setExpandedArcId(expandedArcId === arc.id ? null : arc.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
