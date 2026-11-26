import { apply, createGame } from '../engine';
import { PLAYER_COLORS } from '../rules';
import type { Effect, GameEvent, GameState, Song } from '../types';

type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type EventIn = DistOmit<GameEvent, 'now'> & { now?: number };

export function songs(years: number[]): Song[] {
  return years.map((y, i) => ({
    id: `s${i}`,
    uri: `spotify:track:s${i}`,
    title: `Titel ${i}`,
    artist: `Artiest ${i}`,
    year: y,
  }));
}

let counter = 0;
export const aid = () => `a${++counter}`;

export class Sim {
  state: GameState;
  effects: Effect[] = [];
  now = 1_000_000;
  constructor(songList: Song[], seed = 42) {
    this.state = createGame({ code: 'KWPX', songs: songList, seed, now: this.now });
  }
  send(e: EventIn) {
    const r = apply(this.state, { ...e, now: e.now ?? this.now } as GameEvent);
    this.state = r.state;
    this.effects.push(...r.effects);
    return r;
  }
  join(id: string, name = id, colorIdx?: number) {
    const color = PLAYER_COLORS[colorIdx ?? this.state.players.length].hex;
    return this.send({ type: 'join', playerId: id, secret: `geheim-${id}`, actionId: aid(), name, color });
  }
  intent(id: string, type: string, extra: Record<string, unknown> = {}) {
    return this.send({ type, playerId: id, secret: `geheim-${id}`, actionId: aid(), ...extra } as never);
  }
  advance(ms: number) {
    this.now += ms;
    return this.send({ type: 'tick' });
  }
  /** Laat de tijd lopen tot de volgende fase (max 120 s). */
  until(phase: GameState['phase'], step = 500) {
    for (let i = 0; i < 240 && this.state.phase !== phase; i++) {
      this.advance(step);
      if (this.state.phase === 'placing' && this.state.turn && !this.state.turn.playing && this.state.turn.song)
        this.send({ type: 'songPlaying', songId: this.state.turn.song.id });
    }
    return this.state;
  }
  active() {
    return this.state.players.find((p) => p.id === this.state.turn?.playerId)!;
  }
  playing() {
    const s = this.state.turn!.song!;
    this.send({ type: 'songPlaying', songId: s.id });
    return s;
  }
}
