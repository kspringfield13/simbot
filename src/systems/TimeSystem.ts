import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { useStore } from '../stores/useStore';
import { getSeasonForDay, SEASON_LABELS, SEASON_ICONS } from '../config/seasons';
import type { SimPeriod, WeatherType } from '../types';

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
  sunPosition: [number, number, number];
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

// Sun arcs east→overhead→west from 6am-6pm, below horizon at night
function getSunPosition(hour: number): [number, number, number] {
  const S = 2; // match environment scale
  // Sun rises at 6, peaks at 12, sets at 18
  const sunProgress = Math.max(0, Math.min(1, (hour - 6) / 12)); // 0 at 6am, 1 at 6pm
  const angle = sunProgress * Math.PI; // 0→π (east to west)
  const x = Math.cos(angle) * 16 * S;  // east (+) to west (-)
  const elevation = Math.sin(angle);     // peaks at noon
  const y = (hour >= 6 && hour < 18) ? elevation * 20 * S : 2 * S; // low at night
  const z = 6 * S; // slightly south
  return [x, y, z];
}

export function getTimeLighting(simMinutes: number): TimeLighting {
  const wrapped = wrapMinutes(simMinutes);
  const hour = wrapped / 60;

  const dawn = { hour: 7, color: '#ffd5a8', ambient: 0.24, sun: 0.9 };
  const midday = { hour: 13, color: '#d9ebff', ambient: 0.32, sun: 1.25 };
  const dusk = { hour: 19, color: '#ffc9a2', ambient: 0.26, sun: 0.95 };
  const night = { hour: 23, color: '#9ab2d1', ambient: 0.16, sun: 0.55 };

  const sunPosition = getSunPosition(hour);

  if (hour >= dawn.hour && hour < midday.hour) {
    const t = (hour - dawn.hour) / (midday.hour - dawn.hour);
    return {
      ambientIntensity: dawn.ambient + (midday.ambient - dawn.ambient) * t,
      sunIntensity: dawn.sun + (midday.sun - dawn.sun) * t,
      sunColor: mixHex(dawn.color, midday.color, t),
      hemisphereColor: mixHex('#f7d8b4', '#dcecff', t),
      sunPosition,
    };
  }

  if (hour >= midday.hour && hour < dusk.hour) {
    const t = (hour - midday.hour) / (dusk.hour - midday.hour);
    return {
      ambientIntensity: midday.ambient + (dusk.ambient - midday.ambient) * t,
      sunIntensity: midday.sun + (dusk.sun - midday.sun) * t,
      sunColor: mixHex(midday.color, dusk.color, t),
      hemisphereColor: mixHex('#dcecff', '#f6d1b0', t),
      sunPosition,
    };
  }

  if (hour >= dusk.hour && hour < night.hour) {
    const t = (hour - dusk.hour) / (night.hour - dusk.hour);
    return {
      ambientIntensity: dusk.ambient + (night.ambient - dusk.ambient) * t,
      sunIntensity: dusk.sun + (night.sun - dusk.sun) * t,
      sunColor: mixHex(dusk.color, night.color, t),
      hemisphereColor: mixHex('#f1c29c', '#93acd1', t),
      sunPosition,
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
    sunPosition,
  };
}

const WEATHER_CYCLE: WeatherType[] = ['sunny', 'sunny', 'rainy', 'sunny', 'snowy', 'rainy', 'sunny', 'sunny'];
const WEATHER_INTERVAL = 3 * 60; // change every 3 sim-hours

export function getWeatherForTime(simMinutes: number): WeatherType {
  const idx = Math.floor(simMinutes / WEATHER_INTERVAL) % WEATHER_CYCLE.length;
  return WEATHER_CYCLE[idx];
}

export function getSimDay(simMinutes: number): number {
  return Math.floor(simMinutes / MINUTES_PER_DAY) + 1;
}

export function TimeSystem() {
  const advanceTime = useStore((state) => state.advanceTime);
  const lastWeatherIdxRef = useRef(-1);
  const lastSeasonRef = useRef(useStore.getState().currentSeason);
  const lastDiaryDayRef = useRef(useStore.getState().diaryDay);

  useFrame((_, delta) => {
    advanceTime(delta);

    const s = useStore.getState();
    const idx = Math.floor(s.simMinutes / WEATHER_INTERVAL) % WEATHER_CYCLE.length;
    if (idx !== lastWeatherIdxRef.current) {
      lastWeatherIdxRef.current = idx;
      s.setWeather(WEATHER_CYCLE[idx]);
    }

    // Season tracking
    const day = getSimDay(s.simMinutes);
    const season = getSeasonForDay(day);
    if (season !== lastSeasonRef.current) {
      lastSeasonRef.current = season;
      s.setCurrentSeason(season);
      s.setSeasonToast(`${SEASON_ICONS[season]} ${SEASON_LABELS[season]} has arrived!`);
    }

    // Diary day reset
    if (day !== lastDiaryDayRef.current) {
      lastDiaryDayRef.current = day;
      s.resetDiary(day);
    }
  });

  return null;
}
