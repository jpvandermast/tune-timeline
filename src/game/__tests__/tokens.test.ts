// Fase 2: tokens, stelen, kopen, overslaan, verdienen, bezwaar en hostmenu (CONCEPT 2.5–2.7, 2.9).
import { describe, expect, it } from 'vitest';
import { claimApproved, resolveSteals } from '../engine';
import { toPublic } from '../public';
import type { Card, GameState } from '../types';
import { Sim, songs } from './helpers';

const YEARS = Array.from({ length: 80 }, (_, i) => 1955 + ((i * 7) % 68));
const card = (y: number, id = `c${y}`): Card => ({ songId: id, year: y, title: `T${y}`, artist: `A${y}` });

/** Spel met n spelers in de fase "placing", actieve speler met vaste tijdlijn en een bekend nummer. */
function placing(n = 4, activeYears = [1967, 1985, 1991, 2004], songYear = 1979) {
  const sim = new Sim(songs(YEARS), 11);
  for (let i = 0; i < n; i++) sim.join(`p${i}`, `Speler${i}`);
  sim.intent('p0', 'start');
  sim.until('turnStart');
  const active = sim.active().id;
  sim.intent(active, 'startSong');
  const st: GameState = structuredClone(sim.state);
  const a = st.players.find((p) => p.id === active)!;
  a.cards = activeYears.map((y) => card(y));
  st.turn!.song = { id: 'raadsel', uri: 'spotify:track:raadsel', title: 'Raadsel', artist: 'Iemand', year: songYear };
  st.turn!.playing = true;
  sim.state = st;
  const others = st.players.filter((p) => p.id !== active).map((p) => p.id);
  return { sim, active, others };
}

const P = (sim: Sim, id: string) => sim.state.players.find((p) => p.id === id)!;
const replies = (r: { effects: { type: string; text?: string }[] }) =>
  r.effects.filter((e) => e.type === 'reply').map((e) => e.text);

describe('resolveSteals (pure)', () => {
  const tl = [1967, 1985, 1991, 2004];
  it('actieve speler goed: alle stelers token kwijt, ook als ze óók goed lagen (zelfde jaar)', () => {
    const r = resolveSteals([1970, 1985, 1990], 1, 1985, [{ playerId: 'x', slot: 2 }]);
    expect(r.activeCorrect).toBe(true);
    expect(r.results[0]).toMatchObject({ correct: true, outcome: 'lost' });
    expect(r.winner).toBeNull();
  });
  it('actieve speler fout, één steler goed: steler wint', () => {
    const r = resolveSteals(tl, 2, 1979, [
      { playerId: 'mila', slot: 1 },
      { playerId: 'sanne', slot: 4 },
    ]);
    expect(r.winner).toBe('mila');
    expect(r.results.map((x) => x.outcome)).toEqual(['won', 'lost']);
  });
  it('twee goede stelers: de eerste wint, de ander krijgt zijn token terug', () => {
    const r = resolveSteals([1970, 1980, 1990], 0, 1980, [
      { playerId: 'a', slot: 2 },
      { playerId: 'b', slot: 1 },
    ]);
    expect(r.winner).toBe('a');
    expect(r.results.map((x) => x.outcome)).toEqual(['won', 'refund']);
  });
  it('niemand goed: geen winnaar', () => {
    expect(resolveSteals(tl, 0, 1979, [{ playerId: 'a', slot: 3 }]).winner).toBeNull();
  });
});

