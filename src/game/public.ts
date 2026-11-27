// Publieke status: wat de telefoons mogen zien. Nooit geheimen, nooit de stapel,
// en tijdens een beurt niets over het lopende nummer (CONCEPT 7.4).
import type { Card, DrinkAction, GameState, Notice, Objection, Phase, ReactionMsg, Reveal, Settings, StealClaim } from './types';

export interface PublicPlayer {
  id: string;
  name: string;
  members?: string[];
  color: string;
  cards: Card[];
  tokens: number;
  online: boolean;
  late?: boolean;
  sips?: number;
}

export interface PublicSpectator {
  id: string;
  name: string;
  color: string;
  online: boolean;
}

export interface PublicTurn {
  playerId: string;
  slot: number | null;
  locked: boolean;
  playing: boolean;
  claim: boolean;
  bought: boolean;
  steals: StealClaim[];
  passed: string[];
  stealEligible: string[];
  /** Wie meegokt (alleen wie, niet waar: dat blijft geheim tot de onthulling). */
  guessers: string[];
  yearGuess: number | null;
  waiting: boolean;
}

export interface Award {
  icon: string;
  title: string;
  playerId: string;
  detail: string;
}

export interface PublicState {
  version: number;
  code: string;
  phase: Phase;
  players: PublicPlayer[];
  spectators: PublicSpectator[];
  hostId: string | null;
  settings: Settings;
  turn: PublicTurn | null;
  turnIndex: number;
  startIndex: number;
  round: number;
  deadline: number | null;
  now: number;
  reveal: Reveal | null;
  winnerId: string | null;
  dealInfo: GameState['dealInfo'];
  notice: Notice | null;
  songsPlayed: number;
  deckSize: number;
  paused: boolean;
  pausedBy: GameState['pausedBy'];
  awards: Award[];
  /** Eindoverzicht: overgeslagen nummers. */
  skipped: Card[];
  explainReady: string[];
  reactions: ReactionMsg[];
  /** "Ik speelde al": nieuwe telefoon → speler (zonder geheim). */
  reclaims: { id: string; target: string }[];
  objection: Objection | null;
  lastBuy: GameState['lastBuy'];
  /** Voor het hostmenu: kan de uitslag nog omgedraaid worden? */
  canFlipVerdict: boolean;
  canFlipClaim: boolean;
  canSkipSong: boolean;
  /** Drankspel: actieve drankmeldingen. */
  drinks: DrinkAction[];
}

export function toPublic(s: GameState): PublicState {
  const showReveal = (s.phase === 'reveal' || s.phase === 'objection') && s.reveal !== null;
  const r = s.reveal;
  return {
    version: s.version,
    code: s.code,
    phase: s.phase,
    players: s.players.map((p) => ({
      id: p.id,
      name: p.name,
      ...(p.members?.length ? { members: p.members } : {}),
      color: p.color,
      cards: p.cards,
      tokens: p.tokens,
      online: p.online,
      ...(p.late ? { late: true } : {}),
      ...(s.settings.drinking ? { sips: p.stats.sips ?? 0 } : {}),
    })),
    spectators: s.spectators.map((x) => ({ id: x.id, name: x.name, color: x.color, online: x.online })),
    hostId: s.hostId,
    settings: s.settings,
    turn: s.turn
      ? {
          playerId: s.turn.playerId,
          slot: s.turn.slot,
          locked: s.turn.locked,
          playing: s.turn.playing,
          claim: s.turn.claim,
          bought: s.turn.bought,
          steals: s.turn.steals,
          passed: s.turn.passed,
          stealEligible: s.turn.stealEligible,
          guessers: Object.keys(s.turn.guesses),
          yearGuess: s.turn.yearGuess,
          waiting: s.turn.waiting,
        }
      : null,
    turnIndex: s.turnIndex,
    startIndex: s.startIndex,
    round: s.round,
    deadline: s.deadline,
    now: s.now,
    reveal: showReveal ? s.reveal : null,
    winnerId: s.winnerId,
    dealInfo: s.dealInfo,
    notice: s.notice,
    songsPlayed: s.songsPlayed,
    deckSize: s.deck.length + s.discard.length + s.played.length,
    paused: s.paused,
    pausedBy: s.pausedBy,
    awards: s.phase === 'winner' ? awards(s) : [],
    skipped: s.phase === 'winner' ? s.skipped : [],
    explainReady: s.explainReady,
    reactions: s.reactions,
    reclaims: s.reclaims.map((r) => ({ id: r.id, target: r.target })),
    objection: s.phase === 'objection' ? s.objection : null,
    lastBuy: s.phase === 'turnStart' ? s.lastBuy : null,
    canFlipVerdict:
      !!r &&
      ['reveal', 'objection', 'standings'].includes(s.phase) &&
      !r.pending &&
      !r.stolenBy &&
      !r.steals.some((x) => x.outcome === 'refund'),
    canFlipClaim: s.phase === 'objection' && !!s.objection?.result && s.objection.mode === 'earn',
    canSkipSong:
      s.deck.some((x) => !s.failedIds.includes(x.id)) || s.discard.some((x) => !s.failedIds.includes(x.id)),
    drinks: s.drinks ?? [],
  };
}

export function awards(s: GameState): Award[] {
  const out: Award[] = [];
  const ears = [
    ...s.players.map((p) => ({ id: p.id, n: p.stats.guessesCorrect ?? 0 })),
    ...s.spectators.map((x) => ({ id: x.id, n: x.guessesCorrect })),
  ]
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)[0];
  if (ears) out.push({ icon: '👂', title: 'Beste oor', playerId: ears.id, detail: `${ears.n}× goed meegegokt` });
  const thief = s.players.filter((p) => p.stats.steals > 0).sort((a, b) => b.stats.steals - a.stats.steals)[0];
  if (thief)
    out.push({ icon: '🦊', title: 'Meesterdief', playerId: thief.id, detail: `${thief.stats.steals} ${thief.stats.steals === 1 ? 'steal' : 'steals'}` });
  const old = s.players
    .filter((p) => p.stats.oldestCorrect !== null)
    .sort((a, b) => a.stats.oldestCorrect! - b.stats.oldestCorrect!)[0];
  if (old) out.push({ icon: '⏳', title: 'Tijdreiziger', playerId: old.id, detail: String(old.stats.oldestCorrect) });
  const close = s.players
    .filter((p) => p.stats.closestMiss !== null)
    .sort((a, b) => a.stats.closestMiss! - b.stats.closestMiss!)[0];
  if (close)
    out.push({
      icon: '😬',
      title: 'Bijna!',
      playerId: close.id,
      detail: `${close.stats.closestMiss} jaar mis`,
    });
  if (s.settings.drinking) {
    const thirsty = s.players
      .filter((p) => (p.stats.sips ?? 0) > 0)
      .sort((a, b) => (b.stats.sips ?? 0) - (a.stats.sips ?? 0))[0];
    if (thirsty) {
      out.push({
        icon: '🍺',
        title: s.settings.teams ? 'Dorstigste team' : 'Dorstigste speler',
        playerId: thirsty.id,
        detail: `${thirsty.stats.sips} slokken`,
      });
    }
  }
  return out;
}
