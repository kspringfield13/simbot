import { getFloorPlan } from '../config/floorPlans';
import { useStore } from '../stores/useStore';

/** Charging station is placed in the hallway */
export const CHARGING_STATION_POSITION: [number, number, number] = [-6, 0, -2];

/** Get the charging station position for the active floor plan. */
export function getActiveChargingPosition(): [number, number, number] {
  const id = useStore.getState().floorPlanId;
  return getFloorPlan(id).chargingStation;
}

/** Distance within which a robot can charge */
export const CHARGING_RANGE = 2.0;

/** Battery level below which robots auto-navigate to charger */
export const LOW_BATTERY_THRESHOLD = 15;

/** Battery level at which charging is complete */
export const FULL_CHARGE_THRESHOLD = 95;
