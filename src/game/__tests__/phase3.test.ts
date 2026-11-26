// Fase 3: uitleg, meegokken, reacties, late instappers, offline-wachttijd, "Ik speelde al",
// Pro/Expert, Spotify-pauze, prijzen en speelduur (CONCEPT 2.8, 2.9, 3.4–3.6).
import { describe, expect, it } from 'vitest';
import { apply, migrate, scoreGuesses } from '../engine';
import { awards, toPublic } from '../public';
import { LEVEL_TOKENS, estimateMinutes } from '../rules';
import type { Card, GameState, Level } from '../types';
import { Sim, aid, songs } from './helpers';

const YEARS = Array.from({ length: 90 }, (_, i) => 1955 + ((i * 7) % 68));
const card = (y: number, id = `c${y}`): Card => ({ songId: id, year: y, title: `T${y}`, artist: `A${y}` });
const P = (sim: Sim, id: string) => sim.state.players.find((p) => p.id === id)!;
const replies = (r: { effects: { type: string; text?: string }[] }) =>
  r.effects.filter((e) => e.type === 'reply').map((e) => e.text);

function lobby(n: number, level: Level = 'original') {
  const sim = new Sim(songs(YEARS), 5);
  for (let i = 0; i < n; i++) sim.join(`p${i}`, `Speler${i}`);
  if (level !== 'original') sim.intent('p0', 'settings', { level });
  return sim;
}

/** Spel in "placing" met bekende tijdlijn [1967, 1985, 1991, 2004] en nummer uit `songYear`. */
function placing(n = 4, level: Level = 'original', songYear = 1979) {
  const sim = lobby(n, level);
  sim.start('p0');
  sim.until('turnStart');
  const active = sim.active().id;
  sim.intent(active, 'startSong');
  const st: GameState = structuredClone(sim.state);
  st.players.find((p) => p.id === active)!.cards = [1967, 1985, 1991, 2004].map((y) => card(y));
  st.turn!.song = { id: 'raadsel', uri: 'spotify:track:raadsel', title: 'Raadsel', artist: 'Iemand', year: songYear };
  st.turn!.playing = true;
  sim.state = st;
  const others = st.players.filter((p) => p.id !== active).map((p) => p.id);
  return { sim, active, others };
}

describe('uitleg-scherm (CONCEPT 3.2)', () => {
  it('start → uitleg; alleen de host gaat met "Begrepen" naar de startkaarten', () => {
    const sim = lobby(3);
    sim.intent('p0', 'start');
    expect(sim.state.phase).toBe('explain');
    expect(sim.state.deadline).toBeNull();
    sim.intent('p1', 'understood');
    expect(sim.state.phase).toBe('explain');
    expect(sim.state.explainReady).toEqual(['p1']);
    sim.advance(120_000);
    expect(sim.state.phase).toBe('explain');
    sim.intent('p0', 'understood');
    expect(sim.state.phase).toBe('deal');
  });
  it('de tv kan zelf "Begrepen" klikken (muis op de tv-pc)', () => {
    const sim = lobby(2);
    sim.intent('p0', 'start');
    sim.send({ type: 'tvUnderstood' });
    expect(sim.state.phase).toBe('deal');
  });
  it('"Nog een potje" slaat de uitleg over', () => {
    const sim = lobby(2);
    sim.start('p0');
    const st = { ...structuredClone(sim.state), phase: 'winner' as const, winnerId: 'p0' };
    sim.state = st;
    sim.intent('p0', 'rematch');
    expect(sim.state.phase).toBe('deal');
  });
});