describe('steelvenster', () => {
  it('opent na vastzetten voor 10 s, alleen voor anderen met ≥ 1 token die online zijn', () => {
    const { sim, active, others } = placing(4);
    sim.state = { ...sim.state, players: sim.state.players.map((p) => (p.id === others[2] ? { ...p, tokens: 0 } : p.id === others[1] ? { ...p, online: false } : p)) };
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    expect(sim.state.phase).toBe('stealing');
    expect(sim.state.turn!.stealEligible).toEqual([others[0]]);
    expect(sim.state.deadline).toBe(sim.now + 10_000);
  });
  it('niemand kan stelen: meteen onthulling', () => {
    const { sim, active } = placing(2);
    sim.state = { ...sim.state, players: sim.state.players.map((p) => (p.id !== active ? { ...p, tokens: 0 } : p)) };
    sim.intent(active, 'pickSlot', { slot: 1 });
    sim.intent(active, 'lock');
    expect(sim.state.phase).toBe('reveal');
  });
  it('stelen kost 1 token; steel op de plek van de actieve speler kan niet', () => {
    const { sim, active, others } = placing(3);
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    const r = sim.intent(others[0], 'steal', { slot: 2 });
    expect(replies(r)[0]).toMatch(/Daar legde/);
    expect(P(sim, others[0]).tokens).toBe(2);
    sim.intent(others[0], 'steal', { slot: 1 });
    expect(P(sim, others[0]).tokens).toBe(1);
    expect(sim.state.turn!.steals).toEqual([{ playerId: others[0], slot: 1 }]);
  });
  it('de actieve speler kan niet stelen', () => {
    const { sim, active } = placing(3);
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    sim.intent(active, 'steal', { slot: 0 });
    expect(sim.state.turn!.steals).toHaveLength(0);
  });
  it('wie het eerst tikt heeft de plek; de ander krijgt "Net bezet" en houdt zijn token', () => {
    const { sim, active, others } = placing(4);
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    sim.intent(others[0], 'steal', { slot: 1 });
    const r = sim.intent(others[1], 'steal', { slot: 1 });
    expect(replies(r)[0]).toBe('Net bezet door Speler' + others[0].slice(1) + ', kies een andere plek');
    expect(P(sim, others[1]).tokens).toBe(2);
    sim.intent(others[1], 'steal', { slot: 4 });
    expect(sim.state.turn!.steals).toHaveLength(2);
  });
  it('max 1 steal per speler per beurt', () => {
    const { sim, active, others } = placing(4);
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    sim.intent(others[0], 'steal', { slot: 1 });
    sim.intent(others[0], 'steal', { slot: 0 });
    expect(sim.state.turn!.steals).toHaveLength(1);
    expect(P(sim, others[0]).tokens).toBe(1);
  });
  it('venster sluit eerder als iedereen gestolen of gepast heeft', () => {
    const { sim, active, others } = placing(4);
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    sim.intent(others[0], 'steal', { slot: 1 });
    sim.intent(others[1], 'pass');
    expect(sim.state.phase).toBe('stealing');
    sim.intent(others[2], 'pass');
    expect(sim.state.phase).toBe('reveal');
  });
  it('venster sluit vanzelf na 10 s', () => {
    const { sim, active } = placing(3);
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    sim.advance(9_900);
    expect(sim.state.phase).toBe('stealing');
    sim.advance(200);
    expect(sim.state.phase).toBe('reveal');
  });
  it('tik na het sluiten: "Te laat", geen token kwijt', () => {
    const { sim, active, others } = placing(3);
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    sim.advance(10_100);
    const r = sim.intent(others[0], 'steal', { slot: 1 });
    expect(replies(r)[0]).toBe('Te laat, het venster is dicht. Je token blijft van jou.');
    expect(P(sim, others[0]).tokens).toBe(2);
  });
  it('0 tokens: stelen kan niet', () => {
    const { sim, active, others } = placing(3);
    sim.state = { ...sim.state, players: sim.state.players.map((p) => (p.id === others[1] ? { ...p, tokens: 0 } : p)) };
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    sim.intent(others[1], 'steal', { slot: 1 });
    expect(sim.state.turn!.steals).toHaveLength(0);
  });
  it('timer op 0 zonder plek: elke plek is stelbaar', () => {
    const { sim, others } = placing(3);
    sim.advance(45_000);
    expect(sim.state.phase).toBe('stealing');
    expect(sim.state.turn!.slot).toBeNull();
    sim.intent(others[0], 'steal', { slot: 1 });
    expect(sim.state.turn!.steals).toHaveLength(1);
  });
  it('speler gaat offline in het venster: venster wacht niet op hem', () => {
    const { sim, active, others } = placing(3);
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    sim.intent(others[0], 'pass');
    sim.send({ type: 'presence', onlineIds: [active, others[0]] });
    expect(sim.state.phase).toBe('reveal');
  });
});

