// Voorbereidingsscript: Spotify-playlist → public/songs.json met het oorspronkelijke jaar.
// Draaien met:  npm run songs
// Opent één keer je browser om in te loggen bij Spotify (alleen lezen van je playlists).
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cleanTitle,
  decideYear,
  earliestYear,
  parseCorrections,
  yearOf,
  type MbRecording,
  type Status,
  type YearSource,
} from './lib/year.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'scripts', '.cache');
const MB_CACHE = join(CACHE, 'mb');
const REDIRECT = 'http://127.0.0.1:8888/callback';
const SCOPES = 'playlist-read-private playlist-read-collaborative';

function loadEnv(): Record<string, string> {
  const file = join(ROOT, '.env.local');
  const env: Record<string, string> = {};
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  for (const k of ['VITE_SPOTIFY_CLIENT_ID', 'SPOTIFY_PLAYLIST_ID', 'MUSICBRAINZ_CONTACT']) {
    if (process.env[k]) env[k] = process.env[k]!;
  }
  return env;
}

const env = loadEnv();
const CLIENT_ID = env.VITE_SPOTIFY_CLIENT_ID;
const PLAYLIST = (env.SPOTIFY_PLAYLIST_ID || '').replace(/^.*playlist\//, '').replace(/\?.*$/, '');
const CONTACT = env.MUSICBRAINZ_CONTACT;

function need(v: string | undefined, name: string): string {
  if (!v) {
    console.error(`✗ ${name} ontbreekt in .env.local`);
    process.exit(1);
  }
  return v;
}

mkdirSync(MB_CACHE, { recursive: true });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const b64url = (b: Buffer) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// ---------------- Spotify-inlog (PKCE) ----------------

interface Tok {
  access: string;
  refresh: string;
  expiresAt: number;
}
const TOKEN_FILE = join(CACHE, 'spotify-token.json');

async function tokenRequest(body: Record<string, string>): Promise<Tok> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  if (!res.ok) throw new Error(`Spotify-token mislukt: ${res.status} ${await res.text()}`);
  const j = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  const prev = existsSync(TOKEN_FILE) ? (JSON.parse(readFileSync(TOKEN_FILE, 'utf8')) as Tok) : null;
  const t = { access: j.access_token, refresh: j.refresh_token ?? prev?.refresh ?? '', expiresAt: Date.now() + j.expires_in * 1000 };
  writeFileSync(TOKEN_FILE, JSON.stringify(t));
  return t;
}

async function spotifyToken(): Promise<string> {
  if (existsSync(TOKEN_FILE)) {
    const t = JSON.parse(readFileSync(TOKEN_FILE, 'utf8')) as Tok;
    if (t.expiresAt - Date.now() > 60_000) return t.access;
    if (t.refresh) {
      try {
        return (await tokenRequest({ grant_type: 'refresh_token', refresh_token: t.refresh, client_id: CLIENT_ID })).access;
      } catch {
        /* opnieuw inloggen */
      }
    }
  }
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash('sha256').update(verifier).digest());
  const state = b64url(randomBytes(12));
  const url = new URL('https://accounts.spotify.com/authorize');
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    redirect_uri: REDIRECT,
    state,
  }).toString();

  const code = await new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      const u = new URL(req.url ?? '/', REDIRECT);
      if (u.pathname !== '/callback') {
        res.writeHead(404).end();
        return;
      }
      const c = u.searchParams.get('code');
      const err = u.searchParams.get('error');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(
        c && u.searchParams.get('state') === state
          ? '<h1 style="font-family:system-ui">Gelukt! Je kunt dit venster sluiten en teruggaan naar de terminal.</h1>'
          : `<h1 style="font-family:system-ui">Inloggen mislukt: ${err ?? 'onbekend'}</h1>`,
      );
      server.close();
      if (c && u.searchParams.get('state') === state) resolve(c);
      else reject(new Error(`Inloggen mislukt: ${err ?? 'onbekend'}`));
    });
    server.listen(8888, '127.0.0.1', () => {
      console.log('\n→ Je browser opent nu. Log in bij Spotify en klik op "Agree"/"Akkoord".');
      console.log(`  Gaat er niets open? Kopieer dan deze link naar je browser:\n  ${url}\n`);
      const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
      spawn(opener, [url.toString()], { stdio: 'ignore', detached: true }).unref();
    });
    setTimeout(() => {
      server.close();
      reject(new Error('Geen inlog binnen 5 minuten.'));
    }, 5 * 60_000);
  });
  return (await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT, client_id: CLIENT_ID, code_verifier: verifier })).access;
}

