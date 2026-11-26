// De spelmotor: apply(state, event) → { state, effects }.
// Alleen de tv draait dit. Alle tijden komen uit events (tv-klok), willekeur uit state.rng.
// Regels: docs/concept-v2/CONCEPT.md hoofdstuk 2.
import type {
  ApplyResult,
  Effect,
  GameEvent,
  GameState,
  IntentBase,
  Player,
  PlayerStats,
  Settings,
  Song,
  StealResult,
  Turn,
} from './types';
import {
  BUY_COST,
  GOALS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  PLACE_TIMES,
  PLAYER_COLORS,
  START_TOKENS,
  START_YEAR_MAX,
  START_YEAR_MIN,
  TIMES,
  addTokens,
  gapNeighbours,
  insertCard,
  isCorrectPlacement,
  neighbours,
  oldestStartIndex,
  songToCard,
} from './rules';
import { shuffle } from './rng';

export const DEFAULT_SETTINGS: Settings = { goal: 10, placeSeconds: 45, tempo: 1 };

const TOO_LATE = 'Te laat, het venster is dicht. Je token blijft van jou.';
const newStats = (): PlayerStats => ({ correct: 0, oldestCorrect: null, closestMiss: null, steals: 0 });

export function createGame(opts: {
  code: string;
  songs: Song[];
  seed: number;
  now: number;
  settings?: Partial<Settings>;
}): GameState {
  const [deck, rng] = shuffle(opts.songs, opts.seed);
  return {
    version: 1,
    code: opts.code,
    phase: 'lobby',
    players: [],
    hostId: null,
    settings: { ...DEFAULT_SETTINGS, ...opts.settings },
    deck,
    discard: [],
    played: [],
    failedIds: [],
    turn: null,
    turnIndex: 0,
    startIndex: 0,
    round: 1,
    deadline: null,
    phaseStartedAt: opts.now,
    now: opts.now,
    rng,
    reveal: null,
    winnerId: null,
    dealInfo: null,
    notice: null,
    objection: null,
    lastBuy: null,
    pausedRemaining: null,
    songsPlayed: 0,
    processedActions: [],
    paused: false,
  };
}

const isIntent = (e: GameEvent): e is GameEvent & IntentBase => 'actionId' in e;

export function apply(prev: GameState, event: GameEvent): ApplyResult {
  const s: GameState = structuredClone(prev);
  const fx: Effect[] = [];
  s.now = Math.max(s.now, event.now);

  if (isIntent(event)) {
    if (s.processedActions.includes(event.actionId)) return { state: prev, effects: [] };
    if (event.type === 'join') {
      handleJoin(s, event, fx);
    } else {
      const p = s.players.find((x) => x.id === event.playerId);
      if (!p || p.secret !== event.secret) return { state: prev, effects: [] };
      handleIntent(s, event, p, fx);
    }
    s.processedActions.push(event.actionId);
    if (s.processedActions.length > 300) s.processedActions.splice(0, s.processedActions.length - 300);
  } else {
    switch (event.type) {
      case 'tick':
        tick(s, fx);
        break;
      case 'resume':
        resume(s, fx);
        break;
      case 'songPlaying':
        if (s.phase === 'placing' && s.turn?.song?.id === event.songId) s.turn.playing = true;
        break;
      case 'songFailed':
        if (s.phase === 'placing' && s.turn?.song?.id === event.songId && !s.turn.locked) songFailed(s, fx);
        break;
      case 'presence':
        for (const p of s.players) p.online = event.onlineIds.includes(p.id);
        if (s.phase === 'stealing' && !s.paused) maybeCloseSteal(s, fx);
        if (s.phase === 'objection' && s.objection?.open && !s.paused) maybeCloseObjection(s, fx);
        break;
    }
  }

  if (changed(prev, s)) s.version = prev.version + 1;
  else return { state: prev, effects: fx };
  return { state: s, effects: fx };
}

function changed(a: GameState, b: GameState): boolean {
  // `now` alleen telt niet als wijziging (anders elke tick een nieuwe versie).
  return JSON.stringify({ ...a, now: 0, version: 0 }) !== JSON.stringify({ ...b, now: 0, version: 0 });
}

