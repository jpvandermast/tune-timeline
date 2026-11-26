// De spelmotor: apply(state, event) → { state, effects }.
// Alleen de tv draait dit. Alle tijden komen uit events (tv-klok), willekeur uit state.rng.
import type { ApplyResult, Effect, GameEvent, GameState, IntentBase, Player, Settings, Song } from './types';
import {
  GOALS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  PLACE_TIMES,
  PLAYER_COLORS,
  START_TOKENS,
  START_YEAR_MAX,
  START_YEAR_MIN,
  TIMES,
  gapNeighbours,
  isCorrectPlacement,
  neighbours,
  oldestStartIndex,
  songToCard,
} from './rules';
import { shuffle } from './rng';

export const DEFAULT_SETTINGS: Settings = { goal: 10, placeSeconds: 45, tempo: 1 };

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

// ---------------- intenties ----------------

function handleJoin(s: GameState, e: Extract<GameEvent, { type: 'join' }>, fx: Effect[]) {
  const existing = s.players.find((p) => p.id === e.playerId);
  const name = e.name.trim().slice(0, 10);
  if (existing) {
    if (existing.secret !== e.secret) return;
    if (s.phase === 'lobby' && name) existing.name = name;
    if (s.phase === 'lobby' && validColor(s, e.color, existing.id)) existing.color = e.color;
    return;
  }
  if (s.phase !== 'lobby') {
    fx.push({ type: 'reply', playerId: e.playerId, text: 'Het spel is al begonnen. Instappen kan in een volgende versie.' });
    return;
  }
  if (s.players.length >= MAX_PLAYERS) {
    fx.push({ type: 'reply', playerId: e.playerId, text: 'Het spel zit vol (10 spelers).' });
    return;
  }
  if (!name) return;
  if (!validColor(s, e.color, null)) {
    fx.push({ type: 'reply', playerId: e.playerId, text: 'Die kleur is net gekozen. Kies een andere.' });
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
    stats: { correct: 0, oldestCorrect: null, closestMiss: null },
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
  const isActive = s.turn?.playerId === p.id;
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
      if (isActive && s.phase === 'turnStart' && !s.paused) beginPlacing(s, fx);
      break;
    case 'pickSlot': {
      if (!isActive || s.phase !== 'placing' || !s.turn || s.turn.locked) {
        if (isActive && s.turn?.locked) fx.push({ type: 'reply', playerId: p.id, text: 'Al vastgezet.' });
        break;
      }
      const n = p.cards.length;
      if (e.slot === null || (Number.isInteger(e.slot) && e.slot >= 0 && e.slot <= n)) s.turn.slot = e.slot;
      break;
    }
    case 'lock':
      if (!isActive) break;
      if (s.phase !== 'placing' || !s.turn || s.turn.locked) {
        fx.push({ type: 'reply', playerId: p.id, text: 'Te laat, de tijd was om.' });
        break;
      }
      if (s.turn.slot === null) break;
      resolve(s, fx);
      break;
    case 'rematch':
      if (isHost && s.phase === 'winner') rematch(s, fx);
      break;
    case 'lobby':
      if (isHost && s.phase === 'winner') {
        resetPlayers(s);
        s.phase = 'lobby';
        s.deadline = null;
        s.turn = null;
        s.reveal = null;
        s.winnerId = null;
      }
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
      resolve(s, fx);
      break;
    case 'reveal':
      afterReveal(s, fx);
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
    reveal: TIMES.reveal,
    standings: TIMES.standings,
    placing: s.settings.placeSeconds ? s.settings.placeSeconds * 1000 : null,
  };
  if (!(s.phase in durations)) return;
  const slot = s.turn?.slot ?? null;
  setPhase(s, s.phase, durations[s.phase] ?? null);
  if (s.phase === 'placing' && s.turn?.song && !s.turn.locked) {
    s.turn.playing = false;
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
  setPhase(s, 'deal', TIMES.deal);
  fx.push({ type: 'sound', sound: 'turn' });
}

function beginTurn(s: GameState, fx: Effect[]) {
  const p = s.players[s.turnIndex];
  s.turn = { playerId: p.id, song: null, slot: null, locked: false, songAttempts: 0, playing: false };
  s.reveal = null;
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

function beginPlacing(s: GameState, fx: Effect[]) {
  if (!s.turn) return;
  const song = drawSong(s);
  s.turn.song = song;
  s.turn.slot = null;
  s.turn.playing = false;
  s.turn.songAttempts += 1;
  setPhase(s, 'placing', s.settings.placeSeconds ? s.settings.placeSeconds * 1000 : null);
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
  beginPlacing(s, fx);
  s.turn.slot = keepSlot;
}

function resolve(s: GameState, fx: Effect[]) {
  const t = s.turn;
  if (!t) return;
  t.locked = true;
  const p = s.players.find((x) => x.id === t.playerId)!;
  const song = t.song;
  if (!song) {
    afterReveal(s, fx);
    return;
  }
  const years = p.cards.map((c) => c.year);
  const correct = isCorrectPlacement(years, t.slot, song.year);
  const between = neighbours(years, song.year);
  if (correct && t.slot !== null) {
    const card = songToCard(song);
    p.cards = [...p.cards.slice(0, t.slot), card, ...p.cards.slice(t.slot)];
    s.played.push(song);
    p.stats.correct += 1;
    if (p.stats.oldestCorrect === null || song.year < p.stats.oldestCorrect) p.stats.oldestCorrect = song.year;
  } else {
    s.discard.push(song);
    if (t.slot !== null) {
      const [l, r] = gapNeighbours(years, t.slot);
      const diff = l !== null && song.year < l ? l - song.year : r !== null && song.year > r ? song.year - r : 0;
      if (diff > 0 && (p.stats.closestMiss === null || diff < p.stats.closestMiss)) p.stats.closestMiss = diff;
    }
  }
  s.songsPlayed += 1;
  s.reveal = { playerId: p.id, song, slot: t.slot, correct, between, cardsAfter: p.cards.length };
  setPhase(s, 'reveal', TIMES.reveal);
  fx.push({ type: 'sound', sound: 'lock' });
  fx.push({ type: 'volume', level: 0.3 });
  fx.push({ type: 'sound', sound: correct ? 'good' : 'bad' });
}

function afterReveal(s: GameState, fx: Effect[]) {
  fx.push({ type: 'stop' });
  fx.push({ type: 'volume', level: 1 });
  const active = s.players[s.turnIndex];
  if (active && active.cards.length >= s.settings.goal) {
    s.winnerId = active.id;
    s.turn = null;
    setPhase(s, 'winner', null);
    fx.push({ type: 'sound', sound: 'fanfare' });
    return;
  }
  s.turnIndex = (s.turnIndex + 1) % s.players.length;
  if (s.turnIndex === s.startIndex) {
    s.round += 1;
    s.turn = null;
    s.reveal = null;
    setPhase(s, 'standings', TIMES.standings);
  } else {
    beginTurn(s, fx);
  }
}

function resetPlayers(s: GameState) {
  // Gespeelde nummers komen pas terug als de rest op is: onderop de stapel.
  const used: Song[] = [...s.discard];
  s.discard = [];
  for (const p of s.players) {
    p.cards = [];
    p.tokens = START_TOKENS;
    p.stats = { correct: 0, oldestCorrect: null, closestMiss: null };
  }
  s.deck = [...s.deck, ...used, ...s.played];
  s.played = [];
  s.songsPlayed = 0;
}

function rematch(s: GameState, fx: Effect[]) {
  // Kaarten van tijdlijnen gaan ook terug, onderop.
  const fromTimelines = s.played;
  s.played = [];
  resetPlayers(s); // zet discard onderop; played is al leeg
  const [rest, rng] = shuffle(s.deck, s.rng);
  s.rng = rng;
  s.deck = [...rest, ...fromTimelines];
  deal(s, fx);
}
