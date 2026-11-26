// Publieke status: wat de telefoons mogen zien. Nooit geheimen, nooit de stapel,
// en tijdens een beurt niets over het lopende nummer (CONCEPT 7.4).
import type { Card, GameState, Notice, Phase, Reveal, Settings } from './types';

export interface PublicPlayer {
  id: string;
  name: string;
  color: string;
  cards: Card[];
  tokens: number;
  online: boolean;
}

export interface PublicTurn {
  playerId: string;
  slot: number | null;
  locked: boolean;
  playing: boolean;
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
  awards: Award[];
}

export function toPublic(s: GameState): PublicState {
  const showReveal = s.phase === 'reveal' && s.reveal !== null;
  return {
    version: s.version,
    code: s.code,
    phase: s.phase,
    players: s.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      cards: p.cards,
      tokens: p.tokens,
      online: p.online,
    })),
    hostId: s.hostId,
    settings: s.settings,
    turn: s.turn
      ? { playerId: s.turn.playerId, slot: s.turn.slot, locked: s.turn.locked, playing: s.turn.playing }
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
    awards: s.phase === 'winner' ? awards(s) : [],
  };
}

function awards(s: GameState): Award[] {
  const out: Award[] = [];
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
  return out;
}