const reply = (fx: Effect[], playerId: string, text: string) => fx.push({ type: 'reply', playerId, text });
const byId = (s: GameState, id: string | null | undefined) => s.players.find((p) => p.id === id);

// ---------------- intenties ----------------

function handleJoin(s: GameState, e: Extract<GameEvent, { type: 'join' }>, fx: Effect[]) {
  const existing = byId(s, e.playerId);
  const name = e.name.trim().slice(0, 10);
  if (existing) {
    if (existing.secret !== e.secret) return;
    if (s.phase === 'lobby' && name) existing.name = name;
    if (s.phase === 'lobby' && validColor(s, e.color, existing.id)) existing.color = e.color;
    return;
  }
  if (s.phase !== 'lobby') {
    reply(fx, e.playerId, 'Het spel is al begonnen. Instappen kan in een volgende versie.');
    return;
  }
  if (s.players.length >= MAX_PLAYERS) {
    reply(fx, e.playerId, 'Het spel zit vol (10 spelers).');
    return;
  }
  if (!name) return;
  if (!validColor(s, e.color, null)) {
    reply(fx, e.playerId, 'Die kleur is net gekozen. Kies een andere.');
    return;
  }
  const player: Player = {
    id: e.playerId,
    secret: e.secret,
    name,
    color: e.color,
    cards: [],
    tokens: START_TOKENS,
    online: true,
    joinedAt: e.now,
    stats: newStats(),
  };
  s.players.push(player);
  if (!s.hostId) s.hostId = player.id;
  fx.push({ type: 'sound', sound: 'plop' });
}

function validColor(s: GameState, color: string, selfId: string | null): boolean {
  if (!PLAYER_COLORS.some((c) => c.hex === color)) return false;
  return !s.players.some((p) => p.color === color && p.id !== selfId);
}

function handleIntent(s: GameState, e: GameEvent & IntentBase, p: Player, fx: Effect[]) {
  const isHost = s.hostId === p.id;
  const t = s.turn;
  const isActive = t?.playerId === p.id;
  // Tijdens een pauze kan alleen de host iets (en mag de actieve speler nog schuiven).
  const hostOnly = ['pause', 'skipTurn', 'flipVerdict', 'flipClaim', 'removePlayer', 'restartSong', 'stopGame'];
  if (s.paused && !hostOnly.includes(e.type) && e.type !== 'pickSlot' && e.type !== 'claim') {
    reply(fx, p.id, 'Het spel staat op pauze.');
    return;
  }
  switch (e.type) {
    case 'start':
      if (isHost && s.phase === 'lobby' && s.players.length >= MIN_PLAYERS) deal(s, fx);
      break;
    case 'settings':
      if (!isHost || s.phase !== 'lobby') break;
      if (e.goal !== undefined && (GOALS as readonly number[]).includes(e.goal)) s.settings.goal = e.goal;
      if (e.placeSeconds !== undefined && (PLACE_TIMES as readonly number[]).includes(e.placeSeconds))
        s.settings.placeSeconds = e.placeSeconds;
      break;
    case 'startSong':
      if (isActive && s.phase === 'turnStart') beginPlacing(s, fx);
      break;
    case 'buy':
      if (isActive) buy(s, p, fx);
      break;
    case 'pickSlot': {
      if (!isActive || s.phase !== 'placing' || !t || t.locked) break;
      if (e.slot === null || (Number.isInteger(e.slot) && e.slot >= 0 && e.slot <= p.cards.length)) t.slot = e.slot;
      break;
    }
    case 'claim':
      if (isActive && s.phase === 'placing' && t && !t.locked) t.claim = Boolean(e.on);
      break;
    case 'skip':
      if (isActive) skip(s, p, fx);
      break;
    case 'lock':
      if (!isActive) break;
      if (s.phase !== 'placing' || !t || t.locked) {
        reply(fx, p.id, 'Te laat, de tijd was om.');
        break;
      }
      if (t.slot === null) break;
      lockIn(s, fx);
      break;
    case 'steal':
      steal(s, p, e.slot, fx);
      break;
    case 'pass':
      if (s.phase === 'stealing' && t && !isActive && !t.passed.includes(p.id) && !t.steals.some((x) => x.playerId === p.id)) {
        t.passed.push(p.id);
        maybeCloseSteal(s, fx);
      }
      break;
    case 'objection':
      objectionVote(s, p, e.verdict, fx);
      break;
    case 'rematch':
      if (isHost && s.phase === 'winner') rematch(s, fx);
      break;
    case 'lobby':
      if (isHost && s.phase === 'winner') toLobby(s, fx);
      break;
    // ---- hostmenu ----
    case 'pause':
      if (isHost) togglePause(s, fx);
      break;
    case 'skipTurn':
      if (isHost) skipTurn(s, fx);
      break;
    case 'flipVerdict':
      if (isHost) flipVerdict(s, p, fx);
      break;
    case 'flipClaim':
      if (isHost) flipClaim(s, p, fx);
      break;
    case 'removePlayer':
      if (isHost) removePlayer(s, p, e.target, fx);
      break;
    case 'restartSong':
      if (isHost && s.phase === 'placing' && t?.song && !t.locked) {
        t.playing = false;
        s.phaseStartedAt = s.now;
        fx.push({ type: 'play', song: t.song });
      }
      break;
    case 'stopGame':
      if (isHost && s.phase !== 'lobby') toLobby(s, fx);
      break;
  }
}

