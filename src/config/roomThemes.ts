// ── Room Theme Configuration ──────────────────────────────
// Themes apply visual overrides: wall color, floor appearance,
// furniture tint, ambient lighting, baseboard color, and decorative accents.

export type RoomThemeId = 'default' | 'sci-fi' | 'medieval' | 'tropical';

export interface RoomThemeConfig {
  id: RoomThemeId;
  name: string;
  description: string;
  wallColor: string;
  wallRoughness: number;
  wallMetalness: number;
  wallOpacity: number;
  floorColor: string;
  floorRoughness: number;
  floorMetalness: number;
  baseboardColor: string;
  ambientLightColor: string;
  ambientLightIntensity: number;
  furnitureTint: string;
  furnitureEmissive: string;
  furnitureEmissiveIntensity: number;
  accentColor: string;       // decorative accent glow
  accentEmissiveIntensity: number;
}

export const ROOM_THEMES: Record<RoomThemeId, RoomThemeConfig> = {
  default: {
    id: 'default',
    name: 'Default',
    description: 'Standard home appearance',
    wallColor: '#e8e2d6',
    wallRoughness: 0.8,
    wallMetalness: 0.01,
    wallOpacity: 0.7,
    floorColor: '#4a4644',
    floorRoughness: 0.75,
    floorMetalness: 0.02,
    baseboardColor: '#332f2b',
    ambientLightColor: '#ffffff',
    ambientLightIntensity: 0,
    furnitureTint: '#ffffff',
    furnitureEmissive: '#000000',
    furnitureEmissiveIntensity: 0,
    accentColor: '#000000',
    accentEmissiveIntensity: 0,
  },
  'sci-fi': {
    id: 'sci-fi',
    name: 'Sci-Fi',
    description: 'Neon-lit cyberpunk station',
    wallColor: '#1a1a2e',
    wallRoughness: 0.3,
    wallMetalness: 0.4,
    wallOpacity: 0.85,
    floorColor: '#0f0f1a',
    floorRoughness: 0.2,
    floorMetalness: 0.35,
    baseboardColor: '#2a1a4e',
    ambientLightColor: '#6a3aff',
    ambientLightIntensity: 0.6,
    furnitureTint: '#c0c8e8',
    furnitureEmissive: '#4040ff',
    furnitureEmissiveIntensity: 0.15,
    accentColor: '#00e5ff',
    accentEmissiveIntensity: 0.8,
  },
  medieval: {
    id: 'medieval',
    name: 'Medieval',
    description: 'Stone castle with torch light',
    wallColor: '#7a736a',
    wallRoughness: 0.95,
    wallMetalness: 0.02,
    wallOpacity: 0.9,
    floorColor: '#5a5248',
    floorRoughness: 0.9,
    floorMetalness: 0.01,
    baseboardColor: '#4a3f2e',
    ambientLightColor: '#ff9940',
    ambientLightIntensity: 0.5,
    furnitureTint: '#c8a87a',
    furnitureEmissive: '#804020',
    furnitureEmissiveIntensity: 0.08,
    accentColor: '#ff7020',
    accentEmissiveIntensity: 0.6,
  },
  tropical: {
    id: 'tropical',
    name: 'Tropical',
    description: 'Sunny beach paradise',
    wallColor: '#e8f0e0',
    wallRoughness: 0.7,
    wallMetalness: 0.01,
    wallOpacity: 0.75,
    floorColor: '#d4c8a0',
    floorRoughness: 0.8,
    floorMetalness: 0.01,
    baseboardColor: '#8b7355',
    ambientLightColor: '#ffdd44',
    ambientLightIntensity: 0.45,
    furnitureTint: '#f0ffe0',
    furnitureEmissive: '#40a020',
    furnitureEmissiveIntensity: 0.06,
    accentColor: '#00c896',
    accentEmissiveIntensity: 0.5,
  },
};

export const THEME_IDS: RoomThemeId[] = ['default', 'sci-fi', 'medieval', 'tropical'];

export function getRoomTheme(id: RoomThemeId): RoomThemeConfig {
  return ROOM_THEMES[id] ?? ROOM_THEMES.default;
}
