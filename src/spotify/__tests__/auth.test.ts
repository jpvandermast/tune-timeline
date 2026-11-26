// Spotify-token vernieuwen (CONCEPT 7.5): elke ±45 min stil vernieuwen; lukt dat niet,
// dan een duidelijke fout zodat de tv het spel pauzeert met "Opnieuw inloggen".
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
};

const { getToken, hasLogin } = await import('../auth');

function save(expiresInMin: number, refresh = 'r1') {
  store.set('tt:spotify', JSON.stringify({ access: 'oud', refresh, expiresAt: Date.now() + expiresInMin * 60_000 }));
}

describe('getToken', () => {
  beforeEach(() => {
    store.clear();
    vi.restoreAllMocks();
  });
  it('nog lang geldig: geen verzoek, zelfde token', async () => {
    save(50);
    const f = vi.spyOn(globalThis, 'fetch');
    expect(await getToken()).toBe('oud');
    expect(f).not.toHaveBeenCalled();
  });
  it('minder dan 15 min geldig: vernieuwen met het refresh token', async () => {
    save(10);
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'nieuw', expires_in: 3600 }), { status: 200 }),
    );
    expect(await getToken()).toBe('nieuw');
    expect(f).toHaveBeenCalledTimes(1);
    const body = String((f.mock.calls[0][1] as RequestInit).body);
    expect(body).toContain('grant_type=refresh_token');
    expect(body).toContain('refresh_token=r1');
    // refresh token blijft bewaard als Spotify geen nieuwe meestuurt
    expect(JSON.parse(store.get('tt:spotify')!).refresh).toBe('r1');
    expect(hasLogin()).toBe(true);
  });
  it('verlopen en vernieuwen mislukt: nette fout (de tv pauzeert dan)', async () => {
    save(-5);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"error":"invalid_grant"}', { status: 400 }));
    await expect(getToken()).rejects.toThrow(/Spotify/);
  });
  it('niet ingelogd: fout', async () => {
    await expect(getToken()).rejects.toThrow(/Niet ingelogd/);
  });
});
