// Geluidseffecten met Web Audio (geen bestanden). Alleen op de tv.
import type { Sound } from '../game/types';

let ctx: AudioContext | null = null;

export function unlockAudio() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18) {
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(start: number, dur: number, vol = 0.12, hp = 800) {
  if (!ctx) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(ctx.currentTime + start);
}

export function play(sound: Sound) {
  if (!ctx || ctx.state !== 'running') return;
  switch (sound) {
    case 'plop':
      tone(660, 0, 0.12, 'sine', 0.22);
      tone(990, 0.04, 0.08, 'sine', 0.1);
      break;
    case 'turn':
      tone(523, 0, 0.16, 'triangle');
      tone(784, 0.14, 0.22, 'triangle');
      break;
    case 'tick':
      tone(1200, 0, 0.04, 'square', 0.05);
      break;
    case 'lock':
      noise(0, 0.06, 0.25, 1500);
      tone(180, 0, 0.08, 'square', 0.1);
      break;
    case 'drum':
      for (let i = 0; i < 24; i++) noise(i * 0.05, 0.05, 0.05 + i * 0.004, 200);
      break;
    case 'good':
      tone(523, 0, 0.5, 'triangle');
      tone(659, 0.08, 0.5, 'triangle');
      tone(784, 0.16, 0.7, 'triangle');
      break;
    case 'bad':
      tone(110, 0, 0.5, 'sawtooth', 0.12);
      tone(104, 0.05, 0.45, 'sawtooth', 0.08);
      break;
    case 'countdown':
      tone(880, 0, 0.08, 'sine', 0.12);
      break;
    case 'fanfare':
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.18, i === 5 ? 1.2 : 0.22, 'triangle', 0.2));
      break;
  }
}
