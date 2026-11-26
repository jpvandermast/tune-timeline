// Fase 3 in de browser (nep-speler, ?net=lokaal): meegokken, reacties, late instapper, "Ik speelde al",
// afwezige speler, tweede tv, Spotify-storing + terugvaloptie, Expert, eindoverzicht, minder beweging.
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const SHOTS = 'test-results/screens';
mkdirSync(SHOTS, { recursive: true });

interface TvState {
  phase: string;
  paused: boolean;
  pausedBy: string | null;
  round: number;
  hostId: string;
  players: { id: string; name: string; online: boolean; tokens: number; cards: { year: number }[] }[];
  spectators: { id: string }[];
  turn: { playerId: string; slot: number | null; song: { year: number } | null; locked: boolean; waiting: boolean; guesses: Record<string, number>; yearGuess: number | null } | null;
  reveal: { guesses: { playerId: string; correct: boolean }[]; pending: boolean } | null;
  objection: { result: unknown; extra: unknown } | null;
  turnIndex: number;
  startIndex: number;
  phaseStartedAt: number;
  winnerId: string | null;
  version: number;
}

const tvState = (tv: Page) => tv.evaluate(() => (window as unknown as { __tt: () => unknown }).__tt()) as Promise<TvState>;
const setTv = (tv: Page, st: unknown) => tv.evaluate((x) => (window as unknown as { __ttSet: (s: unknown) => void }).__ttSet(x), st);

function correctSlot(years: number[], y: number): number {
  for (let s = 0; s <= years.length; s++) {
    const l = s > 0 ? years[s - 1] : -Infinity;
    const r = s < years.length ? years[s] : Infinity;
    if (y >= l && y <= r) return s;
  }
  return 0;
}
function wrongSlot(years: number[], y: number): number {
  for (let s = 0; s <= years.length; s++) {
    const l = s > 0 ? years[s - 1] : -Infinity;
    const r = s < years.length ? years[s] : Infinity;
    if (!(y >= l && y <= r)) return s;
  }
  return 0;
}

async function openTv(context: BrowserContext, query = 'nep=1&net=lokaal') {
  const tv = await context.newPage();
  await tv.setViewportSize({ width: 1920, height: 1080 });
  await tv.goto(`/tv?${query}`);
  await tv.getByTestId('begin').click();
  await expect(tv.getByTestId('roomcode')).toBeVisible();
  return tv;
}

async function phoneUrl(tv: Page) {
  const cur = await tv.evaluate(() => JSON.parse(localStorage.getItem('tt:tv:current')!));
  return `/speel/${cur.code}?net=lokaal#${cur.chan}`;
}

async function joinPhone(context: BrowserContext, tv: Page, name: string, expectText = `Je zit erin, ${name}!`) {
  const ph = await context.newPage();
  await ph.setViewportSize({ width: 390, height: 844 });
  await ph.goto(await phoneUrl(tv));
  await ph.getByTestId('naam').fill(name);
  await expect(ph.getByTestId('meedoen')).toBeEnabled({ timeout: 10_000 });
  await ph.getByTestId('meedoen').click();
  if (expectText) await expect(ph.getByText(expectText)).toBeVisible({ timeout: 10_000 });
  return ph;
}

async function startGame(phones: Page[], tv: Page) {
  await phones[0].getByTestId('start').click();
  await phones[0].getByTestId('begrepen').click();
  await expect.poll(async () => (await tvState(tv)).phase, { timeout: 15_000 }).toBe('turnStart');
}

const pageOf = async (tv: Page, phones: Page[], names: string[], id: string) => {
  const st = await tvState(tv);
  return phones[names.indexOf(st.players.find((p) => p.id === id)!.name)];
};

/** Geen horizontaal scrollen op de telefoon (390 px). */
async function noHScroll(ph: Page) {
  const w = await ph.evaluate(() => document.scrollingElement!.scrollWidth);
  expect(w).toBeLessThanOrEqual(391);
}

