// De tv als bron van waarheid: regels toepassen, status bewaren, telefoons bijwerken, muziek sturen.
import { useCallback, useEffect, useRef, useState } from 'react';
import { apply, createGame, migrate } from '../game/engine';
import { toPublic } from '../game/public';
import type { Effect, GameEvent, GameState, Song } from '../game/types';
import { netMode, openChannel, supabaseConfigured, type Channel, type ChannelStatus } from '../net/channel';
import { EV, PHONE_INTENTS, channelName, lobbyName, newChannelSecret, newId, newRoomCode, type Intent } from '../net/messages';
import { play as playSound, played, unlockAudio } from '../audio/sfx';
import {
  FakePlayer,
  PlayerProblem,
  SpotifyAppPlayer,
  SpotifyWebPlayer,
  listDevices,
  type Device,
  type MusicPlayer,
  type ProblemKind,
} from '../spotify/player';
import { hasLogin, login, refresh } from '../spotify/auth';

export const CONFIG_MISSING =
  'De Supabase-instellingen ontbreken in deze versie van de site (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY). Vul ze in bij Vercel → Settings → Environment Variables en rol opnieuw uit.';

export type Setup = 'loading' | 'second' | 'connect' | 'sound' | 'starting' | 'fallback' | 'running' | 'error';

/** Spotify-storing tijdens het spel (CONCEPT 4.3 "Spotify weg"). */
export interface Issue {
  kind: ProblemKind;
  attempt: number;
  final: boolean;
  text: string;
}

