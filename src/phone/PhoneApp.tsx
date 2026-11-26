import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePhone, useWakeLock, vibrate } from './usePhone';
import type { PublicPlayer, PublicState } from '../game/public';
import { GOALS, PLACE_TIMES, PLAYER_COLORS, gapNeighbours } from '../game/rules';
import type { Card } from '../game/types';
import { Avatar, PCard, PMystery, Ring, useCountdown } from '../ui/components';
import { cleanCode } from '../net/messages';

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
}) {
  return (
    <div className="phone app" style={style}>
      {net && <div className="netbar">Verbinding kwijt, bezig…</div>}
      {back && !net && <div className="netbar ok">Terug!</div>}
      {me && (
        <div className="ptop">
          <Avatar p={me} all={all} />
          <div className="nm">{me.name}</div>
          <div className="cnt num">
            {me.cards.length}/{goal}
          </div>
          <div className="coins">
            {Array.from({ length: me.tokens }, (_, i) => (
              <i key={i} className="coin" />
            ))}
          </div>
        </div>
      )}
      <div className="pbody">{children}</div>
      {act && <div className="pact">{act}</div>}
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
}: {
  cards: Card[];
  slot: number | null;
  onPick?: (slot: number | null) => void;
  mysteryText?: string;
  ownLabel?: string;
  scrollToSlot?: boolean;
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
          className={`pgap ${onPick ? '' : 'locked'}`}
          role={onPick ? 'button' : undefined}
          aria-label={onPick ? `Plek ${rangeLabel(years, g)}` : undefined}
          data-testid={onPick ? `gap-${g}` : undefined}
          onClick={onPick ? () => onPick(g) : undefined}
        >
          <span>{onPick ? 'hier?' : ''}</span>
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

function TurnStartMine({ pub, offset, send, busy }: { pub: PublicState; offset: number; send: Send; busy: boolean }) {
  const left = useCountdown(pub.deadline, offset) ?? 0;
  const total = 6 * pub.settings.tempo;
  useEffect(() => vibrate([150, 100, 150]), []);
  return (
    <div className="phone app amber" style={{ background: 'var(--amber)', color: 'var(--inkt)' }} data-testid="jij-bent">
      <div className="full" style={{ paddingBottom: 170 }}>
        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1 }}>Jij bent!</div>
        <div style={{ fontSize: 19, fontWeight: 600, marginTop: 12 }}>
          Muziek start vanzelf over {left} s.
          <br />
          Luister op de tv en kies dan een plek.
        </div>
        <div style={{ width: '100%', height: 10, borderRadius: 5, background: 'rgba(0,0,0,.15)', marginTop: 22, overflow: 'hidden' }}>
          <i style={{ display: 'block', height: '100%', width: `${Math.min(100, (left / Math.max(1, total)) * 100)}%`, background: 'var(--inkt)', transition: 'width .25s linear' }} />
        </div>
      </div>
      <div className="pact" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'none', flexDirection: 'column' }}>
        <button className="pbtn" style={{ background: 'var(--inkt)', color: 'var(--amber)', flex: '0 0 64px' }} onClick={() => send('startSong')} disabled={busy} data-testid="start-nummer">
          {busy ? 'Bezig…' : '▶ Start nummer'}
        </button>
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
  return (
    <Shell
      {...common}
      act={
        <button className={`pbtn ${slot !== null && !busy.lock ? '' : 'dis'}`} disabled={slot === null || busy.lock} onClick={() => send('lock')} data-testid="vastzetten">
          {busy.lock ? 'Bezig…' : 'Vastzetten'}
        </button>
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
  const [l, rr] = r.between;
  const where = l === null ? `vóór ${rr}` : rr === null ? `na ${l}` : l === rr ? `naast ${l}` : `tussen ${l} en ${rr}`;
  useEffect(() => {
    if (mine && r.correct) vibrate([80, 60, 80, 60, 80]);
  }, [mine, r.correct]);
  return (
    <div className="full" style={{ justifyContent: 'flex-start', paddingTop: 40 }} data-testid={r.correct ? 'resultaat-goed' : 'resultaat-mis'}>
      {r.correct ? (
        <>
          <div style={{ fontSize: 52, color: 'var(--mint)' }}>✓</div>
          <div style={{ fontSize: mine ? 52 : 40, fontWeight: 900, color: 'var(--mint)', lineHeight: 1 }}>{mine ? 'GOED!' : `${active.name}: GOED!`}</div>
          <div className="ph2" style={{ marginTop: 8 }}>
            +1 kaart · nu {r.cardsAfter} van {pub.settings.goal}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 52, color: 'var(--rood)' }}>✕</div>
          <div style={{ fontSize: mine ? 52 : 40, fontWeight: 900, color: 'var(--rood)', lineHeight: 1 }}>{mine ? 'MIS!' : `${active.name}: MIS!`}</div>
          <div className="ph2" style={{ marginTop: 8 }}>
            {r.song.year} hoorde {where}
          </div>
        </>
      )}
      <div style={{ width: '100%', marginTop: 28 }}>
        <PCard c={card} cls={r.correct ? 'good' : ''} />
      </div>
      <div className="ph2" style={{ marginTop: 22 }}>
        {mine
          ? r.correct
            ? `Je hebt nu ${r.cardsAfter} kaarten.`
            : `De kaart gaat weg. Je hebt nog ${me.cards.length} kaarten.`
          : `Jij hebt ${me.cards.length} van ${pub.settings.goal} kaarten.`}
      </div>
    </div>
  );
}