describe('meegokken + "Beste oor" (CONCEPT 3.5)', () => {
  it('anderen tikken stiekem een gat; publiek staat alleen wie, niet waar', () => {
    const { sim, active, others } = placing(4);
    sim.intent(others[0], 'guess', { slot: 1 });
    sim.intent(others[1], 'guess', { slot: 3 });
    sim.intent(active, 'guess', { slot: 2 }); // actieve speler gokt niet mee
    expect(sim.state.turn!.guesses).toEqual({ [others[0]]: 1, [others[1]]: 3 });
    const pub = toPublic(sim.state);
    expect(pub.turn!.guessers.sort()).toEqual([others[0], others[1]].sort());
    expect(JSON.stringify(pub)).not.toContain('"guesses"');
    // gok wijzigen en weghalen
    sim.intent(others[1], 'guess', { slot: 0 });
    sim.intent(others[1], 'guess', { slot: null });
    expect(sim.state.turn!.guesses).toEqual({ [others[0]]: 1 });
  });
  it('meegokken kan tot het vastzetten; daarna niet meer', () => {
    const { sim, active, others } = placing(3);
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    const r = sim.intent(others[0], 'guess', { slot: 1 });
    expect(sim.state.turn!.guesses).toEqual({});
    expect(replies(r)[0]).toMatch(/tot het vastzetten/);
  });
  it('onthulling: "Meegokkers goed: x van y"; telt niet voor de winst, wel voor de prijs', () => {
    const { sim, active, others } = placing(4);
    sim.intent(others[0], 'guess', { slot: 1 }); // 1967–1985: goed voor 1979
    sim.intent(others[1], 'guess', { slot: 3 }); // fout
    const cardsBefore = sim.state.players.map((p) => p.cards.length);
    sim.intent(active, 'pickSlot', { slot: 3 });
    sim.intent(active, 'lock');
    for (const id of sim.state.turn!.stealEligible) sim.intent(id, 'pass');
    expect(sim.state.phase).toBe('reveal');
    expect(sim.state.reveal!.guesses).toEqual([
      { playerId: others[0], slot: 1, correct: true },
      { playerId: others[1], slot: 3, correct: false },
    ]);
    expect(P(sim, others[0]).stats.guessesCorrect).toBe(1);
    expect(P(sim, others[0]).cards.length).toBe(cardsBefore[sim.state.players.findIndex((p) => p.id === others[0])]);
  });
  it('overslaan of een kapot nummer: gokken beginnen opnieuw', () => {
    const { sim, active, others } = placing(3);
    sim.intent(others[0], 'guess', { slot: 1 });
    sim.intent(active, 'skip');
    expect(sim.state.turn!.guesses).toEqual({});
  });
  it('prijs Beste oor gaat naar wie het vaakst goed meegokte', () => {
    const sim = lobby(3);
    sim.start('p0');
    const st = structuredClone(sim.state);
    st.players[1].stats.guessesCorrect = 4;
    st.players[2].stats.guessesCorrect = 7;
    st.phase = 'winner';
    expect(awards(st)[0]).toMatchObject({ icon: '👂', title: 'Beste oor', playerId: 'p2' });
  });
  it('scoreGuesses volgt de zelfde-jaarregel', () => {
    expect(scoreGuesses([1970, 1980, 1990], 1980, { a: 1, b: 2, c: 3 })).toEqual([
      { playerId: 'a', slot: 1, correct: true },
      { playerId: 'b', slot: 2, correct: true },
      { playerId: 'c', slot: 3, correct: false },
    ]);
  });
});

describe('emoji-reacties (CONCEPT 3.5)', () => {
  it('max 1 per 3 s per speler, zweven ±2 s', () => {
    const sim = lobby(2);
    sim.intent('p1', 'react', { emoji: '🔥' });
    sim.intent('p1', 'react', { emoji: '😂' });
    expect(sim.state.reactions.map((r) => r.emoji)).toEqual(['🔥']);
    sim.advance(2500);
    expect(sim.state.reactions).toEqual([]);
    sim.advance(600);
    sim.intent('p1', 'react', { emoji: '😂' });
    expect(sim.state.reactions.map((r) => r.emoji)).toEqual(['😂']);
  });
  it('alleen de 4 emoji, en de host kan ze uitzetten', () => {
    const sim = lobby(2);
    sim.intent('p1', 'react', { emoji: '💩' });
    expect(sim.state.reactions).toEqual([]);
    sim.intent('p0', 'settings', { reactions: false });
    const r = sim.intent('p1', 'react', { emoji: '🎶' });
    expect(sim.state.reactions).toEqual([]);
    expect(replies(r)[0]).toMatch(/uit/);
  });
});