const CURRENT = 'tt:tv:current';
const stateKey = (code: string) => `tt:tv:state:${code}`;
const lockKey = (code: string) => `tt:tv:lock:${code}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function tvFlags() {
  const p = new URLSearchParams(window.location.search);
  return { nep: p.get('nep') === '1', snel: p.get('snel') === '1', net: p.get('net') };
}

async function loadSongs(nep: boolean): Promise<Song[]> {
  // songs.json wordt alleen hier (op /tv) opgehaald, nooit meegebundeld.
  try {
    const r = await fetch('/songs.json', { cache: 'no-cache' });
    if (r.ok && (r.headers.get('content-type') ?? '').includes('json')) {
      const list = (await r.json()) as Song[];
      const ok = list.filter((s) => s.status !== 'niet-afspeelbaar' && s.year > 1900);
      if (ok.length >= 20) return ok;
    }
  } catch {
    /* val terug */
  }
  if (nep) {
    const r = await fetch('/songs-demo.json');
    return (await r.json()) as Song[];
  }
  throw new Error('songs.json ontbreekt of is te klein. Draai eerst het voorbereidingsscript (npm run songs).');
}

function readCurrent(): { code: string; chan: string } | null {
  try {
    return JSON.parse(localStorage.getItem(CURRENT) || 'null');
  } catch {
    return null;
  }
}

function readSaved(): { code: string; chan: string; state: GameState } | null {
  try {
    const cur = readCurrent();
    if (!cur) return null;
    const st = JSON.parse(localStorage.getItem(stateKey(cur.code)) || 'null') as GameState | null;
    if (!st) return null;
    return { ...cur, state: migrate(st) };
  } catch {
    return null;
  }
}

// ---------- tweede tv (CONCEPT 7.5) ----------

interface Lock {
  tvId: string;
  at: number;
  since: number;
}
function readLock(code: string): Lock | null {
  try {
    return JSON.parse(localStorage.getItem(lockKey(code)) || 'null');
  } catch {
    return null;
  }
}
function myTvId(): string {
  try {
    let id = sessionStorage.getItem('tt:tv:id');
    if (!id) {
      id = newId(10);
      sessionStorage.setItem('tt:tv:id', id);
    }
    return id;
  } catch {
    return newId(10);
  }
}

export function useTvGame() {
  const flags = useRef(tvFlags()).current;
  const [setup, setSetupState] = useState<Setup>('loading');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [room, setRoom] = useState<{ code: string; chan: string } | null>(null);
  const [resumed, setResumed] = useState(false);
  const [net, setNet] = useState<ChannelStatus>('connecting');
  const [issue, setIssue] = useState<Issue | null>(null);
  const [chooser, setChooser] = useState<{ devices: Device[] | null; error: string | null } | null>(null);
  const [usingApp, setUsingApp] = useState<string | null>(null);
  const [, setClock] = useState(0);

  const ref = useRef<GameState | null>(null);
  const setupRef = useRef<Setup>('loading');
  const songsRef = useRef<Song[]>([]);
  const chRef = useRef<Channel | null>(null);
  const lobbyRef = useRef<Channel | null>(null);
  const playerRef = useRef<MusicPlayer | null>(null);
  const lastSent = useRef(0);
  const sendTimer = useRef<number | null>(null);
  const playToken = useRef(0);
  const tvId = useRef(myTvId()).current;
  const since = useRef(Date.now());
  const handling = useRef(false);

  const setSetup = useCallback((s: Setup) => {
    setupRef.current = s;
    setSetupState(s);
  }, []);

  // ---------- status naar telefoons ----------
  const sendNow = useCallback(() => {
    const s = ref.current;
    if (!s || !chRef.current) return;
    lastSent.current = Date.now();
    chRef.current.send(EV.state, { state: toPublic({ ...s, now: Date.now() }), sentAt: Date.now() });
  }, []);

  const scheduleSend = useCallback(() => {
    // Hooguit 4× per seconde (live plaatsen).
    const wait = 250 - (Date.now() - lastSent.current);
    if (wait <= 0) {
      if (sendTimer.current) clearTimeout(sendTimer.current);
      sendTimer.current = null;
      sendNow();
    } else if (!sendTimer.current) {
      sendTimer.current = window.setTimeout(() => {
        sendTimer.current = null;
        sendNow();
      }, wait);
    }
  }, [sendNow]);

  const dispatchRef = useRef<(e: GameEvent) => void>(() => {});
  const problemRef = useRef<(k: ProblemKind, t: string) => void>(() => {});

  // ---------- muziekspeler ----------
  const attach = useCallback((pl: MusicPlayer) => {
    pl.onProblem((k, t) => problemRef.current(k, t));
    pl.onRecovered(() => {
      // De SDK kwam vanzelf terug.
      setIssue((cur) => {
        if (cur && cur.kind === 'weg') {
          dispatchRef.current({ type: 'systemPause', on: false, now: Date.now() });
          return null;
        }
        return cur;
      });
    });
    return pl;
  }, []);

  const getPlayer = useCallback((): MusicPlayer => {
    if (!playerRef.current) playerRef.current = attach(flags.nep ? new FakePlayer() : SpotifyWebPlayer.get());
    return playerRef.current;
  }, [flags.nep, attach]);

  // ---------- effecten ----------
  const runEffects = useCallback(
    (fx: Effect[]) => {
      for (const e of fx) {
        switch (e.type) {
          case 'sound':
            playSound(e.sound, e.delayMs ?? 0);
            break;
          case 'reply':
            chRef.current?.send(EV.reply, { playerId: e.playerId, text: e.text });
            break;
          case 'adopt':
            chRef.current?.send(EV.adopt, { requesterId: e.requesterId, playerId: e.playerId });
            break;
          case 'stop':
            playToken.current++;
            void getPlayer().stop();
            break;
          case 'fade':
            playToken.current++;
            void getPlayer().fadeOut(e.ms);
            break;
          case 'volume':
            void getPlayer().setVolume(e.level);
            break;
          case 'play': {
            const token = ++playToken.current;
            const song = e.song;
            const pl = getPlayer();
            pl.play(song)
              .then(async () => {
                for (let i = 0; i < 12 && token === playToken.current; i++) {
                  await sleep(500);
                  if (token !== playToken.current) return;
                  if (await pl.isPlaying().catch(() => false)) {
                    dispatchRef.current({ type: 'songPlaying', songId: song.id, now: Date.now() });
                    return;
                  }
                }
              })
              .catch((err) => {
                if (token !== playToken.current) return;
                // Ligt het aan Spotify zelf (inlog, apparaat weg)? Dan pauzeren, niet het nummer afkeuren.
                if (err instanceof PlayerProblem) problemRef.current(err.kind, err.message);
                else dispatchRef.current({ type: 'songFailed', songId: song.id, now: Date.now() });
              });
            break;
          }
        }
      }
    },
    [getPlayer],
  );

  const dispatch = useCallback(
    (e: GameEvent) => {
      const cur = ref.current;
      if (!cur) return;
      const r = apply(cur, e);
      if (r.state !== cur) {
        ref.current = r.state;
        setState(r.state);
        try {
          localStorage.setItem(stateKey(r.state.code), JSON.stringify(r.state));
        } catch {
          /* vol */
        }
        scheduleSend();
      }
      runEffects(r.effects);
    },
    [runEffects, scheduleSend],
  );
  dispatchRef.current = dispatch;

  // ---------- Spotify-storingen: 3 pogingen, dan keuze (CONCEPT 4.3, 6.2) ----------
  const reconnectLoop = useCallback(async () => {
    const pl = getPlayer();
    for (let a = 1; a <= 3; a++) {
      setIssue({ kind: 'weg', attempt: a, final: false, text: 'Bezig met opnieuw verbinden…' });
      if (await pl.reconnect()) {
        setIssue(null);
        handling.current = false;
        dispatchRef.current({ type: 'systemPause', on: false, now: Date.now() });
        return;
      }
      await sleep(1500);
    }
    setIssue({ kind: 'weg', attempt: 3, final: true, text: 'Na 3 pogingen lukt het niet om Spotify terug te krijgen.' });
    handling.current = false;
  }, [getPlayer]);

  const onProblem = useCallback(
    async (kind: ProblemKind, text: string) => {
      if (setupRef.current !== 'running' || handling.current) return;
      handling.current = true;
      dispatchRef.current({ type: 'systemPause', on: true, now: Date.now() });
      if (kind === 'weg' || kind === 'init') {
        await reconnectLoop();
        return;
      }
      if (kind === 'auth') {
        setIssue({ kind, attempt: 1, final: false, text: 'Spotify-inlog vernieuwen…' });
        let ok = false;
        try {
          if (!flags.nep) {
            await refresh();
            ok = true;
          } else ok = await getPlayer().reconnect();
        } catch {
          ok = false;
        }
        if (ok) {
          setIssue(null);
          dispatchRef.current({ type: 'systemPause', on: false, now: Date.now() });
        } else setIssue({ kind, attempt: 1, final: true, text: 'De Spotify-inlog is verlopen. Log opnieuw in; het spel blijft bewaard.' });
        handling.current = false;
        return;
      }
      setIssue({ kind, attempt: 1, final: true, text });
      handling.current = false;
    },
    [reconnectLoop, flags.nep, getPlayer],
  );
  problemRef.current = (k, t) => void onProblem(k, t);

  if (flags.nep) {
    // Alleen met de nep-speler: hulpmiddelen voor schermtests.
    const w = window as unknown as Record<string, unknown>;
    w.__tt = () => ref.current;
    w.__ttSet = (st: GameState) => {
      ref.current = st;
      setState(st);
      scheduleSend();
    };
    w.__ttDispatch = (e: GameEvent) => dispatchRef.current(e);
    w.__ttSpotify = (kind: ProblemKind, fails = 0) => (getPlayer() as FakePlayer).simulate(kind, fails);
    w.__ttSounds = () => played.map((x) => x.sound);
  }

  // ---------- opstarten ----------
  const freshGame = useCallback(() => {
    const code = newRoomCode();
    const chan = newChannelSecret();
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const st = createGame({
      code,
      songs: songsRef.current,
      seed,
      now: Date.now(),
      settings: flags.snel ? { tempo: 0.25 } : {},
    });
    localStorage.setItem(CURRENT, JSON.stringify({ code, chan }));
    localStorage.setItem(stateKey(code), JSON.stringify(st));
    ref.current = st;
    setState(st);
    setRoom({ code, chan });
    setResumed(false);
  }, [flags.snel]);

  const boot = useCallback(
    (force: boolean) => {
      const cur = readCurrent();
      if (!force && cur) {
        const lock = readLock(cur.code);
        if (lock && lock.tvId !== tvId && Date.now() - lock.at < 6000) {
          setRoom(cur);
          setSetup('second');
          return;
        }
      }
      const saved = readSaved();
      if (saved && saved.state.phase !== 'lobby') {
        ref.current = saved.state;
        setState(saved.state);
        setRoom({ code: saved.code, chan: saved.chan });
        setResumed(true);
      } else if (saved && saved.state.players.length > 0) {
        // Lobby met spelers: zelfde kamer houden.
        ref.current = saved.state;
        setState(saved.state);
        setRoom({ code: saved.code, chan: saved.chan });
      } else {
        freshGame();
      }
      if (!flags.nep && !hasLogin()) setSetup('connect');
      else setSetup('sound');
    },
    [flags.nep, freshGame, setSetup, tvId],
  );

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        songsRef.current = await loadSongs(flags.nep);
      } catch (err) {
        if (!live) return;
        setError((err as Error).message);
        setSetup('error');
        return;
      }
      if (live) boot(false);
    })();
    return () => {
      live = false;
    };
  }, [flags.nep, boot, setSetup]);

  /** "Toch deze tv gebruiken": de andere tv geeft het over. */
  const takeOver = useCallback(() => {
    const cur = readCurrent();
    const lock = cur ? readLock(cur.code) : null;
    since.current = Math.min(Date.now(), (lock?.since ?? Date.now()) - 1);
    if (cur) localStorage.setItem(lockKey(cur.code), JSON.stringify({ tvId, at: Date.now(), since: since.current }));
    boot(true);
  }, [boot, tvId]);

  // Slot op deze kamer bijhouden (zelfde browser); geef op als een oudere tv actief is.
  useEffect(() => {
    if (!room || setup === 'loading' || setup === 'second' || setup === 'error') return;
    const key = lockKey(room.code);
    const beat = () => {
      const lock = readLock(room.code);
      if (lock && lock.tvId !== tvId && Date.now() - lock.at < 6000 && lock.since < since.current) {
        void playerRef.current?.stop();
        setSetup('second');
        return;
      }
      localStorage.setItem(key, JSON.stringify({ tvId, at: Date.now(), since: since.current }));
    };
    beat();
    const t = window.setInterval(beat, 2000);
    const leave = () => {
      if (readLock(room.code)?.tvId === tvId) localStorage.removeItem(key);
    };
    window.addEventListener('pagehide', leave);
    return () => {
      clearInterval(t);
      window.removeEventListener('pagehide', leave);
    };
  }, [room, setup, tvId, setSetup]);

  // Spotify alvast laden op het "Klik om te beginnen"-scherm.
  useEffect(() => {
    if (setup === 'sound') getPlayer().init().catch(() => {});
  }, [setup, getPlayer]);

  const begin = useCallback(async () => {
    if (netMode() === 'supabase' && !supabaseConfigured()) {
      setError(CONFIG_MISSING);
      setSetup('error');
      return;
    }
    unlockAudio();
    const pl = getPlayer();
    pl.activate();
    setSetup('starting');
    try {
      await pl.init();
      playSound('plop');
      setIssue(null);
      setSetup('running');
      if (resumed) dispatch({ type: 'resume', now: Date.now() });
    } catch (err) {
      setError((err as Error).message);
      // 15 s geen "ready": terugvaloptie (Spotify-app op deze pc).
      setSetup(err instanceof PlayerProblem && err.kind !== 'auth' ? 'fallback' : 'error');
    }
  }, [getPlayer, resumed, dispatch, setSetup]);

  // ---------- terugvaloptie: Spotify-app op deze pc ----------
  const openChooser = useCallback(async () => {
    setChooser({ devices: null, error: null });
    try {
      const list: Device[] = flags.nep
        ? [{ id: 'nep-pc', name: 'Spotify op deze pc (nep)', type: 'Computer', active: false }]
        : await listDevices();
      setChooser({ devices: list, error: null });
    } catch (e) {
      setChooser({ devices: [], error: (e as Error).message });
    }
  }, [flags.nep]);

  const chooseDevice = useCallback(
    (d: Device) => {
      if (flags.nep) (getPlayer() as FakePlayer).heal();
      else playerRef.current = attach(new SpotifyAppPlayer(d.id, d.name));
      setUsingApp(d.name);
      setChooser(null);
      setIssue(null);
      handling.current = false;
      if (setupRef.current !== 'running') {
        unlockAudio();
        setSetup('running');
        if (resumed) dispatchRef.current({ type: 'resume', now: Date.now() });
      } else dispatchRef.current({ type: 'systemPause', on: false, now: Date.now() });
    },
    [flags.nep, getPlayer, attach, resumed, setSetup],
  );

  const retrySpotify = useCallback(() => {
    if (issue?.kind === 'autoplay') {
      unlockAudio();
      getPlayer().activate();
      setIssue(null);
      dispatchRef.current({ type: 'systemPause', on: false, now: Date.now() });
      return;
    }
    if (issue?.kind === 'auth') {
      void login('/tv' + window.location.search);
      return;
    }
    handling.current = true;
    void reconnectLoop();
  }, [issue, getPlayer, reconnectLoop]);

  const newGame = useCallback(() => {
    const prev = readSaved();
    if (prev) {
      localStorage.removeItem(stateKey(prev.code));
      localStorage.removeItem(lockKey(prev.code));
    }
    localStorage.removeItem(CURRENT);
    freshGame();
  }, [freshGame]);

  // ---------- kanalen ----------
  useEffect(() => {
    if (!room || setup !== 'running') return;
    const ch = openChannel(channelName(room.code, room.chan));
    chRef.current = ch;
    ch.onStatus((st) => {
      setNet(st);
      if (st === 'connected') sendNow();
    });
    ch.on(EV.intent, (i: Intent) => {
      // Alleen echte telefoon-intenties; nooit tick/presence/songFailed/tv-acties van buitenaf.
      if (!i || !PHONE_INTENTS.includes(i.type) || typeof i.actionId !== 'string' || typeof i.playerId !== 'string' || typeof i.secret !== 'string') return;
      dispatchRef.current({ ...i, now: Date.now() } as unknown as GameEvent);
    });
    ch.on(EV.hello, () => sendNow());
    ch.on(EV.tvBeat, (m: { tvId: string; since: number }) => {
      // Een andere tv voor deze kamer die er eerder was: wij geven op.
      if (m && m.tvId !== tvId && m.since < since.current) {
        void playerRef.current?.stop();
        setSetup('second');
      }
    });
    ch.onPresence((ids) => dispatchRef.current({ type: 'presence', onlineIds: ids, now: Date.now() }));
    ch.track('tv');

    const lobby = openChannel(lobbyName(room.code));
    lobbyRef.current = lobby;
    lobby.on(EV.ask, (m: { nonce: string }) => {
      if (ref.current?.phase === 'lobby') lobby.send(EV.secret, { nonce: m.nonce, secret: room.chan });
    });

    const beatTv = () => ch.send(EV.tvBeat, { tvId, since: since.current });
    beatTv();
    const beat = window.setInterval(() => {
      sendNow();
      beatTv();
    }, 5000);
    const onOnline = () => sendNow();
    window.addEventListener('online', onOnline);
    return () => {
      clearInterval(beat);
      window.removeEventListener('online', onOnline);
      ch.close();
      lobby.close();
      chRef.current = null;
      lobbyRef.current = null;
    };
  }, [room, setup, sendNow, tvId, setSetup]);

  // ---------- klok ----------
  useEffect(() => {
    if (setup !== 'running') return;
    const t = window.setInterval(() => {
      setClock(Date.now());
      dispatchRef.current({ type: 'tick', now: Date.now() });
    }, 250);
    return () => clearInterval(t);
  }, [setup]);

  return {
    flags,
    setup,
    setSetup,
    error,
    state,
    room,
    resumed,
    net,
    issue,
    chooser,
    usingApp,
    begin,
    newGame,
    takeOver,
    dispatch,
    retrySpotify,
    openChooser,
    chooseDevice,
    closeChooser: () => setChooser(null),
    understood: () => dispatch({ type: 'tvUnderstood', now: Date.now() }),
    confirmReclaim: (requester: string, ok: boolean) => dispatch({ type: 'tvConfirmReclaim', requester, ok, now: Date.now() }),
  };
}