test('meegokken, emoji-reacties en "Jij zat goed 👂"', async ({ browser }) => {
  const context = await browser.newContext();
  const tv = await openTv(context);
  const names = ['Daan', 'Mila', 'Sanne'];
  const phones: Page[] = [];
  for (const n of names) phones.push(await joinPhone(context, tv, n));
  // reactie in de lobby
  await phones[1].getByLabel('Reactie 🔥').click();
  await expect(tv.locator('.seatemo')).toBeVisible();
  await tv.screenshot({ path: `${SHOTS}/tv-p3-01-lobby-reactie.png` });
  await phones[1].screenshot({ path: `${SHOTS}/phone-p3-01-wachten-reacties.png` });
  await startGame(phones, tv);

  let st = await tvState(tv);
  const active = await pageOf(tv, phones, names, st.turn!.playerId);
  const others = phones.filter((p) => p !== active);
  await active.getByTestId('start-nummer').click();
  await expect.poll(async () => (await tvState(tv)).turn?.song?.year ?? null).not.toBeNull();
  st = await tvState(tv);
  const years = st.players.find((p) => p.id === st.turn!.playerId)!.cards.map((c) => c.year);
  const y = st.turn!.song!.year;
  // anderen gokken stiekem mee: één goed, één fout
  await expect(others[0].getByTestId('andermans-beurt')).toBeVisible();
  await others[0].getByTestId(`guess-gap-${correctSlot(years, y)}`).click();
  await others[1].getByTestId(`guess-gap-${wrongSlot(years, y)}`).click();
  await expect(others[0].locator('.pgap.guess, .pgap.both')).toHaveCount(1);
  await expect.poll(async () => Object.keys((await tvState(tv)).turn!.guesses).length).toBe(2);
  await expect(tv.getByText('meegokkers: 2')).toBeVisible();
  // reactie tijdens andermans beurt: zweeft bij het bordje
  await others[1].getByLabel('Reactie 😱').click();
  await expect(tv.locator('.chip [data-testid="emo"]')).toBeVisible();
  await tv.screenshot({ path: `${SHOTS}/tv-p3-02-speelt-meegokkers.png` });
  await others[0].screenshot({ path: `${SHOTS}/phone-p3-02-meegokken.png` });
  await noHScroll(others[0]);
  // max 1 per 3 s: knoppen even grijs
  await expect(others[1].getByLabel('Reactie 🔥')).toBeDisabled();

  await active.getByTestId(`gap-${correctSlot(years, y)}`).click();
  await expect(tv.getByText('Meegokkers: 2')).toBeVisible();
  await tv.screenshot({ path: `${SHOTS}/tv-p3-03-plaatsen-meegokkers.png` });
  await active.getByTestId('vastzetten').click();
  for (const o of others) await o.getByTestId('pas').click().catch(() => {});
  await expect(tv.locator('[data-phase="reveal"]')).toBeVisible({ timeout: 8000 });
  await expect(tv.getByText(/Meegokkers goed: 1 van 2/)).toBeVisible({ timeout: 4000 });
  await expect(others[0].getByTestId('gok-goed')).toHaveText('Jij zat goed 👂');
  await expect(others[1].getByTestId('gok-mis')).toBeVisible();
  await tv.waitForTimeout(2300);
  await tv.screenshot({ path: `${SHOTS}/tv-p3-04-goed-meegokkers.png` });
  await others[0].screenshot({ path: `${SHOTS}/phone-p3-03-jij-zat-goed.png` });
  await context.close();
});