function turnsUntil(pub: PublicState, meIdx: number): number {
  const n = pub.players.length;
  return (meIdx - pub.turnIndex + n) % n;
}

function StandingsPhone({ pub, me }: { pub: PublicState; me: PublicPlayer }) {
  const rows = [...pub.players].sort((a, b) => b.cards.length - a.cards.length || b.tokens - a.tokens);
  const pos = rows.findIndex((p) => p.id === me.id) + 1;
  const next = pub.players[pub.turnIndex];
  const until = turnsUntil(pub, pub.players.findIndex((p) => p.id === me.id));
  return (
    <>
      <div className="ph1">Tussenstand</div>
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
  useWakeLock(Boolean(me));

  if (!session) return <CodeEntry initial={ph.initialCode} onJoin={ph.joinByCode} />;
  if (!me) return <NameColor pub={pub} send={ph.send} busy={Boolean(ph.busy.join)} toast={ph.toast} />;

  const p = pub!;
  const isHost = p.hostId === me.id;
  const active = p.players.find((x) => x.id === p.turn?.playerId) ?? null;
  const mine = active?.id === me.id;
  const net = ph.conn === 'lost';
  const common = { me, all: p.players, goal: p.settings.goal, net, back: ph.back, toast: ph.toast };

  if (p.phase === 'turnStart' && mine && !net) return <TurnStartMine pub={p} offset={ph.offset} send={ph.send} busy={Boolean(ph.busy.startSong)} />;
  if (p.phase === 'winner') return <WinnerPhone pub={p} me={me} send={ph.send} isHost={isHost} />;

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
        </>
      );
      break;
    }
    case 'turnStart':
    case 'placing': {
      if (mine && p.phase === 'placing' && !p.turn?.locked) {
        return <PlacingMine pub={p} me={me} offset={ph.offset} send={ph.send} busy={ph.busy} common={common} />;
      } else if (mine) {
        const years = me.cards.map((c) => c.year);
        const slot = p.turn?.slot ?? null;
        const [l, r] = slot === null ? [null, null] : gapNeighbours(years, slot);
        body = (
          <>
            <div className="ph1">Vastgezet ✓</div>
            <div className="ph2">{slot === null ? 'Geen plek gekozen.' : l === null ? `Vóór ${r}.` : r === null ? `Na ${l}.` : `Tussen ${l} en ${r}.`} Nu duimen…</div>
            <PhoneTimeline cards={me.cards} slot={slot} ownLabel="Jouw keuze" />
          </>
        );
        act = <button className="pbtn dis">Wachten op de onthulling…</button>;
      } else if (active) {
        body = (
          <div data-testid="andermans-beurt">
            <div className="ph1" style={{ color: active.color }}>
              {active.name} is aan de beurt
            </div>
            <div className="ph2">{p.phase === 'turnStart' ? 'Het nummer begint zo. Kijk mee op de tv.' : p.turn?.slot === null ? `Luister mee. ${active.name} kiest een plek…` : `${active.name} legt hier. Klopt dat?`}</div>
            <PhoneTimeline cards={active.cards} slot={p.turn?.slot ?? null} ownLabel={`${active.name} legt hier`} />
          </div>
        );
      }
      break;
    }
    case 'reveal':
      if (p.reveal && active) body = <Result pub={p} me={me} active={active} />;
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