// ---------------- Spotify-playlist ----------------

interface SpTrack {
  id: string | null;
  uri: string;
  name: string;
  type?: string;
  is_local?: boolean;
  is_playable?: boolean;
  duration_ms: number;
  artists: { name: string }[];
  album: { release_date?: string; name?: string };
  external_ids?: { isrc?: string };
  linked_from?: { id: string; uri: string };
}

async function spGet<T>(url: string, token: string): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 429) {
      const wait = Number(res.headers.get('retry-after') ?? '2') * 1000;
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`Spotify ${res.status}: ${await res.text()}`);
    return (await res.json()) as T;
  }
  throw new Error('Spotify blijft "te veel verzoeken" geven.');
}

async function playlistTracks(token: string): Promise<SpTrack[]> {
  const out: SpTrack[] = [];
  let url: string | null = `https://api.spotify.com/v1/playlists/${PLAYLIST}/items?market=NL&limit=50`;
  while (url) {
    const page: { items: { item?: SpTrack; track?: SpTrack }[]; next: string | null; total?: number } = await spGet(url, token);
    for (const it of page.items) {
      const t = it.item ?? it.track;
      if (t && t.id && !t.is_local && (t.type ?? 'track') === 'track') out.push(t);
    }
    process.stdout.write(`\r  Spotify: ${out.length}${page.total ? ` van ${page.total}` : ''} nummers`);
    url = page.next;
  }
  process.stdout.write('\n');
  return out;
}

// ---------------- MusicBrainz ----------------

let lastMb = 0;
async function mbGet(path: string): Promise<unknown> {
  const key = createHash('sha1').update(path).digest('hex');
  const file = join(MB_CACHE, `${key}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  for (let attempt = 0; attempt < 4; attempt++) {
    const wait = 1100 - (Date.now() - lastMb);
    if (wait > 0) await sleep(wait);
    lastMb = Date.now();
    const res = await fetch(`https://musicbrainz.org/ws/2/${path}`, {
      headers: { 'User-Agent': `TuneTimeline/1.0 ( ${CONTACT} )`, Accept: 'application/json' },
    });
    if (res.status === 503 || res.status === 429) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (res.status === 404) {
      writeFileSync(file, 'null');
      return null;
    }
    if (!res.ok) throw new Error(`MusicBrainz ${res.status}`);
    const j = await res.json();
    writeFileSync(file, JSON.stringify(j));
    return j;
  }
  return null;
}

