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
  | 'explain' // uitleg-scherm, host tikt "Begrepen"
  | 'deal' // startkaarten worden gedeeld
  | 'turnStart' // 6 s, "X is aan de beurt" (of 20 s wachten op een afwezige speler)
  | 'placing' // nummer speelt, actieve speler kiest een plek
  | 'stealing' // steelvenster (10 s) na het vastzetten
  | 'reveal' // kaart draait om
  | 'objection' // bezwaar tegen titel + artiest (6 s)
  | 'standings' // tussenstand na een ronde
  | 'winner';

/** Moeilijkheidsniveau (CONCEPT 2.8). */
export type Level = 'original' | 'pro' | 'expert';

export const REACTIONS = ['🔥', '😂', '😱', '🎶'] as const;
export type Reaction = (typeof REACTIONS)[number];

export interface PlayerStats {
  correct: number;
  oldestCorrect: number | null;
  closestMiss: number | null;
  steals: number;
  /** Meegokken: aantal keer goed (prijs "Beste oor"). */
  guessesCorrect: number;
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
  /** Later ingestapt (na de start). */
  late?: boolean;
}

/** Toeschouwer: kwam na ronde 2 binnen. Kan meegokken en reageren. */
export interface Spectator {
  id: string;
  secret: string;
  name: string;
  color: string;
  online: boolean;
  joinedAt: number;
  guessesCorrect: number;
}

export interface Settings {
  goal: 6 | 8 | 10 | 12;
  /** 0 = geen timer */
  placeSeconds: 0 | 30 | 45 | 60;
  /** Tijdsfactor (1 = normaal). Alleen voor tests (?snel=1). */
  tempo: number;
  level: Level;
  /** Emoji-reacties aan/uit (host). */
  reactions: boolean;
}

export interface StealClaim {
  playerId: string;
  slot: number;
  /** Expert: gekozen jaar. */
  year?: number;
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
  /** Schuifje "Ik noem titel + artiest". */
  claim: boolean;
  /** Al een kaart gekocht deze beurt. */
  bought: boolean;
  /** Steals in ontvangstvolgorde van de tv. */
  steals: StealClaim[];
  passed: string[];
  /** Wie bij het openen van het steelvenster mocht stelen. */
  stealEligible: string[];
  /** Meegokken: speler/toeschouwer → gat (geheim tot de onthulling). */
  guesses: Record<string, number>;
  /** Expert: jaar van het jaarwiel. */
  yearGuess: number | null;
  /** Actieve speler offline bij de beurtstart: 20 s wachten. */
  waiting: boolean;
}

export interface StealResult {
  playerId: string;
  slot: number;
  year?: number;
  correct: boolean;
  outcome: 'won' | 'lost' | 'refund';
}

export interface GuessResult {
  playerId: string;
  slot: number;
  correct: boolean;
}

/** Eén rij in het bezwaar (Pro/Expert kan er twee hebben: actieve speler en steler). */
export interface ObjectionRow {
  playerId: string;
  eligible: string[];
  votes: Record<string, 'fout' | 'klopt'>;
  needed: number;
  ok: boolean | null;
}

export interface Objection {
  playerId: string;
  open: boolean;
  eligible: string[];
  votes: Record<string, 'fout' | 'klopt'>;
  needed: number;
  result: { ok: boolean; awarded: boolean; maxed: boolean } | null;
  /** 'earn' = Original (+1 token), 'keep' = Pro/Expert (beslist over de kaart). */
  mode: 'earn' | 'keep';
  /** Pro/Expert: tweede rij voor de winnende steler. */
  extra: ObjectionRow | null;
}

export interface Reveal {
  playerId: string;
  song: Song;
  slot: number | null;
  /** Eindoordeel: houdt de actieve speler de kaart? */
  correct: boolean;
  /** Plek goed (los van titel/artiest/jaar). */
  placeCorrect: boolean;
  /** Expert: gekozen jaar en of het exact klopt. */
  yearGuess: number | null;
  yearCorrect: boolean | null;
  /** Pro/Expert: het bezwaar moet nog beslissen. */
  pending: boolean;
  /** Pro/Expert: steler die de kaart kan winnen als het bezwaar meevalt. */
  candidate: string | null;
  level: Level;
  /** Buren waar het nummer had moeten liggen (null = rand). */
  between: [number | null, number | null];
  cardsAfter: number;
  steals: StealResult[];
  stolenBy: string | null;
  claim: boolean;
  flipped: boolean;
  guesses: GuessResult[];
}

export interface Notice {
  kind: 'songFailed' | 'info' | 'skip';
  text: string;
  until: number;
}

export interface ReactionMsg {
  id: string;
  playerId: string;
  emoji: Reaction;
  at: number;
}

export interface Reclaim {
  /** Nieuw spelerId van de nieuwe telefoon. */
  id: string;
  secret: string;
  target: string;
  at: number;
}

