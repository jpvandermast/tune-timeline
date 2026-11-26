// Geluidseffecten met Web Audio (geen bestanden). Alleen op de tv. Zie CONCEPT 4.2.
import type { Sound } from '../game/types';

let ctx: AudioContext | null = null;
/** Tests: welke geluiden speelden er (alleen bij ?nep=1 uitgelezen). */
export const played: { sound: Sound; at: number }[] = [];

export function unlockAudio() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18, endFreq?: number) {
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(start: number, dur: number, vol = 0.12, hp = 800, sweepTo?: number) {
  if (!ctx) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  const t = ctx.currentTime + start;
  f.frequency.setValueAtTime(hp, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(t);
}

/** Speel een effect, eventueel met vertraging (bv. pas na de flip). */
export function play(sound: Sound, delayMs = 0) {
  played.push({ sound, at: Date.now() + delayMs });
  if (played.length > 200) played.shift();
  if (!ctx || ctx.state !== 'running') return;
  const d = Math.max(0, delayMs) / 1000;
  switch (sound) {
    case 'plop':
      tone(660, d, 0.12, 'sine', 0.22);
      tone(990, d + 0.04, 0.08, 'sine', 0.1);
      break;
    case 'turn':
      tone(523, d, 0.16, 'triangle');
      tone(784, d + 0.14, 0.22, 'triangle');
      break;
    case 'tick':
      tone(1200, d, 0.04, 'square', 0.05);
      break;
    case 'softtick':
      tone(1800, d, 0.025, 'sine', 0.06);
      break;
    case 'lock':
      noise(d, 0.06, 0.25, 1500);
      tone(180, d, 0.08, 'square', 0.1);
      break;
    case 'drum':
      // trommelroffel 1,2 s, steeds harder
      for (let i = 0; i < 24; i++) noise(d + i * 0.05, 0.05, 0.05 + i * 0.004, 200);
      break;
    case 'drumShort':
      for (let i = 0; i < 10; i++) noise(d + i * 0.045, 0.045, 0.05 + i * 0.006, 200);
      tone(98, d + 0.45, 0.25, 'sine', 0.2);
      break;
    case 'swish':
      noise(d, 0.35, 0.09, 600, 6000);
      break;
    case 'good':
      tone(523, d, 0.5, 'triangle');
      tone(659, d + 0.08, 0.5, 'triangle');
      tone(784, d + 0.16, 0.7, 'triangle');
      break;
    case 'bad':
      tone(110, d, 0.5, 'sawtooth', 0.12);
      tone(104, d + 0.05, 0.45, 'sawtooth', 0.08);
      break;
    case 'countdown':
      tone(880, d, 0.08, 'sine', 0.12);
      break;
    case 'stealOpen':
      tone(440, d, 0.12, 'triangle', 0.14);
      tone(660, d + 0.1, 0.18, 'triangle', 0.14);
      break;
    case 'steal':
      // "zwoesj"
      noise(d, 0.25, 0.12, 2500, 400);
      tone(900, d, 0.18, 'sine', 0.08, 300);
      break;
    case 'kassa':
      tone(1319, d, 0.12, 'square', 0.08);
      tone(1760, d + 0.1, 0.3, 'square', 0.08);
      noise(d + 0.05, 0.15, 0.06, 4000);
      break;
    case 'coin':
      // "ting"
      tone(1568, d, 0.08, 'sine', 0.14);
      tone(2093, d + 0.07, 0.25, 'sine', 0.12);
      break;
    case 'matchpoint':
      // lage puls
      tone(73, d, 0.35, 'sine', 0.3);
      tone(73, d + 0.45, 0.35, 'sine', 0.24);
      break;
    case 'fanfare':
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, d + i * 0.18, i === 5 ? 1.2 : 0.22, 'triangle', 0.2));
      break;
  }
}
