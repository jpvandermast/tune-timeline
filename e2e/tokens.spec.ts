// Fase 2: 4 spelers. Kopen, claimen, stelen (goed + fout), passen, bezwaar, overslaan, pauze.
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const SHOTS = 'test-results/screens';
mkdirSync(SHOTS, { recursive: true });

interface St {
  phase: string;
  paused: boolean;
  players: { id: string; name: string; tokens: number; cards: { year: number }[] }[];
  turn: { playerId: string; slot: number | null; song: { year: number } | null; claim: boolean; steals: { playerId: string; slot: number }[] } | null;
  reveal: { stolenBy: string | null; correct: boolean } | null;
  objection: { result: { ok: boolean } | null } | null;
}
const tvState = (tv: Page) => tv.evaluate(() => (window as unknown as { __tt: () => unknown }).__tt()) as Promise<St>;

function okSlots(years: number[], y: number): number[] {
  const out: number[] = [];
  for (let s = 0; s <= years.length; s++) {
    const l = s > 0 ? years[s - 1] : -Infinity;
    const r = s < years.length ? years[s] : Infinity;
    if (y >= l && y <= r) out.push(s);
  }
  return out;
}

async function join(context: BrowserContext, tv: Page, name: string) {
  const cur = await tv.evaluate(() => JSON.parse(localStorage.getItem('tt:tv:current')!));
  const ph = await context.newPage();
  await ph.setViewportSize({ width: 390, height: 844 });
  await ph.goto(`/speel/${cur.code}?net=lokaal#${cur.chan}`);
  await ph.getByTestId('naam').fill(name);
  await expect(ph.getByTestId('meedoen')).toBeEnabled({ timeout: 10_000 });
  await ph.getByTestId('meedoen').click();
  await expect(ph.getByText(`Je zit erin, ${name}!`)).toBeVisible({ timeout: 10_000 });
  return ph;
}

