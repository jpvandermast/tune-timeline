// Losse, pure regel-helpers. Zie docs/concept-v2/CONCEPT.md hoofdstuk 2.
import type { Card, Level, Player, Song } from './types';

export const START_TOKENS = 2;
/** Start-tokens per niveau (CONCEPT 2.8): Original 2, Pro 5, Expert 3. */
export const LEVEL_TOKENS: Record<Level, number> = { original: 2, pro: 5, expert: 3 };
export const LEVELS = ['original', 'pro', 'expert'] as const;
export const LEVEL_NAMES: Record<Level, string> = { original: 'Original', pro: 'Pro', expert: 'Expert' };
/** Reacties: max 1 per 3 s per speler; zweven 2 s op de tv. */
export const REACT_GAP_MS = 3000;
export const REACT_SHOW_MS = 2200;
export const BUY_COST = 3;
export const MAX_TOKENS = 5;
export const MAX_PLAYERS = 10;
export const MIN_PLAYERS = 2;
export const START_YEAR_MIN = 1960;
export const START_YEAR_MAX = 2015;

export const TIMES = {
  deal: 6000,
  turnStart: 6000,
  reveal: 5000,
  steal: 10_000,
  objection: 6000,
  objectionResult: 2500,
  buyShow: 3500,
  standings: 6000,
  songCheck: 6000,
  notice: 4000,
  /** Wachten op een afwezige actieve speler (CONCEPT 2.9). */
  absent: 20_000,
} as const;

/**
 * Goed als jaar ≥ links en ≤ rechts (CONCEPT 2.4). Daardoor is bij een gelijk
 * jaar zowel direct ervoor als erna goed, en bij een reeks gelijke jaren elke plek
 * binnen, vóór en ná die reeks.
 */
export function isCorrectPlacement(years: number[], slot: number | null, year: number): boolean {
  if (slot === null || slot < 0 || slot > years.length) return false;
  const left = slot > 0 ? years[slot - 1] : -Infinity;
  const right = slot < years.length ? years[slot] : Infinity;
  return year >= left && year <= right;
}

/** Alle goede gaten voor een jaar. */
export function correctSlots(years: number[], year: number): number[] {
  const out: number[] = [];
  for (let s = 0; s <= years.length; s++) if (isCorrectPlacement(years, s, year)) out.push(s);
  return out;
}

/** Plek waar een kaart automatisch goed wordt ingevoegd (na gelijke jaren). */
export function insertIndex(cards: Card[], year: number): number {
  let i = 0;
  while (i < cards.length && cards[i].year <= year) i++;
  return i;
}

export function insertCard(cards: Card[], card: Card): Card[] {
  const i = insertIndex(cards, card.year);
  return [...cards.slice(0, i), card, ...cards.slice(i)];
}

/** Buren tussen welke het jaar hoort (voor "hoorde tussen 1967 en 1985"). */
export function neighbours(years: number[], year: number): [number | null, number | null] {
  let lo: number | null = null;
  let hi: number | null = null;
  for (const y of years) {
    if (y <= year) lo = y;
    if (y >= year && hi === null) hi = y;
  }
  return [lo, hi];
}

export function gapNeighbours(years: number[], slot: number): [number | null, number | null] {
  return [slot > 0 ? years[slot - 1] : null, slot < years.length ? years[slot] : null];
}

export function songToCard(s: Song): Card {
  return { songId: s.id, year: s.year, title: s.title, artist: s.artist };
}

export function addTokens(current: number, delta: number): number {
  return Math.max(0, Math.min(MAX_TOKENS, current + delta));
}

/** Letter-avatar: eerste letter, bij dubbele beginletters de eerste twee. */
export function avatarFor(name: string, all: { name: string }[]): string {
  const first = (name.trim()[0] || '?').toUpperCase();
  const clash = all.filter((p) => (p.name.trim()[0] || '?').toUpperCase() === first).length > 1;
  if (!clash) return first;
  const two = name.trim().slice(0, 2);
  return two.charAt(0).toUpperCase() + two.charAt(1).toLowerCase();
}

/** Index van de speler met de oudste startkaart (bij gelijk: eerst binnen). */
export function oldestStartIndex(players: Player[]): number {
  let best = 0;
  for (let i = 1; i < players.length; i++) {
    const y = players[i].cards[0]?.year ?? Infinity;
    const b = players[best].cards[0]?.year ?? Infinity;
    if (y < b) best = i;
  }
  return best;
}

export const PLAYER_COLORS = [
  { key: 'zon', name: 'Zon', hex: '#FFD23F' },
  { key: 'mandarijn', name: 'Mandarijn', hex: '#FF8C42' },
  { key: 'framboos', name: 'Framboos', hex: '#FF4F8B' },
  { key: 'orchidee', name: 'Orchidee', hex: '#E07BFF' },
  { key: 'kobalt', name: 'Kobalt', hex: '#4D7CFF' },
  { key: 'hemel', name: 'Hemel', hex: '#3BC9F5' },
  { key: 'turkoois', name: 'Turkoois', hex: '#2ED3B7' },
  { key: 'limoen', name: 'Limoen', hex: '#A6E35A' },
  { key: 'zalm', name: 'Zalm', hex: '#FFAD9E' },
  { key: 'zilver', name: 'Zilver', hex: '#C9CED8' },
] as const;

export const GOALS = [6, 8, 10, 12] as const;
export const PLACE_TIMES = [30, 45, 60, 0] as const;

/** Geschatte speelduur in minuten (CONCEPT 3.4), lineair geïnterpoleerd.
 * De tabel geldt voor 45 s plaatstijd en Original; andere instellingen schalen mee
 * (aanname: een beurt duurt ±50/60/70/75 s bij 30/45/60/geen timer; Pro/Expert
 * hebben elke beurt een bezwaar en minder goede kaarten). */
export function estimateMinutes(players: number, goal: number, placeSeconds = 45, level: Level = 'original'): number {
  const turnSec: Record<number, number> = { 30: 50, 45: 60, 60: 70, 0: 75 };
  const levelF: Record<Level, number> = { original: 1, pro: 1.15, expert: 1.3 };
  const f = ((turnSec[placeSeconds] ?? 60) / 60) * levelF[level];
  return Math.round(baseMinutes(players, goal) * f);
}

function baseMinutes(players: number, goal: number): number {
  const table: Record<number, Record<number, number>> = {
    4: { 6: 15, 8: 25, 10: 35 },
    6: { 6: 25, 8: 40, 10: 55 },
    8: { 6: 35, 8: 55, 10: 80 },
    10: { 6: 45, 8: 70, 10: 105 },
  };
  const p = Math.max(2, Math.min(10, players));
  const keys = [4, 6, 8, 10];
  const lo = keys.filter((k) => k <= p).pop() ?? 4;
  const hi = keys.find((k) => k >= p) ?? 10;
  const at = (k: number) => {
    const row = table[k];
    if (goal <= 10) {
      if (row[goal] !== undefined) return row[goal];
      return row[10];
    }
    return row[10] * 1.25; // doel 12
  };
  const base = lo === hi ? at(lo) : at(lo) + ((at(hi) - at(lo)) * (p - lo)) / (hi - lo);
  return p < 4 ? (base * p) / 4 : base;
}

export function formatMinutes(min: number): string {
  if (min < 60) return `±${min} min`;
  const h = Math.floor(min / 60);
  const m = Math.round((min % 60) / 5) * 5;
  return m ? `±${h} u ${m}` : `±${h} u`;
}
