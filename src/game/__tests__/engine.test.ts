import { describe, expect, it } from 'vitest';
import { apply, drawSong } from '../engine';
import { toPublic } from '../public';
import { correctSlots } from '../rules';
import { Sim, aid, songs } from './helpers';

const YEARS = [
  1955, 1962, 1964, 1967, 1969, 1972, 1975, 1977, 1979, 1981, 1983, 1985, 1987, 1989, 1991, 1993, 1995, 1997,
  1999, 2001, 2003, 2005, 2007, 2009, 2011, 2013, 2015, 2018, 2020, 2022, 1980, 1980, 1990, 2000, 1970, 1960,
];

function lobby(n = 3) {
  const sim = new Sim(songs(YEARS));
  for (let i = 0; i < n; i++) sim.join(`p${i}`, `Speler${i}`);
  return sim;
}

function started(n = 3) {
  const sim = lobby(n);
  sim.intent('p0', 'start');
  return sim;
}

/** Iedereen past in het steelvenster. */
function passAll(sim: Sim) {
  if (sim.state.phase !== 'stealing') return;
  for (const id of sim.state.turn!.stealEligible) sim.intent(id, 'pass');
}

/** Speelt de beurt van de actieve speler; goed=true kiest een goede plek. */
function playTurn(sim: Sim, goed: boolean) {
  sim.until('turnStart');
  const p = sim.active();
  sim.intent(p.id, 'startSong');
  const song = sim.playing();
  const years = p.cards.map((c) => c.year);
  const good = correctSlots(years, song.year);
  const slot = goed ? good[0] : [...Array(years.length + 1).keys()].find((s) => !good.includes(s));
  sim.intent(p.id, 'pickSlot', { slot: slot ?? good[0] });
  sim.intent(p.id, 'lock');
  passAll(sim);
  return { p, song, slot };
}

describe('lobby en aanmelden', () => {
  it('eerste speler wordt host, volgorde = binnenkomst', () => {
    const sim = lobby(3);
    expect(sim.state.hostId).toBe('p0');
    expect(sim.state.players.map((p) => p.id)).toEqual(['p0', 'p1', 'p2']);
    expect(sim.state.players.every((p) => p.tokens === 2)).toBe(true);
  });
  it('kleur kan maar één keer gekozen worden', () => {
    const sim = lobby(1);
    const r = sim.join('p9', 'X', 0);
    expect(sim.state.players).toHaveLength(1);
    expect(r.effects.some((e) => e.type === 'reply')).toBe(true);
  });
  it('max 10 spelers', () => {
    const sim = lobby(10);
    sim.join('p10', 'Elf', 0);
    expect(sim.state.players).toHaveLength(10);
  });
  it('naam max 10 tekens', () => {
    const sim = new Sim(songs(YEARS));
    sim.join('a', 'Bartholomeus de Grote');
    expect(sim.state.players[0].name).toBe('Bartholome');
  });
  it('alleen de host kan starten, en pas met 2 spelers', () => {
    const one = lobby(1);
    one.intent('p0', 'start');
    expect(one.state.phase).toBe('lobby');
    const sim = lobby(3);
    sim.intent('p1', 'start');
    expect(sim.state.phase).toBe('lobby');
    sim.intent('p0', 'start');
    expect(sim.state.phase).toBe('deal');
  });
  it('verkeerd spelersgeheim wordt genegeerd', () => {
    const sim = lobby(2);
    const before = sim.state;
    sim.send({ type: 'start', playerId: 'p0', secret: 'fout', actionId: aid() } as never);
    expect(sim.state).toBe(before);
  });
  it('elk actieId telt maar één keer', () => {
    const sim = lobby(2);
    const id = aid();
    sim.send({ type: 'settings', playerId: 'p0', secret: 'geheim-p0', actionId: id, goal: 6 } as never);
    const v = sim.state.version;
    sim.send({ type: 'settings', playerId: 'p0', secret: 'geheim-p0', actionId: id, goal: 8 } as never);
    expect(sim.state.settings.goal).toBe(6);
    expect(sim.state.version).toBe(v);
  });
  it('instellingen: alleen geldige waarden, alleen host', () => {
    const sim = lobby(2);
    sim.intent('p0', 'settings', { goal: 7 });
    expect(sim.state.settings.goal).toBe(10);
    sim.intent('p1', 'settings', { goal: 8 });
    expect(sim.state.settings.goal).toBe(10);
    sim.intent('p0', 'settings', { goal: 8, placeSeconds: 60 });
    expect(sim.state.settings).toMatchObject({ goal: 8, placeSeconds: 60 });
  });
  it('na de start kan niemand meer instappen (fase 1)', () => {
    const sim = started(2);
    sim.join('laat', 'Laat', 5);
    expect(sim.state.players).toHaveLength(2);
  });
});

