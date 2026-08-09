/**
 * Minimal, original, license-free sound system: short procedural tones
 * generated with the Web Audio API instead of shipped audio files. Sound is
 * always optional - nothing in the game depends on hearing it.
 */

const MUTE_KEY = 'doll-city:muted';

export type SoundKey = 'curtain' | 'drop' | 'giftOpen' | 'roomReset' | 'doorEnter' | 'pop';

const TONES: Record<SoundKey, { freq: number; duration: number; type: OscillatorType }[]> = {
  curtain: [{ freq: 320, duration: 0.18, type: 'sine' }],
  drop: [{ freq: 200, duration: 0.08, type: 'triangle' }],
  giftOpen: [
    { freq: 523, duration: 0.09, type: 'sine' },
    { freq: 659, duration: 0.09, type: 'sine' },
    { freq: 784, duration: 0.14, type: 'sine' },
  ],
  roomReset: [
    { freq: 440, duration: 0.08, type: 'sine' },
    { freq: 554, duration: 0.1, type: 'sine' },
  ],
  doorEnter: [{ freq: 380, duration: 0.12, type: 'sine' }],
  pop: [{ freq: 600, duration: 0.06, type: 'square' }],
};

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    return ctx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // ignore - non-critical
  }
}

export function playSound(key: SoundKey): void {
  if (isMuted()) return;
  const audioCtx = getContext();
  if (!audioCtx) return;

  try {
    let startTime = audioCtx.currentTime;
    for (const note of TONES[key]) {
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = note.type;
      oscillator.frequency.value = note.freq;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.duration);
      oscillator.connect(gain).connect(audioCtx.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + note.duration + 0.02);
      startTime += note.duration * 0.8;
    }
  } catch {
    // audio is a nice-to-have; never let it break gameplay
  }
}