test('late instapper (ronde 1–2), toeschouwer daarna, en "Ik speelde al"', async ({ browser }) => {
  const context = await browser.newContext();
  const tv = await openTv(context);
  const names = ['Josse', 'Daan'];
  const phones: Page[] = [];
  for (const n of names) phones.push(await joinPhone(context, tv, n));
  await startGame(phones, tv);

  // late instapper: 1 startkaart, achteraan
  const late = await context.newPage();
  await late.setViewportSize({ width: 390, height: 844 });
  await late.goto(await phoneUrl(tv));
  await expect(late.getByTestId('laat-uitleg')).toBeVisible({ timeout: 10_000 });
  await late.getByTestId('naam').fill('Lotte');
  await late.screenshot({ path: `${SHOTS}/phone-p3-04-laat-instappen.png` });
  await late.getByTestId('meedoen').click();
  await expect(late.getByTestId('bovenbalk')).toContainText('Lotte', { timeout: 10_000 });
  await expect(tv.getByTestId('chip-Lotte')).toBeVisible();
  const st = await tvState(tv);
  const lotte = st.players.find((p) => p.name === 'Lotte')!;
  expect(lotte.cards).toHaveLength(1);
  const idx = st.players.findIndex((p) => p.name === 'Lotte');
  expect((idx + 1) % st.players.length).toBe(st.startIndex);
  await tv.screenshot({ path: `${SHOTS}/tv-p3-05-laat-ingestapt.png` });

  // na ronde 2: toeschouwer
  await setTv(tv, { ...(await tvState(tv)), round: 3, version: (await tvState(tv)).version + 1 });
  const kijker = await context.newPage();
  await kijker.setViewportSize({ width: 390, height: 844 });
  await kijker.goto(await phoneUrl(tv));
  await expect(kijker.getByTestId('toeschouwer-uitleg')).toBeVisible({ timeout: 10_000 });
  await kijker.getByTestId('naam').fill('Kijker');
  await kijker.getByTestId('meedoen').click();
  await expect(kijker.getByTestId('toeschouwer')).toBeVisible({ timeout: 10_000 });
  expect((await tvState(tv)).spectators).toHaveLength(1);
  await kijker.screenshot({ path: `${SHOTS}/phone-p3-05-toeschouwer.png` });

  // "Ik speelde al": nieuwe telefoon (lege accu) neemt Daan over; host bevestigt
  // ?net=lokaal werkt tussen tabbladen van één browser; een nieuw tabblad heeft een eigen (lege) sessie.
  const fresh = await context.newPage();
  await fresh.setViewportSize({ width: 390, height: 844 });
  await fresh.goto(await phoneUrl(tv));
  await fresh.getByTestId('ik-speelde-al').click();
  await fresh.screenshot({ path: `${SHOTS}/phone-p3-06-ik-speelde-al.png` });
  await fresh.getByRole('button', { name: /Daan/ }).click();
  await expect(fresh.getByTestId('reclaim-wacht')).toBeVisible({ timeout: 10_000 });
  await expect(tv.getByTestId('tv-reclaim')).toBeVisible();
  const host = phones[0];
  await expect(host.getByTestId('host-reclaim')).toContainText('Is dit Daan?');
  await host.screenshot({ path: `${SHOTS}/phone-p3-07-host-is-dit.png` });
  await tv.screenshot({ path: `${SHOTS}/tv-p3-06-is-dit-daan.png` });
  await host.getByTestId('reclaim-ja').click();
  await expect(fresh.getByTestId('bovenbalk')).toContainText('Daan', { timeout: 10_000 });
  await expect(tv.getByTestId('tv-reclaim')).toHaveCount(0);
  await context.close();
});