describe('uitkomsten van stelen', () => {
  it('actieve speler goed: kaart voor hem, alle stelers token kwijt', () => {
    const { sim, active, others } = placing(4);
    sim.intent(active, 'pickSlot', { slot: 1 }); // 1967–1985, 1979 = goed
    sim.intent(active, 'lock');
    sim.intent(others[0], 'steal', { slot: 2 });
    sim.intent(others[1], 'steal', { slot: 0 });
    sim.intent(others[2], 'pass');
    expect(sim.state.reveal).toMatchObject({ correct: true, stolenBy: null });
    expect(P(sim, active).cards.map((c) => c.year)).toEqual([1967, 1979, 1985, 1991, 2004]);
    expect(P(sim, others[0]).tokens).toBe(1);
    expect(P(sim, others[1]).tokens).toBe(1);
  });
  it('actieve speler fout, steler goed: kaart naar de goede plek in de tijdlijn van de steler', () => {
    const { sim, active, others } = placing(4);
    sim.intent(active, 'pickSlot', { slot: 2 }); // 1985–1991 = fout
    sim.intent(active, 'lock');
    sim.intent(others[0], 'steal', { slot: 1 }); // goed
    sim.intent(others[1], 'steal', { slot: 4 }); // fout
    sim.intent(others[2], 'pass');
    expect(sim.state.reveal).toMatchObject({ correct: false, stolenBy: others[0] });
    const thief = P(sim, others[0]);
    expect(thief.cards.some((c) => c.year === 1979)).toBe(true);
    expect(thief.cards.map((c) => c.year)).toEqual([...thief.cards.map((c) => c.year)].sort((a, b) => a - b));
    expect(thief.tokens).toBe(1); // token is op
    expect(P(sim, others[1]).tokens).toBe(1);
    expect(P(sim, active).cards).toHaveLength(4);
    expect(sim.state.reveal!.steals.map((x) => x.outcome)).toEqual(['won', 'lost']);
  });
  it('twee goede stelers (zelfde jaar): eerste wint, ander krijgt token terug', () => {
    const { sim, active, others } = placing(4, [1970, 1980, 1990], 1980);
    sim.intent(active, 'pickSlot', { slot: 0 }); // fout
    sim.intent(active, 'lock');
    sim.intent(others[1], 'steal', { slot: 2 }); // goed (na 1980)
    sim.intent(others[0], 'steal', { slot: 1 }); // ook goed (vóór 1980)
    sim.intent(others[2], 'pass');
    expect(sim.state.reveal!.stolenBy).toBe(others[1]);
    expect(P(sim, others[0]).tokens).toBe(2); // terug
    expect(P(sim, others[1]).tokens).toBe(1);
  });
  it('niemand goed: kaart weg, steel-tokens weg', () => {
    const { sim, active, others } = placing(3);
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    sim.intent(others[0], 'steal', { slot: 4 });
    sim.intent(others[1], 'pass');
    expect(sim.state.reveal).toMatchObject({ correct: false, stolenBy: null });
    expect(sim.state.discard.map((s) => s.id)).toContain('raadsel');
    expect(P(sim, others[0]).tokens).toBe(1);
  });
  it('steler die door een gestolen kaart het doel haalt, wint meteen', () => {
    const { sim, active, others } = placing(3);
    const st = structuredClone(sim.state);
    st.settings.goal = 6;
    st.players.find((p) => p.id === others[0])!.cards = [1950, 1960, 1990, 2000, 2010].map((y) => card(y));
    sim.state = st;
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    sim.intent(others[0], 'steal', { slot: 1 });
    sim.intent(others[1], 'pass');
    sim.advance(5000); // onthulling voorbij
    expect(sim.state.phase).toBe('winner');
    expect(sim.state.winnerId).toBe(others[0]);
  });
  it('steal-statistiek voor "Meesterdief"', () => {
    const { sim, active, others } = placing(3);
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    sim.intent(others[0], 'steal', { slot: 1 });
    sim.intent(others[1], 'pass');
    expect(P(sim, others[0]).stats.steals).toBe(1);
  });
  it('publieke status toont steals maar geen nummergegevens tijdens het venster', () => {
    const { sim, active, others } = placing(3);
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    sim.intent(others[0], 'steal', { slot: 1 });
    const json = JSON.stringify(toPublic(sim.state));
    expect(json).toContain(`"steals":[{"playerId":"${others[0]}","slot":1}]`);
    expect(json).not.toContain('Raadsel');
    expect(json).not.toContain('raadsel');
  });
});

