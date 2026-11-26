// Spelregels van Tune Timeline: types. Puur TypeScript, geen React, geen browser.

export interface Song {
  id: string;
  uri: string;
  title: string;
  artist: string;
  year: number;
  yearSource?: 'spotify' | 'musicbrainz' | 'correctie';
  status?: string;
  startMs?: number;
  durationMs?: number;
}

/** Een open kaart in iemands tijdlijn. */
export interface Card {
  songId: string;
  year: number;
  title: string;
  artist: string;
}

export type Phase =
  | 'lobby'
  | 'deal' // startkaarten worden gedeeld
  | 'turnStart' // 6 s, "X is aan de beurt"
  | 'placing' // nummer speelt, actieve speler kiest een plek
  | 'reveal' // kaart draait om
  | 'standings' // tussenstand na een ronde
  | 'winner';

export interface PlayerStats {
  correct: number;
  oldestCorrect: number | null;
  closestMiss: number | null;
}

export interface Player {
  id: string;
  /** Alleen in de volledige status van de tv; nooit publiek. */
  secret: string;
  name: string;
  color: string;
  cards: Card[]; // altijd oplopend gesorteerd op jaar
  tokens: number;
  online: boolean;
  joinedAt: number;
  stats: PlayerStats;
}

export interface Settings {
  goal: 6 | 8 | 10 | 12;
  /** 0 = geen timer */
  placeSeconds: 0 | 30 | 45 | 60;
  /** Tijdsfactor (1 = normaal). Alleen voor tests (?snel=1). */
  tempo: number;
}

export interface Turn {
  playerId: string;
  /** Lopend nummer (geheim tot de onthulling). */
  song: Song | null;
  /** Gekozen gat 0..n (n = aantal kaarten), of null. */
  slot: number | null;
  locked: boolean;
  /** Aantal pogingen om een nummer te laten spelen in deze beurt. */
  songAttempts: number;
  /** Het nummer speelt hoorbaar (signaal van de speler). */
  playing: boolean;
}

export interface Reveal {
  playerId: string;
  song: Song;
  slot: number | null;
  correct: boolean;
  /** Buren waar het nummer had moeten liggen (null = rand). */
  between: [number | null, number | null];
  cardsAfter: number;
}

export interface Notice {
  kind: 'songFailed' | 'info';
  text: string;
  until: number;
}

export interface GameState {
  version: number;
  code: string;
  phase: Phase;
  players: Player[]; // in speelvolgorde (volgorde van binnenkomst)
  hostId: string | null;
  settings: Settings;
  deck: Song[]; // nog te spelen
  discard: Song[]; // afgelegd of overgeslagen (komt terug bij lege stapel)
  played: Song[]; // liggen op een tijdlijn (privé, voor 'Nog een potje')
  failedIds: string[]; // "speelt niet"-lijst voor deze avond
  turn: Turn | null;
  turnIndex: number; // index in players van de actieve speler
  startIndex: number; // wie de ronde begint
  round: number; // 1-based
  deadline: number | null; // tv-klok in ms
  phaseStartedAt: number;
  now: number; // laatst bekende tv-tijd
  rng: number; // toestand van de random-generator
  reveal: Reveal | null;
  winnerId: string | null;
  dealInfo: { playerId: string; year: number } | null;
  notice: Notice | null;
  songsPlayed: number;
  processedActions: string[];
  paused: boolean;
}

// ---------- events (alles met tv-tijd `now`) ----------

interface Base {
  now: number;
}
/** Intenties van een telefoon. Worden gecontroleerd op geheim, fase en actieId. */
export interface IntentBase extends Base {
  playerId: string;
  secret: string;
  actionId: string;
}

export type GameEvent =
  | (IntentBase & { type: 'join'; name: string; color: string })
  | (IntentBase & { type: 'start' })
  | (IntentBase & { type: 'settings'; goal?: Settings['goal']; placeSeconds?: Settings['placeSeconds'] })
  | (IntentBase & { type: 'startSong' })
  | (IntentBase & { type: 'pickSlot'; slot: number | null })
  | (IntentBase & { type: 'lock' })
  | (IntentBase & { type: 'rematch' })
  | (IntentBase & { type: 'lobby' })
  | (Base & { type: 'tick' })
  /** Na herladen van de tv: lopende fase opnieuw starten, nummer vanaf het begin. */
  | (Base & { type: 'resume' })
  | (Base & { type: 'songPlaying'; songId: string })
  | (Base & { type: 'songFailed'; songId: string })
  | (Base & { type: 'presence'; onlineIds: string[] });

export type Sound = 'plop' | 'turn' | 'tick' | 'lock' | 'drum' | 'good' | 'bad' | 'fanfare' | 'countdown';

export type Effect =
  | { type: 'play'; song: Song }
  | { type: 'stop' }
  | { type: 'volume'; level: number }
  | { type: 'sound'; sound: Sound }
  | { type: 'reply'; playerId: string; text: string };

export interface ApplyResult {
  state: GameState;
  effects: Effect[];
}
