// Schermcontrole: tv met 10 spelers en een lange tijdlijn (geen afgeknipte tekst, alles past).
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { apply, createGame } from '../src/game/engine';
import { PLAYER_COLORS, correctSlots } from '../src/game/rules';
import type { GameEvent, GameState, Song } from '../src/game/types';

const SHOTS = 'test-results/screens';
const songs = JSON.parse(readFileSync('public/songs-demo.json', 'utf8')) as Song[];
const NAMES = ['Fleur', 'Bram', 'Noor', 'Tim', 'Lotte', 'Youssef', 'Daan', 'Mila', 'Sanne', 'Josse'];

function tenPlayerState(now: number): GameState {
  let s = createGame({ code: 'KWPX', songs, seed: 9, now });
  const ev = (e: Record<string, unknown>) => (s = apply(s, { now, ...e } as GameEvent).state);
  NAMES.forEach((n, i) => ev({ type: 'join', playerId: `p${i}`, secret: 'x', actionId: `j${i}`, name: n, color: PLAYER_COLORS[i].hex }));
  ev({ type: 'start', playerId: 'p0', secret: 'x', actionId: 'st' });
  ev({ type: 'understood', playerId: 'p0', secret: 'x', actionId: 'un' });
  // Geef iedereen extra kaarten uit de stapel (gesorteerd), actieve speler 9.
  const st = structuredClone(s);
  const pool = [...st.deck];
  st.players.forEach((p, i) => {
    const extra = i === st.startIndex ? 8 : (i * 3) % 8;
    for (let k = 0; k < extra; k++) {
      const song = pool.shift()!;
      p.cards.push({ songId: song.id, year: song.year, title: song.title, artist: song.artist });
    }
    p.cards.sort((a, b) => a.year - b.year);
  });
  st.players[3].online = false;
  st.deck = pool;
  return st;
}

test('tv met 10 spelers: plaatsen met 9 kaarten past op het scherm', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/tv?nep=1&net=lokaal');
  await page.getByTestId('begin').click();
  await expect(page.getByTestId('roomcode')).toBeVisible();
  const now = await page.evaluate(() => Date.now());
  let st = tenPlayerState(now);
  st = apply(st, { type: 'tick', now: now + 7000 } as GameEvent).state; // naar beurtstart
  const active = st.players.find((p) => p.id === st.turn!.playerId)!;
  st = apply(st, { type: 'startSong', playerId: active.id, secret: 'x', actionId: 'ss', now: now + 7100 } as GameEvent).state;
  st = apply(st, { type: 'pickSlot', playerId: active.id, secret: 'x', actionId: 'pk', slot: 5, now: now + 7200 } as GameEvent).state;
  st = { ...st, deadline: Date.now() + 40_000, phaseStartedAt: Date.now(), turn: { ...st.turn!, playing: true } };
  await page.evaluate((x) => (window as unknown as { __ttSet: (s: unknown) => void }).__ttSet(x), st);
  await expect(page.locator('[data-phase="placing"]')).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/tv-11-tien-spelers-plaatsen.png` });

  // Niets buiten het 1920×1080-podium
  const overflow = await page.evaluate(() => {
    const tv = document.querySelector('.tv')!.getBoundingClientRect();
    const out: string[] = [];
    document.querySelectorAll('.chip, .card, .ring, .bottombar').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.left < tv.left - 1 || r.right > tv.right + 1 || r.bottom > tv.bottom + 1) out.push(el.className);
    });
    return out;
  });
  expect(overflow).toEqual([]);
  // Jaartallen minimaal 48 px
  const minYear = await page.evaluate(() =>
    Math.min(...[...document.querySelectorAll('.tl .card .year')].map((e) => parseFloat(getComputedStyle(e).fontSize))),
  );
  expect(minYear).toBeGreaterThanOrEqual(48);

  // Onthulling MIS met lange tijdlijn
  const years = active.cards.map((c) => c.year);
  const good = correctSlots(years, st.turn!.song!.year);
  const wrong = [...Array(years.length + 1).keys()].find((g) => !good.includes(g))!;
  let mis = apply(st, { type: 'pickSlot', playerId: active.id, secret: 'x', actionId: 'pk2', slot: wrong, now: Date.now() } as GameEvent).state;
  mis = apply(mis, { type: 'lock', playerId: active.id, secret: 'x', actionId: 'lk', now: Date.now() } as GameEvent).state;
  mis = { ...mis, deadline: Date.now() + 60_000 };
  await page.evaluate((x) => (window as unknown as { __ttSet: (s: unknown) => void }).__ttSet(x), mis);
  await expect(page.locator('[data-phase="reveal"]')).toBeVisible();
  await page.waitForTimeout(1600);
  await expect(page.locator('.flipwrap .card.back')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/tv-13-tien-spelers-mis.png` });

  // Tussenstand met 10 spelers
  const stand = { ...st, phase: 'standings' as const, turn: null, deadline: Date.now() + 6000, round: 4, version: st.version + 5 };
  await page.evaluate((x) => (window as unknown as { __ttSet: (s: unknown) => void }).__ttSet(x), stand);
  await expect(page.locator('[data-phase="standings"]')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/tv-12-tien-spelers-tussenstand.png` });
});
