import { useStore } from '../../stores/useStore';
import { DEVICES, getDevicesInRoom } from '../../config/devices';
import { rooms } from '../../utils/homeLayout';
import type { DeviceType } from '../../config/devices';

function DeviceIcon({ type, on }: { type: DeviceType; on: boolean }) {
  const color = on ? '#fbbf24' : '#6b7280';

  switch (type) {
    case 'light':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
        </svg>
      );
    case 'thermostat':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
        </svg>
      );
    case 'tv':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
          <polyline points="17 2 12 7 7 2" />
        </svg>
      );
  }
}

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        on ? 'bg-yellow-500' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          on ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function ThermostatControl({ deviceId }: { deviceId: string }) {
  const device = useStore((s) => s.deviceStates[deviceId]);
  const setTemp = useStore((s) => s.setDeviceTemperature);
  const temp = device?.temperature ?? 72;
  const on = device?.on ?? true;

  if (!on) return null;

  const tempColor = temp <= 68 ? 'text-blue-400' : temp <= 74 ? 'text-green-400' : temp <= 78 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="mt-2 flex items-center gap-3">
      <button
        type="button"
        onClick={() => setTemp(deviceId, temp - 1)}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/40 text-sm text-white/70 hover:bg-white/10"
      >
        -
      </button>
      <span className={`text-lg font-bold font-mono ${tempColor}`}>
        {temp}°F
      </span>
      <button
        type="button"
        onClick={() => setTemp(deviceId, temp + 1)}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/40 text-sm text-white/70 hover:bg-white/10"
      >
        +
      </button>
    </div>
  );
}

function DeviceRow({ deviceId }: { deviceId: string }) {
  const config = DEVICES.find((d) => d.id === deviceId);
  const device = useStore((s) => s.deviceStates[deviceId]);
  const toggleDevice = useStore((s) => s.toggleDevice);

  if (!config || !device) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DeviceIcon type={config.type} on={device.on} />
          <span className="text-sm text-white/80">{config.name}</span>
        </div>
        <ToggleSwitch on={device.on} onToggle={() => toggleDevice(deviceId)} />
      </div>
      {config.type === 'thermostat' && <ThermostatControl deviceId={deviceId} />}
    </div>
  );
}

export function DevicePanel() {
  const showDevicePanel = useStore((s) => s.showDevicePanel);
  const setShowDevicePanel = useStore((s) => s.setShowDevicePanel);

  if (!showDevicePanel) return null;

  const roomsWithDevices = rooms.filter((r) => getDevicesInRoom(r.id).length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-gray-900/95 p-6 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setShowDevicePanel(false)}
          className="absolute right-4 top-4 text-white/50 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="mb-1 text-lg font-bold text-white">Smart Home</h2>
        <p className="mb-4 text-xs text-white/40">Control lights, thermostat, and TV</p>

        <div className="space-y-4">
          {roomsWithDevices.map((room) => {
            const devices = getDevicesInRoom(room.id);
            return (
              <div key={room.id}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                  {room.name}
                </h3>
                <div className="space-y-2">
                  {devices.map((d) => (
                    <DeviceRow key={d.id} deviceId={d.id} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
