import { useStore } from '../stores/useStore';
import { getActiveFurniture } from '../utils/furnitureRegistry';

export interface Obstacle { x: number; z: number; r: number; }

/** Build obstacles from current furniture positions (reads store). */
export function getObstacles(): Obstacle[] {
  const positions = useStore.getState().furniturePositions;
  return getActiveFurniture().map((piece) => {
    const override = positions[piece.id];
    return {
      x: override ? override[0] : piece.defaultPosition[0],
      z: override ? override[1] : piece.defaultPosition[2],
      r: piece.obstacleRadius,
    };
  });
}

export function isPositionClear(x: number, z: number, margin: number = 0.5): boolean {
  const obstacles = getObstacles();
  for (const obs of obstacles) {
    const dx = x - obs.x;
    const dz = z - obs.z;
    if (Math.sqrt(dx * dx + dz * dz) < obs.r + margin) return false;
  }
  return true;
}

export function findClearPosition(x: number, z: number, margin: number = 0.8): [number, number] {
  if (isPositionClear(x, z, margin)) return [x, z];
  for (let r = 0.5; r <= 8; r += 0.4) {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
      const nx = x + Math.cos(a) * r;
      const nz = z + Math.sin(a) * r;
      if (isPositionClear(nx, nz, margin)) return [nx, nz];
    }
  }
  return [x, z];
}

export function getAvoidanceForce(
  posX: number, posZ: number, dirX: number, dirZ: number, lookAhead: number = 2.0,
): [number, number] {
  const obstacles = getObstacles();
  let forceX = 0;
  let forceZ = 0;
  const robotR = 0.6;
  for (const obs of obstacles) {
    const dx = posX - obs.x;
    const dz = posZ - obs.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = obs.r + robotR;
    if (dist < minDist + lookAhead) {
      const dot = dirX * (obs.x - posX) + dirZ * (obs.z - posZ);
      if (dot > 0 || dist < minDist) {
        const strength = dist < minDist ? 3.5 : 1.5 / Math.max(dist - minDist, 0.1);
        const nx = dx / Math.max(dist, 0.01);
        const nz = dz / Math.max(dist, 0.01);
        forceX += nx * strength;
        forceZ += nz * strength;
      }
    }
  }
  const mag = Math.sqrt(forceX * forceX + forceZ * forceZ);
  if (mag > 3.5) { forceX = (forceX / mag) * 3.5; forceZ = (forceZ / mag) * 3.5; }
  return [forceX, forceZ];
}
