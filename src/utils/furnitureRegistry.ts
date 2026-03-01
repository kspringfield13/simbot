import type { RoomId } from '../types';
import { getFloorPlan } from '../config/floorPlans';
import { useStore } from '../stores/useStore';

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

/** Get furniture for the currently active floor plan. */
export function getActiveFurniture(): FurniturePiece[] {
  const id = useStore.getState().floorPlanId;
  return getFloorPlan(id).furniture;
}

export function getFurniturePiece(id: string): FurniturePiece | undefined {
  return getActiveFurniture().find((p) => p.id === id);
}
