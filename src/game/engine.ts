// De spelmotor: apply(state, event) → { state, effects }.
// Alleen de tv draait dit. Alle tijden komen uit events (tv-klok), willekeur uit state.rng.
// Regels: docs/concept-v2/CONCEPT.md hoofdstuk 2.
import type {
  ApplyResult,
  Card,
  Effect,
  GameEvent,
  GameState,
  GuessResult,
  IntentBase,
  Level,
  ObjectionRow,
  Player,
  PlayerStats,
  Reaction,
  Settings,
  Song,
  Spectator,
  StealClaim,
  StealResult,
  Turn,
} from './types';
import { REACTIONS } from './types';
import {
  BUY_COST,
  GOALS,
  LEVELS,
  LEVEL_TOKENS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  PLACE_TIMES,
  PLAYER_COLORS,
  REACT_GAP_MS,
  REACT_SHOW_MS,
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

export const DEFAULT_SETTINGS: Settings = { goal: 10, placeSeconds: 45, tempo: 1, level: 'original', reactions: true };

const TOO_LATE = 'Te laat, het venster is dicht. Je token blijft van jou.';
const newStats = (): PlayerStats => ({ correct: 0, oldestCorrect: null, closestMiss: null, steals: 0, guessesCorrect: 0 });
/** Tot het einde van ronde 2 mag je nog instappen (CONCEPT 2.9). */
export const LATE_JOIN_ROUNDS = 2;

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
    spectators: [],
    hostId: null,
    settings: { ...DEFAULT_SETTINGS, ...opts.settings },
    deck,
    discard: [],
    played: [],
    failedIds: [],
    startYears: [],
    skipped: [],
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
    pausedBy: null,
    explainReady: [],
    reactions: [],
    lastReact: {},
    reclaims: [],
  };
}

/** Oudere opgeslagen status (van vóór fase 3) aanvullen met nieuwe velden. */
export function migrate(s: GameState): GameState {
  const d = createGame({ code: s.code, songs: [], seed: 1, now: s.now });
  const out = { ...d, ...s, settings: { ...DEFAULT_SETTINGS, ...s.settings } } as GameState;
  out.players = out.players.map((p) => ({ ...p, stats: { ...newStats(), ...p.stats } }));
  if (out.turn) out.turn = { ...newTurn(out.turn.playerId), ...out.turn };
  return out;
}

const isIntent = (e: GameEvent): e is GameEvent & IntentBase => 'actionId' in e;

export function apply(prev: GameState, event: GameEvent): ApplyResult {
  const s: GameState = structuredClone(prev);
  const fx: Effect[] = [];
  s.now = Math.max(s.now, event.now);
  const mpBefore = matchPointIds(prev);

  if (isIntent(event)) {
    if (s.processedActions.includes(event.actionId)) return { state: prev, effects: [] };
    if (event.type === 'join') {
      handleJoin(s, event, fx);
    } else if (event.type === 'reclaim') {
      handleReclaim(s, event);
    } else {
      const p = s.players.find((x) => x.id === event.playerId);
      if (p) {
        if (p.secret !== event.secret) return { state: prev, effects: [] };
        handleIntent(s, event, p, fx);
      } else {
        const sp = s.spectators.find((x) => x.id === event.playerId);
        if (!sp || sp.secret !== event.secret) return { state: prev, effects: [] };
        handleSpectator(s, event, sp, fx);
      }
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
        if (s.phase === 'placing' && s.turn?.song?.id === event.songId && !s.turn.locked && !s.paused) songFailed(s, fx);
        break;
      case 'presence':
        presence(s, event.onlineIds, fx);
        break;
      case 'tvUnderstood':
        if (s.phase === 'explain') deal(s, fx);
        break;
      case 'tvConfirmReclaim':
        confirmReclaim(s, event.requester, event.ok, fx);
        break;
      case 'systemPause':
        systemPause(s, event.on, fx);
        break;
    }
  }

  // Emoji's verdwijnen na ±2 s.
  if (s.reactions.length) s.reactions = s.reactions.filter((r) => s.now - r.at < REACT_SHOW_MS);

  // Nieuw op match point: lage puls (na de onthulling).
  if (s.phase !== 'winner' && s.phase !== 'lobby') {
    const mpAfter = matchPointIds(s);
    if (mpAfter.some((id) => !mpBefore.includes(id)))
      fx.push({ type: 'sound', sound: 'matchpoint', delayMs: s.phase === 'reveal' || s.phase === 'objection' ? 2400 : 300 });
  }

  if (changed(prev, s)) s.version = prev.version + 1;
  else return { state: prev, effects: fx };
  return { state: s, effects: fx };
}

export function matchPointIds(s: GameState): string[] {
  if (['lobby', 'explain', 'deal'].includes(s.phase)) return [];
  return s.players.filter((p) => p.cards.length === s.settings.goal - 1).map((p) => p.id);
}