test('4 spelers: kopen, claimen, stelen, passen, bezwaar, overslaan en pauze', async ({ browser }) => {
  const context = await browser.newContext();
  const tv = await context.newPage();
  await tv.setViewportSize({ width: 1920, height: 1080 });
  await tv.goto('/tv?nep=1&net=lokaal');
  await tv.getByTestId('begin').click();
  await expect(tv.getByTestId('roomcode')).toBeVisible();

  const names = ['Josse', 'Daan', 'Mila', 'Sanne'];
  const phones: Page[] = [];
  for (const n of names) phones.push(await join(context, tv, n));
  await phones[0].getByTestId('start').click();
  await phones[0].getByTestId('begrepen').click();
  await expect.poll(async () => (await tvState(tv)).phase, { timeout: 15_000 }).toBe('turnStart');

  const pageOf = async (id: string) => phones[(await tvState(tv)).players.findIndex((p) => p.id === id)];
  let st = await tvState(tv);
  const activeId = st.turn!.playerId;
  const active = await pageOf(activeId);
  const others = st.players.filter((p) => p.id !== activeId);

  // ---- Kopen: geef de actieve speler 3 tokens (via de tv-debughaak) ----
  await tv.evaluate((id) => {
    const w = window as unknown as { __tt: () => { players: { id: string; tokens: number }[] }; __ttSet: (s: unknown) => void };
    const s = structuredClone(w.__tt());
    s.players.find((p) => p.id === id)!.tokens = 3;
    w.__ttSet({ ...s, version: (s as unknown as { version: number }).version + 1 });
  }, activeId);
  await expect(active.getByTestId('kopen')).toBeVisible();
  await active.screenshot({ path: `${SHOTS}/phone-20-kopen.png` });
  await active.getByTestId('kopen').click();
  await expect(tv.getByText(/koopt een kaart/)).toBeVisible();
  await tv.screenshot({ path: `${SHOTS}/tv-20-kopen.png` });
  st = await tvState(tv);
  expect(st.players.find((p) => p.id === activeId)!.tokens).toBe(0);
  expect(st.players.find((p) => p.id === activeId)!.cards).toHaveLength(2);
  await active.getByTestId('start-nummer').click();
  await expect.poll(async () => (await tvState(tv)).phase).toBe('placing');

  // ---- Claimen + bewust fout plaatsen ----
  await active.getByTestId('claim').click();
  await expect.poll(async () => (await tvState(tv)).turn?.claim).toBe(true);
  await expect(active.getByTestId('overslaan')).toBeDisabled(); // 0 tokens
  st = await tvState(tv);
  const years = st.players.find((p) => p.id === activeId)!.cards.map((c) => c.year);
  const songYear = st.turn!.song!.year;
  const good = okSlots(years, songYear);
  const wrong = [...Array(years.length + 1).keys()].filter((g) => !good.includes(g));
  expect(wrong.length).toBeGreaterThan(0);
  await active.getByTestId(`gap-${wrong[0]}`).click();
  await expect(tv.locator('.arrow')).toBeVisible();
  await tv.screenshot({ path: `${SHOTS}/tv-21-plaatsen-claim.png` });
  await active.screenshot({ path: `${SHOTS}/phone-21-plaatsen-claim.png` });
  await active.getByTestId('vastzetten').click();
  await expect(tv.locator('[data-phase="stealing"]')).toBeVisible();

  // ---- Stelen ----
  const thief = await pageOf(others[0].id);
  const loser = await pageOf(others[1].id);
  const passer = await pageOf(others[2].id);
  await expect(thief.getByTestId('steelweergave')).toBeVisible();
  await thief.getByTestId(`steal-gap-${good[0]}`).click();
  await thief.screenshot({ path: `${SHOTS}/phone-22-stelen.png` });
  await thief.getByTestId('steel').click();
  await expect.poll(async () => (await tvState(tv)).turn?.steals.length).toBe(1);
  const loserSlot = wrong.find((g) => g !== wrong[0]);
  if (loserSlot !== undefined) {
    await loser.getByTestId(`steal-gap-${loserSlot}`).click();
    await loser.getByTestId('steel').click();
    await expect.poll(async () => (await tvState(tv)).turn?.steals.length).toBe(2);
  } else {
    await loser.getByTestId('pas').click();
  }
  await tv.screenshot({ path: `${SHOTS}/tv-22-steelvenster.png` });
  await active.screenshot({ path: `${SHOTS}/phone-23-vastgezet-steals.png` });
  await passer.getByTestId('pas').click(); // laatste: venster sluit eerder

  // ---- Onthulling: gestolen ----
  await expect(tv.locator('[data-phase="reveal"]')).toBeVisible({ timeout: 5000 });
  st = await tvState(tv);
  expect(st.reveal!.stolenBy).toBe(others[0].id);
  await expect(thief.getByTestId('resultaat-steal-won')).toBeVisible();
  if (loserSlot !== undefined) await expect(loser.getByTestId('resultaat-steal-lost')).toBeVisible();
  await tv.waitForTimeout(1300);
  await tv.screenshot({ path: `${SHOTS}/tv-23-gestolen.png` });
  await thief.screenshot({ path: `${SHOTS}/phone-24-gestolen.png` });
  expect(st.players.find((p) => p.id === others[0].id)!.cards).toHaveLength(2);

  // ---- Bezwaar: 2 van de 3 tikken "Fout!" → afgekeurd ----
  await expect(tv.locator('[data-phase="objection"]')).toBeVisible({ timeout: 8000 });
  await expect(passer.getByTestId('bezwaar')).toBeVisible();
  await tv.screenshot({ path: `${SHOTS}/tv-24-bezwaar.png` });
  await passer.screenshot({ path: `${SHOTS}/phone-25-bezwaar.png` });
  await passer.getByTestId('fout').click();
  await loser.getByTestId('fout').click();
  await expect.poll(async () => (await tvState(tv)).objection?.result?.ok).toBe(false);
  await expect(tv.getByText('Afgekeurd')).toBeVisible();
  await tv.screenshot({ path: `${SHOTS}/tv-25-bezwaar-afgekeurd.png` });

  // ---- Volgende beurt: overslaan kost 1 token ----
  await expect.poll(async () => (await tvState(tv)).phase, { timeout: 10_000 }).toMatch(/turnStart|standings/);
  await expect.poll(async () => (await tvState(tv)).phase, { timeout: 10_000 }).toBe('turnStart');
  st = await tvState(tv);
  const next = await pageOf(st.turn!.playerId);
  const before = st.players.find((p) => p.id === st.turn!.playerId)!.tokens;
  await next.getByTestId('start-nummer').click();
  await expect.poll(async () => (await tvState(tv)).phase).toBe('placing');
  await expect(next.getByTestId('overslaan')).toBeEnabled();
  await next.getByTestId('overslaan').click();
  await expect(tv.getByText(/slaat dit nummer over/)).toBeVisible();
  await tv.screenshot({ path: `${SHOTS}/tv-26-overslaan.png` });
  st = await tvState(tv);
  expect(st.players.find((p) => p.id === st.turn!.playerId)!.tokens).toBe(before - 1);

  // ---- Hostmenu: pauze en verder ----
  await phones[0].getByTestId('tandwiel').click();
  await phones[0].screenshot({ path: `${SHOTS}/phone-26-hostmenu.png` });
  await phones[0].getByTestId('pauze').click();
  await expect(tv.locator('[data-phase="paused"]')).toBeVisible();
  await tv.screenshot({ path: `${SHOTS}/tv-27-pauze.png` });
  await phones[0].getByTestId('tandwiel').click();
  await phones[0].getByTestId('pauze').click();
  await expect(tv.locator('[data-phase="placing"]')).toBeVisible();

  // ---- Tokens-uitleg via de bovenbalk ----
  await phones[1].getByTestId('bovenbalk').click();
  await expect(phones[1].getByText(/Jouw tokens:/)).toBeVisible();
  await phones[1].screenshot({ path: `${SHOTS}/phone-27-tokens.png` });
  await phones[1].getByTestId('sluiten').click();
  await context.close();
});
