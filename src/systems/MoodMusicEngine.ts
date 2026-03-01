// ── Mood Music Engine ────────────────────────────────────────────
// Ambient music layer that shifts based on collective robot mood.
// Uses Web Audio API procedural synthesis — no external audio files.
// Coexists with the room-based MusicEngine as a separate layer.

import type { RobotMood } from '../types';

type LayerCleanup = () => void;

/** Mood categories that map robot emotions to music styles */
export type MoodCategory = 'happy' | 'focused' | 'tired' | 'curious' | 'bored';

/** Map RobotMood → MoodCategory */
export function getMoodCategory(mood: RobotMood): MoodCategory {
  switch (mood) {
    case 'happy':
    case 'content':
      return 'happy';
    case 'focused':
    case 'routine':
      return 'focused';
    case 'tired':
    case 'lonely':
      return 'tired';
    case 'curious':
      return 'curious';
    case 'bored':
      return 'bored';
  }
}

export const MOOD_LABELS: Record<MoodCategory, string> = {
  happy: 'Upbeat Lo-fi',
  focused: 'Soft Ambient',
  tired: 'Gentle Piano',
  curious: 'Playful Explorer',
  bored: 'Sparse Drift',
};

// ── Note frequencies ────────────────────────────────────────────
const N: Record<string, number> = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, Fs5: 739.99, G5: 783.99, A5: 880.00,
};

class MoodMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeCleanup: LayerCleanup | null = null;
  private currentMood: MoodCategory | null = null;
  private _enabled = false;
  private fadeOutTimers: number[] = [];
  private crossfadeSec = 3.0;
  private _volume = 0.18; // Lower than room music — this is ambient

  get enabled() { return this._enabled; }
  get volume() { return this._volume; }

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = this._volume;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  enable() {
    this._enabled = true;
    this.ensureContext();
    if (this.currentMood) {
      this.playMood(this.currentMood);
    }
  }

  disable() {
    this._enabled = false;
    this.stopAll();
  }

  toggle(): boolean {
    if (this._enabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this._enabled;
  }

  setVolume(vol: number) {
    this._volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(
        this._volume,
        this.ctx.currentTime + 0.1,
      );
    }
  }

  setMood(mood: MoodCategory) {
    if (mood === this.currentMood) return;
    this.currentMood = mood;
    if (this._enabled) {
      this.playMood(mood);
    }
  }

  destroy() {
    this.stopAll();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }

  // ── Internal ────────────────────────────────────────────────────

  private stopAll() {
    for (const t of this.fadeOutTimers) clearTimeout(t);
    this.fadeOutTimers = [];
    if (this.activeCleanup) {
      this.activeCleanup();
      this.activeCleanup = null;
    }
  }

  private playMood(mood: MoodCategory) {
    if (!this.ctx || !this.masterGain) return;

    const oldCleanup = this.activeCleanup;
    this.activeCleanup = null;
    if (oldCleanup) oldCleanup();

    switch (mood) {
      case 'happy':
        this.activeCleanup = this.createHappy();
        break;
      case 'focused':
        this.activeCleanup = this.createFocused();
        break;
      case 'tired':
        this.activeCleanup = this.createTired();
        break;
      case 'curious':
        this.activeCleanup = this.createCurious();
        break;
      case 'bored':
        this.activeCleanup = this.createBored();
        break;
    }
  }

  // ── Utility helpers ─────────────────────────────────────────────

  private createFilteredOsc(
    freq: number,
    type: OscillatorType,
    filterFreq: number,
    filterQ: number,
    gain: number,
  ): { osc: OscillatorNode; gainNode: GainNode; filter: BiquadFilterNode } {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;

    const gainNode = ctx.createGain();
    gainNode.gain.value = gain;

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain!);

    return { osc, gainNode, filter };
  }

  private playNote(
    freq: number,
    type: OscillatorType,
    startTime: number,
    duration: number,
    volume: number,
    filterFreq = 2000,
  ) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.04);
    gain.gain.setValueAtTime(volume, startTime + duration - 0.08);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  private createNoise(volume: number, filterFreq: number): { source: AudioBufferSourceNode; gainNode: GainNode } {
    const ctx = this.ctx!;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.5;

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain!);

    return { source, gainNode };
  }

  // ═══════════════════════════════════════════════════════════════
  // MOOD: Happy / Content — Upbeat lo-fi, faster tempo, warm chords
  // ═══════════════════════════════════════════════════════════════
  private createHappy(): LayerCleanup {
    const ctx = this.ctx!;
    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    let alive = true;

    const tempo = 110;
    const beatMs = (60 / tempo) * 1000;

    // Bright major chords: C → G → Am → F
    const chords = [
      [N.C4, N.E4, N.G4],
      [N.G3, N.B3, N.D4],
      [N.A3, N.C4, N.E4],
      [N.F3, N.A3, N.C4],
    ];

    // Warm pad
    const pad = this.createFilteredOsc(N.C4, 'triangle', 800, 1, 0);
    pad.osc.start();
    oscs.push(pad.osc);
    gains.push(pad.gainNode);

    const pad2 = this.createFilteredOsc(N.E4, 'triangle', 700, 1, 0);
    pad2.osc.start();
    oscs.push(pad2.osc);
    gains.push(pad2.gainNode);

    // Fade in
    const now = ctx.currentTime;
    pad.gainNode.gain.linearRampToValueAtTime(0.06, now + 2);
    pad2.gainNode.gain.linearRampToValueAtTime(0.04, now + 2);

    // Vinyl texture
    const noise = this.createNoise(0.008, 600);
    noise.source.start();

    // Melody: pentatonic happy phrases
    const melody = [N.C5, N.E5, N.G5, N.E5, N.D5, N.C5, N.G4, N.A4];
    const bass = [N.C2, N.C2, N.G2, N.G2, N.A2, N.A2, N.F2, N.F2];

    let step = 0;
    const stepInterval = setInterval(() => {
      if (!alive) return;
      const t = ctx.currentTime;

      // Melody note
      this.playNote(melody[step % melody.length], 'triangle', t, beatMs / 1100, 0.05, 1400);

      // Bass on every other step
      if (step % 2 === 0) {
        this.playNote(bass[step % bass.length], 'sine', t, beatMs * 1.8 / 1000, 0.09, 280);
      }

      // Chord changes every 4 steps
      if (step % 4 === 0) {
        const chord = chords[(step / 4) % chords.length];
        pad.osc.frequency.linearRampToValueAtTime(chord[0], t + 0.4);
        pad2.osc.frequency.linearRampToValueAtTime(chord[1], t + 0.4);
      }

      step++;
    }, beatMs);

    return () => {
      alive = false;
      clearInterval(stepInterval);
      const t = ctx.currentTime;
      const fade = this.crossfadeSec;
      for (const g of gains) g.gain.linearRampToValueAtTime(0, t + fade);
      noise.gainNode.gain.linearRampToValueAtTime(0, t + fade);
      const timer = window.setTimeout(() => {
        for (const o of oscs) { try { o.stop(); } catch { /* ok */ } }
        try { noise.source.stop(); } catch { /* ok */ }
      }, (fade + 0.2) * 1000);
      this.fadeOutTimers.push(timer);
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // MOOD: Focused — Minimal ambient, soft synth pads, no rhythm
  // ═══════════════════════════════════════════════════════════════
  private createFocused(): LayerCleanup {
    const ctx = this.ctx!;
    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    // Two slow-evolving sine pads with gentle beating
    const drone1 = this.createFilteredOsc(N.C3, 'sine', 350, 0.5, 0);
    const drone2 = this.createFilteredOsc(N.G3, 'sine', 400, 0.5, 0);
    const drone3 = this.createFilteredOsc(N.E3 * 1.001, 'sine', 320, 0.5, 0);

    [drone1, drone2, drone3].forEach(d => {
      d.osc.start();
      oscs.push(d.osc);
      gains.push(d.gainNode);
    });

    // Very slow volume LFO — breathing effect
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(drone1.gainNode.gain);
    lfo.start();
    oscs.push(lfo);

    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 0.04;
    const lfoGain2 = ctx.createGain();
    lfoGain2.gain.value = 0.025;
    lfo2.connect(lfoGain2);
    lfoGain2.connect(drone2.gainNode.gain);
    lfo2.start();
    oscs.push(lfo2);

    // Filter sweep on drone3
    const filterLfo = ctx.createOscillator();
    filterLfo.type = 'sine';
    filterLfo.frequency.value = 0.025;
    const filterLfoGain = ctx.createGain();
    filterLfoGain.gain.value = 150;
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(drone3.filter.frequency);
    filterLfo.start();
    oscs.push(filterLfo);

    // Fade in slowly
    const now = ctx.currentTime;
    drone1.gainNode.gain.linearRampToValueAtTime(0.07, now + 3);
    drone2.gainNode.gain.linearRampToValueAtTime(0.05, now + 4);
    drone3.gainNode.gain.linearRampToValueAtTime(0.04, now + 3.5);

    return () => {
      const t = ctx.currentTime;
      const fade = this.crossfadeSec;
      for (const g of gains) g.gain.linearRampToValueAtTime(0, t + fade);
      const timer = window.setTimeout(() => {
        for (const o of oscs) { try { o.stop(); } catch { /* ok */ } }
      }, (fade + 0.2) * 1000);
      this.fadeOutTimers.push(timer);
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // MOOD: Tired — Slow, gentle piano-like tones, sparse
  // ═══════════════════════════════════════════════════════════════
  private createTired(): LayerCleanup {
    const ctx = this.ctx!;
    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    let alive = true;

    // Very soft sustained pad
    const pad = this.createFilteredOsc(N.C3, 'sine', 250, 0.5, 0);
    pad.osc.start();
    oscs.push(pad.osc);
    gains.push(pad.gainNode);

    const now = ctx.currentTime;
    pad.gainNode.gain.linearRampToValueAtTime(0.05, now + 3);

    // Sparse piano-like notes — slow tempo, lots of space
    const notes = [N.C4, N.E4, N.G4, N.C5, N.G4, N.E4, N.D4, N.B3];
    const padRoots = [N.C3, N.C3, N.E3, N.E3, N.A2, N.A2, N.G2, N.G2];
    let noteIdx = 0;

    // Play a "piano" note with triangle + quick decay
    const playPianoNote = (freq: number, time: number, vol: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      // Add slight detuned harmonic for richness
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 2.001;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, time);
      filter.frequency.linearRampToValueAtTime(300, time + 2.5);
      filter.Q.value = 0.8;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 3);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0, time);
      gain2.gain.linearRampToValueAtTime(vol * 0.3, time + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, time + 2);

      osc.connect(filter);
      osc2.connect(gain2);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      gain2.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + 3.5);
      osc2.start(time);
      osc2.stop(time + 2.5);
    };

    // Slow note interval — every 2.5-4 seconds (randomized)
    const scheduleNext = () => {
      if (!alive) return;
      const t = ctx.currentTime;
      const note = notes[noteIdx % notes.length];
      playPianoNote(note, t, 0.07);

      // Update pad root
      pad.osc.frequency.linearRampToValueAtTime(
        padRoots[noteIdx % padRoots.length], t + 1,
      );

      noteIdx++;
      const delay = 2500 + Math.random() * 1500;
      const timer = window.setTimeout(scheduleNext, delay);
      this.fadeOutTimers.push(timer);
    };
    const initTimer = window.setTimeout(scheduleNext, 1500);
    this.fadeOutTimers.push(initTimer);

    return () => {
      alive = false;
      const t = ctx.currentTime;
      const fade = this.crossfadeSec;
      for (const g of gains) g.gain.linearRampToValueAtTime(0, t + fade);
      const timer = window.setTimeout(() => {
        for (const o of oscs) { try { o.stop(); } catch { /* ok */ } }
      }, (fade + 0.2) * 1000);
      this.fadeOutTimers.push(timer);
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // MOOD: Curious — Playful, exploratory sounds, varied notes
  // ═══════════════════════════════════════════════════════════════
  private createCurious(): LayerCleanup {
    const ctx = this.ctx!;
    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    let alive = true;

    // Whimsical pad — Lydian feel (raised 4th)
    const pad = this.createFilteredOsc(N.C4, 'triangle', 900, 1, 0);
    pad.osc.start();
    oscs.push(pad.osc);
    gains.push(pad.gainNode);

    const now = ctx.currentTime;
    pad.gainNode.gain.linearRampToValueAtTime(0.04, now + 2);

    // Playful notes — Lydian scale: C D E F# G A B
    const scale = [N.C4, N.D4, N.E4, N.Fs4, N.G4, N.A4, N.B4, N.C5, N.D5, N.E5, N.Fs5];
    const bassNotes = [N.C2, N.D2, N.E2, N.G2, N.A2];

    let lastNoteIdx = 0;

    // Random-interval playful phrases
    const schedulePhrase = () => {
      if (!alive) return;
      const t = ctx.currentTime;

      // Play 2-4 quick ascending/descending notes
      const phraseLen = 2 + Math.floor(Math.random() * 3);
      const goUp = Math.random() > 0.4;

      for (let i = 0; i < phraseLen; i++) {
        if (goUp) {
          lastNoteIdx = Math.min(lastNoteIdx + 1, scale.length - 1);
        } else {
          lastNoteIdx = Math.max(lastNoteIdx - 1, 0);
        }
        // Occasionally jump
        if (Math.random() < 0.2) {
          lastNoteIdx = Math.floor(Math.random() * scale.length);
        }

        const note = scale[lastNoteIdx];
        const offset = i * 0.18;
        this.playNote(note, 'triangle', t + offset, 0.35, 0.055, 1800);
      }

      // Bass accent sometimes
      if (Math.random() > 0.5) {
        const bass = bassNotes[Math.floor(Math.random() * bassNotes.length)];
        this.playNote(bass, 'sine', t, 1.2, 0.07, 250);
      }

      // Update pad
      const padFreqs = [N.C4, N.D4, N.G3, N.A3, N.E4];
      pad.osc.frequency.linearRampToValueAtTime(
        padFreqs[Math.floor(Math.random() * padFreqs.length)],
        t + 0.5,
      );

      // Next phrase in 1-2.5 seconds
      const delay = 1000 + Math.random() * 1500;
      const timer = window.setTimeout(schedulePhrase, delay);
      this.fadeOutTimers.push(timer);
    };

    const initTimer = window.setTimeout(schedulePhrase, 800);
    this.fadeOutTimers.push(initTimer);

    return () => {
      alive = false;
      const t = ctx.currentTime;
      const fade = this.crossfadeSec;
      for (const g of gains) g.gain.linearRampToValueAtTime(0, t + fade);
      const timer = window.setTimeout(() => {
        for (const o of oscs) { try { o.stop(); } catch { /* ok */ } }
      }, (fade + 0.2) * 1000);
      this.fadeOutTimers.push(timer);
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // MOOD: Bored — Sparse, slower ambient, minimal activity
  // ═══════════════════════════════════════════════════════════════
  private createBored(): LayerCleanup {
    const ctx = this.ctx!;
    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    let alive = true;

    // Very sparse low drone
    const drone = this.createFilteredOsc(N.C3, 'sine', 200, 0.3, 0);
    drone.osc.start();
    oscs.push(drone.osc);
    gains.push(drone.gainNode);

    // Detuned second voice
    const drone2 = this.createFilteredOsc(N.G2 * 1.003, 'sine', 180, 0.3, 0);
    drone2.osc.start();
    oscs.push(drone2.osc);
    gains.push(drone2.gainNode);

    const now = ctx.currentTime;
    drone.gainNode.gain.linearRampToValueAtTime(0.06, now + 4);
    drone2.gainNode.gain.linearRampToValueAtTime(0.04, now + 5);

    // Very slow LFO — breathing
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.035;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(drone.gainNode.gain);
    lfo.start();
    oscs.push(lfo);

    // Occasional lonely note every 4-7 seconds
    const notes = [N.C4, N.Eb4, N.G3, N.Bb3, N.C4];
    let noteIdx = 0;

    const scheduleNote = () => {
      if (!alive) return;
      const t = ctx.currentTime;
      const note = notes[noteIdx % notes.length];
      this.playNote(note, 'sine', t, 2.5, 0.035, 400);
      noteIdx++;

      const delay = 4000 + Math.random() * 3000;
      const timer = window.setTimeout(scheduleNote, delay);
      this.fadeOutTimers.push(timer);
    };
    const initTimer = window.setTimeout(scheduleNote, 3000);
    this.fadeOutTimers.push(initTimer);

    // Light noise texture
    const noise = this.createNoise(0.005, 300);
    noise.source.start();

    return () => {
      alive = false;
      const t = ctx.currentTime;
      const fade = this.crossfadeSec;
      for (const g of gains) g.gain.linearRampToValueAtTime(0, t + fade);
      noise.gainNode.gain.linearRampToValueAtTime(0, t + fade);
      const timer = window.setTimeout(() => {
        for (const o of oscs) { try { o.stop(); } catch { /* ok */ } }
        try { noise.source.stop(); } catch { /* ok */ }
      }, (fade + 0.2) * 1000);
      this.fadeOutTimers.push(timer);
    };
  }
}

// Singleton
export const moodMusicEngine = new MoodMusicEngine();