describe('late instappers (CONCEPT 2.9)', () => {
  it('tot het einde van ronde 2: 1 startkaart, 2 tokens, achteraan in het rondje', () => {
    const sim = lobby(3);
    sim.start('p0');
    sim.until('turnStart');
    const order = sim.state.players.map((p) => p.id);
    const startId = sim.state.players[sim.state.startIndex].id;
    const activeId = sim.active().id;
    sim.join('laat', 'Laat', 5);
    const late = P(sim, 'laat');
    expect(late.cards).toHaveLength(1);
    expect(late.tokens).toBe(2);
    expect(late.cards[0].year).toBeGreaterThanOrEqual(1960);
    expect(late.cards[0].year).toBeLessThanOrEqual(2015);
    // uniek startjaar
    const starts = sim.state.players.filter((p) => p.id !== 'laat').map((p) => p.cards[0].year);
    expect(starts).not.toContain(late.cards[0].year);
    // achteraan: vlak vóór wie de ronde begint; de actieve speler blijft dezelfde
    const ids = sim.state.players.map((p) => p.id);
    expect(ids.length).toBe(order.length + 1);
    expect(ids[(sim.state.startIndex - 1 + ids.length) % ids.length]).toBe('laat');
    expect(sim.state.players[sim.state.startIndex].id).toBe(startId);
    expect(sim.active().id).toBe(activeId);
    expect(sim.state.players[sim.state.turnIndex].id).toBe(activeId);
  });
  it('de late speler speelt als laatste in de lopende ronde', () => {
    const sim = lobby(3);
    sim.start('p0');
    sim.until('turnStart');
    sim.join('laat', 'Laat', 5);
    const seen = [sim.active().id];
    for (let i = 0; i < 3; i++) {
      sim.intent('p0', 'skipTurn');
      if (sim.state.phase === 'turnStart') seen.push(sim.active().id);
    }
    expect(seen).toHaveLength(4);
    expect(seen[3]).toBe('laat');
    sim.intent('p0', 'skipTurn');
    expect(sim.state.phase).toBe('standings');
  });
  it('na ronde 2: toeschouwer (meegokken en reacties, geen kaarten)', () => {
    const sim = lobby(2);
    sim.start('p0');
    sim.until('turnStart');
    sim.state = { ...structuredClone(sim.state), round: 3 };
    const r = sim.join('kijker', 'Kijker', 6);
    expect(sim.state.players).toHaveLength(2);
    expect(sim.state.spectators.map((x) => x.id)).toEqual(['kijker']);
    expect(replies(r)[0]).toMatch(/kijkt mee/);
    expect(toPublic(sim.state).spectators[0]).toEqual({ id: 'kijker', name: 'Kijker', color: expect.any(String), online: true });
    expect(JSON.stringify(toPublic(sim.state))).not.toContain('geheim-kijker');
    // toeschouwer kan meegokken en reageren, niet stelen
    sim.intent(sim.active().id, 'startSong');
    sim.intent('kijker', 'guess', { slot: 0 });
    expect(sim.state.turn!.guesses.kijker).toBe(0);
    sim.intent('kijker', 'react', { emoji: '😱' });
    expect(sim.state.reactions.at(-1)?.playerId).toBe('kijker');
  });
  it('spel vol (10): toeschouwer', () => {
    const sim = lobby(10);
    sim.start('p0');
    sim.join('elf', 'Elf', 0);
    expect(sim.state.players).toHaveLength(10);
    expect(sim.state.spectators).toHaveLength(1);
  });
  it('terug naar de lobby: toeschouwers worden gewone spelers', () => {
    const sim = lobby(2);
    sim.start('p0');
    sim.state = { ...structuredClone(sim.state), round: 3 };
    sim.join('kijker', 'Kijker', 6);
    sim.intent('p0', 'stopGame');
    expect(sim.state.phase).toBe('lobby');
    expect(sim.state.players.map((p) => p.id)).toContain('kijker');
    expect(sim.state.spectators).toEqual([]);
  });
});

