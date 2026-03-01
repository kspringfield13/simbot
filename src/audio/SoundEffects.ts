import type { TaskType } from '../types';

/**
 * Procedural Web Audio sound effects for robot actions.
 * All sounds generated via oscillators/noise — no external files.
 */

// ─── Floor type system ───

export type FloorType = 'tile' | 'carpet' | 'wood' | 'grass' | 'linoleum';

/** Maps room IDs to their floor surface material */
export const ROOM_FLOOR_TYPES: Record<string, FloorType> = {
  kitchen: 'tile',
  bathroom: 'tile',
  'living-room': 'carpet',
  bedroom: 'carpet',
  hallway: 'wood',
  laundry: 'linoleum',
  yard: 'grass',
  // Floor plan variants
  'living-area': 'carpet',
  kitchenette: 'tile',
  'main-room': 'carpet',
  'kitchen-area': 'tile',
  'open-loft': 'wood',
  study: 'wood',
  library: 'wood',
  'dining-room': 'wood',
  gym: 'linoleum',
};

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let _muted = false;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function getMaster(): GainNode {
  getCtx();
  return masterGain!;
}

export function setMuted(muted: boolean) {
  _muted = muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : 1;
}

export function isMuted(): boolean {
  return _muted;
}

/** Create a short buffer of white noise */
function noiseBuffer(duration: number): AudioBuffer {
  const ac = getCtx();
  const len = Math.floor(ac.sampleRate * duration);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// ─── Individual sound generators ───

/** Tile footstep — sharp crisp tap (kitchen/bathroom) */
function playFootstepTile() {
  const ac = getCtx();
  const now = ac.currentTime;

  // Short click with high-frequency resonance
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2200 + Math.random() * 600, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  // Add a tiny noise click for texture
  const buf = noiseBuffer(0.025);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 3000 + Math.random() * 1000;
  const nGain = ac.createGain();
  nGain.gain.setValueAtTime(0.08, now);
  nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(gain).connect(getMaster());
  src.connect(hp).connect(nGain).connect(getMaster());
  osc.start(now);
  osc.stop(now + 0.06);
  src.start(now);
  src.stop(now + 0.03);
}

/** Carpet footstep — soft muffled thud (bedroom/living room) */
function playFootstepCarpet() {
  const ac = getCtx();
  const now = ac.currentTime;

  // Low-frequency thud, heavily dampened
  const buf = noiseBuffer(0.08);
  const src = ac.createBufferSource();
  src.buffer = buf;

  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 300 + Math.random() * 100;
  lp.Q.value = 0.5;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

  src.connect(lp).connect(gain).connect(getMaster());
  src.start(now);
  src.stop(now + 0.08);
}

/** Wood footstep — hollow resonant knock (hallway) */
function playFootstepWood() {
  const ac = getCtx();
  const now = ac.currentTime;

  // Hollow body resonance
  const osc = ac.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(400 + Math.random() * 100, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 600 + Math.random() * 200;
  bp.Q.value = 3;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.13, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  // Noise transient for the "knock" attack
  const buf = noiseBuffer(0.03);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const nBp = ac.createBiquadFilter();
  nBp.type = 'bandpass';
  nBp.frequency.value = 1200 + Math.random() * 400;
  nBp.Q.value = 1;
  const nGain = ac.createGain();
  nGain.gain.setValueAtTime(0.07, now);
  nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(bp).connect(gain).connect(getMaster());
  src.connect(nBp).connect(nGain).connect(getMaster());
  osc.start(now);
  osc.stop(now + 0.12);
  src.start(now);
  src.stop(now + 0.04);
}

/** Grass footstep — soft rustle (yard) */
function playFootstepGrass() {
  const ac = getCtx();
  const now = ac.currentTime;

  const buf = noiseBuffer(0.1);
  const src = ac.createBufferSource();
  src.buffer = buf;

  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800 + Math.random() * 600;
  bp.Q.value = 0.8;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.06, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  src.connect(bp).connect(gain).connect(getMaster());
  src.start(now);
  src.stop(now + 0.1);
}

/** Linoleum footstep — medium flat tap (laundry) */
function playFootstepLinoleum() {
  const ac = getCtx();
  const now = ac.currentTime;

  const buf = noiseBuffer(0.05);
  const src = ac.createBufferSource();
  src.buffer = buf;

  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1000 + Math.random() * 300;
  bp.Q.value = 1.2;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

  src.connect(bp).connect(gain).connect(getMaster());
  src.start(now);
  src.stop(now + 0.05);
}

/** Dispatch footstep sound based on floor type */
function playFootstep(floorType: FloorType = 'wood') {
  switch (floorType) {
    case 'tile': playFootstepTile(); break;
    case 'carpet': playFootstepCarpet(); break;
    case 'wood': playFootstepWood(); break;
    case 'grass': playFootstepGrass(); break;
    case 'linoleum': playFootstepLinoleum(); break;
  }
}

/** Get the floor type for a given room ID */
export function getFloorTypeForRoom(roomId: string | null): FloorType {
  if (!roomId) return 'wood';
  return ROOM_FLOOR_TYPES[roomId] ?? 'wood';
}

/** Vacuum whir — low oscillator + filtered noise loop burst */
function playVacuumBurst() {
  const ac = getCtx();
  const now = ac.currentTime;
  const dur = 0.3;

  // Low drone
  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 80 + Math.random() * 20;

  const oscGain = ac.createGain();
  oscGain.gain.setValueAtTime(0.06, now);
  oscGain.gain.linearRampToValueAtTime(0.04, now + dur);
  oscGain.gain.linearRampToValueAtTime(0, now + dur + 0.05);

  osc.connect(oscGain).connect(getMaster());
  osc.start(now);
  osc.stop(now + dur + 0.05);

  // Noise layer
  const buf = noiseBuffer(dur);
  const src = ac.createBufferSource();
  src.buffer = buf;

  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 600;

  const nGain = ac.createGain();
  nGain.gain.setValueAtTime(0.04, now);
  nGain.gain.linearRampToValueAtTime(0.03, now + dur);
  nGain.gain.linearRampToValueAtTime(0, now + dur + 0.05);

  src.connect(lp).connect(nGain).connect(getMaster());
  src.start(now);
  src.stop(now + dur + 0.05);
}

/** Spray bottle hiss — high-pass filtered noise burst */
function playSprayHiss() {
  const ac = getCtx();
  const now = ac.currentTime;
  const dur = 0.25;

  const buf = noiseBuffer(dur);
  const src = ac.createBufferSource();
  src.buffer = buf;

  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 4000;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.09, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  src.connect(hp).connect(gain).connect(getMaster());
  src.start(now);
  src.stop(now + dur);
}

/** Dish clanking — short metallic ring */
function playDishClank() {
  const ac = getCtx();
  const now = ac.currentTime;

  const freq = 1200 + Math.random() * 800;
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.12);

  // Second partial for metallic character
  const osc2 = ac.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = freq * 2.76; // inharmonic partial

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  const gain2 = ac.createGain();
  gain2.gain.setValueAtTime(0.03, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.connect(gain).connect(getMaster());
  osc2.connect(gain2).connect(getMaster());
  osc.start(now);
  osc.stop(now + 0.15);
  osc2.start(now);
  osc2.stop(now + 0.1);
}

/** Sweep swoosh — band-passed noise with frequency sweep */
function playSweepSwoosh() {
  const ac = getCtx();
  const now = ac.currentTime;
  const dur = 0.35;

  const buf = noiseBuffer(dur);
  const src = ac.createBufferSource();
  src.buffer = buf;

  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(400, now);
  bp.frequency.linearRampToValueAtTime(1200, now + dur * 0.5);
  bp.frequency.linearRampToValueAtTime(300, now + dur);
  bp.Q.value = 2;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.08, now + dur * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  src.connect(bp).connect(gain).connect(getMaster());
  src.start(now);
  src.stop(now + dur);
}

/** Doorbell ding-dong — two-tone sine bell */
export function playDoorbell() {
  const ac = getCtx();
  const now = ac.currentTime;

  // Ding (higher note — C5)
  const ding = ac.createOscillator();
  ding.type = 'sine';
  ding.frequency.value = 523;
  const dingGain = ac.createGain();
  dingGain.gain.setValueAtTime(0.2, now);
  dingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
  ding.connect(dingGain).connect(getMaster());
  ding.start(now);
  ding.stop(now + 0.45);

  // Dong (lower note — G4, delayed)
  const dong = ac.createOscillator();
  dong.type = 'sine';
  dong.frequency.value = 392;
  const dongGain = ac.createGain();
  dongGain.gain.setValueAtTime(0.001, now + 0.3);
  dongGain.gain.linearRampToValueAtTime(0.2, now + 0.32);
  dongGain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
  dong.connect(dongGain).connect(getMaster());
  dong.start(now + 0.3);
  dong.stop(now + 0.85);
}

// ─── Task-to-sound mapping ───

type SoundFn = () => void;

const taskSounds: Partial<Record<TaskType, SoundFn>> = {
  vacuuming: playVacuumBurst,
  cleaning: playSprayHiss,
  scrubbing: playSprayHiss,
  dishes: playDishClank,
  sweeping: playSweepSwoosh,
  cooking: playDishClank,
  laundry: playSweepSwoosh,
  'bed-making': playSweepSwoosh,
  organizing: playDishClank,
};

// ─── Sound loop controller ───

let walkIntervalId: number | null = null;
let workIntervalId: number | null = null;
let _currentFloorType: FloorType = 'wood';

/** Start footstep sounds at a rate matching walk speed, capped at 3x */
export function startWalkSound(simSpeed: number, floorType: FloorType = 'wood') {
  stopWalkSound();
  _currentFloorType = floorType;
  const rate = Math.min(simSpeed, 3);
  // Carpet footsteps are slightly slower cadence (softer surface)
  const baseMs = floorType === 'carpet' ? 380 : floorType === 'grass' ? 400 : 350;
  const intervalMs = Math.max(baseMs / rate, 120);
  walkIntervalId = window.setInterval(() => playFootstep(_currentFloorType), intervalMs);
  playFootstep(_currentFloorType); // immediate first step
}

/** Update floor type for currently playing walk sounds without restarting */
export function updateWalkFloorType(floorType: FloorType) {
  _currentFloorType = floorType;
}

export function stopWalkSound() {
  if (walkIntervalId !== null) {
    clearInterval(walkIntervalId);
    walkIntervalId = null;
  }
}

/** Start task-specific work sound loop, capped at 3x rate */
export function startWorkSound(taskType: TaskType, simSpeed: number) {
  stopWorkSound();
  const fn = taskSounds[taskType];
  if (!fn) return;
  const rate = Math.min(simSpeed, 3);
  // Different base intervals per sound type
  let baseMs = 500;
  if (taskType === 'vacuuming') baseMs = 400;
  else if (taskType === 'dishes' || taskType === 'cooking') baseMs = 600;
  else if (taskType === 'sweeping' || taskType === 'laundry' || taskType === 'bed-making') baseMs = 500;
  else if (taskType === 'cleaning' || taskType === 'scrubbing') baseMs = 700;

  const intervalMs = Math.max(baseMs / rate, 150);
  workIntervalId = window.setInterval(fn, intervalMs);
  fn(); // immediate first sound
}

export function stopWorkSound() {
  if (workIntervalId !== null) {
    clearInterval(workIntervalId);
    workIntervalId = null;
  }
}

export function stopAllSounds() {
  stopWalkSound();
  stopWorkSound();
}
