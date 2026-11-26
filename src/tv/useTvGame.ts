// De tv als bron van waarheid: regels toepassen, status bewaren, telefoons bijwerken, muziek sturen.
import { useCallback, useEffect, useRef, useState } from 'react';
import { apply, createGame } from '../game/engine';
import { toPublic } from '../game/public';
import type { Effect, GameEvent, GameState, Song } from '../game/types';
import { openChannel, type Channel, type ChannelStatus } from '../net/channel';
import { EV, PHONE_INTENTS, channelName, lobbyName, newChannelSecret, newRoomCode, type Intent } from '../net/messages';
import { play as playSound, unlockAudio } from '../audio/sfx';
import { FakePlayer, SpotifyWebPlayer, type MusicPlayer } from '../spotify/player';
import { hasLogin } from '../spotify/auth';

export type Setup = 'loading' | 'connect' | 'sound' | 'starting' | 'running' | 'error';

const CURRENT = 'tt:tv:current';
const stateKey = (code: string) => `tt:tv:state:${code}`;

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

function readSaved(): { code: string; chan: string; state: GameState } | null {
  try {
    const cur = JSON.parse(localStorage.getItem(CURRENT) || 'null') as { code: string; chan: string } | null;
    if (!cur) return null;
    const st = JSON.parse(localStorage.getItem(stateKey(cur.code)) || 'null') as GameState | null;
    if (!st) return null;
    return { ...cur, state: st };
  } catch {
    return null;
  }
}

export function useTvGame() {
  const flags = useRef(tvFlags()).current;
  const [setup, setSetup] = useState<Setup>('loading');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [room, setRoom] = useState<{ code: string; chan: string } | null>(null);
  const [resumed, setResumed] = useState(false);
  const [net, setNet] = useState<ChannelStatus>('connecting');
  const [problem, setProblem] = useState<string | null>(null);
  const [, setClock] = useState(0);

  const ref = useRef<GameState | null>(null);
  const songsRef = useRef<Song[]>([]);
  const chRef = useRef<Channel | null>(null);
  const lobbyRef = useRef<Channel | null>(null);
  const playerRef = useRef<MusicPlayer | null>(null);
  const lastSent = useRef(0);
  const sendTimer = useRef<number | null>(null);
  const playToken = useRef(0);

  const getPlayer = useCallback((): MusicPlayer => {
    if (!playerRef.current) {
      playerRef.current = flags.nep ? new FakePlayer() : SpotifyWebPlayer.get();
      playerRef.current.onProblem((t) => setProblem(t));
    }
    return playerRef.current;
  }, [flags.nep]);

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

  // ---------- effecten ----------
  const dispatchRef = useRef<(e: GameEvent) => void>(() => {});

  const runEffects = useCallback(
    (fx: Effect[]) => {
      for (const e of fx) {
        switch (e.type) {
          case 'sound':
            playSound(e.sound);
            break;
          case 'reply':
            chRef.current?.send(EV.reply, { playerId: e.playerId, text: e.text });
            break;
          case 'stop':
            void getPlayer().stop();
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
                  await new Promise((r) => setTimeout(r, 500));
                  if (token !== playToken.current) return;
                  if (await pl.isPlaying()) {
                    dispatchRef.current({ type: 'songPlaying', songId: song.id, now: Date.now() });
                    return;
                  }
                }
              })
              .catch(() => {
                if (token === playToken.current)
                  dispatchRef.current({ type: 'songFailed', songId: song.id, now: Date.now() });
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
  if (flags.nep) {
    // Alleen met de nep-speler: hulpmiddelen voor schermtests.
    const w = window as unknown as { __tt?: () => GameState | null; __ttSet?: (st: GameState) => void };
    w.__tt = () => ref.current;
    w.__ttSet = (st) => {
      ref.current = st;
      setState(st);
      scheduleSend();
    };
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
      if (!live) return;
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
    })();
    return () => {
      live = false;
    };
  }, [flags.nep, freshGame]);

  // Spotify alvast laden op het "Klik om te beginnen"-scherm.
  useEffect(() => {
    if (setup === 'sound') getPlayer().init().catch(() => {});
  }, [setup, getPlayer]);

  const begin = useCallback(async () => {
    unlockAudio();
    const pl = getPlayer();
    pl.activate();
    setSetup('starting');
    try {
      await pl.init();
      playSound('plop');
      setProblem(null);
      setSetup('running');
      if (resumed) dispatch({ type: 'resume', now: Date.now() });
    } catch (err) {
      setError((err as Error).message);
      setSetup('error');
    }
  }, [getPlayer, resumed, dispatch]);

  const newGame = useCallback(() => {
    const prev = readSaved();
    if (prev) localStorage.removeItem(stateKey(prev.code));
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
      // Alleen echte telefoon-intenties; nooit tick/presence/songFailed van buitenaf.
      if (!i || !PHONE_INTENTS.includes(i.type) || typeof i.actionId !== 'string' || typeof i.playerId !== 'string' || typeof i.secret !== 'string') return;
      dispatchRef.current({ ...i, now: Date.now() } as unknown as GameEvent);
    });
    ch.on(EV.hello, () => sendNow());
    ch.onPresence((ids) => dispatchRef.current({ type: 'presence', onlineIds: ids, now: Date.now() }));
    ch.track('tv');

    const lobby = openChannel(lobbyName(room.code));
    lobbyRef.current = lobby;
    lobby.on(EV.ask, (m: { nonce: string }) => {
      if (ref.current?.phase === 'lobby') lobby.send(EV.secret, { nonce: m.nonce, secret: room.chan });
    });

    const beat = window.setInterval(sendNow, 5000);
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
  }, [room, setup, sendNow]);

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
    problem,
    begin,
    newGame,
    dispatch,
    clearProblem: () => setProblem(null),
  };
}
