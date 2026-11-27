import { describe, expect, it } from 'vitest';
import { apply, createGame } from '../engine';
import { awards, toPublic } from '../public';
import type { GameEvent, GameState, Song } from '../types';

function songs(n = 30): Song[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s${i}`,
    uri: `spotify:track:s${i}`,
    title: `Nummer ${i}`,
    artist: `Artiest ${i}`,
    year: 1965 + i * 2,
  }));
}

let actSeq = 0;
function intent(s: GameState, playerId: string, secret: string, ev: Record<string, unknown>, now = s.now + 100): GameState {
  const res = apply(s, { ...ev, playerId, secret, actionId: `a${++actSeq}`, now } as GameEvent);
  return res.state;
}

describe('Teams & Drankspel', () => {
  it('ondersteunt teams van 2–3 spelers met langere naam en teamleden', () => {
    let s = createGame({ code: 'ABCD', songs: songs(), seed: 42, now: 1000 });
    s = intent(s, 'p1', 'sec1', { type: 'join', name: 'Host', color: '#FFD23F' });
    s = intent(s, 'p1', 'sec1', { type: 'settings', teams: true, drinking: true });
    s = intent(s, 'p2', 'sec2', {
      type: 'join',
      name: 'De Hitmachines',
      color: '#FF4F8B',
      members: ['Sanne', 'Daan', 'Mila'],
    });

    const pub = toPublic(s);
    expect(pub.settings.teams).toBe(true);
    expect(pub.settings.drinking).toBe(true);
    expect(pub.players[1].name).toBe('De Hitmachines');
    expect(pub.players[1].members).toEqual(['Sanne', 'Daan', 'Mila']);
  });

  it('voegt geen drankacties toe als drankspel uit staat', () => {
    let s = createGame({ code: 'ABCD', songs: songs(), seed: 7, now: 1000 });
    s = intent(s, 'p1', 'sec1', { type: 'join', name: 'A', color: '#FFD23F' });
    s = intent(s, 'p2', 'sec2', { type: 'join', name: 'B', color: '#FF4F8B' });
    s = intent(s, 'p1', 'sec1', { type: 'start' });
    s = intent(s, 'p1', 'sec1', { type: 'understood' });
    s = apply(s, { type: 'tick', now: s.deadline! + 1 }).state; // deal → turnStart
    s = apply(s, { type: 'tick', now: s.deadline! + 1 }).state; // turnStart → placing
    s = apply(s, { type: 'songPlaying', songId: s.turn!.song!.id, now: s.now + 100 }).state;
    s = apply(s, { type: 'tick', now: s.deadline! + 1 }).state; // placing timeout → stealing
    if (s.phase === 'stealing') s = apply(s, { type: 'tick', now: s.deadline! + 1 }).state;

    expect(s.phase).toBe('reveal');
    expect(s.drinks).toEqual([]);
  });

  it('geeft 2 slokken bij mis + 1 slok aan iedereen als niemand goed zat', () => {
    let s = createGame({ code: 'ABCD', songs: songs(), seed: 7, now: 1000 });
    s = intent(s, 'p1', 'sec1', { type: 'join', name: 'A', color: '#FFD23F' });
    s = intent(s, 'p2', 'sec2', { type: 'join', name: 'B', color: '#FF4F8B' });
    s = intent(s, 'p1', 'sec1', { type: 'settings', drinking: true });
    s = intent(s, 'p1', 'sec1', { type: 'start' });
    s = intent(s, 'p1', 'sec1', { type: 'understood' });
    s = apply(s, { type: 'tick', now: s.deadline! + 1 }).state; // turnStart
    s = apply(s, { type: 'tick', now: s.deadline! + 1 }).state; // placing
    s = apply(s, { type: 'songPlaying', songId: s.turn!.song!.id, now: s.now + 100 }).state;
    // Geen plek gekozen -> mis
    s = apply(s, { type: 'tick', now: s.deadline! + 1 }).state; // stealing
    if (s.phase === 'stealing') s = apply(s, { type: 'tick', now: s.deadline! + 1 }).state;

    expect(s.phase).toBe('reveal');
    const activeId = s.reveal!.playerId;
    expect(s.drinks.some((d) => d.kind === 'drink' && d.playerId === activeId && d.sips === 2)).toBe(true);
    expect(s.drinks.some((d) => d.kind === 'all' && d.sips === 1)).toBe(true);
    expect(s.players.find((p) => p.id === activeId)!.stats.sips).toBe(3);
  });

  it('geeft slokken uitdelen via giveSips en bak trekken voor de verliezer', () => {
    let s = createGame({ code: 'ABCD', songs: songs(), seed: 9, now: 1000, settings: { drinking: true, goal: 6 } });
    s = intent(s, 'p1', 'sec1', { type: 'join', name: 'A', color: '#FFD23F' });
    s = intent(s, 'p2', 'sec2', { type: 'join', name: 'B', color: '#FF4F8B' });
    s = intent(s, 'p1', 'sec1', { type: 'start' });
    s = intent(s, 'p1', 'sec1', { type: 'understood' });
    s = apply(s, { type: 'tick', now: s.deadline! + 1 }).state; // turnStart
    const active = s.players.find((p) => p.id === s.turn!.playerId)!;
    const other = s.players.find((p) => p.id !== active.id)!;
    s = apply(s, { type: 'tick', now: s.deadline! + 1 }).state; // placing

    // Kies bewust de juiste plek + claim titel/artiest
    const songYear = s.turn!.song!.year;
    const slot = songYear < active.cards[0].year ? 0 : 1;
    s = intent(s, active.id, active.secret, { type: 'pickSlot', slot });
    s = intent(s, active.id, active.secret, { type: 'claim', on: true });
    s = intent(s, active.id, active.secret, { type: 'lock' });
    if (s.phase === 'stealing') s = intent(s, other.id, other.secret, { type: 'pass' });
    expect(s.phase).toBe('reveal');
    s = apply(s, { type: 'tick', now: s.deadline! + 1 }).state; // objection
    expect(s.phase).toBe('objection');
    s = intent(s, other.id, other.secret, { type: 'objection', verdict: 'klopt' });

    const give = s.drinks.find((d) => d.kind === 'give' && d.playerId === active.id);
    expect(give).toBeDefined();
    expect(give!.sips).toBe(2);

    const beforeSips = s.players.find((p) => p.id === other.id)!.stats.sips;
    s = intent(s, active.id, active.secret, { type: 'giveSips', drinkId: give!.id, targetId: other.id });
    expect(s.players.find((p) => p.id === other.id)!.stats.sips).toBe(beforeSips + 2);
    expect(s.notice?.kind).toBe('drink');

    // Simuleer winst van active → other moet bak trekken
    const winState = structuredClone(s);
    const wPl = winState.players.find((p) => p.id === active.id)!;
    wPl.cards = Array.from({ length: 6 }, (_, i) => ({
      songId: `w${i}`,
      year: 1970 + i,
      title: `T${i}`,
      artist: `A${i}`,
    }));
    const endRes = apply(winState, { type: 'tick', now: winState.deadline! + 1 }).state;
    expect(endRes.phase).toBe('winner');
    expect(endRes.drinks.some((d) => d.kind === 'bak' && d.playerId === other.id)).toBe(true);
    expect(awards(endRes).some((a) => a.title === 'Dorstigste speler')).toBe(true);
  });
});
