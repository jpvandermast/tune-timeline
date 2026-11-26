// Spotify-inlog met Authorization Code + PKCE (geen client secret in de browser).
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ');

const KEY = 'tt:spotify';
const VERIFIER = 'tt:spotify:verifier';
const RETURN_TO = 'tt:spotify:return';

interface Tokens {
  access: string;
  refresh: string;
  expiresAt: number;
}

export const clientId = () => import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;
const redirectUri = () => window.location.origin + '/callback';

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function login(returnTo = '/tv') {
  const id = clientId();
  if (!id) throw new Error('VITE_SPOTIFY_CLIENT_ID ontbreekt');
  const rnd = new Uint8Array(48);
  crypto.getRandomValues(rnd);
  const verifier = b64url(rnd);
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  localStorage.setItem(VERIFIER, verifier);
  localStorage.setItem(RETURN_TO, returnTo);
  const url = new URL('https://accounts.spotify.com/authorize');
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: id,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    redirect_uri: redirectUri(),
  }).toString();
  window.location.assign(url.toString());
}

async function tokenRequest(body: Record<string, string>): Promise<Tokens> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  if (!res.ok) throw new Error(`Spotify-token mislukt (${res.status})`);
  const j = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  const prev = load();
  const t: Tokens = {
    access: j.access_token,
    refresh: j.refresh_token ?? prev?.refresh ?? '',
    expiresAt: Date.now() + j.expires_in * 1000,
  };
  localStorage.setItem(KEY, JSON.stringify(t));
  return t;
}

/** Op /callback: code inwisselen. Geeft het pad terug waar we heen moeten. */
export async function handleCallback(): Promise<string> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const err = params.get('error');
  if (err) throw new Error(err === 'access_denied' ? 'Inloggen geannuleerd.' : err);
  const verifier = localStorage.getItem(VERIFIER);
  if (!code || !verifier) throw new Error('Geen inlogcode ontvangen.');
  await tokenRequest({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    client_id: clientId() ?? '',
    code_verifier: verifier,
  });
  localStorage.removeItem(VERIFIER);
  return localStorage.getItem(RETURN_TO) || '/tv';
}

function load(): Tokens | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

export function hasLogin(): boolean {
  return Boolean(load()?.refresh);
}

export function logout() {
  localStorage.removeItem(KEY);
}

let refreshing: Promise<Tokens> | null = null;

export async function refresh(): Promise<string> {
  const t = load();
  if (!t?.refresh) throw new Error('Niet ingelogd bij Spotify');
  refreshing ??= tokenRequest({ grant_type: 'refresh_token', refresh_token: t.refresh, client_id: clientId() ?? '' });
  try {
    return (await refreshing).access;
  } finally {
    refreshing = null;
  }
}

/** Geldig toegangstoken; vernieuwt als het binnen 15 minuten verloopt (dus ±elke 45 min). */
export async function getToken(): Promise<string> {
  const t = load();
  if (!t) throw new Error('Niet ingelogd bij Spotify');
  if (t.expiresAt - Date.now() < 15 * 60_000) return refresh();
  return t.access;
}