describe('actieve speler offline bij de beurtstart (CONCEPT 2.9)', () => {
  function offlineAtTurn() {
    const sim = lobby(3);
    sim.start('p0');
    sim.until('turnStart');
    const nextIdx = (sim.state.turnIndex + 1) % sim.state.players.length;
    const nextId = sim.state.players[nextIdx].id;
    sim.send({ type: 'presence', onlineIds: sim.state.players.filter((p) => p.id !== nextId).map((p) => p.id) });
    sim.intent('p0', 'skipTurn');
    return { sim, nextId };
  }
  it('"Wachten op Sanne… 20", daarna overslaan; tijdlijn en tokens blijven', () => {
    const { sim, nextId } = offlineAtTurn();
    expect(sim.state.phase).toBe('turnStart');
    expect(sim.state.turn!.playerId).toBe(nextId);
    expect(sim.state.turn!.waiting).toBe(true);
    expect(sim.state.deadline).toBe(sim.now + 20_000);
    expect(toPublic(sim.state).turn!.waiting).toBe(true);
    const before = structuredClone(P(sim, nextId));
    sim.advance(19_000);
    expect(sim.state.turn!.playerId).toBe(nextId);
    sim.advance(1000);
    expect(sim.state.turn?.playerId).not.toBe(nextId);
    expect(P(sim, nextId).cards).toEqual(before.cards);
    expect(P(sim, nextId).tokens).toBe(before.tokens);
  });
  it('komt de speler terug binnen 20 s: gewone beurtstart van 6 s', () => {
    const { sim, nextId } = offlineAtTurn();
    sim.advance(5000);
    sim.send({ type: 'presence', onlineIds: sim.state.players.map((p) => p.id) });
    expect(sim.state.turn!.waiting).toBe(false);
    expect(sim.state.deadline).toBe(sim.now + 6000);
    expect(sim.state.turn!.playerId).toBe(nextId);
  });
  it('tikt de afwezige speler toch "Start nummer": gewoon spelen', () => {
    const { sim, nextId } = offlineAtTurn();
    sim.intent(nextId, 'startSong');
    expect(sim.state.phase).toBe('placing');
  });
  it('de host kan meteen overslaan', () => {
    const { sim, nextId } = offlineAtTurn();
    sim.intent('p0', 'skipTurn');
    expect(sim.state.turn?.playerId).not.toBe(nextId);
  });
});

describe('"Ik speelde al" (CONCEPT 2.9)', () => {
  it('nieuwe telefoon tikt een naam; host bevestigt; daarna werkt het nieuwe geheim', () => {
    const sim = lobby(3);
    sim.start('p0');
    sim.until('turnStart');
    sim.send({ type: 'reclaim', playerId: 'nieuw', secret: 'nieuw-geheim', actionId: aid(), target: 'p2' } as never);
    expect(sim.state.reclaims).toEqual([{ id: 'nieuw', secret: 'nieuw-geheim', target: 'p2', at: sim.now }]);
    expect(toPublic(sim.state).reclaims).toEqual([{ id: 'nieuw', target: 'p2' }]);
    expect(JSON.stringify(toPublic(sim.state))).not.toContain('nieuw-geheim');
    // alleen de host kan bevestigen
    sim.intent('p1', 'confirmReclaim', { requester: 'nieuw', ok: true });
    expect(sim.state.reclaims).toHaveLength(1);
    const r = sim.intent('p0', 'confirmReclaim', { requester: 'nieuw', ok: true });
    expect(r.effects).toContainEqual({ type: 'adopt', requesterId: 'nieuw', playerId: 'p2' });
    expect(sim.state.reclaims).toEqual([]);
    expect(P(sim, 'p2').secret).toBe('nieuw-geheim');
    // oud geheim werkt niet meer, nieuw wel
    const v = sim.state.version;
    sim.intent('p2', 'react', { emoji: '🔥' });
    expect(sim.state.version).toBe(v);
    sim.send({ type: 'react', playerId: 'p2', secret: 'nieuw-geheim', actionId: aid(), emoji: '🔥' } as never);
    expect(sim.state.reactions.at(-1)?.playerId).toBe('p2');
  });
  it('host zegt nee: melding, niets veranderd', () => {
    const sim = lobby(2);
    sim.send({ type: 'reclaim', playerId: 'nieuw', secret: 'x', actionId: aid(), target: 'p1' } as never);
    const r = sim.intent('p0', 'confirmReclaim', { requester: 'nieuw', ok: false });
    expect(replies(r)[0]).toMatch(/nee/);
    expect(P(sim, 'p1').secret).toBe('geheim-p1');
  });
  it('de tv kan ook bevestigen (nodig als de host zelf een lege accu heeft)', () => {
    const sim = lobby(2);
    sim.send({ type: 'reclaim', playerId: 'nieuw', secret: 'x', actionId: aid(), target: 'p0' } as never);
    sim.send({ type: 'tvConfirmReclaim', requester: 'nieuw', ok: true });
    expect(P(sim, 'p0').secret).toBe('x');
    expect(sim.state.hostId).toBe('p0');
  });
});