function changed(a: GameState, b: GameState): boolean {
  // `now` alleen telt niet als wijziging (anders elke tick een nieuwe versie).
  return JSON.stringify({ ...a, now: 0, version: 0 }) !== JSON.stringify({ ...b, now: 0, version: 0 });
}

const reply = (fx: Effect[], playerId: string, text: string) => fx.push({ type: 'reply', playerId, text });
const byId = (s: GameState, id: string | null | undefined) => s.players.find((p) => p.id === id);
const level = (s: GameState): Level => s.settings.level ?? 'original';
const startTokens = (s: GameState) => LEVEL_TOKENS[level(s)];

// ---------------- aanmelden, later instappen, "Ik speelde al" ----------------

function handleJoin(s: GameState, e: Extract<GameEvent, { type: 'join' }>, fx: Effect[]) {
  const existing = byId(s, e.playerId);
  const name = e.name.trim().slice(0, 10);
  const inLobby = s.phase === 'lobby' || s.phase === 'explain';
  if (existing) {
    if (existing.secret !== e.secret) return;
    if (inLobby && name) existing.name = name;
    if (inLobby && validColor(s, e.color, existing.id)) existing.color = e.color;
    return;
  }
  if (s.spectators.some((x) => x.id === e.playerId)) return;
  if (!name) return;
  const lateOk = !inLobby && s.phase !== 'winner' && s.round <= LATE_JOIN_ROUNDS;
  if ((inLobby || lateOk) && s.players.length < MAX_PLAYERS) {
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
      tokens: startTokens(s),
      online: true,
      joinedAt: e.now,
      stats: newStats(),
    };
    if (inLobby) {
      s.players.push(player);
      if (!s.hostId) s.hostId = player.id;
    } else if (!lateJoin(s, player, fx)) return;
    fx.push({ type: 'sound', sound: 'plop' });
    return;
  }
  if (inLobby) {
    reply(fx, e.playerId, 'Het spel zit vol (10 spelers).');
    return;
  }
  // Te laat of vol: toeschouwer (meegokken en reacties).
  s.spectators.push({
    id: e.playerId,
    secret: e.secret,
    name,
    color: e.color,
    online: true,
    joinedAt: e.now,
    guessesCorrect: 0,
  });
  reply(
    fx,
    e.playerId,
    s.players.length >= MAX_PLAYERS ? 'Het spel zit vol. Je kijkt mee.' : 'Instappen kon tot het einde van ronde 2. Je kijkt mee.',
  );
}

/** Late instapper: 1 startkaart, start-tokens, achteraan in het rondje. */
function lateJoin(s: GameState, p: Player, fx: Effect[]): boolean {
  const used = new Set(s.startYears);
  let idx = s.deck.findIndex((x) => x.year >= START_YEAR_MIN && x.year <= START_YEAR_MAX && !used.has(x.year));
  if (idx < 0) idx = s.deck.findIndex((x) => !used.has(x.year));
  if (idx < 0 && s.deck.length) idx = 0;
  if (idx < 0) {
    reply(fx, p.id, 'Er zijn geen kaarten meer om mee in te stappen.');
    return false;
  }
  const [song] = s.deck.splice(idx, 1);
  s.startYears.push(song.year);
  s.played.push(song);
  p.cards = [songToCard(song)];
  p.late = true;
  // Achteraan in het rondje = vlak vóór de speler die de ronde begint.
  const at = s.startIndex;
  s.players.splice(at, 0, p);
  if (s.turnIndex >= at) s.turnIndex += 1;
  s.startIndex += 1;
  s.notice = { kind: 'info', text: `${p.name} stapt in en speelt achteraan in het rondje`, until: s.now + TIMES.notice };
  return true;
}

function handleReclaim(s: GameState, e: Extract<GameEvent, { type: 'reclaim' }>) {
  if (byId(s, e.playerId)) return; // al speler
  const target = byId(s, e.target);
  if (!target) return;
  s.reclaims = s.reclaims.filter((r) => r.id !== e.playerId && s.now - r.at < 5 * 60_000);
  s.reclaims.push({ id: e.playerId, secret: e.secret, target: target.id, at: e.now });
  if (s.reclaims.length > 5) s.reclaims.shift();
}

function confirmReclaim(s: GameState, requester: string, ok: boolean, fx: Effect[]) {
  const r = s.reclaims.find((x) => x.id === requester);
  if (!r) return;
  s.reclaims = s.reclaims.filter((x) => x.id !== requester);
  const target = byId(s, r.target);
  if (!ok || !target) {
    reply(fx, requester, 'De host zei nee. Kies opnieuw, of doe mee als nieuwe speler.');
    return;
  }
  target.secret = r.secret;
  fx.push({ type: 'adopt', requesterId: requester, playerId: target.id });
  s.notice = { kind: 'info', text: `${target.name} speelt verder op een andere telefoon`, until: s.now + TIMES.notice };
}

