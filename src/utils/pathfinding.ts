import type { NavigationPoint } from '../types';

const S = 2;

interface Waypoint {
  id: string;
  pos: [number, number];
  connections: string[];
  pauseAtDoorway?: boolean;
}

const waypoints: Waypoint[] = [
  // Living room — center of open floor
  { id: 'living-center', pos: [-3.5 * S, -6 * S], connections: ['living-south', 'dining-area'] },
  { id: 'living-south', pos: [-3.5 * S, -3.5 * S], connections: ['living-center', 'hall-entry'] },

  // Transition between living + kitchen
  { id: 'dining-area', pos: [0, -6 * S], connections: ['living-center', 'kitchen-center'] },

  // Kitchen — wide open center, far from back wall appliances
  { id: 'kitchen-center', pos: [3.5 * S, -6 * S], connections: ['dining-area', 'kitchen-south'] },
  { id: 'kitchen-south', pos: [3.5 * S, -3.5 * S], connections: ['kitchen-center', 'hall-east'] },

  // Hallway
  { id: 'hall-entry', pos: [-2 * S, -1 * S], connections: ['living-south', 'hall-center'], pauseAtDoorway: true },
  { id: 'hall-center', pos: [0, -1 * S], connections: ['hall-entry', 'hall-east', 'bedroom-door', 'bathroom-door'] },
  { id: 'hall-east', pos: [2 * S, -1 * S], connections: ['hall-center', 'kitchen-south', 'laundry-door'] },

  // Laundry
  { id: 'laundry-door', pos: [3.5 * S, -1 * S], connections: ['hall-east', 'laundry-center'], pauseAtDoorway: true },
  { id: 'laundry-center', pos: [5 * S, -1 * S], connections: ['laundry-door'] },

  // Bedroom — open center
  { id: 'bedroom-door', pos: [-1.2 * S, 0.5 * S], connections: ['hall-center', 'bedroom-center'], pauseAtDoorway: true },
  { id: 'bedroom-center', pos: [-4 * S, 4 * S], connections: ['bedroom-door'] },

  // Bathroom — open center
  { id: 'bathroom-door', pos: [2 * S, 0.5 * S], connections: ['hall-center', 'bathroom-center'], pauseAtDoorway: true },
  { id: 'bathroom-center', pos: [4 * S, 4 * S], connections: ['bathroom-door'] },
];

function findNearestWaypoint(x: number, z: number): Waypoint {
  let nearest = waypoints[0];
  let minDist = Number.POSITIVE_INFINITY;
  for (const wp of waypoints) {
    const distance = Math.hypot(wp.pos[0] - x, wp.pos[1] - z);
    if (distance < minDist) { minDist = distance; nearest = wp; }
  }
  return nearest;
}

function bfsPath(startId: string, endId: string): string[] {
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
  const start = findNearestWaypoint(from[0], from[2]);
  const end = findNearestWaypoint(to[0], to[2]);
  const route = bfsPath(start.id, end.id);
  const path: NavigationPoint[] = route
    .map((id) => waypoints.find((e) => e.id === id))
    .filter((e): e is Waypoint => Boolean(e))
    .map((e) => ({ id: e.id, position: [e.pos[0], 0, e.pos[1]], pauseAtDoorway: e.pauseAtDoorway }));
  path.push({ id: 'destination', position: to });
  return path;
}
