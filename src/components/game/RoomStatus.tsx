import { useStore } from '../../stores/useStore';
import { rooms } from '../../utils/homeLayout';

function Bar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full rounded-full bg-white/8">
      <div
        className="h-1 rounded-full bg-white/60 transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function RoomStatus() {
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const setSelectedRoomId = useStore((s) => s.setSelectedRoomId);
  const roomNeed = useStore((s) => (selectedRoomId ? s.roomNeeds[selectedRoomId] : null));

  if (!selectedRoomId || !roomNeed) return null;
  const room = rooms.find((r) => r.id === selectedRoomId);
  if (!room) return null;

  return (
    <div className="pointer-events-auto absolute right-3 top-16 z-20 w-56">
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
              <Bar value={m.value} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
