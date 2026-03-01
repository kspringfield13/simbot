import { useMemo } from 'react';
import { useStore } from '../../stores/useStore';
import { getEffectiveRooms } from '../../utils/homeLayout';
import { THEME_IDS, getRoomTheme } from '../../config/roomThemes';
import type { RoomThemeId } from '../../config/roomThemes';

const THEME_PREVIEWS: Record<RoomThemeId, { gradient: string; icon: string }> = {
  default: { gradient: 'from-gray-600 to-gray-400', icon: '🏠' },
  'sci-fi': { gradient: 'from-purple-700 to-cyan-500', icon: '🚀' },
  medieval: { gradient: 'from-amber-800 to-yellow-600', icon: '🏰' },
  tropical: { gradient: 'from-green-500 to-yellow-400', icon: '🌴' },
};

function ThemeCard({
  themeId,
  isActive,
  onClick,
}: {
  themeId: RoomThemeId;
  isActive: boolean;
  onClick: () => void;
}) {
  const theme = getRoomTheme(themeId);
  const preview = THEME_PREVIEWS[themeId];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
        isActive
          ? 'border-white/60 bg-white/15 shadow-lg shadow-white/10'
          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
      }`}
    >
      <div className={`flex h-10 w-full items-center justify-center rounded-lg bg-gradient-to-br ${preview.gradient}`}>
        <span className="text-xl">{preview.icon}</span>
      </div>
      <span className="text-xs font-medium text-white">{theme.name}</span>
      <span className="text-[10px] leading-tight text-white/50">{theme.description}</span>
      {isActive && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px]">
          ✓
        </div>
      )}
    </button>
  );
}

export function ThemeSelectorPanel() {
  const show = useStore((s) => s.showThemeSelector);
  const setShow = useStore((s) => s.setShowThemeSelector);
  const globalTheme = useStore((s) => s.globalTheme);
  const perRoomThemes = useStore((s) => s.perRoomThemes);
  const setGlobalTheme = useStore((s) => s.setGlobalTheme);
  const setRoomTheme = useStore((s) => s.setRoomTheme);
  const resetRoomThemes = useStore((s) => s.resetRoomThemes);
  const floorPlanId = useStore((s) => s.floorPlanId);
  const roomLayout = useStore((s) => s.roomLayout);

  const rooms = useMemo(
    () => getEffectiveRooms(roomLayout.overrides, roomLayout.addedRooms, roomLayout.deletedRoomIds, floorPlanId),
    [roomLayout, floorPlanId],
  );

  if (!show) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-40 flex w-80 flex-col overflow-hidden border-r border-white/10 bg-black/90 text-white backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold tracking-wide">Room Themes</h2>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white/60 hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Global theme */}
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Whole House</h3>
          <div className="grid grid-cols-2 gap-2">
            {THEME_IDS.map((id) => (
              <ThemeCard
                key={id}
                themeId={id}
                isActive={globalTheme === id}
                onClick={() => setGlobalTheme(id)}
              />
            ))}
          </div>
        </div>

        {/* Per-room overrides */}
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Per Room</h3>
          <p className="mb-3 text-[10px] text-white/30">Override the global theme for individual rooms.</p>
          <div className="space-y-2">
            {rooms.map((room) => {
              const roomTheme = perRoomThemes[room.id] ?? globalTheme;
              return (
                <div key={room.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                  <span className="flex-1 text-xs text-white/80">{room.name}</span>
                  <select
                    value={roomTheme}
                    onChange={(e) => {
                      const val = e.target.value as RoomThemeId;
                      if (val === globalTheme) {
                        // Remove per-room override to follow global
                        const next = { ...perRoomThemes };
                        delete next[room.id];
                        // Use setRoomTheme with globalTheme to effectively clear (matches global)
                        setRoomTheme(room.id, val);
                      } else {
                        setRoomTheme(room.id, val);
                      }
                    }}
                    className="rounded border border-white/10 bg-black/50 px-2 py-1 text-[11px] text-white"
                  >
                    {THEME_IDS.map((id) => (
                      <option key={id} value={id}>
                        {getRoomTheme(id).name}{id === globalTheme ? ' (global)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={resetRoomThemes}
          className="w-full rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 transition-all hover:bg-red-500/20"
        >
          Reset All Themes
        </button>
      </div>
    </div>
  );
}
