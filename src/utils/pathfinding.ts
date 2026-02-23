// Simple waypoint-based navigation that respects walls
// The home has a hallway connecting rooms - robot must route through it

interface Waypoint {
  id: string;
  pos: [number, number];
  connections: string[];
}

// Navigation graph - waypoints at doorways and room centers
const waypoints: Waypoint[] = [
  // Room centers
  { id: 'living-center', pos: [-3.5, -2], connections: ['living-door'] },
  { id: 'kitchen-center', pos: [4.2, -2.5], connections: ['kitchen-door'] },
  { id: 'bedroom-center', pos: [-3.5, 5], connections: ['bedroom-door'] },
  { id: 'bathroom-center', pos: [4, 5.5], connections: ['bathroom-door'] },

  // Doorway waypoints
  { id: 'living-door', pos: [-0.5, -1], connections: ['living-center', 'hall-north'] },
  { id: 'kitchen-door', pos: [1, -1], connections: ['kitchen-center', 'hall-north'] },
  { id: 'bedroom-door', pos: [-0.5, 3], connections: ['bedroom-center', 'hall-south'] },
  { id: 'bathroom-door', pos: [1.5, 4], connections: ['bathroom-center', 'hall-south'] },

  // Hallway nodes
  { id: 'hall-north', pos: [0.5, 0], connections: ['living-door', 'kitchen-door', 'hall-center'] },
  { id: 'hall-center', pos: [0.5, 1.5], connections: ['hall-north', 'hall-south'] },
  { id: 'hall-south', pos: [0.5, 3], connections: ['hall-center', 'bedroom-door', 'bathroom-door'] },

  // Specific furniture waypoints
  { id: 'kitchen-sink', pos: [5.5, -3.5], connections: ['kitchen-center'] },
  { id: 'kitchen-stove', pos: [4.5, -3.5], connections: ['kitchen-center'] },
  { id: 'kitchen-fridge', pos: [2.8, -3.5], connections: ['kitchen-center'] },
  { id: 'kitchen-island', pos: [4.2, -1.5], connections: ['kitchen-center'] },
  { id: 'living-couch', pos: [-4.5, -3], connections: ['living-center'] },
  { id: 'living-tv', pos: [-3.5, -0.5], connections: ['living-center'] },
  { id: 'bed-area', pos: [-4, 5.8], connections: ['bedroom-center'] },
  { id: 'desk-area', pos: [-1.5, 4], connections: ['bedroom-center'] },
  { id: 'dresser-area', pos: [-5.2, 4.2], connections: ['bedroom-center'] },
  { id: 'bathtub-area', pos: [5, 6], connections: ['bathroom-center'] },
  { id: 'vanity-area', pos: [4, 4.2], connections: ['bathroom-center'] },
];

const waypointMap = new Map(waypoints.map(w => [w.id, w]));

// BFS to find shortest path between two waypoints
function findPath(startId: string, endId: string): string[] {
  if (startId === endId) return [startId];

  const queue: string[][] = [[startId]];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    const node = waypointMap.get(current);
    if (!node) continue;

    for (const neighbor of node.connections) {
      if (neighbor === endId) {
        return [...path, neighbor];
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return [startId, endId]; // fallback
}

// Find closest waypoint to a position
function closestWaypoint(pos: [number, number]): string {
  let closest = waypoints[0].id;
  let minDist = Infinity;

  for (const wp of waypoints) {
    const dx = wp.pos[0] - pos[0];
    const dz = wp.pos[1] - pos[1];
    const dist = dx * dx + dz * dz;
    if (dist < minDist) {
      minDist = dist;
      closest = wp.id;
    }
  }
  return closest;
}

// Get room from position
function getRoomForPosition(pos: [number, number]): string {
  if (pos[0] < 0 && pos[1] < 1) return 'living';
  if (pos[0] > 1 && pos[1] < 1) return 'kitchen';
  if (pos[0] < 0 && pos[1] > 2.5) return 'bedroom';
  if (pos[0] > 1 && pos[1] > 3) return 'bathroom';
  return 'hall';
}

export function getNavigationPath(
  from: [number, number, number],
  to: [number, number, number]
): [number, number, number][] {
  const fromPos: [number, number] = [from[0], from[2]];
  const toPos: [number, number] = [to[0], to[2]];

  const fromRoom = getRoomForPosition(fromPos);
  const toRoom = getRoomForPosition(toPos);

  // If same room, go direct
  if (fromRoom === toRoom) {
    return [to];
  }

  const startWp = closestWaypoint(fromPos);
  const endWp = closestWaypoint(toPos);

  const pathIds = findPath(startWp, endWp);

  const path: [number, number, number][] = pathIds.map(id => {
    const wp = waypointMap.get(id)!;
    return [wp.pos[0], 0, wp.pos[1]];
  });

  // Add final destination
  path.push(to);

  return path;
}

export { waypoints, waypointMap };
