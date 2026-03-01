import type { NavigationPoint } from '../types';
import { getFloorPlan, type WaypointDef } from '../config/floorPlans';
import { useStore } from '../stores/useStore';

function getActiveWaypoints(): WaypointDef[] {
  const id = useStore.getState().floorPlanId;
  return getFloorPlan(id).waypoints;
}

function findNearestWaypoint(x: number, z: number): WaypointDef {
  const waypoints = getActiveWaypoints();
  let nearest = waypoints[0];
  let minDist = Number.POSITIVE_INFINITY;
  for (const wp of waypoints) {
    const distance = Math.hypot(wp.pos[0] - x, wp.pos[1] - z);
    if (distance < minDist) { minDist = distance; nearest = wp; }
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

export function getNavigationPath(from: [number, number, number], to: [number, number, number]): NavigationPoint[] {
  const waypoints = getActiveWaypoints();
  const start = findNearestWaypoint(from[0], from[2]);
  const end = findNearestWaypoint(to[0], to[2]);
  const route = bfsPath(start.id, end.id);
  const path: NavigationPoint[] = route
    .map((id) => waypoints.find((e) => e.id === id))
    .filter((e): e is WaypointDef => Boolean(e))
    .map((e) => ({ id: e.id, position: [e.pos[0], 0, e.pos[1]] as [number, number, number], pauseAtDoorway: e.pauseAtDoorway }));
  path.push({ id: 'destination', position: to });
  return path;
}