// ---------------- verloop ----------------

function scaled(s: GameState, ms: number) {
  return Math.round(ms * (s.settings.tempo || 1));
}

function setPhase(s: GameState, phase: GameState['phase'], durationMs: number | null) {
  s.phase = phase;
  s.phaseStartedAt = s.now;
  s.deadline = durationMs === null ? null : s.now + scaled(s, durationMs);
}

function placeMs(s: GameState) {
  return s.settings.placeSeconds ? s.settings.placeSeconds * 1000 : null;
}

function tick(s: GameState, fx: Effect[]) {
  if (s.notice && s.now >= s.notice.until) s.notice = null;
  if (s.paused) return;
  if (s.phase === 'placing' && s.turn?.song && !s.turn.playing && !s.turn.locked) {
    if (s.now - s.phaseStartedAt >= TIMES.songCheck) {
      songFailed(s, fx);
      return;
    }
  }
  if (s.deadline === null || s.now < s.deadline) return;
  switch (s.phase) {
    case 'deal':
      beginTurn(s, fx);
      break;
    case 'turnStart':
      beginPlacing(s, fx);
      break;
    case 'placing':
      lockIn(s, fx);
      break;
    case 'stealing':
      resolve(s, fx);
      break;
    case 'reveal':
      afterReveal(s, fx);
      break;
    case 'objection':
      if (s.objection?.open) closeObjection(s, fx);
      else endTurn(s, fx);
      break;
    case 'standings':
      beginTurn(s, fx);
      break;
  }
}

function resume(s: GameState, fx: Effect[]) {
  const durations: Partial<Record<GameState['phase'], number | null>> = {
    deal: TIMES.deal,
    turnStart: TIMES.turnStart,
    stealing: TIMES.steal,
    reveal: TIMES.reveal,
    objection: s.objection?.open ? TIMES.objection : TIMES.objectionResult,
    standings: TIMES.standings,
    placing: placeMs(s),
  };
  if (!(s.phase in durations) || s.paused) return;
  const slot = s.turn?.slot ?? null;
  setPhase(s, s.phase, durations[s.phase] ?? null);
  if ((s.phase === 'placing' || s.phase === 'stealing') && s.turn?.song) {
    s.turn.playing = s.phase === 'stealing';
    s.turn.slot = slot;
    fx.push({ type: 'play', song: s.turn.song });
  }
}

function deal(s: GameState, fx: Effect[]) {
  const used = new Set<number>();
  for (const p of s.players) {
    let idx = s.deck.findIndex((x) => x.year >= START_YEAR_MIN && x.year <= START_YEAR_MAX && !used.has(x.year));
    if (idx < 0) idx = s.deck.findIndex((x) => !used.has(x.year));
    if (idx < 0) idx = 0;
    const [song] = s.deck.splice(idx, 1);
    if (!song) continue;
    used.add(song.year);
    p.cards = [songToCard(song)];
    s.played.push(song);
  }
  s.startIndex = oldestStartIndex(s.players);
  s.turnIndex = s.startIndex;
  s.round = 1;
  const starter = s.players[s.startIndex];
  s.dealInfo = { playerId: starter.id, year: starter.cards[0]?.year ?? 0 };
  s.winnerId = null;
  s.reveal = null;
  s.turn = null;
  s.objection = null;
  s.lastBuy = null;
  setPhase(s, 'deal', TIMES.deal);
  fx.push({ type: 'sound', sound: 'turn' });
}