export interface GameState {
  version: number;
  code: string;
  phase: Phase;
  players: Player[]; // in speelvolgorde (volgorde van binnenkomst)
  spectators: Spectator[];
  hostId: string | null;
  settings: Settings;
  deck: Song[]; // nog te spelen
  discard: Song[]; // afgelegd of overgeslagen (komt terug bij lege stapel)
  played: Song[]; // liggen op een tijdlijn (privé, voor 'Nog een potje')
  failedIds: string[]; // "speelt niet"-lijst voor deze avond
  startYears: number[]; // gebruikte startjaren (uniek)
  skipped: Card[]; // overgeslagen nummers (eindoverzicht)
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
  objection: Objection | null;
  lastBuy: { playerId: string; card: Card } | null;
  /** Resterende tijd van de fase tijdens een pauze. */
  pausedRemaining: number | null;
  songsPlayed: number;
  processedActions: string[];
  paused: boolean;
  /** Wie pauzeerde: de host, of de tv zelf (Spotify weg). */
  pausedBy: 'host' | 'system' | null;
  /** Uitleg: wie al "Begrepen" tikte. */
  explainReady: string[];
  /** Emoji's die nu op de tv zweven. */
  reactions: ReactionMsg[];
  lastReact: Record<string, number>;
  /** "Ik speelde al": wacht op bevestiging van de host. */
  reclaims: Reclaim[];
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
  | (IntentBase & { type: 'understood' })
  | (IntentBase & {
      type: 'settings';
      goal?: Settings['goal'];
      placeSeconds?: Settings['placeSeconds'];
      level?: Level;
      reactions?: boolean;
    })
  | (IntentBase & { type: 'startSong' })
  | (IntentBase & { type: 'pickSlot'; slot: number | null })
  | (IntentBase & { type: 'lock' })
  | (IntentBase & { type: 'rematch' })
  | (IntentBase & { type: 'lobby' })
  | (IntentBase & { type: 'buy' })
  | (IntentBase & { type: 'skip' })
  | (IntentBase & { type: 'claim'; on: boolean })
  | (IntentBase & { type: 'yearPick'; year: number })
  | (IntentBase & { type: 'steal'; slot: number; year?: number })
  | (IntentBase & { type: 'pass' })
  | (IntentBase & { type: 'objection'; verdict: 'fout' | 'klopt'; target?: string })
  | (IntentBase & { type: 'guess'; slot: number | null })
  | (IntentBase & { type: 'react'; emoji: string })
  | (IntentBase & { type: 'reclaim'; target: string })
  | (IntentBase & { type: 'confirmReclaim'; requester: string; ok: boolean })
  | (IntentBase & { type: 'pause' })
  | (IntentBase & { type: 'skipTurn' })
  | (IntentBase & { type: 'flipVerdict' })
  | (IntentBase & { type: 'flipClaim' })
  | (IntentBase & { type: 'removePlayer'; target: string })
  | (IntentBase & { type: 'restartSong' })
  | (IntentBase & { type: 'stopGame' })
  | (Base & { type: 'tick' })
  /** Na herladen van de tv: lopende fase opnieuw starten, nummer vanaf het begin. */
  | (Base & { type: 'resume' })
  | (Base & { type: 'songPlaying'; songId: string })
  | (Base & { type: 'songFailed'; songId: string })
  | (Base & { type: 'presence'; onlineIds: string[] })
  /** Alleen van de tv zelf (muis op de tv-pc), nooit van een telefoon. */
  | (Base & { type: 'tvUnderstood' })
  | (Base & { type: 'tvConfirmReclaim'; requester: string; ok: boolean })
  /** Spotify weg / weer terug: de tv pauzeert het spel zelf. */
  | (Base & { type: 'systemPause'; on: boolean });

export type Sound =
  | 'plop'
  | 'turn'
  | 'tick'
  | 'softtick'
  | 'lock'
  | 'drum'
  | 'drumShort'
  | 'swish'
  | 'good'
  | 'bad'
  | 'fanfare'
  | 'countdown'
  | 'stealOpen'
  | 'steal'
  | 'kassa'
  | 'coin'
  | 'matchpoint';

export type Effect =
  | { type: 'play'; song: Song }
  | { type: 'stop' }
  /** Muziek in `ms` zachter en dan stoppen (einde beurt). */
  | { type: 'fade'; ms: number }
  | { type: 'volume'; level: number }
  | { type: 'sound'; sound: Sound; delayMs?: number }
  | { type: 'reply'; playerId: string; text: string }
  /** "Ik speelde al" bevestigd: de nieuwe telefoon wordt deze speler. */
  | { type: 'adopt'; requesterId: string; playerId: string };

export interface ApplyResult {
  state: GameState;
  effects: Effect[];
}
