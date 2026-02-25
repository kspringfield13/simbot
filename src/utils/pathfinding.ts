import type { NavigationPoint } from '../types';

interface Waypoint {
  id: string;
  pos: [number, number];
  connections: string[];
  pauseAtDoorway?: boolean;
}

const waypoints: Waypoint[] = [
  { id: 'living-center', pos: [-4, -6], connections: ['living-south', 'living-tv', 'dining-area'] },
  { id: 'living-tv', pos: [-4, -8.5], connections: ['living-center'] },
  { id: 'living-south', pos: [-4, -3.5], connections: ['living-center', 'hall-entry'] },

  { id: 'dining-area', pos: [0, -5], connections: ['living-center', 'kitchen-island'] },

  { id: 'kitchen-island', pos: [4, -5], connections: ['dining-area', 'kitchen-counter', 'kitchen-south'] },
  { id: 'kitchen-counter', pos: [5, -8.5], connections: ['kitchen-island'] },
  { id: 'kitchen-south', pos: [4, -3], connections: ['kitchen-island', 'hall-east'] },

  { id: 'hall-entry', pos: [-2, -1], connections: ['living-south', 'hall-center'], pauseAtDoorway: true },
  { id: 'hall-center', pos: [0, -1], connections: ['hall-entry', 'hall-east', 'bedroom-door', 'bathroom-door'] },
  { id: 'hall-east', pos: [2, -1], connections: ['hall-center', 'kitchen-south', 'laundry-door'] },

  { id: 'laundry-door', pos: [3.5, -1], connections: ['hall-east', 'laundry-center'], pauseAtDoorway: true },
  { id: 'laundry-center', pos: [5, -1], connections: ['laundry-door'] },

  { id: 'bedroom-door', pos: [-1.2, 0.45], connections: ['hall-center', 'bedroom-center'], pauseAtDoorway: true },
  { id: 'bedroom-center', pos: [-4, 4], connections: ['bedroom-door', 'bedroom-bed', 'bedroom-desk'] },
  { id: 'bedroom-bed', pos: [-5, 6], connections: ['bedroom-center'] },
  { id: 'bedroom-desk', pos: [-1.5, 1.5], connections: ['bedroom-center', 'bedroom-door'] },

  { id: 'bathroom-door', pos: [2, 0.45], connections: ['hall-center', 'bathroom-center'], pauseAtDoorway: true },
  { id: 'bathroom-center', pos: [4, 4], connections: ['bathroom-door', 'bathroom-tub', 'bathroom-vanity'] },
  { id: 'bathroom-tub', pos: [6, 6], connections: ['bathroom-center'] },
  { id: 'bathroom-vanity', pos: [3, 1.5], connections: ['bathroom-center', 'bathroom-door'] },
];

function findNearestWaypoint(x: number, z: number): Waypoint {
  let nearest = waypoints[0];
  let minDist = Number.POSITIVE_INFINITY;

  for (const wp of waypoints) {
    const distance = Math.hypot(wp.pos[0] - x, wp.pos[1] - z);
    if (distance < minDist) {
      minDist = distance;
      nearest = wp;
    }
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
    const wp = waypoints.find((entry) => entry.id === current);
    if (!wp) continue;

    for (const connection of wp.connections) {
      if (visited.has(connection)) continue;

      const nextPath = [...path, connection];
      if (connection === endId) return nextPath;

      visited.add(connection);
      queue.push(nextPath);
    }
  }

  return [startId, endId];
}

export function getNavigationPath(
  from: [number, number, number],
  to: [number, number, number],
): NavigationPoint[] {
  const start = findNearestWaypoint(from[0], from[2]);
  const end = findNearestWaypoint(to[0], to[2]);
  const route = bfsPath(start.id, end.id);

  const path: NavigationPoint[] = route
    .map((id) => waypoints.find((entry) => entry.id === id))
    .filter((entry): entry is Waypoint => Boolean(entry))
    .map((entry) => ({
      id: entry.id,
      position: [entry.pos[0], 0, entry.pos[1]],
      pauseAtDoorway: entry.pauseAtDoorway,
    }));

  path.push({
    id: 'destination',
    position: to,
  });

  return path;
}
