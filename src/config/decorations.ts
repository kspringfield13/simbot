// ── Room Decoration Configuration ──────────────────────────────

export interface WallColorOption {
  id: string;
  name: string;
  color: string;
}

export interface FloorOption {
  id: string;
  name: string;
  color: string;
  roughness: number;
  metalness: number;
}

export interface WallpaperOption {
  id: string;
  name: string;
  baseColor: string;
  patternColor: string;
  pattern: 'stripes' | 'checks' | 'herringbone' | 'dots' | 'diamonds';
}

export interface RoomDecoration {
  wallColor: string | null;        // hex color for wall panels
  floorId: string | null;          // floor option id
  wallpaperId: string | null;      // wallpaper pattern id
}

export const WALL_COLORS: WallColorOption[] = [
  { id: 'warm-white', name: 'Warm White', color: '#f5f0e8' },
  { id: 'soft-cream', name: 'Soft Cream', color: '#f0e6d0' },
  { id: 'sage-green', name: 'Sage Green', color: '#b2c9ab' },
  { id: 'sky-blue', name: 'Sky Blue', color: '#a8c8e8' },
  { id: 'lavender', name: 'Lavender', color: '#c4b4d8' },
  { id: 'blush-pink', name: 'Blush Pink', color: '#e8c4c4' },
  { id: 'slate-gray', name: 'Slate Gray', color: '#8a9ba8' },
  { id: 'terracotta', name: 'Terracotta', color: '#c87050' },
  { id: 'navy', name: 'Navy', color: '#3a4f6a' },
  { id: 'charcoal', name: 'Charcoal', color: '#4a4a4a' },
];

export const FLOOR_OPTIONS: FloorOption[] = [
  { id: 'wood-oak', name: 'Oak Wood', color: '#a0784c', roughness: 0.55, metalness: 0.04 },
  { id: 'wood-walnut', name: 'Walnut', color: '#6b4c30', roughness: 0.5, metalness: 0.04 },
  { id: 'wood-maple', name: 'Light Maple', color: '#c8a870', roughness: 0.5, metalness: 0.03 },
  { id: 'tile-white', name: 'White Tile', color: '#e8e4e0', roughness: 0.25, metalness: 0.08 },
  { id: 'tile-dark', name: 'Dark Tile', color: '#4a4a4a', roughness: 0.2, metalness: 0.1 },
  { id: 'carpet-beige', name: 'Beige Carpet', color: '#c8b898', roughness: 0.95, metalness: 0.0 },
  { id: 'carpet-blue', name: 'Blue Carpet', color: '#5a7a98', roughness: 0.95, metalness: 0.0 },
  { id: 'marble-white', name: 'White Marble', color: '#e8e0d8', roughness: 0.15, metalness: 0.12 },
  { id: 'marble-dark', name: 'Dark Marble', color: '#3a3a3e', roughness: 0.12, metalness: 0.15 },
  { id: 'concrete', name: 'Concrete', color: '#9a9590', roughness: 0.85, metalness: 0.02 },
];

export const WALLPAPER_OPTIONS: WallpaperOption[] = [
  { id: 'classic-stripe', name: 'Classic Stripe', baseColor: '#f0ece4', patternColor: '#d8d0c0', pattern: 'stripes' },
  { id: 'navy-stripe', name: 'Navy Stripe', baseColor: '#3a4f6a', patternColor: '#2e4058', pattern: 'stripes' },
  { id: 'green-check', name: 'Garden Check', baseColor: '#b8d4a8', patternColor: '#98b888', pattern: 'checks' },
  { id: 'herringbone', name: 'Herringbone', baseColor: '#d8d0c0', patternColor: '#c0b8a8', pattern: 'herringbone' },
  { id: 'blue-dots', name: 'Polka Dot', baseColor: '#e0e8f0', patternColor: '#a8c0d8', pattern: 'dots' },
  { id: 'pink-diamonds', name: 'Pink Diamond', baseColor: '#f0dce0', patternColor: '#d8b8c0', pattern: 'diamonds' },
];

export function getFloorOption(id: string): FloorOption | undefined {
  return FLOOR_OPTIONS.find((f) => f.id === id);
}

export function getWallpaperOption(id: string): WallpaperOption | undefined {
  return WALLPAPER_OPTIONS.find((w) => w.id === id);
}