function validColor(s: GameState, color: string, selfId: string | null): boolean {
  if (!PLAYER_COLORS.some((c) => c.hex === color)) return false;
  return !s.players.some((p) => p.color === color && p.id !== selfId);
}

function presence(s: GameState, onlineIds: string[], fx: Effect[]) {
  for (const p of s.players) p.online = onlineIds.includes(p.id);
  for (const sp of s.spectators) sp.online = onlineIds.includes(sp.id);
  if (s.paused) return;
  if (s.phase === 'stealing') maybeCloseSteal(s, fx);
  if (s.phase === 'objection' && s.objection?.open) maybeCloseObjection(s, fx);
  // Afwezige speler is terug: gewone beurtstart.
  if (s.phase === 'turnStart' && s.turn?.waiting && byId(s, s.turn.playerId)?.online) {
    s.turn.waiting = false;
    setPhase(s, 'turnStart', TIMES.turnStart);
    fx.push({ type: 'sound', sound: 'turn' });
  }
}

// ---------------- intenties ----------------

const HOST_ONLY = ['pause', 'skipTurn', 'flipVerdict', 'flipClaim', 'removePlayer', 'restartSong', 'stopGame', 'confirmReclaim'];

function handleSpectator(s: GameState, e: GameEvent & IntentBase, sp: Spectator, fx: Effect[]) {
  if (e.type === 'guess') guess(s, sp.id, e.slot, fx);
  else if (e.type === 'react') react(s, sp.id, e.emoji, fx);
}