test('actieve speler offline: "Wachten op …" en dan overslaan', async ({ browser }) => {
  const context = await browser.newContext();
  const tv = await openTv(context, 'nep=1&net=lokaal&snel=1');
  const names = ['Josse', 'Daan', 'Sanne'];
  const phones: Page[] = [];
  for (const n of names) phones.push(await joinPhone(context, tv, n));
  await phones[0].getByTestId('start').click();
  await phones[0].getByTestId('begrepen').click();
  await expect.poll(async () => (await tvState(tv)).phase, { timeout: 15_000 }).toBe('turnStart');
  let st = await tvState(tv);
  // de volgende speler (niet de host) gaat weg
  let nextIdx = (st.turnIndex + 1) % 3;
  if (st.players[nextIdx].id === st.hostId) nextIdx = (nextIdx + 1) % 3;
  const goneId = st.players[nextIdx].id;
  const gone = phones[names.indexOf(st.players[nextIdx].name)];
  await gone.close();
  await expect.poll(async () => (await tvState(tv)).players.find((p) => p.id === goneId)!.online, { timeout: 10_000 }).toBe(false);
  // host slaat beurten over tot de afwezige speler aan de beurt is
  const host = phones[0];
  for (let i = 0; i < 3 && (await tvState(tv)).turn?.playerId !== goneId; i++) {
    await host.getByTestId('tandwiel').click();
    await host.getByTestId('beurt-overslaan').click();
    await tv.waitForTimeout(400);
    if ((await tvState(tv)).phase === 'standings') await expect.poll(async () => (await tvState(tv)).phase, { timeout: 8000 }).toBe('turnStart');
  }
  st = await tvState(tv);
  expect(st.turn?.playerId).toBe(goneId);
  expect(st.turn?.waiting).toBe(true);
  await expect(tv.getByTestId('wachten-op')).toBeVisible();
  await expect(tv.locator('.waitstrip')).toContainText('Wachten op');
  await expect(tv.getByTestId(`chip-${st.players[nextIdx].name}`)).toHaveClass(/off/);
  await tv.screenshot({ path: `${SHOTS}/tv-p3-07-afwezig.png` });
  // 20 s (×0,25) later: overgeslagen
  await expect.poll(async () => (await tvState(tv)).turn?.playerId ?? 'geen', { timeout: 15_000 }).not.toBe(goneId);
  await context.close();
});

test('tweede tv voor dezelfde kamer', async ({ browser }) => {
  const context = await browser.newContext();
  const tv = await openTv(context);
  const tv2 = await context.newPage();
  await tv2.setViewportSize({ width: 1920, height: 1080 });
  await tv2.goto('/tv?nep=1&net=lokaal');
  await expect(tv2.getByTestId('tweede-tv')).toBeVisible({ timeout: 10_000 });
  await expect(tv2.getByText('Er is al een tv actief voor deze kamer.')).toBeVisible();
  await tv2.screenshot({ path: `${SHOTS}/tv-p3-08-tweede-tv.png` });
  // overnemen: de eerste tv geeft het op
  await tv2.getByTestId('overnemen').click();
  await expect(tv.getByTestId('tweede-tv')).toBeVisible({ timeout: 10_000 });
  await expect(tv2.getByTestId('begin')).toBeVisible();
  // verversen van dezelfde tv is géén tweede tv
  await tv2.reload();
  await expect(tv2.getByTestId('begin')).toBeVisible({ timeout: 10_000 });
  await context.close();
});

