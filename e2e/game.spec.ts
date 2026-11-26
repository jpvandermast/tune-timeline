// Volledig spel met de nep-speler: 1 tv + 3 telefoon-tabbladen in één browser (?net=lokaal).
import { expect, test, type Page, type BrowserContext } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const SHOTS = 'test-results/screens';
mkdirSync(SHOTS, { recursive: true });

interface TvState {
  phase: string;
  players: { id: string; name: string; cards: { year: number }[] }[];
  turn: { playerId: string; slot: number | null; song: { year: number } | null; locked: boolean } | null;
  winnerId: string | null;
  code: string;
}

const tvState = (tv: Page) => tv.evaluate(() => (window as unknown as { __tt: () => unknown }).__tt()) as Promise<TvState>;

function correctSlot(years: number[], y: number): number {
  for (let s = 0; s <= years.length; s++) {
    const l = s > 0 ? years[s - 1] : -Infinity;
    const r = s < years.length ? years[s] : Infinity;
    if (y >= l && y <= r) return s;
  }
  return 0;
}

async function openTv(context: BrowserContext, query = 'nep=1&net=lokaal&snel=1') {
  const tv = await context.newPage();
  await tv.setViewportSize({ width: 1920, height: 1080 });
  await tv.goto(`/tv?${query}`);
  await tv.getByTestId('begin').click();
  await expect(tv.getByTestId('roomcode')).toBeVisible();
  return tv;
}

