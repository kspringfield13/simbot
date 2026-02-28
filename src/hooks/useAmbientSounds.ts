import { useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';
import { rooms } from '../utils/homeLayout';
import type { RoomId } from '../types';

/**
 * Procedural ambient sounds per room using Web Audio API.
 * No external audio files needed — generates filtered noise and tones.
 */

type RoomSoundConfig = {
  type: 'filtered-noise' | 'tone-cluster';
  filterFreq: number;    // Hz — bandpass center for noise
  filterQ: number;       // resonance
  volume: number;        // 0-1
  // For tone-cluster: base frequencies for subtle hums
  tones?: number[];
};

const roomSounds: Partial<Record<RoomId, RoomSoundConfig>> = {
  kitchen: {
    type: 'filtered-noise',
    filterFreq: 200,      // low rumble — fridge/appliances hum
    filterQ: 2,
    volume: 0.04,
    tones: [120, 180],    // electrical hum harmonics
  },
  bathroom: {
    type: 'filtered-noise',
    filterFreq: 3000,     // higher — water/echo ambiance
    filterQ: 1,
    volume: 0.025,
    tones: [280],         // subtle drip resonance
  },
  laundry: {
    type: 'filtered-noise',
    filterFreq: 150,      // deep washer rumble
    filterQ: 3,
    volume: 0.03,
    tones: [60, 120],     // motor hum
  },
  'living-room': {
    type: 'tone-cluster',
    filterFreq: 400,
    filterQ: 0.5,
    volume: 0.015,
    tones: [100],         // very subtle HVAC
  },
};

function findCurrentRoom(pos: [number, number, number]): RoomId | null {
  for (const room of rooms) {
    const [rx, rz] = room.position;
    const [w, h] = room.size;
    const halfW = w / 2;
    const halfH = h / 2;
    if (
      pos[0] >= rx - halfW && pos[0] <= rx + halfW &&
      pos[2] >= rz - halfH && pos[2] <= rz + halfH
    ) {
      return room.id;
    }
  }
  return null;
}

export function useAmbientSounds() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeNodesRef = useRef<{ gain: GainNode; sources: (AudioBufferSourceNode | OscillatorNode)[] } | null>(null);
  const currentRoomRef = useRef<RoomId | null>(null);
  const enabledRef = useRef(false);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
        enabledRef.current = true;
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    window.addEventListener('click', handleInteraction, { once: false });
    window.addEventListener('touchstart', handleInteraction, { once: false });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      if (activeNodesRef.current) {
        activeNodesRef.current.sources.forEach((s) => { try { s.stop(); } catch {} });
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Track robot position and switch sounds
  useEffect(() => {
    const unsubscribe = useStore.subscribe((state) => {
      if (!enabledRef.current || !audioCtxRef.current) return;
      if (state.simSpeed === 0) return;

      const room = findCurrentRoom(state.robots[state.activeRobotId].position);
      if (room === currentRoomRef.current) return;
      currentRoomRef.current = room;

      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      // Fade out current sounds
      if (activeNodesRef.current) {
        const old = activeNodesRef.current;
        old.gain.gain.linearRampToValueAtTime(0, now + 1.5);
        setTimeout(() => {
          old.sources.forEach((s) => { try { s.stop(); } catch {} });
          old.gain.disconnect();
        }, 2000);
        activeNodesRef.current = null;
      }

      if (!room) return;
      const config = roomSounds[room];
      if (!config) return;

      // Create new sound
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(config.volume, now + 2); // fade in
      masterGain.connect(ctx.destination);

      const sources: (AudioBufferSourceNode | OscillatorNode)[] = [];

      // Filtered noise layer
      if (config.type === 'filtered-noise' || config.type === 'tone-cluster') {
        const bufferSize = ctx.sampleRate * 4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.5;
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = config.filterFreq;
        filter.Q.value = config.filterQ;

        noiseSource.connect(filter);
        filter.connect(masterGain);
        noiseSource.start();
        sources.push(noiseSource);
      }

      // Tone layers (subtle hums)
      if (config.tones) {
        for (const freq of config.tones) {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;

          const toneGain = ctx.createGain();
          toneGain.gain.value = 0.15; // subtle relative to noise
          osc.connect(toneGain);
          toneGain.connect(masterGain);
          osc.start();
          sources.push(osc);
        }
      }

      activeNodesRef.current = { gain: masterGain, sources };
    });

    return unsubscribe;
  }, []);
}
