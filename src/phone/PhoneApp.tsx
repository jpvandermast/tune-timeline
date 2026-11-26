import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePhone, useWakeLock, vibrate } from './usePhone';
import type { PublicPlayer, PublicState } from '../game/public';
import { GOALS, PLACE_TIMES, PLAYER_COLORS, gapNeighbours } from '../game/rules';
import type { Card } from '../game/types';
import { Avatar, PCard, PMystery, Ring, useCountdown } from '../ui/components';
import { cleanCode } from '../net/messages';
import { netMode, supabaseConfigured } from '../net/channel';

type Send = ReturnType<typeof usePhone>['send'];

// ---------------- schil ----------------

function Shell({
  me,
  all,
  goal,
  children,
  act,
  net,
  back,
  toast,
  style,
  onTop,
  onGear,
  sheet,
  frame,
}: {
  me?: PublicPlayer | null;
  all?: PublicPlayer[];
  goal?: number;
  children: ReactNode;
  act?: ReactNode;
  net?: boolean;
  back?: boolean;
  toast?: string | null;
  style?: React.CSSProperties;
  onTop?: () => void;
  onGear?: () => void;
  sheet?: ReactNode;
  frame?: string;
}) {
  return (
    <div className="phone app" style={style}>
      {net && <div className="netbar">Verbinding kwijt, bezig…</div>}
      {back && !net && <div className="netbar ok">Terug!</div>}
      {frame && <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 0 4px ${frame}`, pointerEvents: 'none', zIndex: 5 }} />}
      {me && (
        <div className="ptop">
          <button
            onClick={onTop}
            style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, height: 48, textAlign: 'left' }}
            aria-label="Uitleg over je tokens"
            data-testid="bovenbalk"
          >
            <Avatar p={me} all={all} />
            <div className="nm">{me.name}</div>
            <div className="cnt num">
              {me.cards.length}/{goal}
            </div>
            <div className="coins" data-testid="mijn-tokens" data-tokens={me.tokens}>
              {Array.from({ length: me.tokens }, (_, i) => (
                <i key={i} className="coin" />
              ))}
            </div>
          </button>
          {onGear && (
            <button className="gear" onClick={onGear} aria-label="Hostmenu" data-testid="tandwiel" style={{ width: 48, height: 48 }}>
              ⚙︎
            </button>
          )}
        </div>
      )}
      <div className="pbody">{children}</div>
      {act && <div className="pact">{act}</div>}
      {sheet}
      {toast && (
        <div className="toast" role="status" style={act ? undefined : { bottom: 24 }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function rangeLabel(years: number[], slot: number): string {
  const [l, r] = gapNeighbours(years, slot);
  if (l === null && r === null) return 'hier';
  if (l === null) return `vóór ${r}`;
  if (r === null) return `na ${l}`;
  return `${l} – ${r}`;
}

/** Verticale tijdlijn, oud boven. */
function PhoneTimeline({
  cards,
  slot,
  onPick,
  mysteryText,
  ownLabel,
  scrollToSlot,
  marks,
}: {
  cards: Card[];
  slot: number | null;
  onPick?: (slot: number | null) => void;
  mysteryText?: string;
  ownLabel?: string;
  scrollToSlot?: boolean;
  /** Labels in gaten (bijv. "🟣 Mila steelt hier"). */
  marks?: Record<number, string>;
}) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    if (scrollToSlot && slot !== null) refs.current[slot]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [slot, scrollToSlot]);
  const years = cards.map((c) => c.year);
  const out: ReactNode[] = [];
  for (let g = 0; g <= cards.length; g++) {
    if (slot === g && onPick) {
      out.push(
        <div key={`g${g}`} ref={(el) => void (refs.current[g] = el)}>
          <PMystery text={mysteryText ?? 'Dit nummer'} onClick={() => onPick(null)} />
        </div>,
      );
    } else if (slot === g && ownLabel) {
      out.push(
        <div key={`g${g}`} className="pgap own locked" ref={(el) => void (refs.current[g] = el)}>
          <span>{ownLabel}</span>
        </div>,
      );
    } else {
      out.push(
        <div
          key={`g${g}`}
          ref={(el) => void (refs.current[g] = el)}
          className={`pgap ${onPick ? '' : 'locked'} ${marks?.[g] ? 'taken' : ''}`}
          role={onPick ? 'button' : undefined}
          aria-label={onPick ? `Plek ${rangeLabel(years, g)}` : undefined}
          data-testid={onPick ? `gap-${g}` : undefined}
          onClick={onPick ? () => onPick(g) : undefined}
        >
          <span>{marks?.[g] ?? (onPick ? 'hier?' : '')}</span>
        </div>,
      );
    }
    if (g < cards.length) out.push(<PCard key={cards[g].songId} c={cards[g]} />);
  }
  return <div className="ptl">{out}</div>;
}

// ---------------- schermen ----------------

function CodeEntry({ initial, onJoin }: { initial: string | null; onJoin: (code: string) => Promise<boolean> }) {
  const [code, setCode] = useState(initial ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const go = async () => {
    if (code.length !== 4) return;
    setBusy(true);
    setErr(null);
    const ok = await onJoin(code);
    setBusy(false);
    if (!ok) setErr('Code niet gevonden. Klopt hij met de tv? Instappen met de code kan alleen in de lobby.');
  };
  return (
    <Shell
      act={
        <button className={`pbtn ${code.length === 4 && !busy ? '' : 'dis'}`} onClick={go} disabled={busy} data-testid="verder">
          {busy ? 'Zoeken…' : 'Verder'}
        </button>
      }
      toast={err}
    >
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <div className="ph1">Doe mee</div>
        <div className="ph2">Typ de 4 letters die op de tv staan</div>
      </div>
      <div className="codeboxes">
        {[0, 1, 2, 3].map((i) => (
          <input
            key={i}
            ref={(el) => void (inputs.current[i] = el)}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={1}
            aria-label={`Letter ${i + 1}`}
            value={code[i] ?? ''}
            onChange={(e) => {
              const v = cleanCode(e.target.value);
              const next = (code.slice(0, i) + v + code.slice(i + 1)).slice(0, 4);
              setCode(cleanCode(next));
              if (v && i < 3) inputs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus();
              if (e.key === 'Enter') void go();
            }}
          />
        ))}
      </div>
      <div className="ph2" style={{ textAlign: 'center', marginTop: 18 }}>
        Met de QR-code op de tv gaat het vanzelf.
      </div>
    </Shell>
  );
}

function NameColor({ pub, send, busy, toast }: { pub: PublicState | null; send: Send; busy: boolean; toast: string | null }) {
  const [name, setName] = useState(() => localStorage.getItem('tt:name') ?? '');
  const taken = new Set(pub?.players.map((p) => p.color) ?? []);
  const free = PLAYER_COLORS.filter((c) => !taken.has(c.hex));
  const [color, setColor] = useState<string | null>(null);
  const chosen = color && !taken.has(color) ? color : free[0]?.hex ?? null;
  const ok = name.trim().length > 0 && chosen && pub?.phase === 'lobby';
  const full = (pub?.players.length ?? 0) >= 10;
  return (
    <Shell
      me={{ id: 'x', name: name.trim() || '?', color: chosen ?? '#FFB23F', cards: [], tokens: 2, online: true }}
      goal={pub?.settings.goal ?? 10}
      toast={toast}
      act={
        <button
          className={`pbtn ${ok && !busy && !full ? '' : 'dis'}`}
          disabled={!ok || busy || full}
          data-testid="meedoen"
          onClick={() => {
            localStorage.setItem('tt:name', name.trim());
            send('join', { name: name.trim(), color: chosen });
          }}
        >
          {busy ? 'Bezig…' : 'Ik doe mee'}
        </button>
      }
    >
      {!pub ? (
        <div className="ph2" style={{ marginTop: 30, textAlign: 'center' }}>
          Verbinden met de tv…
        </div>
      ) : pub.phase !== 'lobby' ? (
        <>
          <div className="ph1" style={{ marginTop: 6 }}>
            Het spel is al begonnen
          </div>
          <div className="ph2">Later instappen kan in een volgende versie. Kijk lekker mee op de tv!</div>
        </>
      ) : (
        <>
          <div className="ph1" style={{ marginTop: 6 }}>
            Hoe heet je?
          </div>
          <label className="input" style={{ position: 'relative' }}>
            <input
              className="input"
              style={{ border: 0, background: 'transparent', margin: 0, padding: 0, height: 56 }}
              value={name}
              maxLength={10}
              placeholder="Je naam"
              autoComplete="given-name"
              data-testid="naam"
              onChange={(e) => setName(e.target.value.slice(0, 10))}
            />
            <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--gedempt)' }}>{name.length}/10</span>
          </label>
          <div className="ph1" style={{ marginTop: 22, fontSize: 20 }}>
            Kies je kleur
          </div>
          <div className="colors">
            {PLAYER_COLORS.map((c) => (
              <button
                key={c.key}
                aria-label={c.name + (taken.has(c.hex) ? ' (bezet)' : '')}
                className={`${chosen === c.hex ? 'sel' : ''} ${taken.has(c.hex) ? 'x' : ''}`}
                style={{ background: c.hex }}
                disabled={taken.has(c.hex)}
                onClick={() => setColor(c.hex)}
              />
            ))}
          </div>
          <div className="ph2" style={{ textAlign: 'center', marginTop: 12 }}>
            {full ? 'Het spel zit vol (10 spelers).' : 'Doorgestreept = al gekozen'}
          </div>
        </>
      )}
    </Shell>
  );
}

function Waiting({ pub, me, send, busy, isHost }: { pub: PublicState; me: PublicPlayer; send: Send; busy: Record<string, boolean | undefined>; isHost: boolean }) {
  const enough = pub.players.length >= 2;
  return (
    <>
      <div className="ph1">Je zit erin, {me.name}!</div>
      <div className="ph2">{isHost ? 'Jij bent de host: jij start het spel.' : 'Wacht tot de host start. Je scherm blijft aan.'}</div>
      <div className="list" data-testid="spelerslijst">
        {pub.players.map((p) => (
          <div key={p.id} className="li">
            <Avatar p={p} all={pub.players} />
            {p.name}
            <span className="r">{p.id === me.id ? 'jij' : p.id === pub.hostId ? 'host' : '✓'}</span>
          </div>
        ))}
      </div>
      {isHost && (
        <>
          <div className="lbl">Doel (kaarten om te winnen){pub.players.length >= 8 ? ' · advies: 8' : ''}</div>
          <div className="seg">
            {GOALS.map((g) => (
              <button key={g} className={pub.settings.goal === g ? 'on' : ''} onClick={() => send('settings', { goal: g })}>
                {g}
              </button>
            ))}
          </div>
          <div className="lbl">Tijd om te plaatsen</div>
          <div className="seg">
            {PLACE_TIMES.map((t) => (
              <button key={t} className={pub.settings.placeSeconds === t ? 'on' : ''} onClick={() => send('settings', { placeSeconds: t })}>
                {t ? `${t} s` : 'geen'}
              </button>
            ))}
          </div>
          <div style={{ height: 8 }} />
          <button className={`pbtn ${enough && !busy.start ? '' : 'dis'}`} style={{ width: '100%', marginTop: 16 }} disabled={!enough || busy.start} onClick={() => send('start')} data-testid="start">
            {busy.start ? 'Bezig…' : enough ? `Start het spel (${pub.players.length} spelers)` : 'Wacht op minstens 2 spelers'}
          </button>
        </>
      )}
    </>
  );
}

function TurnStartMine({ pub, me, offset, send, busy }: { pub: PublicState; me: PublicPlayer; offset: number; send: Send; busy: Record<string, boolean | undefined> }) {
  const left = useCountdown(pub.deadline, offset) ?? 0;
  const total = Math.max(left, 6 * pub.settings.tempo);
  const bought = pub.turn?.bought;
  const canBuy = me.tokens >= 3 && !bought;
  useEffect(() => vibrate([150, 100, 150]), []);
  return (
    <div className="phone app amber" style={{ background: 'var(--amber)', color: 'var(--inkt)' }} data-testid="jij-bent">
      <div className="full" style={{ paddingBottom: 190 }}>
        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1 }}>Jij bent!</div>
        <div style={{ fontSize: 19, fontWeight: 600, marginTop: 12 }}>
          {bought ? (
            <>
              Kaart gekocht ✓ Je hebt nu {me.cards.length} kaarten.
              <br />
              Het nummer start over {left} s.
            </>
          ) : canBuy ? (
            <>
              Je hebt {me.tokens} tokens. Koop je eerst een kaart?
              <br />
              Daarna speel je gewoon je beurt.
            </>
          ) : (
            <>
              Muziek start vanzelf over {left} s.
              <br />
              Kopen kan alleen nu, vóór de muziek.
            </>
          )}
        </div>
        <div style={{ width: '100%', height: 10, borderRadius: 5, background: 'rgba(0,0,0,.15)', marginTop: 22, overflow: 'hidden' }}>
          <i style={{ display: 'block', height: '100%', width: `${Math.min(100, (left / Math.max(1, total)) * 100)}%`, background: 'var(--inkt)', transition: 'width .25s linear' }} />
        </div>
      </div>
      <div className="pact" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'none', flexDirection: 'column' }}>
        <button className="pbtn" style={{ background: 'var(--inkt)', color: 'var(--amber)', flex: '0 0 64px' }} onClick={() => send('startSong')} disabled={busy.startSong} data-testid="start-nummer">
          {busy.startSong ? 'Bezig…' : '▶ Start nummer'}
        </button>
        {!bought &&
          (canBuy ? (
            <button className="pbtn v" style={{ flex: '0 0 64px' }} onClick={() => send('buy')} disabled={busy.buy} data-testid="kopen">
              {busy.buy ? 'Bezig…' : '🪙 Kaart kopen · 3 tokens'}
            </button>
          ) : (
            <div className="pbtn" style={{ background: 'rgba(0,0,0,.10)', color: 'rgba(26,21,48,.55)', flex: '0 0 56px', fontSize: 17 }}>
              Kaart kopen: 3 tokens nodig (je hebt er {me.tokens})
            </div>
          ))}
      </div>
    </div>
  );
}

function PlacingMine({
  pub,
  me,
  offset,
  send,
  busy,
  common,
}: {
  pub: PublicState;
  me: PublicPlayer;
  offset: number;
  send: Send;
  busy: Record<string, boolean | undefined>;
  common: Omit<Parameters<typeof Shell>[0], 'children' | 'act'>;
}) {
  const serverSlot = pub.turn?.slot ?? null;
  const [slot, setSlot] = useState<number | null>(serverSlot);
  const lastLocal = useRef(0);
  useEffect(() => {
    // Volg de tv, behalve vlak na een eigen tik.
    if (Date.now() - lastLocal.current > 1200) setSlot(serverSlot);
  }, [serverSlot]);
  const left = useCountdown(pub.deadline, offset);
  const total = pub.settings.placeSeconds;
  const warned = useRef(false);
  useEffect(() => {
    if (left !== null && left <= 10 && left > 0 && !warned.current) {
      warned.current = true;
      vibrate(80);
    }
  }, [left]);
  const pick = (g: number | null) => {
    lastLocal.current = Date.now();
    setSlot(g);
    vibrate(10);
    send('pickSlot', { slot: g });
  };
  const red = left !== null && left <= 10;
  const serverClaim = Boolean(pub.turn?.claim);
  const [claim, setClaim] = useState(serverClaim);
  const lastClaim = useRef(0);
  useEffect(() => {
    if (Date.now() - lastClaim.current > 1200) setClaim(serverClaim);
  }, [serverClaim]);
  const canSkip = me.tokens >= 1 && pub.canSkipSong;
  return (
    <Shell
      {...common}
      act={
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="toggle"
            style={{ margin: 0, minHeight: 52, width: '100%' }}
            role="switch"
            aria-checked={claim}
            data-testid="claim"
            onClick={() => {
              lastClaim.current = Date.now();
              setClaim(!claim);
              send('claim', { on: !claim });
            }}
          >
            🎤 Ik noem titel + artiest (hardop)
            <div className={`sw ${claim ? '' : 'off'}`} />
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className={`pbtn sec ${canSkip && !busy.skip ? '' : 'dis'}`} disabled={!canSkip || busy.skip} onClick={() => send('skip')} data-testid="overslaan">
              {busy.skip ? 'Bezig…' : 'Overslaan · 1'}
            </button>
            <button className={`pbtn ${slot !== null && !busy.lock ? '' : 'dis'}`} disabled={slot === null || busy.lock} onClick={() => send('lock')} data-testid="vastzetten">
              {busy.lock ? 'Bezig…' : 'Vastzetten'}
            </button>
          </div>
        </div>
      }
    >
      <div data-phase="placing">
        <div className="hasring">
          <div className="ph1">Waar hoort dit nummer?</div>
          <div className="ph2">{slot === null ? 'Tik een plek. Oud boven, nieuw onder.' : 'Tik een andere plek om te wisselen.'}</div>
        </div>
        {left !== null && (
          <div className="pring">
            <Ring sec={left} total={total * pub.settings.tempo} color={red ? 'var(--rood)' : 'var(--amber)'} size={54} stroke={6} />
            <b className="num" style={red ? { color: 'var(--rood)' } : undefined}>
              {left}
            </b>
          </div>
        )}
        <PhoneTimeline cards={me.cards} slot={slot} onPick={pick} scrollToSlot />
      </div>
    </Shell>
  );
}

function Result({ pub, me, active }: { pub: PublicState; me: PublicPlayer; active: PublicPlayer }) {
  const r = pub.reveal!;
  const card: Card = { songId: r.song.id, year: r.song.year, title: r.song.title, artist: r.song.artist };
  const mine = active.id === me.id;
  const mySteal = r.steals.find((x) => x.playerId === me.id);
  const thief = pub.players.find((x) => x.id === r.stolenBy);
  const [l, rr] = r.between;
  const where = l === null ? `vóór ${rr}` : rr === null ? `na ${l}` : l === rr ? `naast ${l}` : `tussen ${l} en ${rr}`;
  useEffect(() => {
    if ((mine && r.correct) || mySteal?.outcome === 'won') vibrate([80, 60, 80, 60, 80]);
  }, [mine, r.correct, mySteal?.outcome]);

  let head: ReactNode;
  let sub = '';
  let foot = '';
  if (mySteal?.outcome === 'won') {
    head = (
      <>
        <div style={{ fontSize: 52 }}>🎉</div>
        <div style={{ fontSize: 44, fontWeight: 900, color: me.color, lineHeight: 1.05 }}>Jij stal ’m!</div>
      </>
    );
    sub = '+1 kaart · je token is ingeleverd';
    foot = `Nu ${me.cards.length} van ${pub.settings.goal} · nog ${me.tokens} ${me.tokens === 1 ? 'token' : 'tokens'}`;
  } else if (mySteal) {
    const refund = mySteal.outcome === 'refund';
    head = (
      <>
        <div style={{ fontSize: 52, color: refund ? 'var(--amber)' : 'var(--rood)' }}>{refund ? '↩︎' : '✕'}</div>
        <div style={{ fontSize: 40, fontWeight: 900, color: refund ? 'var(--amber)' : 'var(--rood)', lineHeight: 1 }}>{refund ? 'Token terug' : 'Token kwijt'}</div>
      </>
    );
    sub = refund
      ? `Je zat goed, maar ${thief?.name ?? 'iemand'} was eerder.`
      : r.correct
        ? `${active.name} zat goed, dus je steal telt niet.`
        : `${r.song.year} hoorde ${where}.`;
    foot = `Je hebt nog ${me.tokens} ${me.tokens === 1 ? 'token' : 'tokens'}.`;
  } else if (r.correct) {
    head = (
      <>
        <div style={{ fontSize: 52, color: 'var(--mint)' }}>✓</div>
        <div style={{ fontSize: mine ? 52 : 40, fontWeight: 900, color: 'var(--mint)', lineHeight: 1 }}>{mine ? 'GOED!' : `${active.name}: GOED!`}</div>
      </>
    );
    sub = `+1 kaart · nu ${r.cardsAfter} van ${pub.settings.goal}`;
    foot = mine
      ? r.claim
        ? 'Even afwachten of iemand bezwaar maakt tegen je titel + artiest…'
        : `Je hebt nu ${r.cardsAfter} kaarten.`
      : `Jij hebt ${me.cards.length} van ${pub.settings.goal} kaarten.`;
  } else {
    head = (
      <>
        <div style={{ fontSize: 52, color: 'var(--rood)' }}>✕</div>
        <div style={{ fontSize: mine ? 52 : 40, fontWeight: 900, color: 'var(--rood)', lineHeight: 1 }}>{mine ? 'MIS!' : `${active.name}: MIS!`}</div>
      </>
    );
    sub = `${r.song.year} hoorde ${where}`;
    foot = mine
      ? `${thief ? `${thief.name} stal hem. ` : 'De kaart gaat weg. '}Je hebt nog ${me.cards.length} kaarten en ${me.tokens} ${me.tokens === 1 ? 'token' : 'tokens'}.`
      : thief
        ? `${thief.name} stal hem!`
        : `Jij hebt ${me.cards.length} van ${pub.settings.goal} kaarten.`;
  }
  const tid = mySteal ? `resultaat-steal-${mySteal.outcome}` : r.correct ? 'resultaat-goed' : 'resultaat-mis';
  return (
    <div className="full" style={{ justifyContent: 'flex-start', paddingTop: 40 }} data-testid={tid}>
      {head}
      <div className="ph2" style={{ marginTop: 8 }}>
        {sub}
      </div>
      <div style={{ width: '100%', marginTop: 28 }}>
        <PCard c={card} cls={r.correct || mySteal?.outcome === 'won' ? 'good' : ''} />
      </div>
      <div className="ph2" style={{ marginTop: 22 }}>
        {foot}
      </div>
    </div>
  );
}

function StealView({
  pub,
  me,
  active,
  offset,
  send,
  busy,
  common,
}: {
  pub: PublicState;
  me: PublicPlayer;
  active: PublicPlayer;
  offset: number;
  send: Send;
  busy: Record<string, boolean | undefined>;
  common: Omit<Parameters<typeof Shell>[0], 'children' | 'act'>;
}) {
  const t = pub.turn!;
  const left = useCountdown(pub.deadline, offset) ?? 0;
  const total = 10 * pub.settings.tempo;
  const [sel, setSel] = useState<number | null>(null);
  const years = active.cards.map((c) => c.year);
  const myStealSlot = t.steals.find((x) => x.playerId === me.id)?.slot ?? null;
  const passed = t.passed.includes(me.id);
  const eligible = t.stealEligible.includes(me.id);
  const canAct = eligible && myStealSlot === null && !passed && me.tokens >= 1;
  useEffect(() => {
    if (canAct) vibrate(300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const takenBy = (g: number) => t.steals.find((x) => x.slot === g);
  // Gekozen gat net bezet door een ander? Dan selectie loslaten.
  useEffect(() => {
    if (sel !== null) {
      const tk = takenBy(sel);
      if (tk && tk.playerId !== me.id) setSel(null);
    }
  });
  const rows: ReactNode[] = [];
  for (let g = 0; g <= active.cards.length; g++) {
    const tk = takenBy(g);
    const own = t.slot === g;
    let cls = 'v';
    let label = `vrij · ${rangeLabel(years, g)}`;
    let tappable = canAct;
    if (own) {
      cls = 'own';
      label = `🔒 ${active.name} legde hier`;
      tappable = false;
    } else if (tk) {
      const who = pub.players.find((x) => x.id === tk.playerId);
      cls = tk.playerId === me.id ? 'sel' : 'taken';
      label = tk.playerId === me.id ? `✓ jij steelt hier: ${rangeLabel(years, g)}` : `bezet door ${who?.name ?? '?'}`;
      tappable = false;
    } else if (sel === g) {
      cls = 'sel';
      label = `✓ jij: ${rangeLabel(years, g)}`;
    } else if (!canAct) {
      cls = '';
      label = rangeLabel(years, g);
    }
    rows.push(
      <div
        key={`g${g}`}
        className={`pgap ${cls} ${tappable ? '' : 'locked'}`}
        role={tappable ? 'button' : undefined}
        data-testid={tappable ? `steal-gap-${g}` : undefined}
        onClick={tappable ? () => setSel(g) : undefined}
      >
        <span>{label}</span>
      </div>,
    );
    if (g < active.cards.length) rows.push(<PCard key={active.cards[g].songId} c={active.cards[g]} />);
  }
  let title = 'STEEL? Kies de goede plek';
  let line: ReactNode = (
    <>
      {active.name} zette vast · nog <b className="num" style={{ color: 'var(--creme)' }}>{left} s</b> · kost 1 token
    </>
  );
  if (myStealSlot !== null) {
    title = 'Je steelt ✓';
    line = `Jouw plek: ${rangeLabel(years, myStealSlot)}. Nu duimen…`;
  } else if (passed) {
    title = 'Je past';
    line = 'Wachten op de onthulling…';
  } else if (me.tokens < 1) {
    title = `${active.name} zette vast`;
    line = '0 tokens · verdien er een op je beurt (titel + artiest goed)';
  } else if (!eligible) {
    title = `${active.name} zette vast`;
    line = 'Wachten op de onthulling…';
  }
  return (
    <Shell
      {...common}
      frame={canAct ? 'var(--violet)' : undefined}
      act={
        canAct ? (
          <>
            <button className="pbtn sec" onClick={() => send('pass')} disabled={busy.pass} data-testid="pas">
              Pas
            </button>
            <button
              className={`pbtn ${sel !== null && !busy.steal ? 'v' : 'dis'}`}
              disabled={sel === null || busy.steal}
              onClick={() => sel !== null && send('steal', { slot: sel })}
              data-testid="steel"
            >
              {busy.steal ? 'Bezig…' : 'STEEL hier · 1 token'}
            </button>
          </>
        ) : undefined
      }
    >
      <div data-phase="stealing" data-testid={canAct ? 'steelweergave' : 'steel-wacht'}>
        <div className="ph1" style={{ color: canAct ? '#c9bcff' : undefined }}>
          {title}
        </div>
        <div className="ph2">{line}</div>
        <div className="pbar">
          <i style={{ width: `${Math.min(100, (left / Math.max(1, total)) * 100)}%`, transition: 'width .25s linear' }} />
        </div>
        <div className="ptl">{rows}</div>
      </div>
    </Shell>
  );
}

function ObjectionPhone(props: {
  pub: PublicState;
  me: PublicPlayer;
  offset: number;
  send: Send;
  busy: Record<string, boolean | undefined>;
  common: Omit<Parameters<typeof Shell>[0], 'children' | 'act'>;
}) {
  const { body, act } = useObjection(props);
  return (
    <Shell {...props.common} act={act ?? undefined}>
      <div data-phase="objection">{body}</div>
    </Shell>
  );
}

function useObjection({ pub, me, offset, send, busy }: { pub: PublicState; me: PublicPlayer; offset: number; send: Send; busy: Record<string, boolean | undefined> }) {
  const o = pub.objection!;
  const r = pub.reveal!;
  const p = pub.players.find((x) => x.id === o.playerId)!;
  const left = useCountdown(pub.deadline, offset) ?? 0;
  const card: Card = { songId: r.song.id, year: r.song.year, title: r.song.title, artist: r.song.artist };
  const myVote = o.votes[me.id];
  const canVote = o.open && o.eligible.includes(me.id) && !myVote;
  const fout = Object.values(o.votes).filter((v) => v === 'fout').length;
  if (o.result) {
    const res = o.result;
    return {
      body: (
        <div className="full" style={{ justifyContent: 'flex-start', paddingTop: 40 }} data-testid="bezwaar-uitslag">
          <div style={{ fontSize: 52, color: res.ok ? 'var(--mint)' : 'var(--rood)' }}>{res.ok ? '✓' : '✕'}</div>
          <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.1, color: res.ok ? 'var(--mint)' : 'var(--rood)' }}>
            {res.ok ? 'Goedgekeurd' : 'Afgekeurd'}
          </div>
          <div className="ph2" style={{ marginTop: 10 }}>
            {p.id === me.id
              ? res.ok
                ? res.awarded
                  ? '+1 token voor jou!'
                  : 'Goed, maar je zit al op 5 tokens (max).'
                : 'Geen token deze keer.'
              : res.ok
                ? `${p.name} ${res.awarded ? 'krijgt +1 token' : 'zat al op 5 tokens'}`
                : `${fout} ${fout === 1 ? 'bezwaar' : 'bezwaren'}: geen token voor ${p.name}`}
          </div>
        </div>
      ),
      act: null,
    };
  }
  if (p.id === me.id || !canVote) {
    return {
      body: (
        <div data-testid="bezwaar-wacht">
          <div className="ph1">{p.id === me.id ? 'Even afwachten…' : myVote ? `Je tikte: ${myVote === 'fout' ? 'Fout!' : 'Klopt'}` : `Had ${p.name} het goed?`}</div>
          <div className="ph2">{p.id === me.id ? 'De anderen mogen 6 s bezwaar maken tegen je titel + artiest.' : 'Wachten op de anderen…'}</div>
          <div style={{ marginTop: 14 }}>
            <PCard c={card} />
          </div>
        </div>
      ),
      act: null,
    };
  }
  return {
    body: (
      <div data-testid="bezwaar">
        <div className="ph1">Had {p.name} het goed?</div>
        <div className="ph2">Het was:</div>
        <div style={{ marginTop: 14 }}>
          <PCard c={card} />
        </div>
        <div className="ph2" style={{ marginTop: 14 }}>
          Alleen tikken als het <b style={{ color: 'var(--creme)' }}>fout</b> was. Niets doen = goed.
        </div>
        <div className="pbar" style={{ marginTop: 14 }}>
          <i style={{ width: `${Math.min(100, (left / Math.max(1, 6 * pub.settings.tempo)) * 100)}%`, background: 'var(--rood)', transition: 'width .25s linear' }} />
        </div>
        <div className="ph2" style={{ textAlign: 'center' }}>
          nog {left} s
        </div>
      </div>
    ),
    act: (
      <>
        <button className="pbtn sec" onClick={() => send('objection', { verdict: 'klopt' })} disabled={busy.objection} data-testid="klopt">
          Klopt
        </button>
        <button className="pbtn r" style={{ fontSize: 24 }} onClick={() => send('objection', { verdict: 'fout' })} disabled={busy.objection} data-testid="fout">
          Fout!
        </button>
      </>
    ),
  };
}

function Sheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(10,8,22,.55)', zIndex: 30 }} />
      <div className="sheet" style={{ zIndex: 31, maxHeight: '85%', overflowY: 'auto' }}>
        <div className="grab" />
        {children}
        <button className="pbtn sec" style={{ width: '100%', marginTop: 14, flex: '0 0 auto' }} onClick={onClose} data-testid="sluiten">
          Sluiten
        </button>
      </div>
    </>
  );
}

function TokenSheet({ me, onClose }: { me: PublicPlayer; onClose: () => void }) {
  return (
    <Sheet onClose={onClose}>
      <div className="ph1">Jouw tokens: {me.tokens} van max 5</div>
      <div className="list">
        {[
          ['⏭', 'Overslaan', '1 token · eigen beurt, vóór vastzetten'],
          ['🟣', 'Stelen', '1 token · in het steelvenster van een ander'],
          ['🪙', 'Kaart kopen', '3 tokens · alleen bij jouw beurtstart'],
          ['🎤', 'Verdienen', 'titel + artiest hardop goed = +1'],
        ].map(([i, a, b]) => (
          <div key={a} className="li" style={{ minHeight: 64 }}>
            <span style={{ fontSize: 24 }}>{i}</span>
            <div>
              <div>{a}</div>
              <div style={{ fontSize: 15, color: 'var(--gedempt)', fontWeight: 600 }}>{b}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="ph2" style={{ marginTop: 16 }}>
        Mijn tijdlijn: {me.cards.map((c) => c.year).join(' · ') || 'nog leeg'}
      </div>
    </Sheet>
  );
}

function HostSheet({ pub, me, send, onClose }: { pub: PublicState; me: PublicPlayer; send: Send; onClose: () => void }) {
  const [remove, setRemove] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const active = pub.players.find((x) => x.id === pub.turn?.playerId);
  const inGame = !['lobby', 'winner'].includes(pub.phase);
  const canSkipTurn = ['turnStart', 'placing', 'stealing'].includes(pub.phase) && active;
  const item = (label: string, onClick: () => void, enabled = true, testid?: string) => (
    <button
      key={label}
      className="li"
      style={{ height: 56, width: '100%', opacity: enabled ? 1 : 0.4, textAlign: 'left' }}
      disabled={!enabled}
      onClick={onClick}
      data-testid={testid}
    >
      {label}
    </button>
  );
  if (remove) {
    return (
      <Sheet onClose={onClose}>
        <div className="ph1">Speler verwijderen</div>
        <div className="ph2">Zijn of haar kaarten verdwijnen uit het spel.</div>
        <div className="list">
          {pub.players
            .filter((x) => x.id !== me.id)
            .map((x) =>
              confirm === x.id ? (
                <div key={x.id} style={{ display: 'flex', gap: 8 }}>
                  <button className="pbtn r" style={{ flex: 1, height: 56 }} onClick={() => { send('removePlayer', { target: x.id }); onClose(); }}>
                    Ja, {x.name} eruit
                  </button>
                  <button className="pbtn sec" style={{ flex: '0 0 30%', height: 56 }} onClick={() => setConfirm(null)}>
                    Nee
                  </button>
                </div>
              ) : (
                item(`👤 ${x.name}`, () => setConfirm(x.id))
              ),
            )}
        </div>
      </Sheet>
    );
  }
  return (
    <Sheet onClose={onClose}>
      <div className="ph1">Hostmenu</div>
      <div className="ph2">Alleen zichtbaar voor jou (host).</div>
      <div className="list" data-testid="hostmenu">
        {inGame && item(pub.paused ? '▶ Verder spelen' : '⏸ Pauze', () => { send('pause'); onClose(); }, true, 'pauze')}
        {inGame && item(`⏭ Beurt van ${active?.name ?? '…'} overslaan`, () => { send('skipTurn'); onClose(); }, Boolean(canSkipTurn), 'beurt-overslaan')}
        {inGame && item('↩︎ Uitslag omdraaien', () => { send('flipVerdict'); onClose(); }, pub.canFlipVerdict, 'omdraaien')}
        {inGame && pub.canFlipClaim && item('↩︎ Titel + artiest omdraaien', () => { send('flipClaim'); onClose(); }, true, 'claim-omdraaien')}
        {inGame && item('🔁 Nummer opnieuw starten', () => { send('restartSong'); onClose(); }, pub.phase === 'placing')}
        {item('👤 Speler verwijderen…', () => setRemove(true), pub.players.length > 1)}
        {inGame &&
          (confirm === 'stop' ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="pbtn r" style={{ flex: 1, height: 56 }} onClick={() => { send('stopGame'); onClose(); }}>
                Ja, stoppen
              </button>
              <button className="pbtn sec" style={{ flex: '0 0 30%', height: 56 }} onClick={() => setConfirm(null)}>
                Nee
              </button>
            </div>
          ) : (
            item('⏹ Spel stoppen', () => setConfirm('stop'))
          ))}
      </div>
    </Sheet>
  );
}

function turnsUntil(pub: PublicState, meIdx: number): number {
  const n = pub.players.length;
  return (meIdx - pub.turnIndex + n) % n;
}

function StandingsPhone({ pub, me, hideTitle }: { pub: PublicState; me: PublicPlayer; hideTitle?: boolean }) {
  const rows = [...pub.players].sort((a, b) => b.cards.length - a.cards.length || b.tokens - a.tokens);
  const pos = rows.findIndex((p) => p.id === me.id) + 1;
  const next = pub.players[pub.turnIndex];
  const until = turnsUntil(pub, pub.players.findIndex((p) => p.id === me.id));
  return (
    <>
      {!hideTitle && <div className="ph1">Tussenstand</div>}
      <div className="ph2">
        Jij staat {pos}e. Volgende beurt: {next?.id === me.id ? 'jij!' : next?.name}.{until > 0 ? ` Jij bent over ${until} ${until === 1 ? 'beurt' : 'beurten'}.` : ''}
      </div>
      <div className="list">
        {rows.slice(0, 6).map((p, i) => (
          <div key={p.id} className="li" style={p.id === me.id ? { boxShadow: '0 0 0 2px var(--amber)' } : undefined}>
            {i + 1}. <Avatar p={p} all={pub.players} />
            {p.name}
            <span className="r num">
              {p.cards.length}/{pub.settings.goal}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function WinnerPhone({ pub, me, send, isHost }: { pub: PublicState; me: PublicPlayer; send: Send; isHost: boolean }) {
  const w = pub.players.find((p) => p.id === pub.winnerId)!;
  const mine = w.id === me.id;
  const rows = [...pub.players].sort((a, b) => b.cards.length - a.cards.length);
  const pos = rows.findIndex((p) => p.id === me.id) + 1;
  const prize = pub.awards.find((a) => a.playerId === me.id);
  useEffect(() => {
    if (mine) vibrate([100, 80, 100, 80, 100]);
  }, [mine]);
  const hostBtns = isHost ? (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        className="pbtn"
        style={mine ? { background: 'var(--inkt)', color: 'var(--amber)', flex: '0 0 64px' } : { flex: '0 0 64px' }}
        onClick={() => send('rematch')}
        data-testid="nog-een-potje"
      >
        Nog een potje
      </button>
      <button
        className="pbtn sec"
        style={mine ? { flex: '0 0 56px', background: 'rgba(0,0,0,.12)', color: 'var(--inkt)' } : { flex: '0 0 56px' }}
        onClick={() => send('lobby')}
      >
        Terug naar lobby
      </button>
    </div>
  ) : null;
  return (
    <div
      className="phone app"
      data-testid={mine ? 'winnaar-ik' : 'winnaar-ander'}
      style={
        mine
          ? { background: 'radial-gradient(500px 500px at 50% 35%,#ffcd73,var(--amber) 55%,#b56a0f)', color: 'var(--inkt)' }
          : undefined
      }
    >
      <div className="full" style={{ paddingBottom: isHost ? 170 : 30 }}>
        {mine ? (
          <>
            <div style={{ fontSize: 110, lineHeight: 1 }}>👑</div>
            <div style={{ fontSize: 46, fontWeight: 900, lineHeight: 1.05, marginTop: 10 }}>
              Jij bent de
              <br />
              Tune Master!
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, marginTop: 14 }}>
              {me.cards.length} kaarten{prize ? ` · Prijs: ${prize.icon} ${prize.title}` : ''}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 70, lineHeight: 1 }}>👑</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: w.color, marginTop: 10 }}>{w.name} wint!</div>
            <div className="ph2" style={{ marginTop: 12, fontSize: 19 }}>
              Jij werd {pos}e met {me.cards.length} kaarten.
              {prize ? ` Prijs: ${prize.icon} ${prize.title}.` : ''}
            </div>
          </>
        )}
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 24, opacity: 0.75 }}>Kijk naar de tv</div>
      </div>
      {hostBtns && (
        <div className="pact" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'none', flexDirection: 'column' }}>
          {hostBtns}
        </div>
      )}
    </div>
  );
}

// ---------------- hoofdcomponent ----------------

export default function PhoneApp() {
  const ph = usePhone();
  const { pub, session } = ph;
  const me = useMemo(() => pub?.players.find((p) => p.id === session?.playerId) ?? null, [pub, session]);
  const [sheet, setSheet] = useState<'tokens' | 'host' | null>(null);
  useWakeLock(Boolean(me));

  if (netMode() === 'supabase' && !supabaseConfigured())
    return (
      <Shell>
        <div className="ph1" style={{ marginTop: 30 }}>Even geduld</div>
        <div className="ph2">Deze versie van de site mist nog een instelling, waardoor telefoons de tv niet kunnen bereiken. Zeg het tegen de host.</div>
      </Shell>
    );
  if (!session) return <CodeEntry initial={ph.initialCode} onJoin={ph.joinByCode} />;
  if (!me) return <NameColor pub={pub} send={ph.send} busy={Boolean(ph.busy.join)} toast={ph.toast} />;

  const p = pub!;
  const isHost = p.hostId === me.id;
  const active = p.players.find((x) => x.id === p.turn?.playerId) ?? null;
  const mine = active?.id === me.id;
  const net = ph.conn === 'lost';
  const sheetEl =
    sheet === 'tokens' ? (
      <TokenSheet me={me} onClose={() => setSheet(null)} />
    ) : sheet === 'host' && isHost ? (
      <HostSheet pub={p} me={me} send={ph.send} onClose={() => setSheet(null)} />
    ) : null;
  const common = {
    me,
    all: p.players,
    goal: p.settings.goal,
    net,
    back: ph.back,
    toast: ph.toast,
    onTop: () => setSheet('tokens'),
    onGear: isHost ? () => setSheet('host') : undefined,
    sheet: sheetEl,
  };

  if (p.phase === 'winner') return <WinnerPhone pub={p} me={me} send={ph.send} isHost={isHost} />;
  if (p.paused)
    return (
      <Shell {...common}>
        <div data-phase="paused">
          <div className="ph1">Pauze ☕</div>
          <div className="ph2">{isHost ? 'Ga verder via ⚙︎ rechtsboven.' : 'De host gaat zo verder.'}</div>
          <StandingsPhone pub={p} me={me} hideTitle />
        </div>
      </Shell>
    );
  if (p.phase === 'turnStart' && mine && !net && !sheet) return <TurnStartMine pub={p} me={me} offset={ph.offset} send={ph.send} busy={ph.busy} />;

  let body: ReactNode = null;
  let act: ReactNode = null;
  switch (p.phase) {
    case 'lobby':
      body = <Waiting pub={p} me={me} send={ph.send} busy={ph.busy} isHost={isHost} />;
      break;
    case 'deal': {
      const starter = p.players.find((x) => x.id === p.dealInfo?.playerId);
      body = (
        <>
          <div className="ph1">Je startkaart</div>
          <div className="ph2">Deze ligt open in je tijdlijn. {starter?.id === me.id ? 'Jij hebt de oudste kaart: jij begint!' : `${starter?.name} heeft de oudste kaart en begint.`}</div>
          <div style={{ marginTop: 18 }}>{me.cards[0] && <PCard c={me.cards[0]} cls="good" />}</div>
          <div className="ph2" style={{ marginTop: 18 }}>
            Je hebt 2 tokens. Tik bovenaan op je naam voor uitleg.
          </div>
        </>
      );
      break;
    }
    case 'turnStart':
    case 'placing':
    case 'stealing': {
      if (mine && p.phase === 'placing' && !p.turn?.locked) {
        return <PlacingMine pub={p} me={me} offset={ph.offset} send={ph.send} busy={ph.busy} common={common} />;
      } else if (mine) {
        const years = me.cards.map((c) => c.year);
        const slot = p.turn?.slot ?? null;
        const [l, r] = slot === null ? [null, null] : gapNeighbours(years, slot);
        const steals = p.turn?.steals ?? [];
        body = (
          <div data-testid="vastgezet">
            <div className="ph1">Vastgezet ✓</div>
            <div className="ph2">
              {slot === null ? 'Geen plek gekozen.' : l === null ? `Vóór ${r}.` : r === null ? `Na ${l}.` : `Tussen ${l} en ${r}.`} Nu duimen…
              {p.phase === 'stealing' ? ' de anderen mogen 10 s stelen.' : ''}
            </div>
            <PhoneTimeline
              cards={me.cards}
              slot={slot}
              ownLabel="Jouw keuze"
              marks={Object.fromEntries(steals.map((st) => [st.slot, `🟣 ${p.players.find((x) => x.id === st.playerId)?.name ?? '?'} steelt hier`]))}
            />
          </div>
        );
        act = <button className="pbtn dis">Wachten op de onthulling…</button>;
      } else if (active && p.phase === 'stealing') {
        return <StealView pub={p} me={me} active={active} offset={ph.offset} send={ph.send} busy={ph.busy} common={common} />;
      } else if (active) {
        const bought = p.lastBuy?.playerId === active.id;
        body = (
          <div data-testid="andermans-beurt">
            <div className="ph1" style={{ color: active.color }}>
              {active.name} is aan de beurt
            </div>
            <div className="ph2">
              {p.phase === 'turnStart'
                ? bought
                  ? `${active.name} kocht een kaart. Het nummer begint zo.`
                  : 'Het nummer begint zo. Kijk mee op de tv.'
                : p.turn?.slot === null
                  ? `Luister mee. ${active.name} kiest een plek…`
                  : `${active.name} legt hier. Klopt dat? Na het vastzetten kun je stelen.`}
            </div>
            <PhoneTimeline cards={active.cards} slot={p.turn?.slot ?? null} ownLabel={`${active.name} legt hier`} />
          </div>
        );
      }
      break;
    }
    case 'reveal':
      if (p.reveal && active) body = <Result pub={p} me={me} active={active} />;
      break;
    case 'objection':
      if (p.objection && p.reveal) return <ObjectionPhone pub={p} me={me} offset={ph.offset} send={ph.send} busy={ph.busy} common={common} />;
      break;
    case 'standings':
      body = <StandingsPhone pub={p} me={me} />;
      break;
  }

  return (
    <Shell {...common} act={act}>
      <div data-phase={p.phase}>{body}</div>
    </Shell>
  );
}