function newTurn(playerId: string): Turn {
  return {
    playerId,
    song: null,
    slot: null,
    locked: false,
    songAttempts: 0,
    playing: false,
    claim: false,
    bought: false,
    steals: [],
    passed: [],
    stealEligible: [],
  };
}

function beginTurn(s: GameState, fx: Effect[]) {
  const p = s.players[s.turnIndex];
  s.turn = newTurn(p.id);
  s.reveal = null;
  s.objection = null;
  s.lastBuy = null;
  setPhase(s, 'turnStart', TIMES.turnStart);
  fx.push({ type: 'sound', sound: 'turn' });
}

/** Pakt het volgende nummer; schudt afgelegde nummers terug als de stapel op is. */
export function drawSong(s: GameState): Song | null {
  if (s.deck.length === 0 && s.discard.length) {
    const pool = s.discard.filter((x) => !s.failedIds.includes(x.id));
    s.discard = [];
    const [shuffled, rng] = shuffle(pool, s.rng);
    s.deck = shuffled;
    s.rng = rng;
  }
  while (s.deck.length) {
    const song = s.deck.shift()!;
    if (!s.failedIds.includes(song.id)) return song;
  }
  return null;
}

/** Is er nog een nummer te trekken (eventueel na opnieuw schudden)? */
export function songAvailable(s: GameState): boolean {
  const ok = (x: Song) => !s.failedIds.includes(x.id);
  return s.deck.some(ok) || s.discard.some(ok);
}

function beginPlacing(s: GameState, fx: Effect[]) {
  if (!s.turn) return;
  const song = drawSong(s);
  s.turn.song = song;
  s.turn.slot = null;
  s.turn.playing = false;
  s.turn.songAttempts += 1;
  setPhase(s, 'placing', placeMs(s));
  if (song) fx.push({ type: 'play', song });
  else s.notice = { kind: 'info', text: 'De stapel is op.', until: s.now + TIMES.notice };
}

function songFailed(s: GameState, fx: Effect[]) {
  if (!s.turn?.song) return;
  s.failedIds.push(s.turn.song.id);
  s.notice = {
    kind: 'songFailed',
    text: 'Dit nummer wil niet. We pakken een ander. Niemand verliest iets.',
    until: s.now + TIMES.notice,
  };
  const keepSlot = s.turn.slot;
  const keepClaim = s.turn.claim;
  beginPlacing(s, fx);
  s.turn.slot = keepSlot;
  s.turn.claim = keepClaim;
}

// ---------------- tokens op je eigen beurt (CONCEPT 2.6) ----------------

function buy(s: GameState, p: Player, fx: Effect[]) {
  const t = s.turn!;
  if (s.phase !== 'turnStart') {
    reply(fx, p.id, 'Kopen kan alleen bij je beurtstart, vóór de muziek.');
    return;
  }
  if (t.bought) return;
  if (p.tokens < BUY_COST) {
    reply(fx, p.id, `Kopen kost ${BUY_COST} tokens (je hebt er ${p.tokens}).`);
    return;
  }
  const song = drawSong(s);
  if (!song) {
    reply(fx, p.id, 'De stapel is op.');
    return;
  }
  p.tokens -= BUY_COST;
  const card = songToCard(song);
  p.cards = insertCard(p.cards, card);
  s.played.push(song);
  t.bought = true;
  s.lastBuy = { playerId: p.id, card };
  fx.push({ type: 'sound', sound: 'kassa' });
  if (p.cards.length >= s.settings.goal) {
    // Wie door kopen op het doel komt, wint meteen; het nummer wordt niet meer gespeeld.
    win(s, p, fx);
    return;
  }
  // Even tijd om de gekochte kaart te zien; daarna start het nummer.
  const minDeadline = s.now + scaled(s, TIMES.buyShow);
  if (s.deadline === null || s.deadline < minDeadline) s.deadline = minDeadline;
}