describe('startkaarten', () => {
  it('ieder 1 open kaart, uniek startjaar tussen 1960 en 2015', () => {
    const sim = started(6);
    const years = sim.state.players.map((p) => p.cards[0].year);
    expect(sim.state.players.every((p) => p.cards.length === 1)).toBe(true);
    expect(new Set(years).size).toBe(6);
    expect(years.every((y) => y >= 1960 && y <= 2015)).toBe(true);
  });
  it('de speler met de oudste startkaart begint', () => {
    const sim = started(4);
    const years = sim.state.players.map((p) => p.cards[0].year);
    const oldest = years.indexOf(Math.min(...years));
    expect(sim.state.startIndex).toBe(oldest);
    sim.until('turnStart');
    expect(sim.state.turn?.playerId).toBe(`p${oldest}`);
    expect(sim.state.dealInfo?.year).toBe(Math.min(...years));
  });
});

describe('een beurt', () => {
  it('beurtstart start vanzelf na 6 s', () => {
    const sim = started(2);
    sim.until('turnStart');
    sim.advance(5900);
    expect(sim.state.phase).toBe('turnStart');
    sim.advance(200);
    expect(sim.state.phase).toBe('placing');
    expect(sim.effects.some((e) => e.type === 'play')).toBe(true);
  });
  it('"Start nummer" start meteen, alleen voor de actieve speler', () => {
    const sim = started(2);
    sim.until('turnStart');
    const other = sim.state.players.find((p) => p.id !== sim.state.turn!.playerId)!;
    sim.intent(other.id, 'startSong');
    expect(sim.state.phase).toBe('turnStart');
    sim.intent(sim.active().id, 'startSong');
    expect(sim.state.phase).toBe('placing');
  });
  it('alleen de actieve speler kan een plek kiezen; wisselen mag', () => {
    const sim = started(2);
    sim.until('turnStart');
    const act = sim.active();
    sim.intent(act.id, 'startSong');
    const other = sim.state.players.find((p) => p.id !== act.id)!;
    sim.intent(other.id, 'pickSlot', { slot: 0 });
    expect(sim.state.turn!.slot).toBeNull();
    sim.intent(act.id, 'pickSlot', { slot: 1 });
    sim.intent(act.id, 'pickSlot', { slot: 0 });
    expect(sim.state.turn!.slot).toBe(0);
    sim.intent(act.id, 'pickSlot', { slot: 5 });
    expect(sim.state.turn!.slot).toBe(0);
  });
  it('vastzetten zonder plek kan niet', () => {
    const sim = started(2);
    sim.until('turnStart');
    sim.intent(sim.active().id, 'startSong');
    sim.playing();
    sim.intent(sim.active().id, 'lock');
    expect(sim.state.phase).toBe('placing');
  });
  it('goed geplaatst: kaart op de goede plek in de tijdlijn', () => {
    const sim = started(2);
    const { p, song } = playTurn(sim, true);
    expect(sim.state.phase).toBe('reveal');
    expect(sim.state.reveal?.correct).toBe(true);
    const me = sim.state.players.find((x) => x.id === p.id)!;
    expect(me.cards).toHaveLength(2);
    expect(me.cards.map((c) => c.year)).toEqual([...me.cards.map((c) => c.year)].sort((a, b) => a - b));
    expect(me.cards.some((c) => c.songId === song.id)).toBe(true);
  });
  it('fout geplaatst: kaart gaat weg (naar de aflegstapel)', () => {
    const sim = started(2);
    const { p, song } = playTurn(sim, false);
    expect(sim.state.reveal?.correct).toBe(false);
    expect(sim.state.players.find((x) => x.id === p.id)!.cards).toHaveLength(1);
    expect(sim.state.discard.map((s) => s.id)).toContain(song.id);
  });
  it('timer op 0 met een gekozen plek: die plek telt', () => {
    const sim = started(2);
    sim.until('turnStart');
    const p = sim.active();
    sim.intent(p.id, 'startSong');
    const song = sim.playing();
    const slot = correctSlots(p.cards.map((c) => c.year), song.year)[0];
    sim.intent(p.id, 'pickSlot', { slot });
    sim.advance(45_000);
    expect(sim.state.phase).toBe('stealing');
    expect(sim.state.turn!.slot).toBe(slot);
    sim.advance(10_000);
    expect(sim.state.phase).toBe('reveal');
    expect(sim.state.reveal?.correct).toBe(true);
  });
  it('timer op 0 zonder plek: telt als fout', () => {
    const sim = started(2);
    sim.until('turnStart');
    sim.intent(sim.active().id, 'startSong');
    sim.playing();
    sim.advance(45_000);
    expect(sim.state.phase).toBe('stealing');
    passAll(sim);
    expect(sim.state.phase).toBe('reveal');
    expect(sim.state.reveal?.correct).toBe(false);
    expect(sim.state.reveal?.slot).toBeNull();
  });
  it('te laat vastzetten geeft een "Te laat"-melding', () => {
    const sim = started(2);
    sim.until('turnStart');
    const p = sim.active();
    sim.intent(p.id, 'startSong');
    sim.playing();
    sim.advance(45_000);
    const r = sim.intent(p.id, 'lock');
    expect(r.effects.some((e) => e.type === 'reply' && e.text.startsWith('Te laat'))).toBe(true);
  });
  it('geen timer (instelling 0): wacht tot vastzetten', () => {
    const sim = lobby(2);
    sim.intent('p0', 'settings', { placeSeconds: 0 });
    sim.intent('p0', 'start');
    sim.until('turnStart');
    sim.intent(sim.active().id, 'startSong');
    sim.playing();
    sim.advance(300_000);
    expect(sim.state.phase).toBe('placing');
  });
  it('na de onthulling volgt de volgende speler', () => {
    const sim = started(3);
    const { p } = playTurn(sim, true);
    sim.until('turnStart');
    const idx = sim.state.players.findIndex((x) => x.id === p.id);
    expect(sim.state.turnIndex).toBe((idx + 1) % 3);
  });
  it('tussenstand na elke volledige ronde', () => {
    const sim = started(2);
    playTurn(sim, true);
    sim.advance(5000);
    expect(sim.state.phase).toBe('turnStart');
    playTurn(sim, true);
    sim.advance(5000);
    expect(sim.state.phase).toBe('standings');
    expect(sim.state.round).toBe(2);
    sim.advance(6000);
    expect(sim.state.phase).toBe('turnStart');
    expect(sim.state.turnIndex).toBe(sim.state.startIndex);
  });
});

