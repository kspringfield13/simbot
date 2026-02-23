// Waypoint-based navigation for modern open floor plan
// Layout: Living(-3.5,-2.5) | Kitchen(3.5,-2.5) | Hallway(0,1) | Bedroom(-3.5,4.5) | Bathroom(3.5,4.5)

interface Waypoint {
  id: string;
  pos: [number, number]; // [x, z]
  connections: string[];
}

const waypoints: Waypoint[] = [
  // Living room waypoints
  { id: 'living-center', pos: [-3.5, -2.5], connections: ['living-door', 'living-tv', 'living-couch'] },
  { id: 'living-couch', pos: [-5, -3], connections: ['living-center'] },
  { id: 'living-tv', pos: [-3.5, -0.5], connections: ['living-center', 'living-door'] },
  { id: 'living-door', pos: [-1.5, -0.5], connections: ['living-center', 'living-tv', 'hall-west', 'open-passage'] },

  // Open passage between living and kitchen (the open concept area, z=-2 to 0, x around 0)
  { id: 'open-passage', pos: [0, -1], connections: ['living-door', 'kitchen-door'] },

  // Kitchen waypoints
  { id: 'kitchen-center', pos: [3.5, -2.5], connections: ['kitchen-door', 'kitchen-counter', 'kitchen-island'] },
  { id: 'kitchen-counter', pos: [5, -4], connections: ['kitchen-center'] },
  { id: 'kitchen-island', pos: [3.5, -1.5], connections: ['kitchen-center', 'kitchen-door'] },
  { id: 'kitchen-door', pos: [1.5, -0.5], connections: ['kitchen-center', 'kitchen-island', 'hall-east', 'open-passage'] },

  // Hallway waypoints (z=0 to z=2, wide open area)
  { id: 'hall-west', pos: [-1, 1], connections: ['living-door', 'hall-center'] },
  { id: 'hall-center', pos: [0, 1], connections: ['hall-west', 'hall-east', 'bedroom-door', 'bathroom-door'] },
  { id: 'hall-east', pos: [1, 1], connections: ['kitchen-door', 'hall-center'] },

  // Bedroom waypoints
  { id: 'bedroom-door', pos: [-0.75, 2.5], connections: ['hall-center', 'bedroom-center'] },
  { id: 'bedroom-center', pos: [-3.5, 4.5], connections: ['bedroom-door', 'bedroom-bed', 'bedroom-desk'] },
  { id: 'bedroom-bed', pos: [-5, 5.5], connections: ['bedroom-center'] },
  { id: 'bedroom-desk', pos: [-1.5, 3.5], connections: ['bedroom-center', 'bedroom-door'] },

  // Bathroom waypoints
  { id: 'bathroom-door', pos: [0.75, 2.5], connections: ['hall-center', 'bathroom-center'] },
  { id: 'bathroom-center', pos: [3.5, 4.5], connections: ['bathroom-door', 'bathroom-tub', 'bathroom-sink'] },
  { id: 'bathroom-tub', pos: [5.5, 5.5], connections: ['bathroom-center'] },
  { id: 'bathroom-sink', pos: [3, 3.5], connections: ['bathroom-center', 'bathroom-door'] },
];

// Room detection
function detectRoom(x: number, z: number): string {
  if (z < 0 && x < 0) return 'living-room';
  if (z < 0 && x >= 0) return 'kitchen';
  if (z >= 0 && z <= 2) return 'hallway';
  if (z > 2 && x < 0) return 'bedroom';
  if (z > 2 && x >= 0) return 'bathroom';
  return 'hallway';
}

function findNearestWaypoint(x: number, z: number): string {
  const room = detectRoom(x, z);
  const roomWaypoints = waypoints.filter((w) => w.id.startsWith(room.split('-')[0]) || w.id.startsWith('hall') || w.id.startsWith('open'));

  let nearest = waypoints[0].id;
  let minDist = Infinity;
  for (const wp of (roomWaypoints.length > 0 ? roomWaypoints : waypoints)) {
    const d = Math.hypot(wp.pos[0] - x, wp.pos[1] - z);
    if (d < minDist) {
      minDist = d;
      nearest = wp.id;
    }
  }
  return nearest;
}

// BFS pathfinding
function bfsPath(startId: string, endId: string): string[] {
  if (startId === endId) return [startId];
  const visited = new Set<string>();
  const queue: string[][] = [[startId]];
  visited.add(startId);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    const wp = waypoints.find((w) => w.id === current);
    if (!wp) continue;

    for (const neighbor of wp.connections) {
      if (visited.has(neighbor)) continue;
      const newPath = [...path, neighbor];
      if (neighbor === endId) return newPath;
      visited.add(neighbor);
      queue.push(newPath);
    }
  }
  return [startId, endId]; // fallback
}

export function getNavigationPath(
  from: [number, number, number],
  to: [number, number, number]
): [number, number, number][] {
  const startWp = findNearestWaypoint(from[0], from[2]);
  const endWp = findNearestWaypoint(to[0], to[2]);

  const wpPath = bfsPath(startWp, endWp);

  const path: [number, number, number][] = [];
  for (const wpId of wpPath) {
    const wp = waypoints.find((w) => w.id === wpId);
    if (wp) path.push([wp.pos[0], 0, wp.pos[1]]);
  }

  // Add final destination
  path.push(to);

  return path;
}
