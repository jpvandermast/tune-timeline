// Echte Supabase Realtime (alleen Broadcast + Presence). Draait alleen met RUN_SUPABASE=1.
// Tv en telefoons in aparte browsercontexten, zodat alles echt via Supabase gaat.
import { expect, test } from '@playwright/test';

test.skip(!process.env.RUN_SUPABASE, 'alleen met RUN_SUPABASE=1');

test('tv en 2 telefoons via Supabase: aanmelden, beurt, plaatsen live', async ({ browser }) => {
  const tvCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const tv = await tvCtx.newPage();
  await tv.goto('/tv?nep=1');
  await tv.getByTestId('begin').click();
  await expect(tv.getByTestId('roomcode')).toBeVisible();
  const cur = await tv.evaluate(() => JSON.parse(localStorage.getItem('tt:tv:current')!));

  const phones = [];
  for (const name of ['Ali', 'Bo']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const ph = await ctx.newPage();
    await ph.goto(`/speel/${cur.code}#${cur.chan}`);
    await ph.getByTestId('naam').fill(name);
    await expect(ph.getByTestId('meedoen')).toBeEnabled({ timeout: 15_000 });
    await ph.getByTestId('meedoen').click();
    await expect(ph.getByText(`Je zit erin, ${name}!`)).toBeVisible({ timeout: 15_000 });
    phones.push(ph);
  }
  await expect(tv.locator('.seat.f')).toHaveCount(2);

  // Handmatige code via het lobbykanaal
  const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p3 = await ctx3.newPage();
  await p3.goto('/speel');
  for (let i = 0; i < 4; i++) await p3.getByLabel(`Letter ${i + 1}`).fill(cur.code[i]);
  await p3.getByTestId('verder').click();
  await expect(p3.getByTestId('naam')).toBeVisible({ timeout: 15_000 });

  await phones[0].getByTestId('start').click();
  await phones[0].getByTestId('begrepen').click();
  await expect(tv.locator('[data-phase="deal"]')).toBeVisible({ timeout: 10_000 });
  const st = () => tv.evaluate(() => (window as unknown as { __tt: () => { phase: string; turn: { playerId: string; slot: number | null } | null; players: { id: string }[] } }).__tt());
  await expect.poll(async () => (await st()).phase, { timeout: 15_000 }).toBe('turnStart');
  const s = await st();
  const active = s.players[0].id === s.turn!.playerId ? phones[0] : phones[1];
  await active.getByTestId('start-nummer').click();
  await expect.poll(async () => (await st()).phase, { timeout: 10_000 }).toBe('placing');
  await active.getByTestId('gap-1').click();
  await expect(tv.locator('.arrow')).toBeVisible({ timeout: 5000 });
  await active.getByTestId('vastzetten').click();
  const other = active === phones[0] ? phones[1] : phones[0];
  await expect(other.getByTestId('steelweergave')).toBeVisible({ timeout: 5000 });
  await other.getByTestId('pas').click();
  await expect(tv.locator('[data-phase="reveal"]')).toBeVisible({ timeout: 5000 });
  await expect(active.locator('[data-testid^="resultaat-"]')).toBeVisible({ timeout: 5000 });
});
