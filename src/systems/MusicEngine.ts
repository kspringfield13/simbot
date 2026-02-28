// ── Procedural Music Engine ─────────────────────────────────────
// Uses Web Audio API to generate ambient/lo-fi music per room genre.
// No external audio files — everything is synthesized with oscillators,
// filtered noise, and gain envelopes.

type LayerCleanup = () => void;

export type MusicGenre =
  | 'lo-fi-chill'   // Living Room
  | 'jazz'          // Kitchen
  | 'ambient'       // Hallway
  | 'indie-lo-fi'   // Laundry
  | 'dream'         // Bedroom
  | 'upbeat-bossa'; // Bathroom

export const ROOM_GENRES: Record<string, { genre: MusicGenre; label: string }> = {
  'living-room': { genre: 'lo-fi-chill', label: 'Lo-fi Chill' },
  kitchen:       { genre: 'jazz', label: 'Smooth Jazz' },
  hallway:       { genre: 'ambient', label: 'Ambient Drift' },
  laundry:       { genre: 'indie-lo-fi', label: 'Indie Lo-fi' },
  bedroom:       { genre: 'dream', label: 'Dream Ambient' },
  bathroom:      { genre: 'upbeat-bossa', label: 'Upbeat Bossa' },
};

// ── Note frequencies ────────────────────────────────────────────
const N: Record<string, number> = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, Bb2: 116.54, B2: 123.47,
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
};

class MusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private distanceGain: GainNode | null = null;
  private activeCleanup: LayerCleanup | null = null;
  private currentGenre: MusicGenre | null = null;
  private _enabled = false;
  private fadeOutTimers: number[] = [];

  get enabled() { return this._enabled; }

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.distanceGain = this.ctx.createGain();
      this.masterGain.connect(this.distanceGain);
      this.distanceGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.25;
      this.distanceGain.gain.value = 1;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  enable() {
    this._enabled = true;
    this.ensureContext();
    if (this.currentGenre) {
      this.playGenre(this.currentGenre);
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

  setGenre(genre: MusicGenre) {
    if (genre === this.currentGenre) return;
    this.currentGenre = genre;
    if (this._enabled) {
      this.playGenre(genre);
    }
  }

  setDistanceVolume(vol: number) {
    if (!this.distanceGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, vol));
    this.distanceGain.gain.linearRampToValueAtTime(
      clamped,
      this.ctx.currentTime + 0.15,
    );
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

  private playGenre(genre: MusicGenre) {
    // Fade out current layer over 1.5s, then start new one
    const oldCleanup = this.activeCleanup;
    this.activeCleanup = null;

    if (oldCleanup) {
      // Let the old fade handle itself
      oldCleanup();
    }

    if (!this.ctx || !this.masterGain) return;

    switch (genre) {
      case 'lo-fi-chill':
        this.activeCleanup = this.createLofiChill();
        break;
      case 'jazz':
        this.activeCleanup = this.createJazz();
        break;
      case 'ambient':
        this.activeCleanup = this.createAmbient();
        break;
      case 'indie-lo-fi':
        this.activeCleanup = this.createIndieLofi();
        break;
      case 'dream':
        this.activeCleanup = this.createDream();
        break;
      case 'upbeat-bossa':
        this.activeCleanup = this.createUpbeatBossa();
        break;
    }
  }

  // ── Utility: create a filtered oscillator ──────────────────────
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

  // ── Utility: play a note with envelope ─────────────────────────
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
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
    gain.gain.setValueAtTime(volume, startTime + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  // ── Utility: noise generator ───────────────────────────────────
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
  // GENRE: Lo-fi Chill (Living Room)
  // Warm pad chords through heavy lowpass, subtle vinyl noise
  // ═══════════════════════════════════════════════════════════════
  private createLofiChill(): LayerCleanup {
    const ctx = this.ctx!;
    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    let alive = true;

    // Chord progression: Cmaj7 → Am7 → Fmaj7 → G7
    const chords = [
      [N.C3, N.E3, N.G3, N.B3],     // Cmaj7
      [N.A2, N.C3, N.E3, N.G3],     // Am7
      [N.F2, N.A2, N.C3, N.E3],     // Fmaj7
      [N.G2, N.B2, N.D3, N.F3],     // G7
    ];

    // Pad layer: 4 oscillators for current chord
    const padNodes = chords[0].map((freq) => {
      const { osc, gainNode, filter } = this.createFilteredOsc(
        freq, 'sawtooth', 500, 2, 0,
      );
      // Slow filter LFO via scheduled values
      const lfoOsc = ctx.createOscillator();
      lfoOsc.type = 'sine';
      lfoOsc.frequency.value = 0.15;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 200;
      lfoOsc.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfoOsc.start();
      oscs.push(lfoOsc);

      osc.start();
      oscs.push(osc);
      gains.push(gainNode);
      return { osc, gainNode, filter };
    });

    // Fade in
    const now = ctx.currentTime;
    for (const node of padNodes) {
      node.gainNode.gain.setValueAtTime(0, now);
      node.gainNode.gain.linearRampToValueAtTime(0.08, now + 1.5);
    }

    // Vinyl noise layer
    const noise = this.createNoise(0.012, 800);
    noise.source.start();

    // Chord changes every 3.5 seconds
    let chordIdx = 0;
    const chordInterval = setInterval(() => {
      if (!alive) return;
      chordIdx = (chordIdx + 1) % chords.length;
      const chord = chords[chordIdx];
      const t = ctx.currentTime;
      padNodes.forEach((node, i) => {
        node.osc.frequency.linearRampToValueAtTime(chord[i], t + 0.8);
      });
    }, 3500);

    // Sub bass pulse
    const bassNotes = [N.C2, N.A2, N.F2, N.G2];
    let bassIdx = 0;
    const bassInterval = setInterval(() => {
      if (!alive) return;
      const t = ctx.currentTime;
      this.playNote(bassNotes[bassIdx % bassNotes.length], 'sine', t, 3.2, 0.12, 300);
      bassIdx++;
    }, 3500);

    return () => {
      alive = false;
      clearInterval(chordInterval);
      clearInterval(bassInterval);
      const t = ctx.currentTime;
      for (const g of gains) {
        g.gain.linearRampToValueAtTime(0, t + 1);
      }
      noise.gainNode.gain.linearRampToValueAtTime(0, t + 1);
      const timer = window.setTimeout(() => {
        for (const o of oscs) { try { o.stop(); } catch { /* already stopped */ } }
        try { noise.source.stop(); } catch { /* ok */ }
      }, 1200);
      this.fadeOutTimers.push(timer);
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // GENRE: Smooth Jazz (Kitchen)
  // Walking bass, muted chord stabs, swing feel
  // ═══════════════════════════════════════════════════════════════
  private createJazz(): LayerCleanup {
    const ctx = this.ctx!;
    let alive = true;

    // Walking bass pattern (Dm7-G7-Cmaj7-Am7 changes)
    const bassPattern = [
      N.D2, N.F2, N.A2, N.C3,   // Dm7
      N.G2, N.B2, N.D3, N.F2,   // G7
      N.C2, N.E2, N.G2, N.B2,   // Cmaj7
      N.A2, N.C3, N.E3, N.A2,   // Am7
    ];

    // Chord voicings (played as stabs)
    const chordStabs = [
      [N.D3, N.F3, N.A3, N.C4],     // Dm7
      [N.G3, N.B3, N.D4, N.F4],     // G7
      [N.C3, N.E3, N.G3, N.B3],     // Cmaj7
      [N.A3, N.C4, N.E4, N.G4],     // Am7
    ];

    const tempo = 120; // BPM
    const beatMs = (60 / tempo) * 1000;

    // Soft pad underneath
    const pad = this.createFilteredOsc(N.D3, 'triangle', 600, 1.5, 0);
    const pad2 = this.createFilteredOsc(N.A3, 'triangle', 600, 1.5, 0);
    pad.osc.start();
    pad2.osc.start();
    const padGainVal = 0.04;
    pad.gainNode.gain.linearRampToValueAtTime(padGainVal, ctx.currentTime + 1.5);
    pad2.gainNode.gain.linearRampToValueAtTime(padGainVal, ctx.currentTime + 1.5);

    let beatNum = 0;
    const beatInterval = setInterval(() => {
      if (!alive) return;
      const t = ctx.currentTime;

      // Walking bass on every beat
      const bassNote = bassPattern[beatNum % bassPattern.length];
      this.playNote(bassNote, 'triangle', t, beatMs / 1100, 0.15, 400);

      // Chord stab on beats 0 and 2 of each bar (every 4 beats)
      const beatInBar = beatNum % 4;
      if (beatInBar === 0 || beatInBar === 2) {
        const chordGroup = Math.floor(beatNum / 4) % chordStabs.length;
        const chord = chordStabs[chordGroup];
        for (const note of chord) {
          this.playNote(note, 'sine', t + 0.02, beatMs / 1300, 0.035, 900);
        }
        // Update pad root
        pad.osc.frequency.linearRampToValueAtTime(chord[0], t + 0.3);
        pad2.osc.frequency.linearRampToValueAtTime(chord[2], t + 0.3);
      }

      beatNum++;
    }, beatMs);

    return () => {
      alive = false;
      clearInterval(beatInterval);
      const t = ctx.currentTime;
      pad.gainNode.gain.linearRampToValueAtTime(0, t + 1);
      pad2.gainNode.gain.linearRampToValueAtTime(0, t + 1);
      const timer = window.setTimeout(() => {
        try { pad.osc.stop(); } catch { /* ok */ }
        try { pad2.osc.stop(); } catch { /* ok */ }
      }, 1200);
      this.fadeOutTimers.push(timer);
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // GENRE: Ambient Drift (Hallway)
  // Minimal evolving drone, no rhythm, atmospheric
  // ═══════════════════════════════════════════════════════════════
  private createAmbient(): LayerCleanup {
    const ctx = this.ctx!;
    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    // Two drone oscillators with slow beating
    const drone1 = this.createFilteredOsc(N.C3, 'sine', 400, 0.5, 0);
    const drone2 = this.createFilteredOsc(N.G3, 'sine', 500, 0.5, 0);
    const drone3 = this.createFilteredOsc(N.C3 * 1.002, 'sine', 380, 0.5, 0); // slight detune for beating

    [drone1, drone2, drone3].forEach(d => {
      d.osc.start();
      oscs.push(d.osc);
      gains.push(d.gainNode);
    });

    // Slow volume LFO for drone1
    const lfo1 = ctx.createOscillator();
    lfo1.type = 'sine';
    lfo1.frequency.value = 0.08;
    const lfoGain1 = ctx.createGain();
    lfoGain1.gain.value = 0.04;
    lfo1.connect(lfoGain1);
    lfoGain1.connect(drone1.gainNode.gain);
    lfo1.start();
    oscs.push(lfo1);

    // Slow volume LFO for drone2
    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 0.05;
    const lfoGain2 = ctx.createGain();
    lfoGain2.gain.value = 0.03;
    lfo2.connect(lfoGain2);
    lfoGain2.connect(drone2.gainNode.gain);
    lfo2.start();
    oscs.push(lfo2);

    // Fade in
    const t = ctx.currentTime;
    drone1.gainNode.gain.linearRampToValueAtTime(0.07, t + 3);
    drone2.gainNode.gain.linearRampToValueAtTime(0.05, t + 4);
    drone3.gainNode.gain.linearRampToValueAtTime(0.06, t + 3.5);

    // Slow filter sweep on drone2
    const filterLfo = ctx.createOscillator();
    filterLfo.type = 'sine';
    filterLfo.frequency.value = 0.03;
    const filterLfoGain = ctx.createGain();
    filterLfoGain.gain.value = 200;
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(drone2.filter.frequency);
    filterLfo.start();
    oscs.push(filterLfo);

    return () => {
      const t = ctx.currentTime;
      for (const g of gains) {
        g.gain.linearRampToValueAtTime(0, t + 2);
      }
      const timer = window.setTimeout(() => {
        for (const o of oscs) { try { o.stop(); } catch { /* ok */ } }
      }, 2200);
      this.fadeOutTimers.push(timer);
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // GENRE: Indie Lo-fi (Laundry)
  // Simple rhythmic pattern, warm bass, minimal melody
  // ═══════════════════════════════════════════════════════════════
  private createIndieLofi(): LayerCleanup {
    const ctx = this.ctx!;
    let alive = true;

    const tempo = 85;
    const beatMs = (60 / tempo) * 1000;

    // Warm pad
    const pad = this.createFilteredOsc(N.E3, 'triangle', 450, 1, 0);
    pad.osc.start();
    pad.gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1);

    // Melody notes (pentatonic: E-G-A-B-D)
    const melody = [N.E4, N.G4, N.A4, N.B4, N.D5, N.B4, N.A4, N.G4];
    const bassLine = [N.E2, N.E2, N.A2, N.A2, N.D2, N.D2, N.G2, N.E2];

    let step = 0;
    const stepInterval = setInterval(() => {
      if (!alive) return;
      const t = ctx.currentTime;

      // Melody — gentle plucked sound
      const note = melody[step % melody.length];
      this.playNote(note, 'triangle', t, beatMs / 1200, 0.06, 1200);

      // Bass on every other step
      if (step % 2 === 0) {
        const bass = bassLine[(step / 2) % bassLine.length];
        this.playNote(bass, 'sine', t, beatMs * 1.8 / 1000, 0.1, 300);
      }

      // Update pad root every 4 steps
      if (step % 4 === 0) {
        const roots = [N.E3, N.A3, N.D3, N.G3];
        pad.osc.frequency.linearRampToValueAtTime(
          roots[(step / 4) % roots.length], t + 0.5,
        );
      }

      step++;
    }, beatMs);

    return () => {
      alive = false;
      clearInterval(stepInterval);
      const t = ctx.currentTime;
      pad.gainNode.gain.linearRampToValueAtTime(0, t + 1);
      const timer = window.setTimeout(() => {
        try { pad.osc.stop(); } catch { /* ok */ }
      }, 1200);
      this.fadeOutTimers.push(timer);
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // GENRE: Dream Ambient (Bedroom)
  // Ethereal pads, very soft, slow-moving
  // ═══════════════════════════════════════════════════════════════
  private createDream(): LayerCleanup {
    const ctx = this.ctx!;
    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    let alive = true;

    // Lydian-ish chord voicings for dreamy feel
    const chords = [
      [N.C3, N.E3, N.G3, N.B3],     // Cmaj7
      [N.F3, N.A3, N.C4, N.E4],     // Fmaj7
      [N.D3, N.F3, N.A3, N.C4],     // Dm7
      [N.E3, N.G3, N.B3, N.D4],     // Em7
    ];

    // Create pad oscillators (sine for purity)
    const padNodes = chords[0].map((freq) => {
      const { osc, gainNode, filter } = this.createFilteredOsc(
        freq, 'sine', 700, 0.7, 0,
      );
      osc.start();
      oscs.push(osc);
      gains.push(gainNode);
      return { osc, gainNode, filter };
    });

    // Add a shimmer layer with slight detune
    const shimmer1 = this.createFilteredOsc(N.G4 * 1.003, 'sine', 900, 0.5, 0);
    const shimmer2 = this.createFilteredOsc(N.E5 * 0.998, 'sine', 800, 0.5, 0);
    shimmer1.osc.start();
    shimmer2.osc.start();
    oscs.push(shimmer1.osc, shimmer2.osc);
    gains.push(shimmer1.gainNode, shimmer2.gainNode);

    // Volume LFOs for shimmers
    const sLfo1 = ctx.createOscillator();
    sLfo1.type = 'sine';
    sLfo1.frequency.value = 0.12;
    const sLfoG1 = ctx.createGain();
    sLfoG1.gain.value = 0.025;
    sLfo1.connect(sLfoG1);
    sLfoG1.connect(shimmer1.gainNode.gain);
    sLfo1.start();
    oscs.push(sLfo1);

    const sLfo2 = ctx.createOscillator();
    sLfo2.type = 'sine';
    sLfo2.frequency.value = 0.07;
    const sLfoG2 = ctx.createGain();
    sLfoG2.gain.value = 0.02;
    sLfo2.connect(sLfoG2);
    sLfoG2.connect(shimmer2.gainNode.gain);
    sLfo2.start();
    oscs.push(sLfo2);

    // Fade in pads
    const now = ctx.currentTime;
    for (const node of padNodes) {
      node.gainNode.gain.linearRampToValueAtTime(0.06, now + 2.5);
    }
    shimmer1.gainNode.gain.linearRampToValueAtTime(0.03, now + 3);
    shimmer2.gainNode.gain.linearRampToValueAtTime(0.02, now + 4);

    // Very slow chord changes (6 seconds)
    let chordIdx = 0;
    const chordInterval = setInterval(() => {
      if (!alive) return;
      chordIdx = (chordIdx + 1) % chords.length;
      const chord = chords[chordIdx];
      const t = ctx.currentTime;
      padNodes.forEach((node, i) => {
        node.osc.frequency.linearRampToValueAtTime(chord[i], t + 2);
      });
    }, 6000);

    return () => {
      alive = false;
      clearInterval(chordInterval);
      const t = ctx.currentTime;
      for (const g of gains) {
        g.gain.linearRampToValueAtTime(0, t + 2);
      }
      const timer = window.setTimeout(() => {
        for (const o of oscs) { try { o.stop(); } catch { /* ok */ } }
      }, 2500);
      this.fadeOutTimers.push(timer);
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // GENRE: Upbeat Bossa (Bathroom)
  // Brighter tones, syncopated rhythm, energetic
  // ═══════════════════════════════════════════════════════════════
  private createUpbeatBossa(): LayerCleanup {
    const ctx = this.ctx!;
    let alive = true;

    const tempo = 130;
    const beatMs = (60 / tempo) * 1000;

    // Bright pad
    const pad = this.createFilteredOsc(N.C4, 'triangle', 1200, 1, 0);
    pad.osc.start();
    pad.gainNode.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1);

    // Bossa pattern: syncopated
    // Beat pattern: x . x . . x . x  (1-based: 1, 3, 6, 8 out of 8 16th notes)
    const bossaPattern = [true, false, true, false, false, true, false, true];

    // Chord tones
    const chordTones = [
      [N.C4, N.E4, N.G4],    // C
      [N.A3, N.C4, N.E4],    // Am
      [N.F3, N.A3, N.C4],    // F
      [N.G3, N.B3, N.D4],    // G
    ];

    const bassNotes = [N.C2, N.A2, N.F2, N.G2];

    let sixteenth = 0;
    const interval = setInterval(() => {
      if (!alive) return;
      const t = ctx.currentTime;
      const patternIdx = sixteenth % 8;
      const chordGroup = Math.floor(sixteenth / 8) % chordTones.length;

      if (bossaPattern[patternIdx]) {
        const chord = chordTones[chordGroup];
        for (const note of chord) {
          this.playNote(note, 'triangle', t, beatMs / 1400, 0.04, 1500);
        }
      }

      // Bass on beat 1 of each chord group
      if (patternIdx === 0) {
        this.playNote(bassNotes[chordGroup], 'sine', t, beatMs * 3.5 / 1000, 0.12, 350);
        pad.osc.frequency.linearRampToValueAtTime(chordTones[chordGroup][0], t + 0.2);
      }

      sixteenth++;
    }, beatMs / 2);

    return () => {
      alive = false;
      clearInterval(interval);
      const t = ctx.currentTime;
      pad.gainNode.gain.linearRampToValueAtTime(0, t + 0.8);
      const timer = window.setTimeout(() => {
        try { pad.osc.stop(); } catch { /* ok */ }
      }, 1000);
      this.fadeOutTimers.push(timer);
    };
  }
}

// Singleton
export const musicEngine = new MusicEngine();