test('Spotify weg: 3 pogingen, terugvaloptie Spotify-app; verlopen inlog pauzeert netjes', async ({ browser }) => {
  const context = await browser.newContext();
  const tv = await openTv(context);
  const names = ['Josse', 'Daan'];
  const phones: Page[] = [];
  for (const n of names) phones.push(await joinPhone(context, tv, n));
  await startGame(phones, tv);
  let st = await tvState(tv);
  const active = await pageOf(tv, phones, names, st.turn!.playerId);
  await active.getByTestId('start-nummer').click();
  await expect.poll(async () => (await tvState(tv)).phase).toBe('placing');

  // Spotify valt weg en komt 3× niet terug
  await tv.evaluate(() => (window as unknown as { __ttSpotify: (k: string, n: number) => void }).__ttSpotify('weg', 3));
  await expect(tv.getByTestId('spotify-storing')).toBeVisible();
  await expect(tv.getByTestId('spotify-storing')).toContainText('poging 1 van 3');
  await expect.poll(async () => (await tvState(tv)).pausedBy).toBe('system');
  await expect(phones[1].getByText('Even wachten 🔌')).toBeVisible();
  await expect(tv.getByTestId('opnieuw-verbinden')).toBeVisible({ timeout: 15_000 });
  await expect(tv.getByTestId('spotify-storing')).toContainText('Gebruik de Spotify-app op deze pc');
  await tv.screenshot({ path: `${SHOTS}/tv-p3-09-spotify-weg.png` });
  await phones[1].screenshot({ path: `${SHOTS}/phone-p3-08-spotify-weg.png` });
  // terugvaloptie: apparaat kiezen
  await tv.getByTestId('spotify-app').click();
  await expect(tv.getByTestId('apparaat-kiezen')).toBeVisible();
  await tv.screenshot({ path: `${SHOTS}/tv-p3-10-apparaat-kiezen.png` });
  await tv.getByTestId('apparaat').first().click();
  await expect(tv.getByTestId('spotify-storing')).toHaveCount(0);
  await expect.poll(async () => (await tvState(tv)).paused).toBe(false);
  expect((await tvState(tv)).phase).toBe('placing');
  await expect(tv.getByText(/Muziek via de Spotify-app/)).toBeVisible();

  // Spotify-token verlopen: spel pauzeert met "Opnieuw inloggen", status blijft bewaard
  st = await tvState(tv);
  const before = st.players.map((p) => p.cards.length);
  await tv.evaluate(() => (window as unknown as { __ttSpotify: (k: string) => void }).__ttSpotify('auth'));
  await expect(tv.getByTestId('opnieuw-verbinden')).toHaveText('Opnieuw inloggen', { timeout: 5000 });
  await expect(tv.getByText('Spotify-inlog verlopen')).toBeVisible();
  st = await tvState(tv);
  expect(st.paused).toBe(true);
  expect(st.phase).toBe('placing');
  expect(st.players.map((p) => p.cards.length)).toEqual(before);
  const saved = await tv.evaluate(() => {
    const cur = JSON.parse(localStorage.getItem('tt:tv:current')!);
    return JSON.parse(localStorage.getItem(`tt:tv:state:${cur.code}`)!).paused;
  });
  expect(saved).toBe(true);
  await tv.screenshot({ path: `${SHOTS}/tv-p3-11-inlog-verlopen.png` });
  await context.close();
});

