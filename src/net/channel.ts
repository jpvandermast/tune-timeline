// Realtime-kanaal. Standaard Supabase Realtime (alleen Broadcast + Presence).
// Voor tests en lokaal spelen zonder internet: ?net=lokaal gebruikt BroadcastChannel
// (werkt tussen tabbladen van dezelfde browser).
import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';

export type ChannelStatus = 'connecting' | 'connected' | 'error';

export interface Channel {
  send(event: string, payload: unknown): void;
  on(event: string, cb: (payload: any) => void): void;
  /** Eén keer per verbinding: meld deze client aan in Presence. */
  track(id: string): void;
  onPresence(cb: (ids: string[]) => void): void;
  onStatus(cb: (s: ChannelStatus) => void): void;
  close(): void;
}

export function netMode(): 'supabase' | 'lokaal' {
  const p = new URLSearchParams(window.location.search);
  if (p.get('net') === 'lokaal') return 'lokaal';
  try {
    if (sessionStorage.getItem('tt:net') === 'lokaal') return 'lokaal';
  } catch {
    /* geen opslag */
  }
  return 'supabase';
}

export function rememberNetMode() {
  if (new URLSearchParams(window.location.search).get('net') === 'lokaal') {
    try {
      sessionStorage.setItem('tt:net', 'lokaal');
    } catch {
      /* geen opslag */
    }
  }
}

export function openChannel(name: string): Channel {
  return netMode() === 'lokaal' ? new LocalChannel(name) : new SupabaseChannel(name);
}

export function supabaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
}

// ---------------- Supabase ----------------

let client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 50 } },
    });
  }
  return client;
}

class SupabaseChannel implements Channel {
  private ch: RealtimeChannel;
  private handlers = new Map<string, ((p: any) => void)[]>();
  private presenceCbs: ((ids: string[]) => void)[] = [];
  private statusCbs: ((s: ChannelStatus) => void)[] = [];
  private trackId: string | null = null;
  private tracked = false;
  private closed = false;
  private queue: { event: string; payload: unknown }[] = [];

  constructor(private name: string) {
    this.ch = this.create();
  }

  private create(): RealtimeChannel {
    const ch = getClient().channel(this.name, {
      config: { broadcast: { self: false, ack: false }, presence: { key: '' } },
    });
    ch.on('broadcast', { event: '*' }, (msg: { event: string; payload: unknown }) => {
      for (const cb of this.handlers.get(msg.event) ?? []) cb(msg.payload);
    });
    ch.on('presence', { event: 'sync' }, () => {
      const st = ch.presenceState() as Record<string, { id?: string }[]>;
      const ids = new Set<string>();
      for (const metas of Object.values(st)) for (const m of metas) if (m.id) ids.add(m.id);
      for (const cb of this.presenceCbs) cb([...ids]);
    });
    this.emit('connecting');
    ch.subscribe((status) => {
      if (this.closed) return;
      if (status === 'SUBSCRIBED') {
        const q = this.queue;
        this.queue = [];
        for (const m of q) void ch.send({ type: 'broadcast', event: m.event, payload: m.payload });
        this.emit('connected');
        if (this.trackId && !this.tracked) {
          this.tracked = true;
          void ch.track({ id: this.trackId });
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        this.emit('error');
      }
    });
    return ch;
  }

  private emit(s: ChannelStatus) {
    for (const cb of this.statusCbs) cb(s);
  }

  send(event: string, payload: unknown) {
    if (this.ch.state !== 'joined') {
      // Wachten tot het kanaal klaar is; van 'state' alleen de nieuwste bewaren.
      if (event === 'state') this.queue = this.queue.filter((m) => m.event !== 'state');
      this.queue.push({ event, payload });
      if (this.queue.length > 30) this.queue.shift();
      return;
    }
    void this.ch.send({ type: 'broadcast', event, payload });
  }
  on(event: string, cb: (payload: any) => void) {
    const list = this.handlers.get(event) ?? [];
    list.push(cb);
    this.handlers.set(event, list);
  }
  track(id: string) {
    this.trackId = id;
    if (this.ch.state === 'joined' && !this.tracked) {
      this.tracked = true;
      void this.ch.track({ id });
    }
  }
  onPresence(cb: (ids: string[]) => void) {
    this.presenceCbs.push(cb);
  }
  onStatus(cb: (s: ChannelStatus) => void) {
    this.statusCbs.push(cb);
  }
  close() {
    this.closed = true;
    void getClient().removeChannel(this.ch);
  }
}

// ---------------- Lokaal (BroadcastChannel) ----------------

class LocalChannel implements Channel {
  private bc: BroadcastChannel;
  private handlers = new Map<string, ((p: any) => void)[]>();
  private presenceCbs: ((ids: string[]) => void)[] = [];
  private statusCbs: ((s: ChannelStatus) => void)[] = [];
  private seen = new Map<string, number>();
  private timers: number[] = [];
  private trackId: string | null = null;

  constructor(name: string) {
    this.bc = new BroadcastChannel(`tt-local:${name}`);
    this.bc.onmessage = (ev: MessageEvent<{ event: string; payload: any }>) => {
      const { event, payload } = ev.data;
      if (event === '__presence') {
        this.seen.set(payload.id, Date.now());
        return;
      }
      if (event === '__leave') {
        this.seen.delete(payload.id);
        this.firePresence();
        return;
      }
      for (const cb of this.handlers.get(event) ?? []) cb(payload);
    };
    this.timers.push(
      window.setInterval(() => {
        if (this.trackId) this.bc.postMessage({ event: '__presence', payload: { id: this.trackId } });
        this.firePresence();
      }, 1000),
    );
    window.setTimeout(() => this.statusCbs.forEach((cb) => cb('connected')), 30);
  }
  private firePresence() {
    const now = Date.now();
    const ids = [...this.seen.entries()].filter(([, t]) => now - t < 3500).map(([id]) => id);
    for (const cb of this.presenceCbs) cb(ids);
  }
  send(event: string, payload: unknown) {
    this.bc.postMessage({ event, payload });
  }
  on(event: string, cb: (payload: any) => void) {
    const list = this.handlers.get(event) ?? [];
    list.push(cb);
    this.handlers.set(event, list);
  }
  track(id: string) {
    this.trackId = id;
    this.bc.postMessage({ event: '__presence', payload: { id } });
  }
  onPresence(cb: (ids: string[]) => void) {
    this.presenceCbs.push(cb);
  }
  onStatus(cb: (s: ChannelStatus) => void) {
    this.statusCbs.push(cb);
  }
  close() {
    if (this.trackId) this.bc.postMessage({ event: '__leave', payload: { id: this.trackId } });
    this.timers.forEach((t) => clearInterval(t));
    this.bc.close();
  }
}