function handleIntent(s: GameState, e: GameEvent & IntentBase, p: Player, fx: Effect[]) {
  const isHost = s.hostId === p.id;
  const t = s.turn;
  const isActive = t?.playerId === p.id;
  // Tijdens een pauze kan alleen de host iets (en mag de actieve speler nog schuiven).
  if (s.paused && !HOST_ONLY.includes(e.type) && !['pickSlot', 'claim', 'yearPick', 'react', 'guess'].includes(e.type)) {
    reply(fx, p.id, 'Het spel staat op pauze.');
    return;
  }
  // De afwezige actieve speler is er toch: gewone beurtstart.
  if (isActive && t?.waiting && s.phase === 'turnStart') {
    t.waiting = false;
    setPhase(s, 'turnStart', TIMES.turnStart);
  }
  switch (e.type) {
    case 'start':
      if (isHost && s.phase === 'lobby' && s.players.length >= MIN_PLAYERS) {
        s.explainReady = [];
        setPhase(s, 'explain', null);
        fx.push({ type: 'sound', sound: 'turn' });
      }
      break;
    case 'understood':
      if (s.phase !== 'explain') break;
      if (isHost) deal(s, fx);
      else if (!s.explainReady.includes(p.id)) s.explainReady.push(p.id);
      break;
    case 'settings': {
      if (!isHost || s.phase !== 'lobby') break;
      if (e.goal !== undefined && (GOALS as readonly number[]).includes(e.goal)) s.settings.goal = e.goal;
      if (e.placeSeconds !== undefined && (PLACE_TIMES as readonly number[]).includes(e.placeSeconds))
        s.settings.placeSeconds = e.placeSeconds;
      if (e.level !== undefined && (LEVELS as readonly string[]).includes(e.level)) {
        s.settings.level = e.level;
        for (const x of s.players) x.tokens = LEVEL_TOKENS[e.level];
      }
      if (typeof e.reactions === 'boolean') s.settings.reactions = e.reactions;
      break;
    }
    case 'startSong':
      if (isActive && s.phase === 'turnStart') beginPlacing(s, fx);
      break;
    case 'buy':
      if (isActive) buy(s, p, fx);
      break;
    case 'pickSlot': {
      if (!isActive || s.phase !== 'placing' || !t || t.locked) break;
      if (e.slot === null || (Number.isInteger(e.slot) && e.slot >= 0 && e.slot <= p.cards.length)) {
        if (t.slot !== e.slot && e.slot !== null) fx.push({ type: 'sound', sound: 'softtick' });
        t.slot = e.slot;
      }
      break;
    }
    case 'claim':
      // Pro/Expert: claim is verplicht (schuifje staat vast aan).
      if (isActive && s.phase === 'placing' && t && !t.locked && level(s) === 'original') t.claim = Boolean(e.on);
      break;
    case 'yearPick':
      if (isActive && s.phase === 'placing' && t && !t.locked && level(s) === 'expert' && validYear(e.year)) t.yearGuess = e.year;
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
      if (level(s) === 'expert' && t.yearGuess === null) {
        reply(fx, p.id, 'Kies eerst een jaar met het jaarwiel.');
        break;
      }
      lockIn(s, fx);
      break;
    case 'steal':
      steal(s, p, e.slot, e.year, fx);
      break;
    case 'pass':
      if (s.phase === 'stealing' && t && !isActive && !t.passed.includes(p.id) && !t.steals.some((x) => x.playerId === p.id)) {
        t.passed.push(p.id);
        maybeCloseSteal(s, fx);
      }
      break;
    case 'objection':
      objectionVote(s, p, e.verdict, e.target, fx);
      break;
    case 'guess':
      if (!isActive) guess(s, p.id, e.slot, fx);
      break;
    case 'react':
      react(s, p.id, e.emoji, fx);
      break;
    case 'rematch':
      if (isHost && s.phase === 'winner') rematch(s, fx);
      break;
    case 'lobby':
      if (isHost && s.phase === 'winner') toLobby(s, fx);
      break;
    // ---- hostmenu ----
    case 'confirmReclaim':
      if (isHost) confirmReclaim(s, e.requester, Boolean(e.ok), fx);
      break;
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

const validYear = (y: unknown): y is number => typeof y === 'number' && Number.isInteger(y) && y >= 1900 && y <= 2100;

// ---------------- meegokken en reacties (CONCEPT 3.5) ----------------

function guess(s: GameState, id: string, slot: number | null, fx: Effect[]) {
  const t = s.turn;
  if (!t || s.phase !== 'placing' || t.locked || t.playerId === id) {
    if (s.phase === 'stealing' || s.phase === 'reveal') reply(fx, id, 'Meegokken kan alleen tot het vastzetten.');
    return;
  }
  const active = byId(s, t.playerId);
  if (!active) return;
  if (slot === null) delete t.guesses[id];
  else if (Number.isInteger(slot) && slot >= 0 && slot <= active.cards.length) t.guesses[id] = slot;
}

function react(s: GameState, id: string, emoji: string, fx: Effect[]) {
  if (!s.settings.reactions) {
    reply(fx, id, 'Reacties staan uit.');
    return;
  }
  if (!(REACTIONS as readonly string[]).includes(emoji)) return;
  const last = s.lastReact[id];
  if (last !== undefined && s.now - last < REACT_GAP_MS) return; // max 1 per 3 s
  s.lastReact[id] = s.now;
  s.reactions.push({ id: `${id}:${s.now}`, playerId: id, emoji: emoji as Reaction, at: s.now });
  if (s.reactions.length > 20) s.reactions.shift();
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
    case 'turnStart': {
      const t = s.turn;
      const p = byId(s, t?.playerId);
      if (t?.waiting) {
        // 20 s voorbij en nog steeds weg: beurt overslaan. Tijdlijn en tokens blijven.
        s.notice = { kind: 'info', text: `${p?.name ?? 'Speler'} is er niet: beurt overgeslagen`, until: s.now + 3000 };
        endTurn(s, fx);
      } else if (t && p && !p.online) {
        t.waiting = true;
        setPhase(s, 'turnStart', TIMES.absent);
      } else beginPlacing(s, fx);
      break;
    }
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
    turnStart: s.turn?.waiting ? TIMES.absent : TIMES.turnStart,
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
    p.tokens = startTokens(s);
    s.played.push(song);
  }
  s.startYears = [...used];
  s.skipped = [];
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
  s.explainReady = [];
  setPhase(s, 'deal', TIMES.deal);
  fx.push({ type: 'sound', sound: 'turn' });
}

export function newTurn(playerId: string): Turn {
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
    guesses: {},
    yearGuess: null,
    waiting: false,
  };
}

function beginTurn(s: GameState, fx: Effect[]) {
  const p = s.players[s.turnIndex];
  s.turn = newTurn(p.id);
  s.reveal = null;
  s.objection = null;
  s.lastBuy = null;
  if (!p.online) {
    // Actieve speler offline bij zijn beurtstart: 20 s wachten (CONCEPT 2.9).
    s.turn.waiting = true;
    setPhase(s, 'turnStart', TIMES.absent);
    return;
  }
  setPhase(s, 'turnStart', TIMES.turnStart);
  fx.push({ type: 'sound', sound: 'turn' });
  // Match point: kort trommelroffeltje bij zijn beurt.
  if (p.cards.length === s.settings.goal - 1) fx.push({ type: 'sound', sound: 'drumShort', delayMs: 450 });
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
  s.turn.guesses = {};
  s.turn.songAttempts += 1;
  if (level(s) !== 'original') s.turn.claim = true; // Pro/Expert: claim verplicht
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
  const keepYear = s.turn.yearGuess;
  beginPlacing(s, fx);
  s.turn.slot = keepSlot;
  s.turn.claim = keepClaim;
  s.turn.yearGuess = keepYear;
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
  if (t.song) {
    s.discard.push(t.song); // niet onthuld (wel in het eindoverzicht)
    s.skipped.push(songToCard(t.song));
  }
  s.notice = { kind: 'skip', text: `${p.name} slaat dit nummer over (−1 token)`, until: s.now + 2000 };
  fx.push({ type: 'sound', sound: 'coin' });
  const claim = t.claim;
  beginPlacing(s, fx);
  t.claim = claim || level(s) !== 'original';
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
  fx.push({ type: 'sound', sound: 'stealOpen', delayMs: 250 });
}