describe('nummer speelt niet (CONCEPT 2.9)', () => {
  it('na 6 s zonder "speelt"-signaal: ander nummer, timer opnieuw, niemand verliest iets', () => {
    const sim = started(2);
    sim.until('turnStart');
    sim.intent(sim.active().id, 'startSong');
    const first = sim.state.turn!.song!;
    sim.intent(sim.active().id, 'pickSlot', { slot: 0 });
    sim.advance(6100);
    expect(sim.state.phase).toBe('placing');
    expect(sim.state.turn!.song!.id).not.toBe(first.id);
    expect(sim.state.failedIds).toContain(first.id);
    expect(sim.state.notice?.kind).toBe('songFailed');
    expect(sim.state.deadline).toBe(sim.state.now + 45_000);
    expect(sim.state.turn!.slot).toBe(0);
    sim.advance(4000);
    expect(sim.state.notice).toBeNull();
  });
  it('songFailed-signaal van de speler werkt direct', () => {
    const sim = started(2);
    sim.until('turnStart');
    sim.intent(sim.active().id, 'startSong');
    const first = sim.state.turn!.song!;
    sim.send({ type: 'songFailed', songId: first.id });
    expect(sim.state.turn!.song!.id).not.toBe(first.id);
  });
  it('een nummer dat speelt wordt niet vervangen', () => {
    const sim = started(2);
    sim.until('turnStart');
    sim.intent(sim.active().id, 'startSong');
    const s = sim.playing();
    sim.advance(10_000);
    expect(sim.state.turn!.song!.id).toBe(s.id);
  });
  it('"speelt niet"-nummers komen niet terug bij opnieuw schudden', () => {
    const sim = new Sim(songs([1970, 1980, 1990]));
    sim.state = { ...sim.state, deck: [], discard: songs([1970, 1980, 1990]), failedIds: ['s1'] };
    const s = structuredClone(sim.state);
    const drawn = [drawSong(s), drawSong(s), drawSong(s)].map((x) => x?.id ?? null);
    expect(drawn).not.toContain('s1');
    expect(drawn.filter(Boolean)).toHaveLength(2);
  });
});