describe('Pro en Expert (CONCEPT 2.8)', () => {
  it('start-tokens: Original 2, Pro 5, Expert 3', () => {
    expect(LEVEL_TOKENS).toEqual({ original: 2, pro: 5, expert: 3 });
    for (const lv of ['pro', 'expert'] as const) {
      const sim = lobby(3, lv);
      sim.start('p0');
      expect(sim.state.players.every((p) => p.tokens === LEVEL_TOKENS[lv])).toBe(true);
    }
  });
  it('alleen de host kiest het niveau, alleen in de lobby', () => {
    const sim = lobby(2);
    sim.intent('p1', 'settings', { level: 'pro' });
    expect(sim.state.settings.level).toBe('original');
    sim.intent('p0', 'settings', { level: 'nep' });
    expect(sim.state.settings.level).toBe('original');
  });
  it('Pro: claim staat vast aan', () => {
    const { sim, active } = placing(3, 'pro');
    sim.intent(active, 'claim', { on: false });
    expect(sim.state.turn!.claim).toBe(true);
  });
  it('Pro: goede plek + geen bezwaar = kaart, maar geen token verdienen', () => {
    const { sim, active, others } = placing(3, 'pro');
    const tokens = P(sim, active).tokens;
    sim.intent(active, 'pickSlot', { slot: 1 });
    sim.intent(active, 'lock');
    for (const id of others) sim.intent(id, 'pass');
    expect(sim.state.reveal).toMatchObject({ pending: true, placeCorrect: true, correct: false });
    expect(P(sim, active).cards).toHaveLength(4); // nog niet
    sim.advance(5000);
    expect(sim.state.phase).toBe('objection');
    expect(sim.state.objection).toMatchObject({ mode: 'keep', playerId: active, extra: null });
    for (const id of others) sim.intent(id, 'objection', { verdict: 'klopt' });
    expect(sim.state.objection!.result!.ok).toBe(true);
    expect(P(sim, active).cards).toHaveLength(5);
    expect(P(sim, active).tokens).toBe(tokens);
    expect(sim.state.reveal!.correct).toBe(true);
  });
  it('Pro: goede plek maar titel afgekeurd = kaart weg', () => {
    const { sim, active, others } = placing(3, 'pro');
    sim.intent(active, 'pickSlot', { slot: 1 });
    sim.intent(active, 'lock');
    for (const id of others) sim.intent(id, 'pass');
    sim.advance(5000);
    for (const id of others) sim.intent(id, 'objection', { verdict: 'fout' });
    expect(sim.state.objection!.result!.ok).toBe(false);
    expect(P(sim, active).cards).toHaveLength(4);
    expect(sim.state.discard.some((x) => x.id === 'raadsel')).toBe(true);
  });
  it('Pro: steler mag op de plek van de actieve speler; twee bezwaar-rijen; titel actieve speler fout → steler wint, token terug', () => {
    const { sim, active, others } = placing(4, 'pro');
    sim.intent(active, 'pickSlot', { slot: 1 });
    sim.intent(active, 'lock');
    const t0 = P(sim, others[0]).tokens;
    sim.intent(others[0], 'steal', { slot: 1 }); // zelfde plek als de actieve speler
    expect(sim.state.turn!.steals).toEqual([{ playerId: others[0], slot: 1 }]);
    expect(P(sim, others[0]).tokens).toBe(t0 - 1);
    for (const id of others.slice(1)) sim.intent(id, 'pass');
    expect(sim.state.reveal).toMatchObject({ pending: true, candidate: others[0] });
    sim.advance(5000);
    const o = sim.state.objection!;
    expect(o.playerId).toBe(active);
    expect(o.extra?.playerId).toBe(others[0]);
    // actieve speler afgekeurd (2 van 3 nodig), steler goedgekeurd
    sim.intent(others[1], 'objection', { verdict: 'fout' });
    sim.intent(others[2], 'objection', { verdict: 'fout' });
    for (const id of [active, others[1], others[2]]) sim.intent(id, 'objection', { verdict: 'klopt', target: others[0] });
    expect(sim.state.objection!.open).toBe(false);
    expect(P(sim, others[0]).cards.some((c) => c.songId === 'raadsel')).toBe(true);
    expect(P(sim, others[0]).tokens).toBe(t0); // gelukte steal kost geen token
    expect(sim.state.reveal!.stolenBy).toBe(others[0]);
  });
  it('Pro: actieve speler goed + goedgekeurd → stelers verliezen hun token', () => {
    const { sim, active, others } = placing(3, 'pro');
    sim.intent(active, 'pickSlot', { slot: 1 });
    sim.intent(active, 'lock');
    const t0 = P(sim, others[0]).tokens;
    sim.intent(others[0], 'steal', { slot: 1 });
    sim.intent(others[1], 'pass');
    sim.advance(5000);
    sim.advance(6000); // niemand tikt: alles goedgekeurd
    expect(P(sim, active).cards.some((c) => c.songId === 'raadsel')).toBe(true);
    expect(P(sim, others[0]).tokens).toBe(t0 - 1);
    expect(sim.state.reveal!.steals[0].outcome).toBe('lost');
  });
  it('Original: de plek van de actieve speler blijft niet stelbaar', () => {
    const { sim, active, others } = placing(3, 'original');
    sim.intent(active, 'pickSlot', { slot: 1 });
    sim.intent(active, 'lock');
    const r = sim.intent(others[0], 'steal', { slot: 1 });
    expect(sim.state.turn!.steals).toEqual([]);
    expect(replies(r)[0]).toMatch(/Daar legde/);
  });
  it('Expert: jaarwiel verplicht vóór vastzetten; exact jaar nodig', () => {
    const { sim, active, others } = placing(3, 'expert');
    sim.intent(active, 'pickSlot', { slot: 1 });
    const r = sim.intent(active, 'lock');
    expect(sim.state.phase).toBe('placing');
    expect(replies(r)[0]).toMatch(/jaar/);
    sim.intent(active, 'yearPick', { year: 1978 });
    expect(toPublic(sim.state).turn!.yearGuess).toBe(1978);
    sim.intent(active, 'lock');
    for (const id of others) sim.intent(id, 'pass');
    // plek goed, jaar fout: niemand kan de kaart krijgen → geen bezwaar
    expect(sim.state.reveal).toMatchObject({ placeCorrect: true, yearCorrect: false, pending: false, yearGuess: 1978 });
    sim.advance(5000);
    expect(sim.state.phase).not.toBe('objection');
    expect(P(sim, active).cards).toHaveLength(4);
  });
  it('Expert: plek + exact jaar + geen bezwaar = kaart', () => {
    const { sim, active, others } = placing(3, 'expert');
    sim.intent(active, 'pickSlot', { slot: 1 });
    sim.intent(active, 'yearPick', { year: 1979 });
    sim.intent(active, 'lock');
    for (const id of others) sim.intent(id, 'pass');
    expect(sim.state.reveal).toMatchObject({ yearCorrect: true, pending: true });
    sim.advance(5000);
    sim.advance(6000);
    expect(P(sim, active).cards.some((c) => c.songId === 'raadsel')).toBe(true);
  });
  it('Expert: stelen vraagt ook een jaar; steler met goed jaar kan winnen', () => {
    const { sim, active, others } = placing(3, 'expert');
    sim.intent(active, 'pickSlot', { slot: 3 }); // fout
    sim.intent(active, 'yearPick', { year: 1995 });
    sim.intent(active, 'lock');
    const r = sim.intent(others[0], 'steal', { slot: 1 });
    expect(replies(r)[0]).toMatch(/jaar/);
    sim.intent(others[0], 'steal', { slot: 1, year: 1979 });
    sim.intent(others[1], 'pass');
    expect(sim.state.reveal).toMatchObject({ pending: true, candidate: others[0] });
    sim.advance(5000);
    expect(sim.state.objection!.playerId).toBe(others[0]);
    expect(sim.state.objection!.extra).toBeNull();
    sim.advance(6000);
    expect(sim.state.reveal!.stolenBy).toBe(others[0]);
  });
  it('Pro/Expert: titel + artiest omdraaien via het hostmenu kan niet (uitslag omdraaien wel)', () => {
    const { sim, active, others } = placing(3, 'pro');
    sim.intent(active, 'pickSlot', { slot: 1 });
    sim.intent(active, 'lock');
    for (const id of others) sim.intent(id, 'pass');
    expect(toPublic(sim.state).canFlipVerdict).toBe(false); // nog pending
    sim.advance(5000);
    sim.advance(6000);
    expect(toPublic(sim.state).canFlipClaim).toBe(false);
    expect(toPublic(sim.state).canFlipVerdict).toBe(true);
    sim.intent('p0', 'flipVerdict');
    expect(P(sim, active).cards.some((c) => c.songId === 'raadsel')).toBe(false);
  });
});