describe('overslaan (1 token)', () => {
  it('kost 1 token, nieuw nummer, timer opnieuw, niet onthuld', () => {
    const { sim, active } = placing(2);
    sim.advance(20_000);
    sim.intent(active, 'pickSlot', { slot: 1 });
    sim.intent(active, 'skip');
    expect(P(sim, active).tokens).toBe(1);
    expect(sim.state.phase).toBe('placing');
    expect(sim.state.turn!.song!.id).not.toBe('raadsel');
    expect(sim.state.turn!.slot).toBeNull();
    expect(sim.state.deadline).toBe(sim.now + 45_000);
    expect(sim.state.discard.map((s) => s.id)).toContain('raadsel');
    expect(sim.state.reveal).toBeNull();
    expect(sim.state.notice?.kind).toBe('skip');
  });
  it('mag vaker zolang je tokens hebt; bij 0 tokens niet', () => {
    const { sim, active } = placing(2);
    sim.intent(active, 'skip');
    sim.playing();
    sim.intent(active, 'skip');
    sim.playing();
    expect(P(sim, active).tokens).toBe(0);
    const id = sim.state.turn!.song!.id;
    const r = sim.intent(active, 'skip');
    expect(sim.state.turn!.song!.id).toBe(id);
    expect(replies(r)[0]).toMatch(/geen/);
  });
  it('niet na het vastzetten', () => {
    const { sim, active } = placing(3);
    sim.intent(active, 'pickSlot', { slot: 1 });
    sim.intent(active, 'lock');
    sim.intent(active, 'skip');
    expect(P(sim, active).tokens).toBe(2);
  });
  it('kan niet als er geen nummers meer zijn', () => {
    const { sim, active } = placing(2);
    sim.state = { ...sim.state, deck: [], discard: [] };
    sim.intent(active, 'skip');
    expect(P(sim, active).tokens).toBe(2);
    expect(toPublic(sim.state).canSkipSong).toBe(false);
  });
});