describe('stapel op', () => {
  it('afgelegde nummers worden opnieuw geschud, nooit kaarten van een tijdlijn', () => {
    const sim = new Sim(songs([1965, 1975, 1985, 1995]));
    sim.join('a', 'A');
    sim.join('b', 'B');
    sim.intent('a', 'start');
    // 2 startkaarten, 2 over in de stapel
    expect(sim.state.deck).toHaveLength(2);
    const onTimelines = sim.state.players.flatMap((p) => p.cards.map((c) => c.songId));
    playTurn(sim, false);
    playTurn(sim, false);
    sim.until('turnStart');
    expect(sim.state.deck).toHaveLength(0);
    sim.intent(sim.active().id, 'startSong');
    expect(sim.state.turn!.song).not.toBeNull();
    expect(onTimelines).not.toContain(sim.state.turn!.song!.id);
  });
});

describe('winnen', () => {
  it('eerste met het doel aan kaarten wint; de startkaart telt mee', () => {
    const many = songs(Array.from({ length: 80 }, (_, i) => 1950 + (i % 70)));
    const sim = new Sim(many, 3);
    sim.join('a', 'A');
    sim.join('b', 'B');
    sim.intent('a', 'settings', { goal: 6 });
    sim.intent('a', 'start');
    let guard = 0;
    while (sim.state.phase !== 'winner' && guard++ < 60) {
      playTurn(sim, true);
      sim.advance(5000);
      if (sim.state.phase === 'standings') sim.advance(6000);
    }
    expect(sim.state.phase).toBe('winner');
    const w = sim.state.players.find((p) => p.id === sim.state.winnerId)!;
    expect(w.cards).toHaveLength(6); // 1 startkaart + 5 goed
    expect(w.id).toBe(sim.state.players[sim.state.startIndex].id);
  });
  it('"Nog een potje": zelfde spelers, nieuwe startkaarten, gespeelde nummers onderop', () => {
    const many = songs(Array.from({ length: 60 }, (_, i) => 1960 + (i % 55)));
    const sim = new Sim(many, 5);
    sim.join('a', 'A');
    sim.join('b', 'B');
    sim.intent('a', 'settings', { goal: 6 });
    sim.intent('a', 'start');
    while (sim.state.phase !== 'winner') {
      playTurn(sim, true);
      sim.advance(5000);
      if (sim.state.phase === 'standings') sim.advance(6000);
    }
    const playedIds = sim.state.played.map((s) => s.id);
    sim.intent('b', 'rematch');
    expect(sim.state.phase).toBe('winner');
    sim.intent('a', 'rematch');
    expect(sim.state.phase).toBe('deal');
    expect(sim.state.players.map((p) => p.cards.length)).toEqual([1, 1]);
    expect(sim.state.winnerId).toBeNull();
    const total = sim.state.deck.length + sim.state.played.length + sim.state.discard.length;
    expect(total).toBe(60);
    // De nieuwe startkaarten komen niet uit de vorige tijdlijnen (die liggen onderop).
    expect(sim.state.players.some((p) => playedIds.includes(p.cards[0].songId))).toBe(false);
  });
});