test('Expert: jaarwiel, "GOED GELEGD", bezwaar beslist over de kaart; Pro in de lobby', async ({ browser }) => {
  const context = await browser.newContext();
  const tv = await openTv(context);
  const names = ['Josse', 'Daan', 'Mila'];
  const phones: Page[] = [];
  for (const n of names) phones.push(await joinPhone(context, tv, n));
  const host = phones[0];
  await host.getByRole('button', { name: 'Pro', exact: true }).click();
  await expect(tv.locator('.pill').first()).toContainText('Pro');
  await expect(tv.locator('.pill').first()).toContainText('5 tokens');
  await host.getByRole('button', { name: 'Expert', exact: true }).click();
  await expect(tv.locator('.pill').first()).toContainText('Expert');
  await tv.screenshot({ path: `${SHOTS}/tv-p3-12-lobby-expert.png` });
  await host.screenshot({ path: `${SHOTS}/phone-p3-09-host-niveau.png`, fullPage: true });
  await host.getByTestId('start').click();
  await expect(tv.getByTestId('uitleg')).toContainText('exact jaar');
  await host.getByTestId('begrepen').click();
  await expect.poll(async () => (await tvState(tv)).phase, { timeout: 15_000 }).toBe('turnStart');
  let st = await tvState(tv);
  expect(st.players.every((p) => p.tokens === 3)).toBe(true);
  const active = await pageOf(tv, phones, names, st.turn!.playerId);
  const others = phones.filter((p) => p !== active);
  await active.getByTestId('start-nummer').click();
  await expect.poll(async () => (await tvState(tv)).turn?.song?.year ?? null).not.toBeNull();
  st = await tvState(tv);
  const years = st.players.find((p) => p.id === st.turn!.playerId)!.cards.map((c) => c.year);
  const y = st.turn!.song!.year;
  await active.getByTestId(`gap-${correctSlot(years, y)}`).click();
  await expect(active.getByTestId('vastzetten')).toBeDisabled();
  await expect(active.getByTestId('claim')).toContainText('verplicht');
  // jaarwiel naar het goede jaar
  await active.getByRole('button', { name: '1 jaar later' }).click();
  for (let i = 0; i < 80; i++) {
    const cur = Number(await active.getByTestId('jaar').textContent());
    if (cur === y) break;
    const diff = y - cur;
    const name = Math.abs(diff) >= 10 ? (diff > 0 ? '10 jaar later' : '10 jaar eerder') : diff > 0 ? '1 jaar later' : '1 jaar eerder';
    await active.getByRole('button', { name, exact: true }).click();
  }
  await expect(active.getByTestId('jaar')).toHaveText(String(y));
  await active.screenshot({ path: `${SHOTS}/phone-p3-10-jaarwiel.png` });
  await noHScroll(active);
  await expect.poll(async () => (await tvState(tv)).turn!.yearGuess).toBe(y);
  await expect(tv.getByText('jaar gekozen ✓')).toBeVisible();
  await active.getByTestId('vastzetten').click();
  for (const o of others) await o.getByTestId('pas').click().catch(() => {});
  await expect(tv.locator('[data-phase="reveal"]')).toBeVisible({ timeout: 8000 });
  await expect(tv.getByText('GOED GELEGD!')).toBeVisible({ timeout: 4000 });
  await tv.waitForTimeout(800);
  await tv.screenshot({ path: `${SHOTS}/tv-p3-13-expert-goed-gelegd.png` });
  await expect(tv.locator('[data-phase="objection"]')).toBeVisible({ timeout: 8000 });
  await expect(others[0].getByTestId('bezwaar')).toBeVisible();
  await tv.screenshot({ path: `${SHOTS}/tv-p3-14-expert-bezwaar.png` });
  for (const o of others) await o.getByTestId('klopt').click();
  await expect(tv.getByText(/houdt de kaart/)).toBeVisible({ timeout: 5000 });
  await tv.screenshot({ path: `${SHOTS}/tv-p3-15-expert-uitslag.png` });
  await expect(active.getByTestId('bezwaar-uitslag')).toContainText('De kaart is voor jou!');
  await context.close();
});