function skip(s: GameState, p: Player, fx: Effect[]) {
  const t = s.turn!;
  if (s.phase !== 'placing' || t.locked) {
    reply(fx, p.id, 'Overslaan kan alleen vóór het vastzetten.');
    return;
  }
  if (p.tokens < 1) {
    reply(fx, p.id, 'Overslaan kost 1 token; je hebt er geen.');
    return;
  }
  if (!songAvailable(s)) {
    reply(fx, p.id, 'Er zijn geen nummers meer om naar over te slaan.');
    return;
  }
  p.tokens -= 1;
  if (t.song) s.discard.push(t.song); // niet onthuld
  s.notice = { kind: 'skip', text: `${p.name} slaat dit nummer over (−1 token)`, until: s.now + 2000 };
  fx.push({ type: 'sound', sound: 'coin' });
  const claim = t.claim;
  beginPlacing(s, fx);
  t.claim = claim;
}

// ---------------- vastzetten en stelen (CONCEPT 2.5) ----------------

function lockIn(s: GameState, fx: Effect[]) {
  const t = s.turn;
  if (!t) return;
  t.locked = true;
  t.playing = true;
  fx.push({ type: 'sound', sound: 'lock' });
  if (!t.song) {
    endTurn(s, fx);
    return;
  }
  t.stealEligible = s.players.filter((x) => x.id !== t.playerId && x.online && x.tokens >= 1).map((x) => x.id);
  if (t.stealEligible.length === 0) {
    resolve(s, fx);
    return;
  }
  setPhase(s, 'stealing', TIMES.steal);
  fx.push({ type: 'sound', sound: 'stealOpen' });
}

function steal(s: GameState, p: Player, slot: number, fx: Effect[]) {
  const t = s.turn;
  if (!t || t.playerId === p.id) return;
  if (s.phase !== 'stealing') {
    if (['reveal', 'objection', 'turnStart', 'standings'].includes(s.phase)) reply(fx, p.id, TOO_LATE);
    return;
  }
  if (t.steals.some((x) => x.playerId === p.id) || t.passed.includes(p.id)) return; // max 1 per beurt
  if (p.tokens < 1) {
    reply(fx, p.id, 'Je hebt geen tokens om te stelen.');
    return;
  }
  const active = byId(s, t.playerId)!;
  if (!Number.isInteger(slot) || slot < 0 || slot > active.cards.length) return;
  if (t.slot !== null && slot === t.slot) {
    reply(fx, p.id, `Daar legde ${active.name} al. Kies een andere plek.`);
    return;
  }
  const taken = t.steals.find((x) => x.slot === slot);
  if (taken) {
    reply(fx, p.id, `Net bezet door ${byId(s, taken.playerId)?.name ?? 'iemand'}, kies een andere plek`);
    return;
  }
  p.tokens -= 1;
  t.steals.push({ playerId: p.id, slot });
  fx.push({ type: 'sound', sound: 'steal' });
  maybeCloseSteal(s, fx);
}

function maybeCloseSteal(s: GameState, fx: Effect[]) {
  const t = s.turn;
  if (!t || s.phase !== 'stealing') return;
  const open = t.stealEligible.filter((id) => {
    const pl = byId(s, id);
    return pl && pl.online && !t.passed.includes(id) && !t.steals.some((x) => x.playerId === id);
  });
  if (open.length === 0) resolve(s, fx);
}

/** Pure uitkomst van een beurt met steals (exporteerd voor tests). */
export function resolveSteals(
  years: number[],
  activeSlot: number | null,
  year: number,
  steals: { playerId: string; slot: number }[],
): { activeCorrect: boolean; results: StealResult[]; winner: string | null } {
  const activeCorrect = isCorrectPlacement(years, activeSlot, year);
  let winner: string | null = null;
  const results: StealResult[] = steals.map((st) => {
    const correct = isCorrectPlacement(years, st.slot, year);
    if (activeCorrect || !correct) return { ...st, correct, outcome: 'lost' as const };
    if (!winner) {
      winner = st.playerId;
      return { ...st, correct, outcome: 'won' as const };
    }
    return { ...st, correct, outcome: 'refund' as const };
  });
  return { activeCorrect, results, winner };
}

