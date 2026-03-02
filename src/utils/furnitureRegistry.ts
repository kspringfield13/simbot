import type { RoomId } from '../types';
import { getFloorPlan } from '../config/floorPlans';

export interface FurnitureModel {
  url: string;
  offset: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export interface FurniturePiece {
  id: string;
  name: string;
  roomId: RoomId;
  defaultPosition: [number, number, number];
  models: FurnitureModel[];
  obstacleRadius: number;
  movable: boolean;
}

/** Static fallback for import-time usage — house preset furniture. */
export const FURNITURE_PIECES: FurniturePiece[] = getFloorPlan('house').furniture;

// Break circular dep: store ref set lazily after store initializes
let _getFloorPlanId: (() => string) | null = null;
export function setFloorPlanIdGetter(fn: () => string) { _getFloorPlanId = fn; }

/** Get furniture for the currently active floor plan. */
export function getActiveFurniture(floorPlanId?: string): FurniturePiece[] {
  const id = floorPlanId ?? _getFloorPlanId?.() ?? 'house';
  return getFloorPlan(id).furniture;
}

export function getFurniturePiece(id: string, floorPlanId?: string): FurniturePiece | undefined {
  return getActiveFurniture(floorPlanId).find((p) => p.id === id);
}