describe('kopen (3 tokens, alleen bij de beurtstart)', () => {
  function turnStart(tokens: number) {
    const sim = new Sim(songs(YEARS), 4);
    sim.join('a', 'A');
    sim.join('b', 'B');
    sim.intent('a', 'start');
    sim.until('turnStart');
    const id = sim.active().id;
    sim.state = { ...sim.state, players: sim.state.players.map((p) => (p.id === id ? { ...p, tokens } : p)) };
    return { sim, id };
  }
  it('kaart meteen goed in je tijdlijn, −3 tokens, daarna speel je gewoon je beurt', () => {
    const { sim, id } = turnStart(3);
    sim.intent(id, 'buy');
    const me = P(sim, id);
    expect(me.tokens).toBe(0);
    expect(me.cards).toHaveLength(2);
    expect(me.cards.map((c) => c.year)).toEqual([...me.cards.map((c) => c.year)].sort((a, b) => a - b));
    expect(sim.state.phase).toBe('turnStart');
    expect(toPublic(sim.state).lastBuy?.playerId).toBe(id);
    expect(sim.state.deadline! - sim.now).toBeGreaterThanOrEqual(3500);
    sim.advance(sim.state.deadline! - sim.now);
    expect(sim.state.phase).toBe('placing');
  });
  it('niet met minder dan 3 tokens', () => {
    const { sim, id } = turnStart(2);
    const r = sim.intent(id, 'buy');
    expect(P(sim, id).cards).toHaveLength(1);
    expect(replies(r)[0]).toMatch(/3 tokens/);
  });
  it('maar één keer per beurt', () => {
    const { sim, id } = turnStart(5);
    sim.intent(id, 'buy');
    sim.intent(id, 'buy');
    expect(P(sim, id).tokens).toBe(2);
    expect(P(sim, id).cards).toHaveLength(2);
  });
  it('niet meer zodra de muziek speelt', () => {
    const { sim, id } = turnStart(3);
    sim.intent(id, 'startSong');
    sim.intent(id, 'buy');
    expect(P(sim, id).tokens).toBe(3);
  });
  it('alleen de actieve speler', () => {
    const { sim, id } = turnStart(3);
    const other = sim.state.players.find((p) => p.id !== id)!.id;
    sim.state = { ...sim.state, players: sim.state.players.map((p) => ({ ...p, tokens: 3 })) };
    sim.intent(other, 'buy');
    expect(P(sim, other).cards).toHaveLength(1);
  });
  it('wie door kopen het doel haalt, wint meteen; het nummer wordt niet gespeeld', () => {
    const { sim, id } = turnStart(3);
    const st = structuredClone(sim.state);
    st.settings.goal = 6;
    st.players.find((p) => p.id === id)!.cards = [1950, 1960, 1970, 1980, 1990].map((y) => card(y));
    sim.state = st;
    sim.effects = [];
    sim.intent(id, 'buy');
    expect(sim.state.phase).toBe('winner');
    expect(sim.state.winnerId).toBe(id);
    expect(sim.effects.some((e) => e.type === 'play')).toBe(false);
  });
});