function resolve(s: GameState, fx: Effect[]) {
  const t = s.turn;
  if (!t) return;
  t.locked = true;
  const p = byId(s, t.playerId)!;
  const song = t.song;
  if (!song) {
    endTurn(s, fx);
    return;
  }
  const years = p.cards.map((c) => c.year);
  const { activeCorrect, results, winner } = resolveSteals(years, t.slot, song.year, t.steals);
  const between = neighbours(years, song.year);
  const card = songToCard(song);
  if (activeCorrect && t.slot !== null) {
    p.cards = [...p.cards.slice(0, t.slot), card, ...p.cards.slice(t.slot)];
    s.played.push(song);
    p.stats.correct += 1;
    if (p.stats.oldestCorrect === null || song.year < p.stats.oldestCorrect) p.stats.oldestCorrect = song.year;
  } else {
    if (t.slot !== null) {
      const [l, r] = gapNeighbours(years, t.slot);
      const diff = l !== null && song.year < l ? l - song.year : r !== null && song.year > r ? song.year - r : 0;
      if (diff > 0 && (p.stats.closestMiss === null || diff < p.stats.closestMiss)) p.stats.closestMiss = diff;
    }
    const w = winner ? byId(s, winner) : null;
    if (w) {
      w.cards = insertCard(w.cards, card);
      w.stats.steals += 1;
      if (w.stats.oldestCorrect === null || song.year < w.stats.oldestCorrect) w.stats.oldestCorrect = song.year;
      s.played.push(song);
    } else {
      s.discard.push(song);
    }
  }
  for (const r of results) {
    if (r.outcome === 'refund') {
      const pl = byId(s, r.playerId);
      if (pl) pl.tokens = addTokens(pl.tokens, 1);
    }
  }
  s.songsPlayed += 1;
  s.reveal = {
    playerId: p.id,
    song,
    slot: t.slot,
    correct: activeCorrect,
    between,
    cardsAfter: p.cards.length,
    steals: results,
    stolenBy: winner,
    claim: t.claim,
    flipped: false,
  };
  setPhase(s, 'reveal', TIMES.reveal);
  fx.push({ type: 'sound', sound: 'drum' });
  fx.push({ type: 'volume', level: 0.3 });
  fx.push({ type: 'sound', sound: activeCorrect ? 'good' : winner ? 'kassa' : 'bad' });
}

// ---------------- bezwaar en verdienen (CONCEPT 2.7) ----------------

function afterReveal(s: GameState, fx: Effect[]) {
  fx.push({ type: 'volume', level: 1 });
  const r = s.reveal;
  if (r?.claim) {
    const eligible = s.players.filter((x) => x.id !== r.playerId && x.online).map((x) => x.id);
    s.objection = {
      playerId: r.playerId,
      open: true,
      eligible,
      votes: {},
      needed: Math.ceil(eligible.length / 2),
      result: null,
    };
    setPhase(s, 'objection', TIMES.objection);
    if (eligible.length === 0) closeObjection(s, fx);
    return;
  }
  endTurn(s, fx);
}

function objectionVote(s: GameState, p: Player, verdict: 'fout' | 'klopt', fx: Effect[]) {
  const o = s.objection;
  if (!o || s.phase !== 'objection' || !o.open) {
    if (o && o.playerId !== p.id) reply(fx, p.id, 'Te laat, het bezwaar is al gesloten.');
    return;
  }
  if (!o.eligible.includes(p.id) || o.votes[p.id]) return;
  o.votes[p.id] = verdict === 'fout' ? 'fout' : 'klopt';
  maybeCloseObjection(s, fx);
}

function maybeCloseObjection(s: GameState, fx: Effect[]) {
  const o = s.objection;
  if (!o?.open) return;
  const fout = Object.values(o.votes).filter((v) => v === 'fout').length;
  const waiting = o.eligible.filter((id) => !o.votes[id] && byId(s, id)?.online);
  if (fout >= o.needed && o.needed > 0) closeObjection(s, fx);
  else if (waiting.length === 0) closeObjection(s, fx);
}

/** Goed tenzij minstens de helft (naar boven afgerond) van de andere online spelers "Fout!" tikt. */
export function claimApproved(foutVotes: number, needed: number): boolean {
  return needed === 0 || foutVotes < needed;
}