test('winnaar → eindoverzicht met 4 prijzen; minder beweging', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const tv = await openTv(context);
  const names = ['Mila', 'Daan', 'Sanne', 'Josse'];
  const phones: Page[] = [];
  for (const n of names) phones.push(await joinPhone(context, tv, n));
  await startGame(phones, tv);
  const st = await tvState(tv);
  const p = st.players as unknown as { id: string; stats: Record<string, number | null>; cards: { songId: string; year: number; title: string; artist: string }[] }[];
  p[0].stats = { correct: 9, oldestCorrect: 1966, closestMiss: null, steals: 3, guessesCorrect: 2 };
  p[1].stats = { correct: 3, oldestCorrect: 1972, closestMiss: 1, steals: 0, guessesCorrect: 1 };
  p[2].stats = { correct: 2, oldestCorrect: 1958, closestMiss: 4, steals: 1, guessesCorrect: 0 };
  p[3].stats = { correct: 4, oldestCorrect: 1980, closestMiss: 3, steals: 0, guessesCorrect: 14 };
  const now = await tv.evaluate(() => Date.now());
  await setTv(tv, { ...st, phase: 'winner', winnerId: p[0].id, turn: null, phaseStartedAt: now, deadline: null, version: st.version + 1 });
  await expect(tv.getByText(`${names[0]} wint!`)).toBeVisible();
  await expect(tv.getByTestId('prijzen')).toContainText('Beste oor');
  await tv.screenshot({ path: `${SHOTS}/tv-p3-16-winnaar.png` });
  await expect(phones[0].getByTestId('winnaar-ik')).toBeVisible();
  await phones[0].screenshot({ path: `${SHOTS}/phone-p3-11-winnaar.png` });
  await phones[3].screenshot({ path: `${SHOTS}/phone-p3-12-winnaar-prijs.png` });
  await expect(phones[3].getByTestId('winnaar-ander')).toContainText('Beste oor');
  // na 8 s: eindoverzicht dat blijft staan
  await setTv(tv, { ...(await tvState(tv)), phaseStartedAt: now - 9000, version: (await tvState(tv)).version + 1 });
  await expect(tv.getByTestId('eindoverzicht')).toBeVisible({ timeout: 3000 });
  for (const t of ['Beste oor', 'Meesterdief', 'Tijdreiziger', 'Bijna!']) await expect(tv.getByTestId('eindoverzicht')).toContainText(t);
  await expect(tv.getByTestId('eindoverzicht')).toContainText('Josse · 14×');
  await tv.screenshot({ path: `${SHOTS}/tv-p3-17-eindoverzicht.png` });
  // minder beweging: geen confetti
  const confetti = await tv.evaluate(() => getComputedStyle(document.querySelector('.confetti') ?? document.body).display);
  expect(['none', 'block']).toContain(confetti);
  await context.close();
});

test('gestolen: kaart vliegt in een boog naar het bordje van de steler, munt en "+1"', async ({ browser }) => {
  const context = await browser.newContext();
  const tv = await openTv(context);
  const names = ['Daan', 'Mila', 'Sanne'];
  const phones: Page[] = [];
  for (const n of names) phones.push(await joinPhone(context, tv, n));
  await startGame(phones, tv);
  let st = await tvState(tv);
  const active = await pageOf(tv, phones, names, st.turn!.playerId);
  const others = phones.filter((p) => p !== active);
  await active.getByTestId('start-nummer').click();
  await expect.poll(async () => (await tvState(tv)).turn?.song?.year ?? null).not.toBeNull();
  st = await tvState(tv);
  const years = st.players.find((p) => p.id === st.turn!.playerId)!.cards.map((c) => c.year);
  const y = st.turn!.song!.year;
  const good = correctSlot(years, y);
  const bad = wrongSlot(years, y);
  await active.getByTestId(`gap-${bad}`).click();
  await active.getByTestId('vastzetten').click();
  await expect(others[0].getByTestId('steelweergave')).toBeVisible();
  await others[0].getByTestId(`steal-gap-${good}`).click();
  await others[0].getByTestId('steel').click();
  await expect(tv.locator('.gap .tok')).toHaveCount(1);
  await tv.screenshot({ path: `${SHOTS}/tv-p3-18-steelfiche.png` });
  await others[1].getByTestId('pas').click();
  await expect(tv.locator('[data-phase="reveal"]')).toBeVisible({ timeout: 5000 });
  await expect(tv.locator('.flyx')).toBeVisible({ timeout: 4000 });
  await tv.waitForTimeout(250);
  await tv.screenshot({ path: `${SHOTS}/tv-p3-19-kaart-vliegt.png` });
  await expect(tv.getByText(/GESTOLEN DOOR/)).toBeVisible();
  await tv.waitForTimeout(900);
  await tv.screenshot({ path: `${SHOTS}/tv-p3-20-gestolen.png` });
  await expect(others[0].getByTestId('resultaat-steal-won')).toBeVisible();
  await others[0].screenshot({ path: `${SHOTS}/phone-p3-13-gestolen.png` });
  await context.close();
});