function steal(s: GameState, p: Player, slot: number, year: number | undefined, fx: Effect[]) {
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
  // Original: de plek van de actieve speler is niet stelbaar. Pro/Expert wel.
  if (t.slot !== null && slot === t.slot && level(s) === 'original') {
    reply(fx, p.id, `Daar legde ${active.name} al. Kies een andere plek.`);
    return;
  }
  if (level(s) === 'expert' && !validYear(year)) {
    reply(fx, p.id, 'Kies ook een jaar met het jaarwiel.');
    return;
  }
  const taken = t.steals.find((x) => x.slot === slot);
  if (taken) {
    reply(fx, p.id, `Net bezet door ${byId(s, taken.playerId)?.name ?? 'iemand'}, kies een andere plek`);
    return;
  }
  p.tokens -= 1;
  const claim: StealClaim = { playerId: p.id, slot };
  if (level(s) === 'expert') claim.year = year;
  t.steals.push(claim);
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

/** Pure uitkomst van een beurt met steals in Original (exporteerd voor tests). */
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

/** Meegokkers: wie lag goed? (exporteerd voor tests) */
export function scoreGuesses(years: number[], year: number, guesses: Record<string, number>): GuessResult[] {
  return Object.entries(guesses).map(([playerId, slot]) => ({ playerId, slot, correct: isCorrectPlacement(years, slot, year) }));
}

function recordGuesses(s: GameState, results: GuessResult[]) {
  for (const g of results) {
    if (!g.correct) continue;
    const p = byId(s, g.playerId);
    if (p) p.stats.guessesCorrect += 1;
    const sp = s.spectators.find((x) => x.id === g.playerId);
    if (sp) sp.guessesCorrect += 1;
  }
}

function noteMiss(p: Player, years: number[], slot: number | null, year: number) {
  if (slot === null) return;
  const [l, r] = gapNeighbours(years, slot);
  const diff = l !== null && year < l ? l - year : r !== null && year > r ? year - r : 0;
  if (diff > 0 && (p.stats.closestMiss === null || diff < p.stats.closestMiss)) p.stats.closestMiss = diff;
}

function noteOldest(p: Player, year: number) {
  if (p.stats.oldestCorrect === null || year < p.stats.oldestCorrect) p.stats.oldestCorrect = year;
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
  const guesses = scoreGuesses(years, song.year, t.guesses);
  recordGuesses(s, guesses);
  if (level(s) !== 'original') {
    resolvePro(s, t, p, song, years, guesses, fx);
    return;
  }
  const { activeCorrect, results, winner } = resolveSteals(years, t.slot, song.year, t.steals);
  const between = neighbours(years, song.year);
  const card = songToCard(song);
  if (activeCorrect && t.slot !== null) {
    p.cards = [...p.cards.slice(0, t.slot), card, ...p.cards.slice(t.slot)];
    s.played.push(song);
    p.stats.correct += 1;
    noteOldest(p, song.year);
  } else {
    noteMiss(p, years, t.slot, song.year);
    const w = winner ? byId(s, winner) : null;
    if (w) {
      w.cards = insertCard(w.cards, card);
      w.stats.steals += 1;
      noteOldest(w, song.year);
      s.played.push(song);
    } else {
      s.discard.push(song);
    }
  }
  for (const r of results) if (r.outcome === 'refund') refund(s, r.playerId);
  s.songsPlayed += 1;
  s.reveal = {
    playerId: p.id,
    song,
    slot: t.slot,
    correct: activeCorrect,
    placeCorrect: activeCorrect,
    yearGuess: null,
    yearCorrect: null,
    pending: false,
    candidate: null,
    level: 'original',
    between,
    cardsAfter: p.cards.length,
    steals: results,
    stolenBy: winner,
    claim: t.claim,
    flipped: false,
    guesses,
  };
  revealFx(s, fx, activeCorrect ? 'good' : winner ? 'kassa' : 'bad');
}

/** Onthullings-effecten: muziek zachter, trommelroffel 1,2 s, flip, dan de uitslag. */
function revealFx(s: GameState, fx: Effect[], result: 'good' | 'bad' | 'kassa' | null) {
  setPhase(s, 'reveal', TIMES.reveal);
  fx.push({ type: 'volume', level: 0.3 });
  fx.push({ type: 'sound', sound: 'drum' });
  fx.push({ type: 'sound', sound: 'swish', delayMs: 1200 });
  if (result) fx.push({ type: 'sound', sound: result, delayMs: 1900 });
}

/**
 * Pro/Expert (CONCEPT 2.8): kaart houden of stelen = goede plek + titel/artiest (+ exact jaar).
 * Titel + artiest beslist het bezwaar; tot dan is de uitslag "pending".
 */
function resolvePro(s: GameState, t: Turn, p: Player, song: Song, years: number[], guesses: GuessResult[], fx: Effect[]) {
  const expert = level(s) === 'expert';
  const placeCorrect = isCorrectPlacement(years, t.slot, song.year);
  const yearCorrect = expert ? t.yearGuess === song.year : null;
  const activeOk = placeCorrect && (yearCorrect ?? true);
  let candidate: string | null = null;
  const steals: StealResult[] = t.steals.map((st) => {
    const correct = isCorrectPlacement(years, st.slot, song.year) && (!expert || st.year === song.year);
    if (correct && !candidate) {
      candidate = st.playerId;
      return { ...st, correct, outcome: 'won' as const };
    }
    return { ...st, correct, outcome: correct ? ('refund' as const) : ('lost' as const) };
  });
  if (!placeCorrect) noteMiss(p, years, t.slot, song.year);
  s.songsPlayed += 1;
  const pending = activeOk || candidate !== null;
  s.reveal = {
    playerId: p.id,
    song,
    slot: t.slot,
    correct: false,
    placeCorrect,
    yearGuess: t.yearGuess,
    yearCorrect,
    pending,
    candidate,
    level: level(s),
    between: neighbours(years, song.year),
    cardsAfter: p.cards.length,
    steals,
    stolenBy: null,
    claim: true,
    flipped: false,
    guesses,
  };
  if (!pending) {
    // Niemand kan de kaart nog krijgen: afleggen, steel-tokens weg.
    s.discard.push(song);
    for (const st of steals) st.outcome = 'lost';
    revealFx(s, fx, 'bad');
    return;
  }
  revealFx(s, fx, null);
}

// ---------------- bezwaar en verdienen (CONCEPT 2.7) ----------------

function row(s: GameState, playerId: string): ObjectionRow {
  const eligible = s.players.filter((x) => x.id !== playerId && x.online).map((x) => x.id);
  return { playerId, eligible, votes: {}, needed: Math.ceil(eligible.length / 2), ok: null };
}

function afterReveal(s: GameState, fx: Effect[]) {
  fx.push({ type: 'volume', level: 1 });
  const r = s.reveal;
  if (r && r.level !== 'original') {
    if (!r.pending) {
      endTurn(s, fx);
      return;
    }
    // Twee rijen als de actieve speler goed lag én er een goede steler is (CONCEPT 2.8).
    const activeOk = r.placeCorrect && (r.yearCorrect ?? true);
    const main = row(s, activeOk ? r.playerId : r.candidate!);
    const extra = activeOk && r.candidate ? row(s, r.candidate) : null;
    s.objection = {
      playerId: main.playerId,
      open: true,
      eligible: main.eligible,
      votes: {},
      needed: main.needed,
      result: null,
      mode: 'keep',
      extra,
    };
    setPhase(s, 'objection', TIMES.objection);
    maybeCloseObjection(s, fx);
    return;
  }
  if (r?.claim) {
    const main = row(s, r.playerId);
    s.objection = {
      playerId: main.playerId,
      open: true,
      eligible: main.eligible,
      votes: {},
      needed: main.needed,
      result: null,
      mode: 'earn',
      extra: null,
    };
    setPhase(s, 'objection', TIMES.objection);
    if (main.eligible.length === 0) closeObjection(s, fx);
    return;
  }
  endTurn(s, fx);
}

function objectionVote(s: GameState, p: Player, verdict: 'fout' | 'klopt', target: string | undefined, fx: Effect[]) {
  const o = s.objection;
  if (!o || s.phase !== 'objection' || !o.open) {
    if (o && o.playerId !== p.id) reply(fx, p.id, 'Te laat, het bezwaar is al gesloten.');
    return;
  }
  const v = verdict === 'fout' ? 'fout' : 'klopt';
  if (o.extra && target === o.extra.playerId) {
    if (!o.extra.eligible.includes(p.id) || o.extra.votes[p.id]) return;
    o.extra.votes[p.id] = v;
  } else {
    if (!o.eligible.includes(p.id) || o.votes[p.id]) return;
    o.votes[p.id] = v;
  }
  maybeCloseObjection(s, fx);
}

const fouts = (votes: Record<string, string>) => Object.values(votes).filter((v) => v === 'fout').length;

/** Is een rij beslist: genoeg "Fout!" of iedereen (online) heeft getikt. */
function rowDone(s: GameState, r: { eligible: string[]; votes: Record<string, string>; needed: number }): boolean {
  if (fouts(r.votes) >= r.needed && r.needed > 0) return true;
  return r.eligible.filter((id) => !r.votes[id] && byId(s, id)?.online).length === 0;
}

function maybeCloseObjection(s: GameState, fx: Effect[]) {
  const o = s.objection;
  if (!o?.open) return;
  if (rowDone(s, o) && (!o.extra || rowDone(s, o.extra))) closeObjection(s, fx);
}

/** Goed tenzij minstens de helft (naar boven afgerond) van de andere online spelers "Fout!" tikt. */
export function claimApproved(foutVotes: number, needed: number): boolean {
  return needed === 0 || foutVotes < needed;
}

function closeObjection(s: GameState, fx: Effect[]) {
  const o = s.objection!;
  const ok = claimApproved(fouts(o.votes), o.needed);
  o.open = false;
  if (o.mode === 'keep') {
    if (o.extra) o.extra.ok = claimApproved(fouts(o.extra.votes), o.extra.needed);
    o.result = { ok, awarded: false, maxed: false };
    settlePro(s, fx);
    setPhase(s, 'objection', TIMES.objectionResult);
    return;
  }
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
  o.result = { ok, awarded, maxed };
  setPhase(s, 'objection', TIMES.objectionResult);
}

/** Pro/Expert: het bezwaar is gesloten; nu pas gaat de kaart naar iemand (of weg). */
function settlePro(s: GameState, fx: Effect[]) {
  const o = s.objection!;
  const r = s.reveal!;
  const p = byId(s, r.playerId);
  const song = r.song;
  const card: Card = songToCard(song);
  const activeOk = r.placeCorrect && (r.yearCorrect ?? true);
  const activeApproved = activeOk && o.playerId === r.playerId && Boolean(o.result?.ok);
  const candId = r.candidate;
  const candApproved = candId
    ? o.extra?.playerId === candId
      ? Boolean(o.extra.ok)
      : o.playerId === candId && Boolean(o.result?.ok)
    : false;
  r.pending = false;
  if (activeApproved && p && r.slot !== null) {
    p.cards = [...p.cards.slice(0, r.slot), card, ...p.cards.slice(r.slot)];
    s.played.push(song);
    p.stats.correct += 1;
    noteOldest(p, song.year);
    r.correct = true;
    // Actieve speler goed: alle stelers verliezen hun token.
    for (const st of r.steals) st.outcome = 'lost';
    fx.push({ type: 'sound', sound: 'good' });
  } else if (candId && candApproved) {
    const w = byId(s, candId);
    if (w) {
      w.cards = insertCard(w.cards, card);
      w.stats.steals += 1;
      noteOldest(w, song.year);
      w.tokens = addTokens(w.tokens, 1); // gelukte steal kost geen token
      s.played.push(song);
      r.stolenBy = w.id;
    } else s.discard.push(song);
    for (const st of r.steals) if (st.playerId !== candId && st.outcome === 'refund') refund(s, st.playerId);
    fx.push({ type: 'sound', sound: 'kassa' });
  } else {
    s.discard.push(song);
    for (const st of r.steals) {
      if (st.playerId === candId) st.outcome = 'lost';
      else if (st.outcome === 'refund') refund(s, st.playerId);
    }
    fx.push({ type: 'sound', sound: 'bad' });
  }
  if (p) r.cardsAfter = p.cards.length;
}

function refund(s: GameState, id: string) {
  const pl = byId(s, id);
  if (pl) pl.tokens = addTokens(pl.tokens, 1);
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
  // Muziek 2 s uitfaden aan het eind van een beurt.
  fx.push({ type: 'fade', ms: 2000 });
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

function pauseNow(s: GameState, by: 'host' | 'system', fx: Effect[]) {
  s.paused = true;
  s.pausedBy = by;
  s.pausedRemaining = s.deadline === null ? null : Math.max(0, s.deadline - s.now);
  s.deadline = null;
  fx.push({ type: 'stop' });
}

function unpauseNow(s: GameState, fx: Effect[]) {
  s.paused = false;
  s.pausedBy = null;
  s.deadline = s.pausedRemaining === null ? null : s.now + s.pausedRemaining;
  s.pausedRemaining = null;
  if ((s.phase === 'placing' || s.phase === 'stealing') && s.turn?.song) {
    s.phaseStartedAt = s.now;
    if (s.phase === 'placing') s.turn.playing = false;
    fx.push({ type: 'play', song: s.turn.song });
  }
}

function togglePause(s: GameState, fx: Effect[]) {
  if (['lobby', 'explain', 'winner'].includes(s.phase)) return;
  if (!s.paused) pauseNow(s, 'host', fx);
  else unpauseNow(s, fx);
}

/** Spotify weg: de tv pauzeert zelf; terug: alleen hervatten als de tv zelf pauzeerde. */
function systemPause(s: GameState, on: boolean, fx: Effect[]) {
  if (['lobby', 'explain', 'winner'].includes(s.phase)) return;
  if (on && !s.paused) pauseNow(s, 'system', fx);
  else if (!on && s.paused && s.pausedBy === 'system') unpauseNow(s, fx);
}

function refundSteals(s: GameState) {
  for (const st of s.turn?.steals ?? []) refund(s, st.playerId);
}

function skipTurn(s: GameState, fx: Effect[]) {
  if (!['turnStart', 'placing', 'stealing'].includes(s.phase) || !s.turn) return;
  const p = byId(s, s.turn.playerId);
  refundSteals(s);
  if (s.turn.song) s.discard.push(s.turn.song);
  s.notice = { kind: 'info', text: `Beurt van ${p?.name ?? 'speler'} overgeslagen`, until: s.now + 3000 };
  if (s.paused) {
    s.paused = false;
    s.pausedBy = null;
    s.pausedRemaining = null;
  }
  endTurn(s, fx);
}

/** Plaatsing omdraaien (verkeerd jaartal e.d.), alleen als er niets gestolen is; tot de volgende beurt. */
function flipVerdict(s: GameState, host: Player, fx: Effect[]) {
  const r = s.reveal;
  if (!r || !['reveal', 'objection', 'standings'].includes(s.phase) || r.pending) {
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
  if (!o?.result || s.phase !== 'objection' || o.mode !== 'earn') {
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
  if (idx < 0) {
    s.spectators = s.spectators.filter((x) => x.id !== target);
    return;
  }
  const t = s.turn;
  if (t?.playerId === target && ['reveal', 'objection'].includes(s.phase)) {
    reply(fx, host.id, 'Even wachten tot deze beurt klaar is.');
    return;
  }
  if (t?.playerId === target && ['turnStart', 'placing', 'stealing'].includes(s.phase)) {
    skipTurn(s, fx); // zet turnIndex al op de volgende speler
  }
  // Uit lopende steal/bezwaar/meegokken halen
  if (s.turn) {
    s.turn.steals = s.turn.steals.filter((x) => x.playerId !== target);
    s.turn.stealEligible = s.turn.stealEligible.filter((x) => x !== target);
    delete s.turn.guesses[target];
  }
  if (s.objection) {
    s.objection.eligible = s.objection.eligible.filter((x) => x !== target);
    if (s.objection.extra) s.objection.extra.eligible = s.objection.extra.eligible.filter((x) => x !== target);
  }
  s.reclaims = s.reclaims.filter((r) => r.target !== target);
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
  s.pausedBy = null;
  s.pausedRemaining = null;
  s.explainReady = [];
  // Toeschouwers mogen in de lobby gewoon meedoen.
  for (const sp of s.spectators) {
    if (s.players.length >= MAX_PLAYERS) break;
    const color = validColor(s, sp.color, null) ? sp.color : PLAYER_COLORS.find((c) => validColor(s, c.hex, null))?.hex;
    if (!color) break;
    s.players.push({
      id: sp.id,
      secret: sp.secret,
      name: sp.name,
      color,
      cards: [],
      tokens: startTokens(s),
      online: sp.online,
      joinedAt: sp.joinedAt,
      stats: newStats(),
    });
  }
  s.spectators = s.spectators.filter((sp) => !s.players.some((p) => p.id === sp.id));
  fx.push({ type: 'stop' });
}

function resetPlayers(s: GameState) {
  // Gespeelde nummers komen pas terug als de rest op is: onderop de stapel.
  const used: Song[] = [...s.discard];
  s.discard = [];
  for (const p of s.players) {
    p.cards = [];
    p.tokens = startTokens(s);
    p.stats = newStats();
    delete p.late;
  }
  for (const sp of s.spectators) sp.guessesCorrect = 0;
  s.deck = [...s.deck, ...used, ...s.played];
  s.played = [];
  s.songsPlayed = 0;
  s.skipped = [];
}

function rematch(s: GameState, fx: Effect[]) {
  // Nog niet gespeelde nummers geschud bovenop; gespeelde nummers onderop.
  const used = [...s.discard, ...s.played];
  s.discard = [];
  s.played = [];
  for (const p of s.players) {
    p.cards = [];
    p.stats = newStats();
    delete p.late;
  }
  for (const sp of s.spectators) sp.guessesCorrect = 0;
  s.songsPlayed = 0;
  const [rest, rng] = shuffle(s.deck, s.rng);
  s.rng = rng;
  s.deck = [...rest, ...used];
  deal(s, fx);
}
