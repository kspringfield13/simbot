import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { getRoomFromPoint } from '../../utils/homeLayout';
import { musicEngine, ROOM_GENRES } from '../../systems/MusicEngine';

/**
 * MusicSystem — lives inside <Canvas> so it can access the camera.
 * Tracks which room the active robot is in, sets the genre accordingly,
 * and fades volume based on camera distance to the robot.
 * Renders nothing.
 */
export function MusicSystem() {
  const { camera } = useThree();
  const lastRoomRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      musicEngine.disable();
    };
  }, []);

  useFrame(() => {
    const state = useStore.getState();

    if (!state.musicEnabled) return;

    const robot = state.robots[state.activeRobotId];
    const roomId = getRoomFromPoint(robot.position[0], robot.position[2]);

    // Update genre when room changes
    if (roomId && roomId !== lastRoomRef.current) {
      lastRoomRef.current = roomId;
      const roomGenre = ROOM_GENRES[roomId];
      if (roomGenre) {
        musicEngine.setGenre(roomGenre.genre);
        useStore.getState().setMusicGenreLabel(roomGenre.label);
      }
    }

    // Distance-based volume: louder when camera is closer to robot
    const rx = robot.position[0];
    const rz = robot.position[2];
    const cx = camera.position.x;
    const cy = camera.position.y;
    const cz = camera.position.z;

    const dist = Math.sqrt(
      (cx - rx) ** 2 + cy ** 2 + (cz - rz) ** 2,
    );

    // Volume curve: full at <=10 units, fades to 0.15 at 60+ units
    const minDist = 10;
    const maxDist = 60;
    const minVol = 0.15;
    const maxVol = 1.0;

    let vol: number;
    if (dist <= minDist) {
      vol = maxVol;
    } else if (dist >= maxDist) {
      vol = minVol;
    } else {
      const t = (dist - minDist) / (maxDist - minDist);
      vol = maxVol - t * (maxVol - minVol);
    }

    musicEngine.setDistanceVolume(vol);
  });

  return null;
}