describe('geen spoilers in de publieke status (CONCEPT 7.4)', () => {
  it('vóór de onthulling staat er niets over het lopende nummer in', () => {
    const sim = started(3);
    sim.until('turnStart');
    const p = sim.active();
    sim.intent(p.id, 'startSong');
    const song = sim.state.turn!.song!;
    sim.playing();
    sim.intent(p.id, 'pickSlot', { slot: 0 });
    const json = JSON.stringify(toPublic(sim.state));
    expect(json).not.toContain(song.id);
    expect(json).not.toContain(song.title);
    expect(json).not.toContain(song.artist);
    expect(json).not.toContain(song.uri);
    expect(json).not.toContain('geheim-');
    expect(json).not.toMatch(/"deck"|"discard"|"failedIds"|"secret"/);
    // het jaar van het lopende nummer mag alleen voorkomen als het al op een open kaart staat
    const openYears = sim.state.players.flatMap((x) => x.cards.map((c) => c.year));
    if (!openYears.includes(song.year)) expect(json).not.toContain(String(song.year));
  });
  it('bij de onthulling wel', () => {
    const sim = started(2);
    const { song } = playTurn(sim, true);
    const json = JSON.stringify(toPublic(sim.state));
    expect(json).toContain(song.title);
  });
});

describe('presence', () => {
  it('markeert spelers online/offline', () => {
    const sim = lobby(3);
    sim.send({ type: 'presence', onlineIds: ['p0', 'p2'] });
    expect(sim.state.players.map((p) => p.online)).toEqual([true, false, true]);
  });
});

describe('versies', () => {
  it('alleen echte wijzigingen verhogen het versienummer', () => {
    const sim = lobby(2);
    const v = sim.state.version;
    sim.advance(100);
    expect(sim.state.version).toBe(v);
    sim.intent('p0', 'settings', { goal: 8 });
    expect(sim.state.version).toBe(v + 1);
  });
  it('apply verandert de oude status niet', () => {
    const sim = lobby(2);
    const before = JSON.stringify(sim.state);
    apply(sim.state, { type: 'start', playerId: 'p0', secret: 'geheim-p0', actionId: 'x', now: sim.now });
    expect(JSON.stringify(sim.state)).toBe(before);
  });
});

describe('tv ververst (CONCEPT 2.9)', () => {
  it('resume: plaatsen begint opnieuw, nummer vanaf het begin, gekozen plek blijft', () => {
    const sim = started(2);
    sim.until('turnStart');
    const p = sim.active();
    sim.intent(p.id, 'startSong');
    const song = sim.playing();
    sim.intent(p.id, 'pickSlot', { slot: 1 });
    sim.now += 120_000; // tv was 2 minuten weg
    sim.effects = [];
    sim.send({ type: 'resume' });
    expect(sim.state.phase).toBe('placing');
    expect(sim.state.deadline).toBe(sim.now + 45_000);
    expect(sim.state.turn!.slot).toBe(1);
    expect(sim.state.turn!.playing).toBe(false);
    expect(sim.effects).toContainEqual({ type: 'play', song });
  });
  it('resume in de lobby verandert niets', () => {
    const sim = lobby(2);
    const v = sim.state.version;
    sim.send({ type: 'resume' });
    expect(sim.state.version).toBe(v);
  });
});