describe('titel + artiest: claim, bezwaar en verdienen', () => {
  function claimed(n = 4, slot = 1) {
    const r = placing(n);
    r.sim.intent(r.active, 'claim', { on: true });
    r.sim.intent(r.active, 'pickSlot', { slot });
    r.sim.intent(r.active, 'lock');
    for (const id of r.others) r.sim.intent(id, 'pass');
    expect(r.sim.state.phase).toBe('reveal');
    r.sim.advance(5000);
    return r;
  }
  it('na de onthulling 6 s bezwaar voor de andere online spelers', () => {
    const { sim, others } = claimed(4);
    expect(sim.state.phase).toBe('objection');
    expect(sim.state.objection).toMatchObject({ open: true, needed: 2 });
    expect(sim.state.objection!.eligible).toEqual(others);
    expect(toPublic(sim.state).reveal?.song.title).toBe('Raadsel');
  });
  it('geen bezwaar = +1 token, ook als de plaatsing fout was', () => {
    const { sim, active } = claimed(4, 3); // fout geplaatst
    expect(sim.state.reveal!.correct).toBe(false);
    sim.advance(6000);
    expect(sim.state.objection!.result).toEqual({ ok: true, awarded: true, maxed: false });
    expect(P(sim, active).tokens).toBe(3);
  });
  it('minstens de helft (naar boven afgerond) "Fout!": afgekeurd, sluit meteen', () => {
    const { sim, active, others } = claimed(4); // 3 anderen → 2 nodig
    sim.intent(others[0], 'objection', { verdict: 'fout' });
    expect(sim.state.objection!.open).toBe(true);
    sim.intent(others[1], 'objection', { verdict: 'fout' });
    expect(sim.state.objection!.open).toBe(false);
    expect(sim.state.objection!.result!.ok).toBe(false);
    expect(P(sim, active).tokens).toBe(2);
  });
  it('één "Fout!" van drie is niet genoeg; sluit eerder als iedereen getikt heeft', () => {
    const { sim, others } = claimed(4);
    sim.intent(others[0], 'objection', { verdict: 'fout' });
    sim.intent(others[1], 'objection', { verdict: 'klopt' });
    sim.intent(others[2], 'objection', { verdict: 'klopt' });
    expect(sim.state.objection!.open).toBe(false);
    expect(sim.state.objection!.result!.ok).toBe(true);
  });
  it('drempel: helft naar boven afgerond', () => {
    expect(claimApproved(1, 1)).toBe(false); // 1 andere speler
    expect(claimApproved(0, 1)).toBe(true);
    expect(claimApproved(1, 2)).toBe(true); // 3 anderen
    expect(claimApproved(2, 2)).toBe(false);
    expect(claimApproved(0, 0)).toBe(true); // niemand online
  });
  it('de actieve speler stemt niet; stemmen maar één keer', () => {
    const { sim, active, others } = claimed(4);
    sim.intent(active, 'objection', { verdict: 'fout' });
    sim.intent(others[0], 'objection', { verdict: 'fout' });
    sim.intent(others[0], 'objection', { verdict: 'fout' });
    expect(Object.keys(sim.state.objection!.votes)).toEqual([others[0]]);
  });
  it('max 5 tokens: geen extra token, wel "Max 5"', () => {
    const r = placing(3);
    r.sim.state = { ...r.sim.state, players: r.sim.state.players.map((p) => (p.id === r.active ? { ...p, tokens: 5 } : p)) };
    r.sim.intent(r.active, 'claim', { on: true });
    r.sim.intent(r.active, 'pickSlot', { slot: 1 });
    r.sim.intent(r.active, 'lock');
    for (const id of r.others) r.sim.intent(id, 'pass');
    r.sim.advance(5000);
    r.sim.advance(6000);
    expect(r.sim.state.objection!.result).toEqual({ ok: true, awarded: false, maxed: true });
    expect(P(r.sim, r.active).tokens).toBe(5);
  });
  it('zonder claim geen bezwaarfase', () => {
    const r = placing(3);
    r.sim.intent(r.active, 'pickSlot', { slot: 1 });
    r.sim.intent(r.active, 'lock');
    for (const id of r.others) r.sim.intent(id, 'pass');
    r.sim.advance(5000);
    expect(r.sim.state.phase).not.toBe('objection');
  });
  it('te laat stemmen: melding', () => {
    const { sim, others } = claimed(3);
    sim.advance(6000);
    const r = sim.intent(others[0], 'objection', { verdict: 'fout' });
    expect(replies(r)[0]).toMatch(/Te laat/);
  });
  it('na het bezwaar volgt de volgende beurt', () => {
    const { sim } = claimed(3);
    sim.advance(6000);
    sim.advance(2500);
    expect(['turnStart', 'standings']).toContain(sim.state.phase);
  });
});

