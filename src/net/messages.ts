// Berichttypes tussen tv en telefoons.
import type { PublicState } from '../game/public';

export const EV = {
  state: 'state', // tv → allen: { state, sentAt }
  intent: 'intent', // telefoon → tv: Intent
  hello: 'hello', // telefoon → tv: { playerId }
  reply: 'reply', // tv → telefoon: { playerId, text }
  ask: 'ask', // lobbykanaal: telefoon vraagt het kanaalgeheim { nonce }
  secret: 'secret', // lobbykanaal: tv antwoordt { nonce, secret }
} as const;

export interface StateMsg {
  state: PublicState;
  sentAt: number;
}

export const PHONE_INTENTS = ['join', 'start', 'settings', 'startSong', 'pickSlot', 'lock', 'rematch', 'lobby'] as const;
export type IntentType = (typeof PHONE_INTENTS)[number];

export interface Intent {
  type: IntentType;
  playerId: string;
  secret: string;
  actionId: string;
  [k: string]: unknown;
}

export const channelName = (code: string, secret: string) => `tt:${code}:${secret}`;
export const lobbyName = (code: string) => `tt:${code}:lobby`;

const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // zonder I en O (en geen cijfers)
const SECRET_CHARS = 'abcdefghijkmnpqrstuvwxyz23456789';

function randomFrom(chars: string, n: number): string {
  const buf = new Uint32Array(n);
  crypto.getRandomValues(buf);
  return Array.from(buf, (x) => chars[x % chars.length]).join('');
}

export const newRoomCode = () => randomFrom(CODE_LETTERS, 4);
export const newChannelSecret = () => randomFrom(SECRET_CHARS, 6);
export const newId = (n = 12) => randomFrom(SECRET_CHARS, n);

export function cleanCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .filter((c) => CODE_LETTERS.includes(c))
    .join('')
    .slice(0, 4);
}
