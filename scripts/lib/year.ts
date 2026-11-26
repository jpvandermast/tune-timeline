// Pure helpers voor het voorbereidingsscript: titels opschonen, artiesten vergelijken,
// het oorspronkelijke jaar kiezen (CONCEPT 6.3) en correcties inlezen.

export type Status = 'ok' | 'ok-mb' | 'controleren' | 'correctie';
export type YearSource = 'spotify' | 'musicbrainz' | 'correctie';

export interface YearDecision {
  year: number;
  yearSource: YearSource;
  status: Status;
}

/** "Take On Me - 2017 Remaster" → "Take On Me"; ook (Radio Edit), (feat. X), - Mono, enz. */
export function cleanTitle(t: string): string {
  let s = t;
  // " - …" achtervoegsels met bekende woorden
  s = s.replace(
    /\s+-\s+(?:\d{4}\s+)?(?:remaster(?:ed)?|re-?master(?:ed)?|radio edit|single version|mono|stereo|edit|single edit|album version|original mix|remix|live|version|mix|\d{4} remaster(?:ed)?|remastered \d{4}|from .+|feat\..+)(?:\s+\d{4})?.*$/i,
    '',
  );
  // (…) en […] met bekende woorden
  s = s.replace(
    /\s*[([][^)\]]*(?:remaster|radio edit|single version|mono|stereo|feat\.|ft\.|with |edit|version|mix\b|bonus)[^)\]]*[)\]]/gi,
    '',
  );
  return s.replace(/\s{2,}/g, ' ').trim();
}

export function normArtist(a: string): string {
  return a
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

export function sameArtist(a: string, b: string): boolean {
  const x = normArtist(a);
  const y = normArtist(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
}

export function yearOf(date: string | undefined | null): number | null {
  if (!date) return null;
  const m = /^(\d{4})/.exec(date);
  if (!m) return null;
  const y = Number(m[1]);
  return y >= 1900 && y <= 2100 ? y : null;
}

/**
 * Beslisregel (CONCEPT 6.3):
 * - Spotify en MusicBrainz gelijk of 1 jaar verschil: vroegste → ok
 * - MusicBrainz eerder (≤ 15 jaar): MusicBrainz → ok-mb
 * - MusicBrainz > 15 jaar eerder: MusicBrainz-jaar (beste gok) → controleren
 * - MusicBrainz later of geen gegevens: Spotify-jaar → controleren
 */
export function decideYear(spotifyYear: number, mbYear: number | null): YearDecision {
  if (mbYear === null) return { year: spotifyYear, yearSource: 'spotify', status: 'controleren' };
  const diff = spotifyYear - mbYear;
  if (Math.abs(diff) <= 1) {
    return mbYear < spotifyYear
      ? { year: mbYear, yearSource: 'musicbrainz', status: 'ok' }
      : { year: spotifyYear, yearSource: 'spotify', status: 'ok' };
  }
  if (diff > 1 && diff <= 15) return { year: mbYear, yearSource: 'musicbrainz', status: 'ok-mb' };
  // Veel eerder bij MusicBrainz (typisch een verzamelalbum bij Spotify): het vroegste jaar is de beste gok,
  // maar laat het nalopen. MusicBrainz later dan Spotify: Spotify houden en nalopen.
  if (diff > 15) return { year: mbYear, yearSource: 'musicbrainz', status: 'controleren' };
  return { year: spotifyYear, yearSource: 'spotify', status: 'controleren' };
}

export interface Correction {
  spotifyId: string;
  year: number | null;
  note: string;
  startMs: number | null;
}

/** data/corrections.csv: spotifyId;year;note;startMs (kopregel optioneel, # = commentaar). */
export function parseCorrections(csv: string): Map<string, Correction> {
  const out = new Map<string, Correction>();
  for (const raw of csv.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [id, year, note = '', start = ''] = line.split(';').map((x) => x.trim());
    if (!id || id.toLowerCase() === 'spotifyid') continue;
    const y = year ? Number(year) : null;
    const s = start ? Number(start) : null;
    out.set(id.replace(/^spotify:track:/, ''), {
      spotifyId: id,
      year: y !== null && Number.isFinite(y) ? y : null,
      note,
      startMs: s !== null && Number.isFinite(s) ? s : null,
    });
  }
  return out;
}

export interface MbRecording {
  title?: string;
  length?: number | null;
  disambiguation?: string;
  'first-release-date'?: string;
  'artist-credit'?: { name?: string; artist?: { name?: string } }[];
}

export function creditName(r: MbRecording): string {
  return (r['artist-credit'] ?? []).map((c) => c.name ?? c.artist?.name ?? '').join(' ');
}

/** Vroegste jaar uit MusicBrainz-opnames van dezelfde artiest; bij zoeken ook duur ≤ 10 s verschil en geen live/cover. */
export function earliestYear(recs: MbRecording[], artist: string, durationMs: number | null, strict: boolean): number | null {
  let best: number | null = null;
  for (const r of recs) {
    if (!sameArtist(creditName(r), artist)) continue;
    if (strict) {
      const dis = (r.disambiguation ?? '').toLowerCase();
      if (/\blive\b|cover|karaoke|instrumental|demo|remix/.test(dis)) continue;
      if (durationMs && r.length && Math.abs(r.length - durationMs) > 10_000) continue;
    }
    const y = yearOf(r['first-release-date']);
    if (y !== null && (best === null || y < best)) best = y;
  }
  return best;
}