describe('Spotify weg: de tv pauzeert zelf (CONCEPT 4.3, 8.2)', () => {
  it('systemPause bevriest de timer en stopt de muziek; terug = verder waar het was', () => {
    const { sim } = placing(3);
    sim.advance(10_000);
    const left = sim.state.deadline! - sim.now;
    sim.effects = [];
    sim.send({ type: 'systemPause', on: true });
    expect(sim.state).toMatchObject({ paused: true, pausedBy: 'system' });
    expect(sim.effects).toContainEqual({ type: 'stop' });
    sim.advance(60_000);
    expect(sim.state.phase).toBe('placing');
    sim.send({ type: 'systemPause', on: false });
    expect(sim.state.paused).toBe(false);
    expect(sim.state.deadline! - sim.now).toBe(left);
    expect(sim.effects.some((e) => e.type === 'play')).toBe(true);
  });
  it('een pauze van de host wordt niet door de tv opgeheven', () => {
    const { sim } = placing(3);
    sim.intent('p0', 'pause');
    sim.send({ type: 'systemPause', on: false });
    expect(sim.state.paused).toBe(true);
  });
  it('tijdens de pauze wordt een nummer niet als "kapot" gemarkeerd', () => {
    const { sim } = placing(3);
    sim.send({ type: 'systemPause', on: true });
    sim.send({ type: 'songFailed', songId: 'raadsel' });
    expect(sim.state.failedIds).toEqual([]);
  });
});

