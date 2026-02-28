import type { RoomId } from '../types';

export type DeviceType = 'light' | 'thermostat' | 'tv';

export interface DeviceConfig {
  id: string;
  name: string;
  type: DeviceType;
  roomId: RoomId;
  position: [number, number, number];
}

export const DEVICES: DeviceConfig[] = [
  // Lights — one per room
  { id: 'light-living', name: 'Living Room Light', type: 'light', roomId: 'living-room', position: [-8, 4.8, -12] },
  { id: 'light-kitchen', name: 'Kitchen Light', type: 'light', roomId: 'kitchen', position: [8, 4.8, -12] },
  { id: 'light-hallway', name: 'Hallway Light', type: 'light', roomId: 'hallway', position: [0, 4.8, -2] },
  { id: 'light-bedroom', name: 'Bedroom Light', type: 'light', roomId: 'bedroom', position: [-8, 4.8, 8] },
  { id: 'light-bathroom', name: 'Bathroom Light', type: 'light', roomId: 'bathroom', position: [8, 4.8, 8] },
  { id: 'light-laundry', name: 'Laundry Light', type: 'light', roomId: 'laundry', position: [10, 4.8, -2] },

  // Thermostat — in hallway
  { id: 'thermostat', name: 'Thermostat', type: 'thermostat', roomId: 'hallway', position: [-6, 2.2, -3.8] },

  // TV — in living room (reuses existing tv-stand position area)
  { id: 'tv', name: 'Living Room TV', type: 'tv', roomId: 'living-room', position: [-8, 2.5, -19] },
];

export function getDevicesInRoom(roomId: RoomId): DeviceConfig[] {
  return DEVICES.filter((d) => d.roomId === roomId);
}

export function getDeviceById(id: string): DeviceConfig | undefined {
  return DEVICES.find((d) => d.id === id);
}

// Temperature comfort range for robots
export const COMFORT_TEMP = { ideal: 72, min: 65, max: 78 };

export function getComfortMultiplier(temp: number): number {
  if (temp >= COMFORT_TEMP.min && temp <= COMFORT_TEMP.max) return 1;
  const distance = temp < COMFORT_TEMP.min
    ? COMFORT_TEMP.min - temp
    : temp - COMFORT_TEMP.max;
  return Math.max(0.5, 1 - distance * 0.03);
}