describe('hostmenu', () => {
  it('pauze bevriest de timer; hervatten gaat verder met de resterende tijd', () => {
    const { sim } = placing(3);
    sim.advance(10_000);
    const left = sim.state.deadline! - sim.now;
    sim.effects = [];
    sim.intent('p0', 'pause');
    expect(sim.state.paused).toBe(true);
    expect(sim.effects).toContainEqual({ type: 'stop' });
    sim.advance(120_000);
    expect(sim.state.phase).toBe('placing');
    sim.intent('p0', 'pause');
    expect(sim.state.paused).toBe(false);
    expect(sim.state.deadline! - sim.now).toBe(left);
    expect(sim.effects.some((e) => e.type === 'play')).toBe(true);
  });
  it('alleen de host kan pauzeren; tijdens pauze kan niemand stelen', () => {
    const { sim, active, others } = placing(3);
    sim.intent(others[1], 'pause');
    expect(sim.state.paused).toBe(false);
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    sim.intent('p0', 'pause');
    const thief = others.find((id) => id !== 'p0') ?? others[0];
    sim.intent(thief, 'steal', { slot: 1 });
    expect(sim.state.turn!.steals).toHaveLength(0);
  });
  it('beurt overslaan: steel-tokens terug, volgende speler', () => {
    const { sim, active, others } = placing(4);
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    sim.intent(others[0], 'steal', { slot: 1 });
    sim.intent('p0', 'skipTurn');
    expect(P(sim, others[0]).tokens).toBe(2);
    expect(sim.state.turn?.playerId ?? null).not.toBe(active);
    expect(P(sim, active).cards).toHaveLength(4);
  });
  it('uitslag omdraaien (verkeerd jaartal): kaart erbij of eraf, tot de volgende beurt', () => {
    const { sim, active, others } = placing(3);
    sim.intent(active, 'pickSlot', { slot: 2 }); // fout
    sim.intent(active, 'lock');
    for (const id of others) sim.intent(id, 'pass');
    expect(toPublic(sim.state).canFlipVerdict).toBe(true);
    sim.intent('p0', 'flipVerdict');
    expect(sim.state.reveal).toMatchObject({ correct: true, flipped: true });
    expect(P(sim, active).cards).toHaveLength(5);
    sim.intent('p0', 'flipVerdict');
    expect(P(sim, active).cards).toHaveLength(4);
  });
  it('omdraaien kan niet na een steal', () => {
    const { sim, active, others } = placing(3);
    sim.intent(active, 'pickSlot', { slot: 2 });
    sim.intent(active, 'lock');
    sim.intent(others[0], 'steal', { slot: 1 });
    sim.intent(others[1], 'pass');
    expect(toPublic(sim.state).canFlipVerdict).toBe(false);
  });
  it('titel + artiest omdraaien past het token aan', () => {
    const r = placing(3);
    r.sim.intent(r.active, 'claim', { on: true });
    r.sim.intent(r.active, 'pickSlot', { slot: 1 });
    r.sim.intent(r.active, 'lock');
    for (const id of r.others) r.sim.intent(id, 'pass');
    r.sim.advance(5000);
    r.sim.advance(6000);
    expect(P(r.sim, r.active).tokens).toBe(3);
    r.sim.intent('p0', 'flipClaim');
    expect(P(r.sim, r.active).tokens).toBe(2);
    expect(r.sim.state.objection!.result!.ok).toBe(false);
  });
  it('speler verwijderen: uit de volgorde, zijn kaarten weg, beurtvolgorde klopt', () => {
    const sim = new Sim(songs(YEARS), 2);
    for (const id of ['a', 'b', 'c', 'd']) sim.join(id, id.toUpperCase());
    sim.intent('a', 'start');
    sim.until('turnStart');
    const activeIdx = sim.state.turnIndex;
    const activeId = sim.active().id;
    const victim = sim.state.players.find((p) => p.id !== activeId && p.id !== 'a')!.id;
    sim.intent('a', 'removePlayer', { target: victim });
    expect(sim.state.players.map((p) => p.id)).not.toContain(victim);
    expect(sim.state.players[sim.state.turnIndex].id).toBe(activeId);
    expect(sim.state.turnIndex).toBeLessThanOrEqual(activeIdx);
  });
  it('actieve speler verwijderen: zijn beurt eindigt', () => {
    const sim = new Sim(songs(YEARS), 2);
    for (const id of ['a', 'b', 'c']) sim.join(id, id.toUpperCase());
    sim.intent('a', 'start');
    sim.until('turnStart');
    let activeId = sim.active().id;
    if (activeId === 'a') {
      sim.intent('a', 'skipTurn');
      sim.until('turnStart');
      activeId = sim.active().id;
    }
    sim.intent('a', 'removePlayer', { target: activeId });
    expect(sim.state.players.map((p) => p.id)).not.toContain(activeId);
    expect(sim.state.turn?.playerId ?? null).not.toBe(activeId);
  });
  it('host kan zichzelf niet verwijderen', () => {
    const { sim } = placing(3);
    sim.intent('p0', 'removePlayer', { target: 'p0' });
    expect(sim.state.players).toHaveLength(3);
  });
  it('spel stoppen: terug naar de lobby met dezelfde spelers', () => {
    const { sim } = placing(3);
    sim.intent('p0', 'stopGame');
    expect(sim.state.phase).toBe('lobby');
    expect(sim.state.players).toHaveLength(3);
    expect(sim.state.players.every((p) => p.cards.length === 0 && p.tokens === 2)).toBe(true);
  });
});