describe('geluid en animatie-signalen (CONCEPT 4.2)', () => {
  it('onthulling: trommelroffel, flip na 1,2 s, uitslag daarna; einde beurt: 2 s fade-out', () => {
    const { sim, active, others } = placing(3);
    sim.effects = [];
    sim.intent(active, 'pickSlot', { slot: 1 });
    sim.intent(active, 'lock');
    for (const id of others) sim.intent(id, 'pass');
    expect(sim.effects).toContainEqual({ type: 'sound', sound: 'drum' });
    expect(sim.effects).toContainEqual({ type: 'sound', sound: 'swish', delayMs: 1200 });
    expect(sim.effects).toContainEqual({ type: 'sound', sound: 'good', delayMs: 1900 });
    sim.advance(5000);
    expect(sim.effects).toContainEqual({ type: 'fade', ms: 2000 });
  });
  it('match point: lage puls als iemand er nieuw op komt, trommelroffeltje bij zijn beurt', () => {
    const sim = lobby(2);
    sim.intent('p0', 'settings', { goal: 6 });
    sim.start('p0');
    sim.until('turnStart');
    const st = structuredClone(sim.state);
    const a = st.players[st.turnIndex];
    a.cards = [1960, 1970, 1980, 1990].map((y) => card(y));
    sim.state = st;
    sim.effects = [];
    sim.intent(a.id, 'startSong');
    // kaart kopen niet nodig: zet kaart erbij via een goede plaatsing
    const s2 = structuredClone(sim.state);
    s2.turn!.song = { id: 'mp', uri: 'x', title: 'X', artist: 'Y', year: 2000 };
    s2.turn!.playing = true;
    sim.state = s2;
    sim.intent(a.id, 'pickSlot', { slot: 4 });
    sim.intent(a.id, 'lock');
    for (const id of sim.state.turn?.stealEligible ?? []) sim.intent(id, 'pass');
    expect(sim.effects.some((e) => e.type === 'sound' && e.sound === 'matchpoint')).toBe(true);
    // volgende ronde: zijn beurt → drumShort
    sim.effects = [];
    for (let i = 0; i < 60 && !(sim.state.phase === 'turnStart' && sim.active().id === a.id); i++) {
      sim.advance(1000);
      if (sim.state.phase === 'turnStart' && sim.active().id !== a.id) sim.intent(sim.active().id, 'startSong');
      if (sim.state.phase === 'placing' && sim.state.turn?.song) {
        sim.send({ type: 'songPlaying', songId: sim.state.turn.song.id });
        sim.intent(sim.active().id, 'pickSlot', { slot: 0 });
        sim.intent(sim.active().id, 'lock');
        for (const id of sim.state.turn?.stealEligible ?? []) sim.intent(id, 'pass');
      }
    }
    expect(sim.effects.some((e) => e.type === 'sound' && e.sound === 'drumShort')).toBe(true);
  });
  it('een tik op een ander gat geeft een zachte tik', () => {
    const { sim, active } = placing(3);
    sim.effects = [];
    sim.intent(active, 'pickSlot', { slot: 2 });
    expect(sim.effects).toContainEqual({ type: 'sound', sound: 'softtick' });
  });
});

