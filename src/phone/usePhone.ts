// Verbinding van een telefoon met de tv. Bewaart spelerId/geheim, herverbindt bij terugkeer.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicState } from '../game/public';
import { netMode, openChannel, rememberNetMode, type Channel } from '../net/channel';
import { EV, channelName, lobbyName, newId, type IntentType, type StateMsg } from '../net/messages';

const KEY = 'tt:phone';

export interface Session {
  code: string;
  chan: string;
  playerId: string;
  secret: string;
}

// Lokaal testen (?net=lokaal): sessie per tabblad, zodat meerdere "telefoons" in één browser kunnen.
const store = (): Storage => (netMode() === 'lokaal' ? sessionStorage : localStorage);

function loadSession(): Session | null {
  try {
    return JSON.parse(store().getItem(KEY) || 'null');
  } catch {
    return null;
  }
}
function saveSession(s: Session | null) {
  try {
    if (s) store().setItem(KEY, JSON.stringify(s));
    else store().removeItem(KEY);
  } catch {
    /* geen opslag */
  }
}

/** Leest /speel/KWPX#geheim uit de adresbalk. */
export function initialSession(): { session: Session | null; code: string | null } {
  rememberNetMode();
  const m = window.location.pathname.match(/^\/speel\/([A-Za-z]{4})\/?$/);
  const code = m ? m[1].toUpperCase() : null;
  const chan = window.location.hash.replace(/^#/, '');
  const stored = loadSession();
  if (code && chan) {
    const s: Session =
      stored && stored.code === code && stored.chan === chan
        ? stored
        : { code, chan, playerId: newId(), secret: newId(16) };
    saveSession(s);
    window.history.replaceState(null, '', `/speel/${code}${window.location.search}`);
    return { session: s, code };
  }
  if (code && stored?.code === code) return { session: stored, code };
  if (!code && stored) return { session: stored, code: stored.code };
  return { session: null, code };
}

export type Conn = 'connecting' | 'connected' | 'lost';

export function usePhone() {
  const init = useRef(initialSession()).current;
  const [session, setSession] = useState<Session | null>(init.session);
  const [pub, setPub] = useState<PublicState | null>(null);
  const [offset, setOffset] = useState(0);
  const [conn, setConn] = useState<Conn>('connecting');
  const [back, setBack] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<Partial<Record<IntentType, boolean>>>({});
  const chRef = useRef<Channel | null>(null);
  const lastMsg = useRef(Date.now());
  const verRef = useRef(0);
  const codeRef = useRef<string | null>(null);
  const wasLost = useRef(false);

  const showToast = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 3500);
  }, []);

  const connect = useCallback(() => {
    if (!session) return;
    chRef.current?.close();
    const ch = openChannel(channelName(session.code, session.chan));
    chRef.current = ch;
    setConn((c) => (c === 'connected' ? 'connecting' : c));
    ch.on(EV.state, (m: StateMsg) => {
      lastMsg.current = Date.now();
      const st = m.state;
      if (codeRef.current !== st.code) {
        codeRef.current = st.code;
        verRef.current = 0;
      }
      setOffset(m.sentAt - Date.now());
      setConn('connected');
      if (wasLost.current) {
        wasLost.current = false;
        setBack(true);
        window.setTimeout(() => setBack(false), 1500);
      }
      if (st.version >= verRef.current) {
        if (st.version > verRef.current) setBusy({});
        verRef.current = st.version;
        setPub(st);
      }
    });
    ch.on(EV.reply, (m: { playerId: string; text: string }) => {
      if (m.playerId === session.playerId) {
        setBusy({});
        showToast(m.text);
      }
    });
    ch.onStatus((st) => {
      if (st === 'connected') {
        ch.track(session.playerId);
        ch.send(EV.hello, { playerId: session.playerId });
      } else if (st === 'error') {
        wasLost.current = true;
        setConn('lost');
      }
    });
  }, [session, showToast]);

  useEffect(() => {
    if (!session) return;
    connect();
    return () => {
      chRef.current?.close();
      chRef.current = null;
    };
  }, [session, connect]);

  // iPhones verbreken websockets stil op de achtergrond: bij terugkeer altijd opnieuw abonneren.
  useEffect(() => {
    if (!session) return;
    const again = () => {
      if (document.visibilityState === 'visible') connect();
    };
    const onOnline = () => connect();
    document.addEventListener('visibilitychange', again);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', () => setConn('lost'));
    const watchdog = window.setInterval(() => {
      // tv stuurt elke 5 s de status; 12 s niets = verbinding kwijt
      if (Date.now() - lastMsg.current > 12_000) {
        wasLost.current = true;
        setConn('lost');
        lastMsg.current = Date.now() - 6000; // volgende poging over ±6 s
        connect();
      }
    }, 2000);
    return () => {
      document.removeEventListener('visibilitychange', again);
      window.removeEventListener('online', onOnline);
      clearInterval(watchdog);
    };
  }, [session, connect]);

  const send = useCallback(
    (type: IntentType, extra: Record<string, unknown> = {}) => {
      if (!session || !chRef.current) return;
      setBusy((b) => ({ ...b, [type]: true }));
      window.setTimeout(() => setBusy((b) => ({ ...b, [type]: false })), 3000);
      chRef.current.send(EV.intent, {
        type,
        playerId: session.playerId,
        secret: session.secret,
        actionId: newId(),
        ...extra,
      });
    },
    [session],
  );

  /** Handmatige code: vraag het kanaalgeheim op via het lobbykanaal. */
  const joinByCode = useCallback(async (code: string): Promise<boolean> => {
    const lobby = openChannel(lobbyName(code));
    const nonce = newId(8);
    try {
      const secret = await new Promise<string | null>((resolve) => {
        const t = window.setTimeout(() => resolve(null), 6000);
        lobby.on(EV.secret, (m: { nonce: string; secret: string }) => {
          if (m.nonce === nonce) {
            clearTimeout(t);
            resolve(m.secret);
          }
        });
        let tries = 0;
        const ask = () => {
          if (tries++ > 5) return;
          lobby.send(EV.ask, { nonce });
          window.setTimeout(ask, 1000);
        };
        lobby.onStatus((st) => st === 'connected' && ask());
      });
      if (!secret) return false;
      const stored = loadSession();
      const s: Session =
        stored && stored.code === code && stored.chan === secret
          ? stored
          : { code, chan: secret, playerId: newId(), secret: newId(16) };
      saveSession(s);
      setSession(s);
      window.history.replaceState(null, '', `/speel/${code}${window.location.search}`);
      return true;
    } finally {
      lobby.close();
    }
  }, []);

  const leave = useCallback(() => {
    saveSession(null);
    setSession(null);
    setPub(null);
    window.history.replaceState(null, '', `/speel${window.location.search}`);
  }, []);

  return { session, pub, offset, conn, back, toast, busy, send, joinByCode, leave, initialCode: init.code, showToast };
}

/** Scherm aan houden (CONCEPT 5.5). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const req = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        /* niet toegestaan */
      }
    };
    void req();
    const vis = () => document.visibilityState === 'visible' && void req();
    document.addEventListener('visibilitychange', vis);
    return () => {
      document.removeEventListener('visibilitychange', vis);
      void lock?.release().catch(() => {});
    };
  }, [active]);
}

export function vibrate(pattern: number | number[]) {
  try {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  } catch {
    /* niet ondersteund */
  }
}