function closeObjection(s: GameState, fx: Effect[]) {
  const o = s.objection!;
  const fout = Object.values(o.votes).filter((v) => v === 'fout').length;
  const ok = claimApproved(fout, o.needed);
  const p = byId(s, o.playerId);
  let awarded = false;
  let maxed = false;
  if (ok && p) {
    if (p.tokens >= 5) maxed = true;
    else {
      p.tokens = addTokens(p.tokens, 1);
      awarded = true;
      fx.push({ type: 'sound', sound: 'coin' });
    }
  }
  o.open = false;
  o.result = { ok, awarded, maxed };
  setPhase(s, 'objection', TIMES.objectionResult);
}

// ---------------- einde van een beurt ----------------

function win(s: GameState, p: Player, fx: Effect[]) {
  s.winnerId = p.id;
  s.turn = null;
  s.objection = null;
  setPhase(s, 'winner', null);
  fx.push({ type: 'stop' });
  fx.push({ type: 'sound', sound: 'fanfare' });
}

function endTurn(s: GameState, fx: Effect[]) {
  fx.push({ type: 'stop' });
  fx.push({ type: 'volume', level: 1 });
  // Actieve speler, steler of koper: wie het doel haalt, wint.
  const w = s.players.find((x) => x.cards.length >= s.settings.goal);
  if (w) {
    win(s, w, fx);
    return;
  }
  if (s.players.length === 0) return;
  s.turnIndex = (s.turnIndex + 1) % s.players.length;
  s.objection = null;
  if (s.turnIndex === s.startIndex) {
    s.round += 1;
    s.turn = null;
    setPhase(s, 'standings', TIMES.standings);
  } else {
    beginTurn(s, fx);
  }
}

// ---------------- hostmenu ----------------

function togglePause(s: GameState, fx: Effect[]) {
  if (['lobby', 'winner'].includes(s.phase)) return;
  if (!s.paused) {
    s.paused = true;
    s.pausedRemaining = s.deadline === null ? null : Math.max(0, s.deadline - s.now);
    s.deadline = null;
    fx.push({ type: 'stop' });
  } else {
    s.paused = false;
    s.deadline = s.pausedRemaining === null ? null : s.now + s.pausedRemaining;
    s.pausedRemaining = null;
    if ((s.phase === 'placing' || s.phase === 'stealing') && s.turn?.song) {
      s.phaseStartedAt = s.now;
      if (s.phase === 'placing') s.turn.playing = false;
      fx.push({ type: 'play', song: s.turn.song });
    }
  }
}

function refundSteals(s: GameState) {
  for (const st of s.turn?.steals ?? []) {
    const pl = byId(s, st.playerId);
    if (pl) pl.tokens = addTokens(pl.tokens, 1);
  }
}

function skipTurn(s: GameState, fx: Effect[]) {
  if (!['turnStart', 'placing', 'stealing'].includes(s.phase) || !s.turn) return;
  const p = byId(s, s.turn.playerId);
  refundSteals(s);
  if (s.turn.song) s.discard.push(s.turn.song);
  s.notice = { kind: 'info', text: `Beurt van ${p?.name ?? 'speler'} overgeslagen`, until: s.now + 3000 };
  if (s.paused) {
    s.paused = false;
    s.pausedRemaining = null;
  }
  endTurn(s, fx);
}

/** Plaatsing omdraaien (verkeerd jaartal e.d.), alleen als er niets gestolen is; tot de volgende beurt. */
function flipVerdict(s: GameState, host: Player, fx: Effect[]) {
  const r = s.reveal;
  if (!r || !['reveal', 'objection', 'standings'].includes(s.phase)) {
    reply(fx, host.id, 'Omdraaien kan alleen direct na een onthulling.');
    return;
  }
  if (r.stolenBy || r.steals.some((x) => x.outcome === 'refund')) {
    reply(fx, host.id, 'Omdraaien kan niet als er gestolen is.');
    return;
  }
  const p = byId(s, r.playerId);
  if (!p) return;
  if (r.correct) {
    p.cards = p.cards.filter((c) => c.songId !== r.song.id);
    s.played = s.played.filter((x) => x.id !== r.song.id);
    s.discard.push(r.song);
  } else {
    p.cards = insertCard(p.cards, songToCard(r.song));
    s.discard = s.discard.filter((x) => x.id !== r.song.id);
    s.played.push(r.song);
  }
  r.correct = !r.correct;
  r.flipped = !r.flipped;
  r.cardsAfter = p.cards.length;
  s.notice = { kind: 'info', text: `De host draaide de uitslag om: ${r.correct ? 'GOED' : 'MIS'}`, until: s.now + 3000 };
}