describe('eindoverzicht en speelduur', () => {
  it('overgeslagen nummers staan in het eindoverzicht (niet eerder)', () => {
    const { sim, active } = placing(3);
    sim.intent(active, 'skip');
    expect(sim.state.skipped.map((c) => c.songId)).toEqual(['raadsel']);
    expect(toPublic(sim.state).skipped).toEqual([]);
    sim.state = { ...structuredClone(sim.state), phase: 'winner', winnerId: active };
    expect(toPublic(sim.state).skipped.map((c) => c.songId)).toEqual(['raadsel']);
  });
  it('speelduur schaalt met plaatstijd en niveau; tabel CONCEPT 3.4 blijft bij 45 s Original', () => {
    expect(estimateMinutes(10, 10)).toBe(105);
    expect(estimateMinutes(10, 8)).toBe(70);
    expect(estimateMinutes(8, 10)).toBe(80);
    expect(estimateMinutes(10, 10, 30)).toBeLessThan(105);
    expect(estimateMinutes(10, 10, 60)).toBeGreaterThan(105);
    expect(estimateMinutes(6, 8, 45, 'expert')).toBeGreaterThan(estimateMinutes(6, 8, 45, 'pro'));
  });
  it('migrate: oude opgeslagen status krijgt de nieuwe velden', () => {
    const sim = lobby(2);
    sim.start('p0');
    const old = structuredClone(sim.state) as unknown as Record<string, unknown>;
    delete old.spectators;
    delete old.reactions;
    delete (old.settings as Record<string, unknown>).level;
    const m = migrate(old as unknown as GameState);
    expect(m.spectators).toEqual([]);
    expect(m.settings.level).toBe('original');
    expect(() => apply(m, { type: 'tick', now: sim.now + 100 })).not.toThrow();
  });
});