async function mbYear(t: SpTrack): Promise<{ year: number | null; via: string }> {
  const artist = t.artists[0]?.name ?? '';
  const isrc = t.external_ids?.isrc;
  if (isrc) {
    const j = (await mbGet(`isrc/${encodeURIComponent(isrc)}?inc=artist-credits&fmt=json`)) as { recordings?: MbRecording[] } | null;
    const y = earliestYear(j?.recordings ?? [], artist, t.duration_ms, false);
    if (y !== null) return { year: y, via: 'isrc' };
  }
  const title = cleanTitle(t.name).replace(/"/g, '');
  const q = `recording:"${title}" AND artist:"${artist.replace(/"/g, '')}"`;
  const j = (await mbGet(`recording?query=${encodeURIComponent(q)}&limit=25&fmt=json`)) as { recordings?: MbRecording[] } | null;
  return { year: earliestYear(j?.recordings ?? [], artist, t.duration_ms, true), via: 'zoeken' };
}

// ---------------- hoofdprogramma ----------------

interface OutSong {
  id: string;
  uri: string;
  title: string;
  artist: string;
  year: number;
  yearSource: YearSource;
  status: Status;
  startMs?: number;
  durationMs: number;
}

async function main() {
  need(CLIENT_ID, 'VITE_SPOTIFY_CLIENT_ID');
  need(PLAYLIST, 'SPOTIFY_PLAYLIST_ID');
  need(CONTACT, 'MUSICBRAINZ_CONTACT');

  console.log('Tune Timeline · nummerlijst maken');
  const token = await spotifyToken();
  console.log('✓ Ingelogd bij Spotify');
  const tracks = await playlistTracks(token);

  const corrFile = join(ROOT, 'data', 'corrections.csv');
  const corrections = existsSync(corrFile) ? parseCorrections(readFileSync(corrFile, 'utf8')) : new Map();

  const songs: OutSong[] = [];
  const notPlayable: SpTrack[] = [];
  const check: { s: OutSong; sp: number; mb: number | null; album: string }[] = [];
  const usedCorr: { s: OutSong; note: string }[] = [];
  const seen = new Set<string>();

  console.log(`  MusicBrainz: ±${Math.ceil((tracks.length * 1.3) / 60)} minuten (1 verzoek per seconde, daarna uit de cache)`);
  let i = 0;
  for (const t of tracks) {
    i++;
    process.stdout.write(`\r  ${i}/${tracks.length} ${t.name.slice(0, 40).padEnd(40)}`);
    if (t.is_playable === false) {
      notPlayable.push(t);
      continue;
    }
    if (seen.has(t.id!)) continue;
    seen.add(t.id!);
    const sp = yearOf(t.album.release_date) ?? 0;
    const corr = corrections.get(t.id!) ?? (t.linked_from ? corrections.get(t.linked_from.id) : undefined);
    let mb: number | null = null;
    if (!corr?.year) {
      try {
        mb = (await mbYear(t)).year;
      } catch (e) {
        mb = null;
        process.stdout.write(`\n  ! MusicBrainz-fout bij ${t.name}: ${(e as Error).message}\n`);
      }
    }
    const d = decideYear(sp, mb);
    const s: OutSong = {
      id: t.id!,
      uri: t.uri,
      title: cleanTitle(t.name),
      artist: t.artists.map((a) => a.name).slice(0, 2).join(' & '),
      year: d.year,
      yearSource: d.yearSource,
      status: d.status,
      durationMs: t.duration_ms,
    };
    if (corr) {
      if (corr.year) {
        s.year = corr.year;
        s.yearSource = 'correctie';
        s.status = 'correctie';
      }
      if (corr.startMs) s.startMs = corr.startMs;
      usedCorr.push({ s, note: corr.note });
    } else if (d.status === 'controleren') {
      check.push({ s, sp, mb, album: t.album.name ?? '' });
    }
    songs.push(s);
  }
  process.stdout.write('\n');

  writeFileSync(join(ROOT, 'public', 'songs.json'), JSON.stringify(songs, null, 0).replace(/},{/g, '},\n{') + '\n');

  const date = new Date().toISOString().slice(0, 10);
  const lines = [
    '# Rapport nummerlijst',
    '',
    `Gemaakt op ${date} uit playlist \`${PLAYLIST}\`. ${songs.length} nummers in \`public/songs.json\`.`,
    '',
    `- ok: ${songs.filter((s) => s.status === 'ok').length}`,
    `- ok-mb (jaar van MusicBrainz, eerder dan het Spotify-album): ${songs.filter((s) => s.status === 'ok-mb').length}`,
    `- correctie (uit \`data/corrections.csv\`): ${usedCorr.length}`,
    `- **controleren: ${check.length}**`,
    `- niet afspeelbaar in NL (eruit gehaald): ${notPlayable.length}`,
    '',
    '## Controleren',
    '',
    'Zoek per nummer het jaar van de **eerste uitgave van deze opname door deze artiest** op (Wikipedia of Discogs) en zet het in `data/corrections.csv` als `spotifyId;jaar;notitie`. Draai daarna opnieuw `npm run songs` (gaat snel, alles staat in de cache).',
    '',
    '| Spotify-ID | Titel | Artiest | Spotify-album (jaar) | MusicBrainz | Nu gebruikt |',
    '|---|---|---|---|---|---|',
    ...check.map(({ s, sp, mb, album }) => `| ${s.id} | ${s.title} | ${s.artist} | ${album.replace(/\|/g, '/')} (${sp}) | ${mb ?? '–'} | ${s.year} |`),
    '',
    '## Niet afspeelbaar (eruit gehaald)',
    '',
    ...(notPlayable.length ? notPlayable.map((t) => `- ${t.name} — ${t.artists.map((a) => a.name).join(', ')} (${t.id})`) : ['Geen.']),
    '',
    '## Gebruikte correcties',
    '',
    ...(usedCorr.length ? usedCorr.map(({ s, note }) => `- ${s.title} — ${s.artist}: ${s.year}${s.startMs ? `, start op ${s.startMs} ms` : ''}${note ? ` (${note})` : ''}`) : ['Geen.']),
    '',
  ];
  writeFileSync(join(ROOT, 'data', 'rapport.md'), lines.join('\n'));
  console.log(`✓ public/songs.json: ${songs.length} nummers`);
  console.log(`✓ data/rapport.md: ${check.length} om te controleren, ${notPlayable.length} niet afspeelbaar`);
}

main().catch((e) => {
  console.error(`\n✗ ${(e as Error).message}`);
  process.exit(1);
});
