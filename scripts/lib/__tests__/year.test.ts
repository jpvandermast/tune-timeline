import { describe, expect, it } from 'vitest';
import { cleanTitle, decideYear, earliestYear, parseCorrections, sameArtist, yearOf } from '../year';

describe('cleanTitle', () => {
  it.each([
    ['Take On Me - 2017 Remaster', 'Take On Me'],
    ['Waterloo Sunset - 1997 Remastered Version', 'Waterloo Sunset'],
    ['Hey Jude - Remastered 2015', 'Hey Jude'],
    ['Billie Jean (Single Version)', 'Billie Jean'],
    ['Dancing Queen - Radio Edit', 'Dancing Queen'],
    ['Get Lucky (feat. Pharrell Williams & Nile Rodgers) - Radio Edit', 'Get Lucky'],
    ['Paint It, Black - Mono', 'Paint It, Black'],
    ['Smells Like Teen Spirit', 'Smells Like Teen Spirit'],
    ['Don’t Stop Me Now - Remastered 2011', 'Don’t Stop Me Now'],
  ])('%s → %s', (a, b) => expect(cleanTitle(a)).toBe(b));
});

describe('sameArtist', () => {
  it('negeert "The", hoofdletters en accenten', () => {
    expect(sameArtist('The Killers', 'Killers')).toBe(true);
    expect(sameArtist('Beyoncé', 'beyonce')).toBe(true);
    expect(sameArtist('Simon & Garfunkel', 'Simon and Garfunkel')).toBe(true);
    expect(sameArtist('Queen', 'ABBA')).toBe(false);
  });
});

describe('decideYear (CONCEPT 6.3)', () => {
  it('gelijk of 1 jaar verschil: vroegste, ok', () => {
    expect(decideYear(1985, 1985)).toEqual({ year: 1985, yearSource: 'spotify', status: 'ok' });
    expect(decideYear(1986, 1985)).toEqual({ year: 1985, yearSource: 'musicbrainz', status: 'ok' });
    expect(decideYear(1985, 1986)).toEqual({ year: 1985, yearSource: 'spotify', status: 'ok' });
  });
  it('MusicBrainz eerder (verzamelalbum): MusicBrainz, ok-mb', () => {
    expect(decideYear(2011, 1979)).toEqual({ year: 2011, yearSource: 'spotify', status: 'controleren' }); // > 15 jaar
    expect(decideYear(1994, 1985)).toEqual({ year: 1985, yearSource: 'musicbrainz', status: 'ok-mb' });
  });
  it('MusicBrainz later of geen gegevens: controleren', () => {
    expect(decideYear(1985, 1990).status).toBe('controleren');
    expect(decideYear(1985, null)).toEqual({ year: 1985, yearSource: 'spotify', status: 'controleren' });
  });
});

describe('parseCorrections', () => {
  it('leest spotifyId;year;note;startMs, kopregel en commentaar overslaan', () => {
    const m = parseCorrections('spotifyId;year;note;startMs\n# commentaar\nabc;1979;single;\ndef;;lange intro;12000\n');
    expect(m.get('abc')).toMatchObject({ year: 1979, note: 'single', startMs: null });
    expect(m.get('def')).toMatchObject({ year: null, startMs: 12000 });
    expect(m.size).toBe(2);
  });
});

describe('earliestYear', () => {
  const recs = [
    { 'first-release-date': '1979-09-07', length: 250_000, 'artist-credit': [{ name: 'The Buggles' }] },
    { 'first-release-date': '1978', length: 250_000, 'artist-credit': [{ name: 'Bruce Woolley' }] },
    { 'first-release-date': '1981', length: 400_000, disambiguation: 'live', 'artist-credit': [{ name: 'The Buggles' }] },
  ];
  it('alleen dezelfde artiest', () => expect(earliestYear(recs, 'The Buggles', 251_000, false)).toBe(1979));
  it('strikt: geen live en duur ≤ 10 s verschil', () => expect(earliestYear(recs.slice(2), 'Buggles', 251_000, true)).toBeNull());
  it('yearOf', () => {
    expect(yearOf('1979-09-07')).toBe(1979);
    expect(yearOf('')).toBeNull();
  });
});
