import { useStore } from '../../stores/useStore';
import { rooms } from '../../utils/homeLayout';
import { roomAttentionLabel } from '../../systems/RoomState';

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-white/8">
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}

function barColor(value: number): string {
  if (value >= 74) return '#4ade80';
  if (value >= 45) return '#facc15';
  return '#f87171';
}

export function RoomStatus() {
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const setSelectedRoomId = useStore((s) => s.setSelectedRoomId);
  const roomNeed = useStore((s) => (selectedRoomId ? s.roomNeeds[selectedRoomId] : null));

  if (!selectedRoomId || !roomNeed) return null;
  const room = rooms.find((r) => r.id === selectedRoomId);
  if (!room) return null;

  const avg = (roomNeed.cleanliness + roomNeed.tidiness + roomNeed.routine) / 3;
  const statusLabel = roomAttentionLabel(avg);
  const statusColor = barColor(avg);

  return (
    <>
      {/* Desktop: top-right card */}
      <div className="pointer-events-auto absolute right-3 top-16 z-20 hidden w-56 sm:block">
        <div className="rounded-2xl border border-white/6 bg-black/80 p-3 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-white/90">{room.name}</span>
            <button
              type="button"
              onClick={() => setSelectedRoomId(null)}
              className="text-[10px] text-white/30 hover:text-white/60"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'Clean', value: roomNeed.cleanliness },
              { label: 'Tidy', value: roomNeed.tidiness },
              { label: 'Routine', value: roomNeed.routine },
            ].map((m) => (
              <div key={m.label}>
                <div className="mb-1 flex justify-between text-[10px]">
                  <span className="text-white/40">{m.label}</span>
                  <span className="text-white/50">{m.value.toFixed(0)}%</span>
                </div>
                <Bar value={m.value} color={barColor(m.value)} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 sm:hidden animate-slide-up">
        {/* Backdrop tap to close */}
        <div
          className="absolute inset-0 -top-[100vh]"
          onClick={() => setSelectedRoomId(null)}
        />
        <div className="relative rounded-t-2xl border-t border-white/10 bg-black/90 px-5 pb-6 pt-3 backdrop-blur-xl">
          {/* Drag handle */}
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />

          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white/90">{room.name}</h3>
              <span className="text-[11px] font-medium" style={{ color: statusColor }}>
                {statusLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRoomId(null)}
              className="rounded-full bg-white/10 p-1.5 text-white/50 hover:text-white/80"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Cleanliness', value: roomNeed.cleanliness },
              { label: 'Tidiness', value: roomNeed.tidiness },
              { label: 'Routine', value: roomNeed.routine },
            ].map((m) => (
              <div key={m.label}>
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="text-white/50">{m.label}</span>
                  <span className="font-medium text-white/70">{m.value.toFixed(0)}%</span>
                </div>
                <Bar value={m.value} color={barColor(m.value)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
