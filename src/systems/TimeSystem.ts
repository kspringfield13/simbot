import { useFrame } from '@react-three/fiber';
import { useStore } from '../stores/useStore';
import type { SimPeriod } from '../types';

export const MINUTES_PER_DAY = 24 * 60;

function wrapMinutes(totalMinutes: number): number {
  const wrapped = totalMinutes % MINUTES_PER_DAY;
  return wrapped >= 0 ? wrapped : wrapped + MINUTES_PER_DAY;
}

export function getSimPeriod(simMinutes: number): SimPeriod {
  const minutes = wrapMinutes(simMinutes);
  const hour = Math.floor(minutes / 60);

  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export function formatSimClock(simMinutes: number): { timeText: string; dayText: string } {
  const dayIndex = Math.floor(simMinutes / MINUTES_PER_DAY) + 1;
  const wrapped = wrapMinutes(simMinutes);
  const hours = Math.floor(wrapped / 60);
  const minutes = Math.floor(wrapped % 60);

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');

  return {
    timeText: `${hh}:${mm}`,
    dayText: `Day ${dayIndex}`,
  };
}

interface TimeLighting {
  ambientIntensity: number;
  sunIntensity: number;
  sunColor: string;
  hemisphereColor: string;
}

function mixChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(
    mixChannel(ar, br, t),
    mixChannel(ag, bg, t),
    mixChannel(ab, bb, t),
  );
}

export function getTimeLighting(simMinutes: number): TimeLighting {
  const wrapped = wrapMinutes(simMinutes);
  const hour = wrapped / 60;

  const dawn = { hour: 7, color: '#ffd5a8', ambient: 0.24, sun: 0.9 };
  const midday = { hour: 13, color: '#d9ebff', ambient: 0.32, sun: 1.25 };
  const dusk = { hour: 19, color: '#ffc9a2', ambient: 0.26, sun: 0.95 };
  const night = { hour: 23, color: '#9ab2d1', ambient: 0.16, sun: 0.55 };

  if (hour >= dawn.hour && hour < midday.hour) {
    const t = (hour - dawn.hour) / (midday.hour - dawn.hour);
    return {
      ambientIntensity: dawn.ambient + (midday.ambient - dawn.ambient) * t,
      sunIntensity: dawn.sun + (midday.sun - dawn.sun) * t,
      sunColor: mixHex(dawn.color, midday.color, t),
      hemisphereColor: mixHex('#f7d8b4', '#dcecff', t),
    };
  }

  if (hour >= midday.hour && hour < dusk.hour) {
    const t = (hour - midday.hour) / (dusk.hour - midday.hour);
    return {
      ambientIntensity: midday.ambient + (dusk.ambient - midday.ambient) * t,
      sunIntensity: midday.sun + (dusk.sun - midday.sun) * t,
      sunColor: mixHex(midday.color, dusk.color, t),
      hemisphereColor: mixHex('#dcecff', '#f6d1b0', t),
    };
  }

  if (hour >= dusk.hour && hour < night.hour) {
    const t = (hour - dusk.hour) / (night.hour - dusk.hour);
    return {
      ambientIntensity: dusk.ambient + (night.ambient - dusk.ambient) * t,
      sunIntensity: dusk.sun + (night.sun - dusk.sun) * t,
      sunColor: mixHex(dusk.color, night.color, t),
      hemisphereColor: mixHex('#f1c29c', '#93acd1', t),
    };
  }

  const startHour = night.hour;
  const endHour = dawn.hour + 24;
  const adjustedHour = hour < dawn.hour ? hour + 24 : hour;
  const t = (adjustedHour - startHour) / (endHour - startHour);

  return {
    ambientIntensity: night.ambient + (dawn.ambient - night.ambient) * t,
    sunIntensity: night.sun + (dawn.sun - night.sun) * t,
    sunColor: mixHex(night.color, dawn.color, t),
    hemisphereColor: mixHex('#93acd1', '#f7d8b4', t),
  };
}

export function TimeSystem() {
  const advanceTime = useStore((state) => state.advanceTime);

  useFrame((_, delta) => {
    advanceTime(delta);
  });

  return null;
}
