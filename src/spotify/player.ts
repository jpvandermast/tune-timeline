// Muziekspeler voor de tv: Spotify Web Playback SDK, de Spotify-app op de pc (terugvaloptie),
// of een nep-speler (?nep=1, tests).
import type { Song } from '../game/types';
import { getToken, refresh } from './auth';

/** Soorten storing. 'weg' = speler kwijt (opnieuw verbinden helpt vaak). */
export type ProblemKind = 'weg' | 'auth' | 'premium' | 'init' | 'autoplay';

/** Fout die niet aan het nummer ligt, maar aan Spotify (dan niet naar het volgende nummer). */
export class PlayerProblem extends Error {
  kind: ProblemKind;
  constructor(kind: ProblemKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

export interface Device {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

export interface MusicPlayer {
  readonly kind: 'spotify' | 'app' | 'nep';
  /** Laden en verbinden; resolve bij "ready". */
  init(): Promise<void>;
  /** Moet binnen een klik van de gebruiker (autoplay-regel). */
  activate(): void;
  play(song: Song): Promise<void>;
  stop(): Promise<void>;
  /** In `ms` zachter en dan stoppen. */
  fadeOut(ms: number): Promise<void>;
  setVolume(level: number): Promise<void>;
  /** Speelt er nu hoorbaar iets (positie > 0, niet gepauzeerd)? */
  isPlaying(): Promise<boolean>;
  /** Opnieuw verbinden na een storing; true als het weer werkt. */
  reconnect(): Promise<boolean>;
  onProblem(cb: (kind: ProblemKind, text: string) => void): void;
  onRecovered(cb: () => void): void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------- nep-speler ----------------

export class FakePlayer implements MusicPlayer {
  readonly kind = 'nep' as const;
  private startedAt = 0;
  private current: Song | null = null;
  private problems: ((k: ProblemKind, t: string) => void)[] = [];
  private recovered: (() => void)[] = [];
  /** Tests: zoveel keer mislukt opnieuw verbinden nog. */
  failReconnects = 0;
  /** Tests: stoppen met afspelen tot de storing voorbij is. */
  broken: ProblemKind | null = null;
  async init() {}
  activate() {}
  async play(song: Song) {
    if (this.broken) throw new PlayerProblem(this.broken, 'nep-storing');
    this.current = song;
    this.startedAt = Date.now();
  }
  async stop() {
    this.current = null;
  }
  async fadeOut() {
    this.current = null;
  }
  async setVolume() {}
  async isPlaying() {
    // Een id met "kapot" speelt nooit (om "nummer speelt niet" te testen).
    if (!this.current || this.current.id.includes('kapot')) return false;
    return Date.now() - this.startedAt > 300;
  }
  async reconnect() {
    await sleep(400);
    if (this.failReconnects > 0) {
      this.failReconnects -= 1;
      return false;
    }
    if (this.broken === 'auth') return false; // inlog verlopen: opnieuw verbinden helpt niet
    this.broken = null;
    return true;
  }
  onProblem(cb: (k: ProblemKind, t: string) => void) {
    this.problems.push(cb);
  }
  onRecovered(cb: () => void) {
    this.recovered.push(cb);
  }
  /** Tests (?nep=1): doe alsof Spotify wegvalt of het token verloopt. */
  simulate(kind: ProblemKind, failReconnects = 0) {
    this.broken = kind;
    this.failReconnects = failReconnects;
    this.current = null;
    const text = kind === 'auth' ? 'Spotify-inlog verlopen. Log opnieuw in.' : 'Spotify is even weg. Bezig met opnieuw verbinden…';
    this.problems.forEach((cb) => cb(kind, text));
  }
  /** Tests: storing voorbij (bv. na "Opnieuw inloggen"). */
  heal() {
    this.broken = null;
    this.failReconnects = 0;
  }
}

// ---------------- Web API-hulp ----------------

const SDK_NAME = 'Tune Timeline TV';

async function api(path: string, init: RequestInit = {}, retried = false): Promise<Response> {
  let token: string;
  try {
    token = await getToken();
  } catch (e) {
    throw new PlayerProblem('auth', (e as Error).message);
  }
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (res.status === 401 && !retried) {
    // Token net verlopen: één keer vernieuwen en opnieuw proberen.
    try {
      await refresh();
    } catch {
      throw new PlayerProblem('auth', 'Spotify-inlog verlopen. Log opnieuw in.');
    }
    return api(path, init, true);
  }
  if (res.status === 401) throw new PlayerProblem('auth', 'Spotify-inlog verlopen. Log opnieuw in.');
  return res;
}

/** Spotify-apparaten van dit account (voor de terugvaloptie), zonder onze eigen web-speler. */
export async function listDevices(): Promise<Device[]> {
  const res = await api('/me/player/devices');
  if (!res.ok) throw new PlayerProblem('weg', `Apparaten ophalen mislukt (${res.status})`);
  const j = (await res.json()) as { devices: { id: string | null; name: string; type: string; is_active: boolean }[] };
  return j.devices
    .filter((d) => d.id && d.name !== SDK_NAME)
    .map((d) => ({ id: d.id!, name: d.name, type: d.type, active: d.is_active }));
}

async function playOn(deviceId: string, song: Song) {
  const res = await api(`/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    body: JSON.stringify({ uris: [song.uri], position_ms: song.startMs ?? 0 }),
  });
  if (res.status === 404) throw new PlayerProblem('weg', 'Spotify-apparaat niet gevonden');
  if (res.status === 403) {
    const txt = await res.text().catch(() => '');
    if (/premium/i.test(txt)) throw new PlayerProblem('premium', 'Voor afspelen is Spotify Premium nodig.');
    throw new Error('Afspelen mislukt (403)'); // dit nummer mag niet: volgende
  }
  if (res.status === 429 || res.status >= 500) throw new PlayerProblem('weg', `Spotify antwoordt niet (${res.status})`);
  if (!res.ok && res.status !== 202 && res.status !== 204) throw new Error(`Afspelen mislukt (${res.status})`);
}

/** Volume in stapjes naar `to` (fade-in/-out). */
async function ramp(set: (v: number) => Promise<void>, from: number, to: number, ms: number, steps: number, alive: () => boolean) {
  for (let i = 1; i <= steps; i++) {
    if (!alive()) return;
    await set(from + ((to - from) * i) / steps).catch(() => {});
    await sleep(ms / steps);
  }
}

// ---------------- Spotify Web Playback SDK ----------------

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: { Player: new (o: SpotifyPlayerOptions) => SpotifySdkPlayer };
  }
}
interface SpotifyPlayerOptions {
  name: string;
  getOAuthToken: (cb: (t: string) => void) => void;
  volume?: number;
}
interface SpotifySdkPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  activateElement(): Promise<void>;
  pause(): Promise<void>;
  setVolume(v: number): Promise<void>;
  getCurrentState(): Promise<{ paused: boolean; position: number } | null>;
  addListener(ev: string, cb: (arg: any) => void): boolean;
}

let sdkPromise: Promise<void> | null = null;
function loadSdk(): Promise<void> {
  sdkPromise ??= new Promise((resolve, reject) => {
    if (window.Spotify) return resolve();
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const s = document.createElement('script');
    s.src = 'https://sdk.scdn.co/spotify-player.js';
    s.async = true;
    s.onerror = () => {
      sdkPromise = null;
      reject(new PlayerProblem('init', 'Spotify-speler kon niet laden (adblocker?)'));
    };
    document.head.appendChild(s);
  });
  return sdkPromise;
}

let single: SpotifyWebPlayer | null = null;

export class SpotifyWebPlayer implements MusicPlayer {
  readonly kind = 'spotify' as const;
  private player: SpotifySdkPlayer | null = null;
  private deviceId: string | null = null;
  private ready: Promise<void> | null = null;
  private problems: ((k: ProblemKind, t: string) => void)[] = [];
  private recovered: (() => void)[] = [];
  private volume = 1;
  private isReady = false;
  private readyWaiters: (() => void)[] = [];
  private fadeToken = 0;

  /** Precies één speler per pagina (CONCEPT 6.2). */
  static get(): SpotifyWebPlayer {
    single ??= new SpotifyWebPlayer();
    return single;
  }

  onProblem(cb: (k: ProblemKind, t: string) => void) {
    this.problems.push(cb);
  }
  onRecovered(cb: () => void) {
    this.recovered.push(cb);
  }
  private problem(k: ProblemKind, t: string) {
    this.problems.forEach((cb) => cb(k, t));
  }

  init(): Promise<void> {
    this.ready ??= (async () => {
      await loadSdk();
      if (!this.player) {
        const player = new window.Spotify!.Player({
          name: SDK_NAME,
          getOAuthToken: (cb) => {
            getToken()
              .then(cb)
              .catch(() => this.problem('auth', 'Spotify-inlog verlopen. Log opnieuw in.'));
          },
          volume: 0.9,
        });
        this.player = player;
        player.addListener('ready', ({ device_id }: { device_id: string }) => {
          const was = this.isReady;
          this.deviceId = device_id;
          this.isReady = true;
          const w = this.readyWaiters;
          this.readyWaiters = [];
          w.forEach((f) => f());
          if (!was) this.recovered.forEach((cb) => cb());
        });
        player.addListener('not_ready', () => {
          this.isReady = false;
          this.problem('weg', 'Spotify is even weg. Bezig met opnieuw verbinden…');
        });
        player.addListener('autoplay_failed', () => this.problem('autoplay', 'Klik om muziek te hervatten'));
        player.addListener('initialization_error', ({ message }: { message: string }) =>
          this.problem('init', `Spotify-speler start niet: ${message}`),
        );
        player.addListener('authentication_error', () => this.problem('auth', 'Spotify-inlog verlopen. Log opnieuw in.'));
        player.addListener('account_error', () => this.problem('premium', 'Voor afspelen is Spotify Premium nodig.'));
      }
      const ready = new Promise<void>((resolve, reject) => {
        // Na 15 s geen "ready": terugvaloptie aanbieden (CONCEPT 6.2).
        const timer = setTimeout(
          () => reject(new PlayerProblem('init', 'De Spotify-speler werd niet klaar binnen 15 seconden.')),
          15_000,
        );
        this.readyWaiters.push(() => {
          clearTimeout(timer);
          setTimeout(resolve, 1000); // na "ready" 1 s wachten vóór het eerste afspelen
        });
      });
      const ok = await this.player.connect();
      if (!ok) throw new PlayerProblem('init', 'Verbinden met Spotify mislukt');
      await ready;
    })();
    this.ready.catch(() => {
      this.ready = null;
    });
    return this.ready;
  }

  activate() {
    void this.player?.activateElement();
  }

  async reconnect(): Promise<boolean> {
    try {
      await getToken();
    } catch {
      return false;
    }
    if (!this.player) {
      try {
        await this.init();
        return true;
      } catch {
        return false;
      }
    }
    if (this.isReady) return true;
    const back = new Promise<boolean>((resolve) => {
      const t = setTimeout(() => resolve(false), 8000);
      this.readyWaiters.push(() => {
        clearTimeout(t);
        resolve(true);
      });
    });
    try {
      this.player.disconnect();
      await sleep(300);
      await this.player.connect();
    } catch {
      return false;
    }
    return back;
  }

  async play(song: Song) {
    await this.init();
    if (!this.deviceId || !this.isReady) throw new PlayerProblem('weg', 'Geen Spotify-speler');
    const token = ++this.fadeToken;
    await this.player?.setVolume(0).catch(() => {});
    await playOn(this.deviceId, song);
    // 1 s fade-in
    void ramp((v) => this.player!.setVolume(v), 0, this.volume * 0.9, 1000, 8, () => token === this.fadeToken);
  }

  async stop() {
    this.fadeToken++;
    try {
      await this.player?.pause();
    } catch {
      /* niets */
    }
  }

  async fadeOut(ms: number) {
    const token = ++this.fadeToken;
    const from = this.volume * 0.9;
    await ramp((v) => this.player!.setVolume(v), from, 0, ms, 10, () => token === this.fadeToken);
    if (token !== this.fadeToken) return;
    try {
      await this.player?.pause();
      await this.player?.setVolume(from);
    } catch {
      /* niets */
    }
  }

  async setVolume(level: number) {
    this.volume = level;
    this.fadeToken++;
    try {
      await this.player?.setVolume(Math.max(0, Math.min(1, level)) * 0.9);
    } catch {
      /* niets */
    }
  }

  async isPlaying() {
    const st = await this.player?.getCurrentState();
    return Boolean(st && !st.paused && st.position > 0);
  }
}

// ---------------- Terugvaloptie: de Spotify-app op deze pc (Spotify Connect) ----------------

export class SpotifyAppPlayer implements MusicPlayer {
  readonly kind = 'app' as const;
  private problems: ((k: ProblemKind, t: string) => void)[] = [];
  private recovered: (() => void)[] = [];
  private fadeToken = 0;
  deviceId: string;
  deviceName: string;
  constructor(deviceId: string, deviceName: string) {
    this.deviceId = deviceId;
    this.deviceName = deviceName;
  }
  async init() {}
  activate() {}
  onProblem(cb: (k: ProblemKind, t: string) => void) {
    this.problems.push(cb);
  }
  onRecovered(cb: () => void) {
    this.recovered.push(cb);
  }
  async play(song: Song) {
    this.fadeToken++;
    await playOn(this.deviceId, song);
  }
  async stop() {
    this.fadeToken++;
    await api(`/me/player/pause?device_id=${encodeURIComponent(this.deviceId)}`, { method: 'PUT' }).catch(() => {});
  }
  async fadeOut(ms: number) {
    const token = ++this.fadeToken;
    // Weinig stapjes: de Web API heeft een limiet op het aantal verzoeken.
    await ramp((v) => this.volumeRaw(v), 1, 0.2, ms, 3, () => token === this.fadeToken);
    if (token === this.fadeToken) {
      await this.stop();
      await this.volumeRaw(1);
    }
  }
  private async volumeRaw(level: number) {
    const pct = Math.round(Math.max(0, Math.min(1, level)) * 100);
    await api(`/me/player/volume?volume_percent=${pct}&device_id=${encodeURIComponent(this.deviceId)}`, { method: 'PUT' }).catch(
      () => {},
    );
  }
  async setVolume(level: number) {
    await this.volumeRaw(level);
  }
  async isPlaying() {
    const res = await api('/me/player').catch(() => null);
    if (!res || res.status === 204 || !res.ok) return false;
    const j = (await res.json()) as { is_playing: boolean; progress_ms: number; device?: { id: string } };
    return j.is_playing && j.progress_ms > 0 && j.device?.id === this.deviceId;
  }
  async reconnect() {
    try {
      const list = await listDevices();
      return list.some((d) => d.id === this.deviceId);
    } catch {
      return false;
    }
  }
}