async function joinPhone(context: BrowserContext, tv: Page, name: string) {
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

test('volledig spel van 3 spelers tot het doel, daarna "Nog een potje"', async ({ browser }) => {
  const context = await browser.newContext();
  const tv = await openTv(context);
  await tv.screenshot({ path: `${SHOTS}/tv-01-lobby-leeg.png` });

  const names = ['Daan', 'Mila', 'Sanne'];
  const phones: Page[] = [];
  for (const n of names) phones.push(await joinPhone(context, tv, n));
  await expect(tv.locator('.seat.f')).toHaveCount(3);
  await tv.screenshot({ path: `${SHOTS}/tv-02-lobby.png` });
  await phones[1].screenshot({ path: `${SHOTS}/phone-01-wachten.png` });
  await phones[0].screenshot({ path: `${SHOTS}/phone-02-wachten-host.png` });

  // host = eerste speler: doel 6 en starten
  await phones[0].getByRole('button', { name: '6', exact: true }).click();
  await expect(tv.getByText('Doel: 6 kaarten')).toBeVisible();
  await phones[0].getByTestId('start').click();
  // Uitleg-scherm: tv 4 blokken, telefoon lijst + "Begrepen"; de host gaat door.
  await expect(tv.locator('[data-phase="explain"]')).toBeVisible();
  await expect(phones[1].getByTestId('uitleg-telefoon')).toBeVisible();
  await phones[1].getByTestId('begrepen').click();
  await expect(tv.getByText('klaar:')).toBeVisible();
  await tv.screenshot({ path: `${SHOTS}/tv-02b-uitleg.png` });
  await phones[1].screenshot({ path: `${SHOTS}/phone-02b-uitleg.png` });
  await phones[0].getByTestId('begrepen').click();
  await expect(tv.locator('[data-phase="deal"]')).toBeVisible();
  await tv.screenshot({ path: `${SHOTS}/tv-03-startkaarten.png` });
  await phones[2].screenshot({ path: `${SHOTS}/phone-03-startkaart.png` });

  const byId = async (id: string) => {
    const st = await tvState(tv);
    const idx = st.players.findIndex((p) => p.id === id);
    return phones[idx];
  };

  let shotTurn = false;
  let shotPlace = false;
  let shotReveal = false;
  let shotStand = false;
  let missDone = false;
  let turns = 0;
  const deadline = Date.now() + 200_000;
  while (Date.now() < deadline) {
    const st = await tvState(tv);
    if (st.phase === 'winner') break;
    if (st.phase === 'turnStart' && st.turn) {
      const ph = await byId(st.turn.playerId);
      if (await ph.getByTestId('start-nummer').isVisible().catch(() => false)) {
        if (!shotTurn) {
          shotTurn = true;
          await tv.screenshot({ path: `${SHOTS}/tv-04-beurtstart.png` });
          await ph.screenshot({ path: `${SHOTS}/phone-04-jij-bent.png` });
        }
        await ph.getByTestId('start-nummer').click().catch(() => {});
      }
    } else if (st.phase === 'placing' && st.turn && !st.turn.locked && st.turn.song) {
      const me = st.players.find((p) => p.id === st.turn!.playerId)!;
      const ph = await byId(me.id);
      const years = me.cards.map((c) => c.year);
      let slot = correctSlot(years, st.turn.song.year);
      // Eén keer bewust fout, om "MIS!" te zien.
      if (!missDone && turns === 1) {
        const wrong = [...Array(years.length + 1).keys()].find((g) => g !== slot && !(st.turn!.song!.year >= (g > 0 ? years[g - 1] : -Infinity) && st.turn!.song!.year <= (g < years.length ? years[g] : Infinity)));
        if (wrong !== undefined) {
          slot = wrong;
          missDone = true;
        }
      }
      if (!(await ph.getByTestId(`gap-${slot}`).isVisible().catch(() => false))) {
        await tv.waitForTimeout(150);
        continue;
      }
      if (!shotPlace) {
        await tv.screenshot({ path: `${SHOTS}/tv-05-speelt.png` });
        await ph.screenshot({ path: `${SHOTS}/phone-05-plaatsen-leeg.png` });
      }
      await ph.getByTestId(`gap-${slot}`).click();
      await expect(tv.locator('.arrow')).toBeVisible();
      if (!shotPlace) {
        shotPlace = true;
        await tv.screenshot({ path: `${SHOTS}/tv-06-plaatsen-live.png` });
        await ph.screenshot({ path: `${SHOTS}/phone-06-plaatsen.png` });
        const other = phones.find((p) => p !== ph)!;
        await expect(other.getByTestId('andermans-beurt')).toBeVisible();
        await other.screenshot({ path: `${SHOTS}/phone-07-andermans-beurt.png` });
      }
      await ph.getByTestId('vastzetten').click();
      turns++;
      await expect(tv.locator('[data-phase="reveal"]')).toBeVisible({ timeout: 5000 });
      if (!shotReveal || (missDone && turns === 2)) {
        await tv.waitForTimeout(1300);
        const tag = turns === 2 && missDone ? 'mis' : 'goed';
        await tv.screenshot({ path: `${SHOTS}/tv-07-onthulling-${tag}.png` });
        await ph.screenshot({ path: `${SHOTS}/phone-08-resultaat-${tag}.png` });
        shotReveal = true;
      }
    } else if (st.phase === 'standings' && !shotStand) {
      shotStand = true;
      await tv.screenshot({ path: `${SHOTS}/tv-08-tussenstand.png` });
      await phones[1].screenshot({ path: `${SHOTS}/phone-09-tussenstand.png` });
    }
    await tv.waitForTimeout(120);
  }

  const end = await tvState(tv);
  expect(end.phase).toBe('winner');
  const winner = end.players.find((p) => p.id === end.winnerId)!;
  expect(winner.cards.length).toBe(6);
  await expect(tv.getByText(`${winner.name} wint!`)).toBeVisible();
  await tv.waitForTimeout(500);
  await tv.screenshot({ path: `${SHOTS}/tv-09-winnaar.png` });
  const wPhone = await byId(winner.id);
  await expect(wPhone.getByTestId('winnaar-ik')).toBeVisible();
  await wPhone.screenshot({ path: `${SHOTS}/phone-10-winnaar.png` });
  const loser = phones.find((p) => p !== wPhone)!;
  await expect(loser.getByTestId('winnaar-ander')).toBeVisible();

  // Nog een potje
  await phones[0].getByTestId('nog-een-potje').click();
  await expect(tv.locator('[data-phase="deal"]')).toBeVisible();
  const again = await tvState(tv);
  expect(again.players.every((p) => p.cards.length === 1)).toBe(true);
  await context.close();
});

test('telefoon herladen en tv verversen midden in een beurt', async ({ browser }) => {
  const context = await browser.newContext();
  const tv = await openTv(context, 'nep=1&net=lokaal');
  const a = await joinPhone(context, tv, 'Anna');
  const b = await joinPhone(context, tv, 'Bas');
  await a.getByTestId('start').click();
  await a.getByTestId('begrepen').click();
  // wachten op beurtstart
  await expect.poll(async () => (await tvState(tv)).phase, { timeout: 15_000 }).toBe('turnStart');
  const st = await tvState(tv);
  const active = st.players[0].id === st.turn!.playerId ? a : b;
  const idle = active === a ? b : a;
  await active.getByTestId('start-nummer').click();
  await expect.poll(async () => (await tvState(tv)).phase).toBe('placing');
  await active.getByTestId('gap-0').click();
  await expect.poll(async () => (await tvState(tv)).turn?.slot).toBe(0);

  // Telefoon herladen: zelfde speler, zelfde kaarten
  const before = await tvState(tv);
  await idle.reload();
  await expect(idle.getByTestId('andermans-beurt')).toBeVisible({ timeout: 10_000 });
  expect((await tvState(tv)).players).toHaveLength(2);

  // Tv verversen: status terug, één klik "Muziek hervatten"
  await tv.reload();
  await expect(tv.getByTestId('begin')).toHaveText(/Muziek hervatten/);
  await tv.screenshot({ path: `${SHOTS}/tv-10-hervatten.png` });
  await tv.getByTestId('begin').click();
  await expect(tv.locator('[data-phase="placing"]')).toBeVisible();
  const after = await tvState(tv);
  expect(after.code).toBe(before.code);
  expect(after.turn?.slot).toBe(0);
  expect(after.players.map((p) => p.cards.length)).toEqual(before.players.map((p) => p.cards.length));
  await active.getByTestId('vastzetten').click();
  await expect(tv.locator('[data-phase="stealing"]')).toBeVisible({ timeout: 5000 });
  await idle.getByTestId('pas').click();
  await expect(tv.locator('[data-phase="reveal"]')).toBeVisible({ timeout: 5000 });
  await context.close();
});

test('startscherm en handmatige code', async ({ browser }) => {
  const context = await browser.newContext();
  const tv = await openTv(context);
  const code = (await tv.getByTestId('roomcode').textContent())!.trim();
  const ph = await context.newPage();
  await ph.setViewportSize({ width: 390, height: 844 });
  await ph.goto('/speel?net=lokaal');
  await ph.screenshot({ path: `${SHOTS}/phone-00-aanmelden.png` });
  await ph.getByLabel('Letter 1').fill(code[0]);
  await ph.getByLabel('Letter 2').fill(code[1]);
  await ph.getByLabel('Letter 3').fill(code[2]);
  await ph.getByLabel('Letter 4').fill(code[3]);
  await ph.getByTestId('verder').click();
  await expect(ph.getByTestId('naam')).toBeVisible({ timeout: 10_000 });
  await ph.getByTestId('naam').fill('Josse');
  await ph.screenshot({ path: `${SHOTS}/phone-00b-naam.png` });
  await ph.getByTestId('meedoen').click();
  await expect(ph.getByText('Je zit erin, Josse!')).toBeVisible();
  await expect(tv.locator('.seat.f')).toHaveCount(1);
  await context.close();
});
