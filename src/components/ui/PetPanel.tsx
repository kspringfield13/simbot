import { useStore } from '../../stores/useStore';
import { PET_CONFIGS, PET_IDS } from '../../config/pets';

function HappinessBar({ value }: { value: number }) {
  const color = value >= 70 ? '#4ade80' : value >= 40 ? '#facc15' : '#f87171';
  const label = value >= 70 ? 'Happy' : value >= 40 ? 'Okay' : 'Hungry';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#999' }}>Happiness</span>
        <span style={{ fontSize: 11, color, fontWeight: 600 }}>{Math.round(value)}% — {label}</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
        <div style={{
          height: '100%',
          width: `${value}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.5s, background 0.5s',
        }} />
      </div>
    </div>
  );
}

export function PetPanel() {
  const showPetPanel = useStore((s) => s.showPetPanel);
  const setShowPetPanel = useStore((s) => s.setShowPetPanel);
  const petStates = useStore((s) => s.petStates);

  if (!showPetPanel) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0,0,0,0.9)',
        color: '#e0e0e0',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14,
        padding: 20,
        fontSize: 13,
        zIndex: 55,
        backdropFilter: 'blur(16px)',
        width: 300,
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
          <span style={{ marginRight: 8 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, display: 'inline', verticalAlign: 'middle', color: '#f59e0b' }}>
              <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217 1.5 2 2 2s1.5-1 2-1 1.5 1 2 1 1.863-.783 2-2c.074-.65-.109-1.632-.5-2.5" />
              <path d="M14 5.172C14 3.782 15.577 2.679 17.5 3c2.823.47 4.113 6.006 4 7-.137 1.217-1.5 2-2 2s-1.5-1-2-1-1.5 1-2 1-1.863-.783-2-2c-.074-.65.109-1.632.5-2.5" />
              <path d="M8 14v.5" />
              <path d="M16 14v.5" />
              <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
              <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306" />
            </svg>
          </span>
          Robot Pets
        </span>
        <button
          onClick={() => setShowPetPanel(false)}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18 }}
        >
          ✕
        </button>
      </div>

      {PET_IDS.map((petId) => {
        const config = PET_CONFIGS[petId];
        const state = petStates[petId];
        const emoji = petId === 'fish' ? '🐟' : '🐹';
        const roomLabel = petId === 'fish' ? 'Living Room' : 'Bedroom';

        return (
          <div
            key={petId}
            style={{
              marginBottom: 14,
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 24 }}>{emoji}</span>
              <div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>
                  {config.name}
                </div>
                <div style={{ fontSize: 11, color: '#777' }}>{roomLabel}</div>
              </div>
            </div>

            <HappinessBar value={state.happiness} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: '#888' }}>
              <span>Times fed: <span style={{ color: '#4ade80' }}>{state.totalFeedings}</span></span>
              <span>
                {state.lastFedAt > 0
                  ? `Last fed: ${Math.floor(state.lastFedAt / 60) % 24}:${String(Math.floor(state.lastFedAt % 60)).padStart(2, '0')}`
                  : 'Not fed yet'}
              </span>
            </div>
          </div>
        );
      })}

      <div style={{ fontSize: 11, color: '#666', textAlign: 'center', marginTop: 4, lineHeight: 1.4 }}>
        Robots will automatically visit and feed your pets when they get hungry.
      </div>
    </div>
  );
}