function flipClaim(s: GameState, host: Player, fx: Effect[]) {
  const o = s.objection;
  if (!o?.result || s.phase !== 'objection') {
    reply(fx, host.id, 'Er is nu geen titel + artiest om om te draaien.');
    return;
  }
  const p = byId(s, o.playerId);
  if (!p) return;
  if (o.result.ok) {
    if (o.result.awarded) p.tokens = addTokens(p.tokens, -1);
    o.result = { ok: false, awarded: false, maxed: false };
  } else {
    const maxed = p.tokens >= 5;
    if (!maxed) p.tokens = addTokens(p.tokens, 1);
    o.result = { ok: true, awarded: !maxed, maxed };
  }
  s.deadline = s.now + scaled(s, TIMES.objectionResult);
}

function removePlayer(s: GameState, host: Player, target: string, fx: Effect[]) {
  if (target === host.id) return;
  const idx = s.players.findIndex((x) => x.id === target);
  if (idx < 0) return;
  const t = s.turn;
  if (t?.playerId === target && ['reveal', 'objection'].includes(s.phase)) {
    reply(fx, host.id, 'Even wachten tot deze beurt klaar is.');
    return;
  }
  if (t?.playerId === target && ['turnStart', 'placing', 'stealing'].includes(s.phase)) {
    skipTurn(s, fx); // zet turnIndex al op de volgende speler
  }
  // Uit lopende steal/bezwaar halen
  if (s.turn) {
    s.turn.steals = s.turn.steals.filter((x) => x.playerId !== target);
    s.turn.stealEligible = s.turn.stealEligible.filter((x) => x !== target);
  }
  if (s.objection) s.objection.eligible = s.objection.eligible.filter((x) => x !== target);
  const name = s.players[idx].name;
  s.players.splice(idx, 1);
  const n = s.players.length;
  if (n === 0) return;
  if (idx < s.turnIndex) s.turnIndex -= 1;
  if (idx < s.startIndex) s.startIndex -= 1;
  s.turnIndex %= n;
  s.startIndex %= n;
  s.notice = { kind: 'info', text: `${name} is uit het spel gehaald`, until: s.now + 3000 };
  if (s.phase === 'stealing') maybeCloseSteal(s, fx);
  if (s.phase === 'objection') maybeCloseObjection(s, fx);
}

function toLobby(s: GameState, fx: Effect[]) {
  resetPlayers(s);
  s.phase = 'lobby';
  s.deadline = null;
  s.turn = null;
  s.reveal = null;
  s.winnerId = null;
  s.objection = null;
  s.lastBuy = null;
  s.paused = false;
  s.pausedRemaining = null;
  fx.push({ type: 'stop' });
}

function resetPlayers(s: GameState) {
  // Gespeelde nummers komen pas terug als de rest op is: onderop de stapel.
  const used: Song[] = [...s.discard];
  s.discard = [];
  for (const p of s.players) {
    p.cards = [];
    p.tokens = START_TOKENS;
    p.stats = newStats();
  }
  s.deck = [...s.deck, ...used, ...s.played];
  s.played = [];
  s.songsPlayed = 0;
}

function rematch(s: GameState, fx: Effect[]) {
  // Nog niet gespeelde nummers geschud bovenop; gespeelde nummers onderop.
  const used = [...s.discard, ...s.played];
  s.discard = [];
  s.played = [];
  for (const p of s.players) {
    p.cards = [];
    p.tokens = START_TOKENS;
    p.stats = newStats();
  }
  s.songsPlayed = 0;
  const [rest, rng] = shuffle(s.deck, s.rng);
  s.rng = rng;
  s.deck = [...rest, ...used];
  deal(s, fx);
}
