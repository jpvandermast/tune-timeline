// Muziekspeler voor de tv: Spotify Web Playback SDK, of een nep-speler (?nep=1, tests).
import type { Song } from '../game/types';
import { getToken } from './auth';

export type PlayerStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface MusicPlayer {
  readonly kind: 'spotify' | 'nep';
  /** Laden en verbinden; resolve bij "ready". */
  init(): Promise<void>;
  /** Moet binnen een klik van de gebruiker (autoplay-regel). */
  activate(): void;
  play(song: Song): Promise<void>;
  stop(): Promise<void>;
  setVolume(level: number): Promise<void>;
  /** Speelt er nu hoorbaar iets (positie > 0, niet gepauzeerd)? */
  isPlaying(): Promise<boolean>;
  onProblem(cb: (text: string) => void): void;
}

// ---------------- nep-speler ----------------

export class FakePlayer implements MusicPlayer {
  readonly kind = 'nep' as const;
  private startedAt = 0;
  private current: Song | null = null;
  async init() {}
  activate() {}
  async play(song: Song) {
    this.current = song;
    this.startedAt = Date.now();
  }
  async stop() {
    this.current = null;
  }
  async setVolume() {}
  async isPlaying() {
    // Een id met "kapot" speelt nooit (om "nummer speelt niet" te testen).
    if (!this.current || this.current.id.includes('kapot')) return false;
    return Date.now() - this.startedAt > 300;
  }
  onProblem() {}
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
    s.onerror = () => reject(new Error('Spotify-speler kon niet laden (adblocker?)'));
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
  private problems: ((t: string) => void)[] = [];
  private volume = 1;

  /** Precies één speler per pagina (CONCEPT 6.2). */
  static get(): SpotifyWebPlayer {
    single ??= new SpotifyWebPlayer();
    return single;
  }

  onProblem(cb: (text: string) => void) {
    this.problems.push(cb);
  }
  private problem(t: string) {
    this.problems.forEach((cb) => cb(t));
  }

  init(): Promise<void> {
    this.ready ??= (async () => {
      await loadSdk();
      const player = new window.Spotify!.Player({
        name: 'Tune Timeline TV',
        getOAuthToken: (cb) => {
          getToken()
            .then(cb)
            .catch(() => this.problem('Spotify-inlog verlopen. Log opnieuw in.'));
        },
        volume: 0.9,
      });
      this.player = player;
      const ready = new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Spotify-speler werd niet klaar binnen 15 s')), 15_000);
        player.addListener('ready', ({ device_id }: { device_id: string }) => {
          clearTimeout(timer);
          this.deviceId = device_id;
          setTimeout(resolve, 1000); // na "ready" 1 s wachten vóór het eerste afspelen
        });
      });
      player.addListener('not_ready', () => this.problem('Spotify is even weg. Bezig met opnieuw verbinden…'));
      player.addListener('autoplay_failed', () => this.problem('Klik om muziek te hervatten'));
      player.addListener('initialization_error', ({ message }: { message: string }) =>
        this.problem(`Spotify-speler start niet: ${message}`),
      );
      player.addListener('authentication_error', () => this.problem('Spotify-inlog verlopen. Log opnieuw in.'));
      player.addListener('account_error', () => this.problem('Voor afspelen is Spotify Premium nodig.'));
      const ok = await player.connect();
      if (!ok) throw new Error('Verbinden met Spotify mislukt');
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

  async play(song: Song) {
    await this.init();
    const token = await getToken();
    const res = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(this.deviceId!)}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: [song.uri], position_ms: song.startMs ?? 0 }),
      },
    );
    if (!res.ok && res.status !== 202 && res.status !== 204) {
      throw new Error(`Afspelen mislukt (${res.status})`);
    }
    await this.player?.setVolume(this.volume * 0.9);
  }

  async stop() {
    try {
      await this.player?.pause();
    } catch {
      /* niets */
    }
  }

  async setVolume(level: number) {
    this.volume = level;
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
