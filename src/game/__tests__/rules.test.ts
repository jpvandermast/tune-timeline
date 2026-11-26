import { describe, expect, it } from 'vitest';
import {
  addTokens,
  avatarFor,
  correctSlots,
  estimateMinutes,
  insertCard,
  isCorrectPlacement,
  neighbours,
} from '../rules';
import { shuffle } from '../rng';

describe('isCorrectPlacement (CONCEPT 2.4)', () => {
  const tl = [1967, 1985, 1991, 2004];
  it('goed tussen links en rechts', () => {
    expect(isCorrectPlacement(tl, 1, 1979)).toBe(true);
    expect(isCorrectPlacement(tl, 2, 1979)).toBe(false);
  });
  it('vóór de eerste en na de laatste kaart', () => {
    expect(isCorrectPlacement(tl, 0, 1960)).toBe(true);
    expect(isCorrectPlacement(tl, 0, 1970)).toBe(false);
    expect(isCorrectPlacement(tl, 4, 2010)).toBe(true);
    expect(isCorrectPlacement(tl, 4, 2000)).toBe(false);
  });
  it('zelfde jaar mag aan beide kanten', () => {
    expect(isCorrectPlacement(tl, 1, 1985)).toBe(true);
    expect(isCorrectPlacement(tl, 2, 1985)).toBe(true);
    expect(isCorrectPlacement(tl, 3, 1985)).toBe(false);
  });
  it('reeks gelijke jaren: elke plek binnen, vóór en ná de reeks is goed', () => {
    const run = [1970, 1980, 1980, 1980, 1990];
    expect(correctSlots(run, 1980)).toEqual([1, 2, 3, 4]);
    expect(correctSlots(run, 1975)).toEqual([1]);
  });
  it('lege tijdlijn: elke plek goed', () => {
    expect(isCorrectPlacement([], 0, 1999)).toBe(true);
  });
  it('geen plek gekozen = fout', () => {
    expect(isCorrectPlacement(tl, null, 1979)).toBe(false);
  });
  it('ongeldige plek = fout', () => {
    expect(isCorrectPlacement(tl, 5, 2030)).toBe(false);
    expect(isCorrectPlacement(tl, -1, 1900)).toBe(false);
  });
});

describe('helpers', () => {
  it('neighbours geeft de buren voor "hoorde tussen"', () => {
    expect(neighbours([1967, 1985, 1991], 1979)).toEqual([1967, 1985]);
    expect(neighbours([1967, 1985], 1950)).toEqual([null, 1967]);
    expect(neighbours([1967, 1985], 2000)).toEqual([1985, null]);
  });
  it('insertCard houdt de tijdlijn gesorteerd', () => {
    const c = (y: number) => ({ songId: String(y), year: y, title: '', artist: '' });
    expect(insertCard([c(1970), c(1990)], c(1980)).map((x) => x.year)).toEqual([1970, 1980, 1990]);
    expect(insertCard([c(1970), c(1990)], c(1990)).map((x) => x.year)).toEqual([1970, 1990, 1990]);
  });
  it('tokens nooit boven 5 of onder 0', () => {
    expect(addTokens(5, 1)).toBe(5);
    expect(addTokens(4, 3)).toBe(5);
    expect(addTokens(0, -1)).toBe(0);
  });
  it('letter-avatar: twee letters bij dubbele beginletter', () => {
    const all = [{ name: 'Mila' }, { name: 'Mark' }, { name: 'Daan' }];
    expect(avatarFor('Daan', all)).toBe('D');
    expect(avatarFor('Mila', all)).toBe('Mi');
    expect(avatarFor('Mark', all)).toBe('Ma');
  });
  it('speelduurschatting volgt de tabel', () => {
    expect(estimateMinutes(10, 10)).toBe(105);
    expect(estimateMinutes(4, 10)).toBe(35);
    expect(estimateMinutes(10, 8)).toBe(70);
  });
  it('schudden is deterministisch met een zaadje', () => {
    const a = shuffle([1, 2, 3, 4, 5, 6], 7)[0];
    const b = shuffle([1, 2, 3, 4, 5, 6], 7)[0];
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
