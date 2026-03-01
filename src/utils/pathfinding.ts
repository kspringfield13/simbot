import type { NavigationPoint, FloorLevel } from '../types';
import { getFloorPlan, type WaypointDef } from '../config/floorPlans';
import { useStore } from '../stores/useStore';

function getActiveWaypoints(): WaypointDef[] {
  const id = useStore.getState().floorPlanId;
  return getFloorPlan(id).waypoints;
}

function findNearestWaypoint(x: number, z: number, floor?: FloorLevel): WaypointDef {
  const waypoints = getActiveWaypoints();
  let nearest = waypoints[0];
  let minDist = Number.POSITIVE_INFINITY;
  for (const wp of waypoints) {
    // Prefer waypoints on the same floor
    if (floor !== undefined && wp.floor !== undefined && wp.floor !== floor) continue;
    const distance = Math.hypot(wp.pos[0] - x, wp.pos[1] - z);
    if (distance < minDist) { minDist = distance; nearest = wp; }
  }
  // Fallback: if no waypoint found on same floor, find any nearest
  if (minDist === Number.POSITIVE_INFINITY) {
    for (const wp of waypoints) {
      const distance = Math.hypot(wp.pos[0] - x, wp.pos[1] - z);
      if (distance < minDist) { minDist = distance; nearest = wp; }
    }
  }
  return nearest;
}

function bfsPath(startId: string, endId: string): string[] {
  const waypoints = getActiveWaypoints();
  if (startId === endId) return [startId];
  const visited = new Set<string>([startId]);
  const queue: string[][] = [[startId]];
  while (queue.length > 0) {
    const path = queue.shift();
    if (!path) break;
    const current = path[path.length - 1];
    const wp = waypoints.find((e) => e.id === current);
    if (!wp) continue;
    for (const conn of wp.connections) {
      if (visited.has(conn)) continue;
      const next = [...path, conn];
      if (conn === endId) return next;
      visited.add(conn);
      queue.push(next);
    }
  }
  return [startId, endId];
}

/** Get the floor height Y offset for a given floor level */
function getFloorY(floor: FloorLevel | undefined): number {
  if (floor === undefined || floor === 0) return 0;
  return 5.6; // FLOOR_HEIGHT = 2.8 * S where S=2
}

export function getNavigationPath(from: [number, number, number], to: [number, number, number], fromFloor?: FloorLevel, toFloor?: FloorLevel): NavigationPoint[] {
  const waypoints = getActiveWaypoints();
  const start = findNearestWaypoint(from[0], from[2], fromFloor);
  const end = findNearestWaypoint(to[0], to[2], toFloor);
  const route = bfsPath(start.id, end.id);
  const path: NavigationPoint[] = route
    .map((id) => waypoints.find((e) => e.id === id))
    .filter((e): e is WaypointDef => Boolean(e))
    .map((e) => ({
      id: e.id,
      position: [e.pos[0], getFloorY(e.floor), e.pos[1]] as [number, number, number],
      pauseAtDoorway: e.pauseAtDoorway,
      floor: e.floor,
      isStairs: e.isStairs,
      isElevator: e.isElevator,
    }));
  path.push({ id: 'destination', position: to, floor: toFloor });
  return path;
}
