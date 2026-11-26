import { useEffect, useState, type ReactNode } from 'react';
import { useTvGame } from './useTvGame';
import type { GameState, Player } from '../game/types';
import { toPublic, type PublicPlayer } from '../game/public';
import { estimateMinutes, formatMinutes, gapNeighbours } from '../game/rules';
import {
  Avatar,
  Chip,
  FlipCard,
  Logo,
  MysteryCard,
  QrSvg,
  Ring,
  TvCard,
  band,
  cardWidth,
} from '../ui/components';
import { login, clientId } from '../spotify/auth';
import type { Card } from '../game/types';

// ---------------- podium 1920×1080 ----------------

function Stage({ children, win, ten }: { children: ReactNode; win?: boolean; ten?: boolean }) {
  const [scale, setScale] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const fit = () => {
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      setScale(s);
      setOff({ x: (window.innerWidth - 1920 * s) / 2, y: (window.innerHeight - 1080 * s) / 2 });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return (
    <div className="stage">
      <div
        className={`tv ${win ? 'win' : ''} ${ten ? 'tv10' : ''}`}
        style={{ transform: `translate(${off.x}px, ${off.y}px) scale(${scale})`, transformOrigin: '0 0' }}
      >
        {children}
      </div>
    </div>
  );
}

const joinUrl = (code: string, chan: string, lokaal: boolean) =>
  `${window.location.origin}/speel/${code}${lokaal ? '?net=lokaal' : ''}#${chan}`;

function secsLeft(s: GameState): number | null {
  if (s.deadline === null) return null;
  return Math.max(0, Math.ceil((s.deadline - Date.now()) / 1000));
}

function fracLeft(s: GameState, total: number): number {
  if (s.deadline === null || total <= 0) return 1;
  return Math.max(0, Math.min(1, (s.deadline - Date.now()) / total));
}

// ---------------- onderdelen ----------------

function Topbar({ s, flags }: { s: GameState; flags?: Record<string, { flag?: string; mp?: boolean }> }) {
  const pub = toPublic(s).players;
  const goal = s.settings.goal;
  return (
    <div className="topbar">
      {pub.map((p) => {
        const f = flags?.[p.id] ?? (p.cards.length === goal - 1 && s.phase !== 'winner' ? { flag: 'MATCH POINT', mp: true } : undefined);
        return <Chip key={p.id} p={p} all={pub} goal={goal} active={s.turn?.playerId === p.id} flag={f?.flag} mp={f?.mp} />;
      })}
    </div>
  );
}

function Bottombar({
  ph,
  sub,
  frac,
  violet,
  room,
  lokaal,
}: {
  ph: string;
  sub: string;
  frac: number;
  violet?: boolean;
  room: { code: string; chan: string };
  lokaal: boolean;
}) {
  return (
    <div className="bottombar">
      <div className="ph">
        {ph}
        <small>{sub}</small>
      </div>
      <div className={`timer ${violet ? 'v' : ''}`}>
        <i style={{ width: `${frac * 100}%`, transition: 'width .25s linear' }} />
      </div>
      <div className="room">
        <div className="code">
          Instappen?<b>{room.code}</b>
        </div>
        <QrSvg text={joinUrl(room.code, room.chan, lokaal)} size={104} />
      </div>
    </div>
  );
}

function TvTimeline({
  cards,
  insertAt,
  mystery,
  top,
  stealable,
  stealGaps,
  highlight,
  all,
}: {
  cards: Card[];
  insertAt?: number | null;
  mystery?: (w: number) => ReactNode;
  top?: number;
  /** Steelvenster: vrije gaten violet gestippeld (behalve de plek van de actieve speler). */
  stealable?: boolean;
  /** Geclaimde steelgaten: gat → speler. */
  stealGaps?: Record<number, PublicPlayer>;
  /** songId van een kaart die oplicht (gekochte kaart). */
  highlight?: string;
  all?: PublicPlayer[];
}) {
  const hasMystery = Boolean(mystery && insertAt !== null && insertAt !== undefined);
  const items = cards.length + (hasMystery ? 1 : 0);
  const anySteal = stealable || (stealGaps && Object.keys(stealGaps).length > 0);
  // Breedte van steelgaten: 110 px als het past, anders smaller (tv met veel kaarten: 40 px).
  const plainW = items > 9 ? 24 : 56;
  let stealW = 110;
  let w = 200;
  if (anySteal) {
    const gaps = cards.length + 1;
    for (const sw of [110, 80, 56, 40]) {
      stealW = sw;
      w = Math.floor((1840 - gaps * sw - (hasMystery ? plainW : 0)) / items);
      if (w >= 150 || sw === 40) break;
    }
    w = Math.max(120, Math.min(200, w));
  } else {
    w = cardWidth(items, plainW);
  }
  const out: ReactNode[] = [];
  for (let g = 0; g <= cards.length; g++) {
    if (insertAt === g && hasMystery) {
      out.push(<div key="m-gap" className="gap" style={{ width: plainW }} />);
      out.push(<div key="m">{mystery!(w)}</div>);
    }
    const taken = stealGaps?.[g];
    const isSteal = Boolean((stealable && insertAt !== g) || taken);
    out.push(
      <div key={`g${g}`} className={`gap ${isSteal ? 'steal' : ''} ${taken ? 'taken' : ''}`} style={{ width: isSteal ? stealW : plainW }}>
        {taken && (
          <div className="tok">
            <Avatar p={taken} all={all} style={stealW < 80 ? { width: 40, height: 40, fontSize: 20 } : undefined} />
            <span style={stealW < 80 ? { fontSize: 18, padding: '1px 5px' } : undefined}>{taken.name}</span>
          </div>
        )}
      </div>,
    );
    if (g < cards.length) out.push(<TvCard key={cards[g].songId} c={cards[g]} w={w} cls={highlight === cards[g].songId ? 'good' : ''} />);
  }
  return (
    <div className="tl" style={top !== undefined ? { top } : undefined} data-testid="tv-timeline">
      {out}
    </div>
  );
}

function Ringer({ s, total, violet }: { s: GameState; total: number; violet?: boolean }) {
  const left = secsLeft(s);
  if (left === null) return null;
  const red = !violet && left <= 10;
  return (
    <div className="ring">
      <Ring sec={(s.deadline! - Date.now()) / 1000} total={total / 1000} color={violet ? 'var(--violet)' : red ? 'var(--rood)' : 'var(--amber)'} />
      <div className={`t num ${red ? 'red' : ''}`} key={left <= 3 ? left : 'x'}>
        {left}
      </div>
    </div>
  );
}

const range = (years: number[], slot: number) => {
  const [l, r] = gapNeighbours(years, slot);
  if (l === null && r === null) return 'Ergens';
  if (l === null) return `Vóór ${r}`;
  if (r === null) return `Na ${l}`;
  return `Tussen ${l} en ${r}`;
};

function hoorde(between: [number | null, number | null]) {
  const [l, r] = between;
  if (l === null && r === null) return '';
  if (l === null) return `hoorde vóór ${r}`;
  if (r === null) return `hoorde na ${l}`;
  if (l === r) return `hoorde naast ${l}`;
  return `hoorde tussen ${l} en ${r}`;
}

// ---------------- schermen ----------------

function Lobby({ s, room, lokaal }: { s: GameState; room: { code: string; chan: string }; lokaal: boolean }) {
  const pub = toPublic(s).players;
  const n = pub.length;
  const est = formatMinutes(estimateMinutes(Math.max(n, 2), s.settings.goal));
  return (
    <div className="lobby">
      <div className="left">
        <div className="logo">
          <Logo />
          TUNE·TIMELINE
        </div>
        <div className="qrbig">
          <QrSvg text={joinUrl(room.code, room.chan, lokaal)} size={380} className="" />
        </div>
        <div className="url">
          Scan of ga naar <b>{window.location.host}</b>
        </div>
        <div className="bigcode" data-testid="roomcode">
          {room.code}
        </div>
      </div>
      <div className="right">
        <div className="seatshead">
          <div className="n num">{n}</div>
          <div className="s">van max 10 spelers · in speelvolgorde</div>
        </div>
        <div className="seats" style={{ marginTop: 60 }}>
          {Array.from({ length: 10 }, (_, i) => {
            const p = pub[i];
            return (
              <div key={p?.id ?? `leeg${i}`} className={`seat ${p ? 'f' : ''}`} style={p && !p.online ? { opacity: 0.5 } : undefined}>
                <span style={{ position: 'absolute', top: -14, left: 12, fontSize: 20, background: 'var(--nacht)', padding: '0 6px', color: 'var(--gedempt)' }}>
                  {i + 1}
                </span>
                {p ? (
                  <>
                    <Avatar p={p} all={pub} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  </>
                ) : (
                  <span style={{ fontSize: 24 }}>vrij</span>
                )}
              </div>
            );
          })}
        </div>
        {n >= 8 && s.settings.goal > 8 && (
          <div style={{ textAlign: 'center', marginTop: 34, fontSize: 30, color: 'var(--amber)', fontWeight: 700 }}>
            Advies bij {n} spelers: doel 8 ({formatMinutes(estimateMinutes(n, 8))})
          </div>
        )}
        <div className="settings">
          <div className="pill">Original</div>
          <div className="pill">Doel: {s.settings.goal} kaarten</div>
          <div className="pill">Plaatsen: {s.settings.placeSeconds ? `${s.settings.placeSeconds} s` : 'geen timer'}</div>
          <div className="pill est">Geschatte speelduur {est}</div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 44, fontSize: 30, color: 'var(--gedempt)', fontWeight: 600 }}>
          {n < 2 ? 'Wachten op minstens 2 spelers…' : `${pub.find((p) => p.id === s.hostId)?.name ?? 'De host'} start het spel op de telefoon`}
        </div>
      </div>
    </div>
  );
}

function Deal({ s, room, lokaal }: { s: GameState; room: { code: string; chan: string }; lokaal: boolean }) {
  const starter = s.players.find((p) => p.id === s.dealInfo?.playerId);
  const w = s.players.length > 6 ? 150 : 180;
  return (
    <>
      <Topbar s={s} />
      <div className="phase">
        <div className="big">Startkaarten</div>
        <div className="sub">
          Oudste kaart: <b style={{ color: starter?.color }}>{starter?.name}</b> ({s.dealInfo?.year}). {starter?.name} begint!
        </div>
      </div>
      <div className="tl" style={{ gap: 28 }}>
        {s.players.map((p, i) => (
          <div key={p.id} className="dealcard" style={{ animationDelay: `${i * 0.25}s`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <TvCard c={p.cards[0]} w={w} cls={p.id === starter?.id ? 'good' : ''} />
            <div style={{ fontSize: 28, fontWeight: 800, color: p.color }}>{p.name}</div>
          </div>
        ))}
      </div>
      <Bottombar ph="Startkaarten" sub="iedereen krijgt 1 open kaart" frac={fracLeft(s, 6000 * s.settings.tempo)} room={room} lokaal={lokaal} />
    </>
  );
}

type Room = { code: string; chan: string };

const nm = (s: GameState, id: string | null | undefined) => s.players.find((x) => x.id === id);

/** Steelgaten: gat → speler (voor de tijdlijn). */
function stealMap(s: GameState, steals: { playerId: string; slot: number }[]): Record<number, PublicPlayer> {
  const pub = toPublic(s).players;
  const out: Record<number, PublicPlayer> = {};
  for (const st of steals) {
    const pl = pub.find((x) => x.id === st.playerId);
    if (pl) out[st.slot] = pl;
  }
  return out;
}

function TurnStart({ s, room, lokaal }: { s: GameState; room: Room; lokaal: boolean }) {
  const p = s.players.find((x) => x.id === s.turn?.playerId)!;
  const left = secsLeft(s);
  const buy = s.lastBuy && s.lastBuy.playerId === p.id ? s.lastBuy : null;
  if (buy) {
    return (
      <>
        <Topbar s={s} flags={{ [p.id]: { flag: '−3 tokens' } }} />
        <div className="phase">
          <div className="big" style={{ color: p.color, fontSize: 84 }}>
            {p.name} koopt een kaart
          </div>
          <div className="sub">3 tokens ingeleverd · de kaart ligt meteen goed · daarna gewoon luisteren</div>
        </div>
        <TvTimeline cards={p.cards} highlight={buy.card.songId} />
        <div className="banner">
          Nu <b>{p.cards.length} van {s.settings.goal}</b> · het nummer voor deze beurt start over <b className="num">{left}</b>
        </div>
        <Bottombar ph="Kaart gekocht" sub="beurt gaat gewoon door" frac={fracLeft(s, 6000 * s.settings.tempo)} room={room} lokaal={lokaal} />
      </>
    );
  }
  return (
    <>
      <Topbar s={s} />
      <div className="phase">
        <div className="big" style={{ color: p.color, fontSize: 110 }}>
          {p.name}
        </div>
        <div className="sub" style={{ fontSize: 44, color: 'var(--creme)' }}>
          is aan de beurt
        </div>
      </div>
      <TvTimeline cards={p.cards} />
      <div className="banner">
        Muziek start over <b className="num">{left}</b> ·{' '}
        {p.tokens >= 3 ? (
          <>
            {p.name} kan eerst een kaart <b>kopen</b> (3 tokens)
          </>
        ) : (
          `${p.name} kan ook zelf starten op de telefoon`
        )}
      </div>
      <Bottombar ph="Beurtstart" sub={p.tokens >= 3 ? 'kopen kan alleen nu' : `ronde ${s.round}`} frac={fracLeft(s, 6000 * s.settings.tempo)} room={room} lokaal={lokaal} />
    </>
  );
}

function Placing({ s, room, lokaal }: { s: GameState; room: Room; lokaal: boolean }) {
  const p = s.players.find((x) => x.id === s.turn?.playerId)!;
  const slot = s.turn?.slot ?? null;
  const total = s.settings.placeSeconds * 1000 * s.settings.tempo;
  const years = p.cards.map((c) => c.year);
  const sub = `nummer ${s.songsPlayed + 1} van ${toPublic(s).deckSize}`;
  const claim = s.turn?.claim ? ' · titel + artiest geclaimd 🎤' : '';
  return (
    <>
      <Topbar s={s} />
      <div className="phase">
        <div className="big">Luister…</div>
        <div className="sub">{slot === null ? `${p.name} kiest een plek in de tijdlijn` : `${p.name} schuift de kaart live heen en weer`}</div>
      </div>
      <Ringer s={s} total={total} />
      {slot === null ? (
        <>
          <div style={{ position: 'absolute', left: '50%', top: 366, transform: 'translateX(-50%) scale(.74)', transformOrigin: '50% 0' }}>
            <MysteryCard />
          </div>
          <TvTimeline cards={p.cards} top={560} />
          {claim && <div className="banner" style={{ top: 960, fontSize: 26 }}>{claim.slice(3)}</div>}
        </>
      ) : (
        <>
          <TvTimeline
            cards={p.cards}
            insertAt={slot}
            mystery={(w) => (
              <MysteryCard w={w} cls="lift">
                <div className="arrow">{p.name} legt hier</div>
              </MysteryCard>
            )}
          />
          <div className="banner">
            {range(years, slot)}?{claim}
          </div>
        </>
      )}
      <Bottombar ph="Luisteren & plaatsen" sub={sub} frac={total ? fracLeft(s, total) : 1} room={room} lokaal={lokaal} />
    </>
  );
}

function rangeShort(years: number[], slot: number) {
  const [l, r] = gapNeighbours(years, slot);
  if (l === null && r === null) return 'ergens';
  if (l === null) return `vóór ${r}`;
  if (r === null) return `na ${l}`;
  return `${l}–${r}`;
}

function Stealing({ s, room, lokaal }: { s: GameState; room: Room; lokaal: boolean }) {
  const t = s.turn!;
  const p = nm(s, t.playerId)!;
  const years = p.cards.map((c) => c.year);
  const pub = toPublic(s).players;
  const parts = [
    ...t.steals.map((st) => (
      <span key={st.playerId}>
        <b>{nm(s, st.playerId)?.name}</b> ({rangeShort(years, st.slot)})
      </span>
    )),
    ...t.passed.map((id) => <span key={id}>{nm(s, id)?.name} past</span>),
  ];
  const stamp = (w: number) => (
    <MysteryCard w={w}>
      <div className="stamp" style={w < 180 ? { top: 70, fontSize: 22 } : undefined}>
        VASTGEZET
      </div>
    </MysteryCard>
  );
  return (
    <>
      <div className="glow-v" />
      <Topbar s={s} />
      <div className="phase">
        <div className="big" style={{ color: '#b9a8ff', fontSize: 96 }}>
          Wie steelt?
        </div>
        <div className="sub">
          {t.slot === null ? `${p.name} koos geen plek: elke plek is te stelen` : `Denk je dat ${p.name} fout zit? Kies de goede plek`} · 1 token
        </div>
      </div>
      <Ringer s={s} total={10_000 * s.settings.tempo} violet />
      {t.slot === null ? (
        <>
          <div style={{ position: 'absolute', left: '50%', top: 366, transform: 'translateX(-50%) scale(.74)', transformOrigin: '50% 0' }}>{stamp(200)}</div>
          <TvTimeline cards={p.cards} top={560} stealable stealGaps={stealMap(s, t.steals)} all={pub} />
        </>
      ) : (
        <TvTimeline cards={p.cards} insertAt={t.slot} mystery={stamp} stealable stealGaps={stealMap(s, t.steals)} all={pub} />
      )}
      <div className="banner" style={{ top: 900 }}>
        {parts.length ? (
          <>
            Stelen:{' '}
            {parts.map((x, i) => (
              <span key={i}>
                {i > 0 && ' · '}
                {x}
              </span>
            ))}
          </>
        ) : (
          'Tik op je telefoon een plek en dan STEEL'
        )}
      </div>
      <Bottombar ph="Steelvenster" sub="wie het eerst tikt, heeft de plek" frac={fracLeft(s, 10_000 * s.settings.tempo)} violet room={room} lokaal={lokaal} />
    </>
  );
}

function names(list: string[]) {
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} en ${list[list.length - 1]}`;
}

function Reveal({ s, room, lokaal }: { s: GameState; room: Room; lokaal: boolean }) {
  const r = s.reveal!;
  const p = nm(s, r.playerId)!;
  const song = r.song;
  const card: Card = { songId: song.id, year: song.year, title: song.title, artist: song.artist };
  const thief = r.stolenBy ? nm(s, r.stolenBy) : null;
  // Tijdlijn zonder de zojuist gewonnen kaart; de flipkaart staat op de gekozen plek.
  const base = r.correct ? p.cards.filter((c) => c.songId !== song.id) : p.cards;
  const flags: Record<string, { flag?: string }> = {};
  if (r.correct) flags[p.id] = { flag: '+1 kaart' };
  for (const st of r.steals) {
    if (st.outcome === 'won') flags[st.playerId] = { flag: '+1 kaart' };
    else if (st.outcome === 'lost') flags[st.playerId] = { flag: '−1 token' };
    else flags[st.playerId] = { flag: 'token terug' };
  }
  const losers = r.steals.filter((x) => x.outcome === 'lost').map((x) => nm(s, x.playerId)?.name ?? '');
  const refunds = r.steals.filter((x) => x.outcome === 'refund').map((x) => nm(s, x.playerId)?.name ?? '');
  const bannerParts: string[] = [];
  if (thief) bannerParts.push(`De kaart vliegt naar ${thief.name}`);
  else if (r.correct) bannerParts.push(`${p.name} heeft nu ${r.cardsAfter} kaarten`);
  else bannerParts.push(r.steals.length ? 'Niemand stal goed · de kaart gaat weg' : 'De kaart gaat weg');
  if (losers.length) bannerParts.push(`${names(losers)} ${losers.length > 1 ? 'verliezen hun token' : 'verliest een token'}`);
  if (refunds.length) bannerParts.push(`${names(refunds)} krijgt de token terug`);
  return (
    <>
      <Topbar s={s} flags={flags} />
      <div className="phase">
        {r.correct ? (
          <>
            <div className="result pop" style={{ color: 'var(--mint)' }}>
              GOED!
            </div>
            <div className="sub reveal-sub">
              {p.name} houdt de kaart · {r.cardsAfter} van {s.settings.goal}
              {r.flipped ? ' · omgedraaid door de host' : ''}
            </div>
          </>
        ) : thief ? (
          <>
            <div className="result pop" style={{ color: thief.color, fontSize: 96 }}>
              GESTOLEN DOOR {thief.name.toUpperCase()}!
            </div>
            <div className="sub reveal-sub">
              {p.name} zat mis: dit nummer is uit <b style={{ color: 'var(--creme)' }}>{song.year}</b> en {hoorde(r.between)}
            </div>
          </>
        ) : (
          <>
            <div className="result pop" style={{ color: 'var(--rood)' }}>
              MIS!
            </div>
            <div className="sub reveal-sub">
              {r.slot === null ? `${p.name} koos geen plek · ` : ''}Dit nummer is uit <b style={{ color: 'var(--creme)' }}>{song.year}</b> en {hoorde(r.between)}
              {r.flipped ? ' · omgedraaid door de host' : ''}
            </div>
          </>
        )}
      </div>
      {r.slot === null ? (
        <>
          <div style={{ position: 'absolute', left: '50%', top: 340, transform: 'translateX(-50%) scale(.85)', transformOrigin: '50% 0' }}>
            <FlipCard c={card} cls="bad" />
          </div>
          <TvTimeline cards={base} top={570} stealGaps={stealMap(s, r.steals)} all={toPublic(s).players} />
        </>
      ) : (
        <TvTimeline
          cards={base}
          insertAt={r.slot}
          mystery={(w) => <FlipCard c={card} w={w} cls={r.correct ? 'good' : 'bad'} drop={!r.correct} />}
          stealGaps={stealMap(s, r.steals)}
          all={toPublic(s).players}
        />
      )}
      <div className="banner reveal-sub">{bannerParts.join(' · ')}</div>
      <Bottombar ph="Onthulling" sub={`${song.artist} — ${song.title}`} frac={1} room={room} lokaal={lokaal} />
    </>
  );
}

function ObjectionScreen({ s, room, lokaal }: { s: GameState; room: Room; lokaal: boolean }) {
  const o = s.objection!;
  const r = s.reveal!;
  const p = nm(s, o.playerId)!;
  const fout = Object.values(o.votes).filter((v) => v === 'fout').length;
  const card: Card = { songId: r.song.id, year: r.song.year, title: r.song.title, artist: r.song.artist };
  const res = o.result;
  const flags: Record<string, { flag?: string }> = {};
  if (res?.awarded) flags[p.id] = { flag: '+1 token' };
  if (res?.maxed) flags[p.id] = { flag: 'Max 5' };
  return (
    <>
      <Topbar s={s} flags={flags} />
      <div className="phase">
        <div className="big" style={{ fontSize: 72 }}>
          Had {p.name} titel + artiest goed?
        </div>
        <div className="sub">
          Het was: “{r.song.title} — {r.song.artist}”
        </div>
      </div>
      <div style={{ position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 60, alignItems: 'center' }}>
        <TvCard c={card} cls={res ? (res.ok ? 'good' : 'bad') : r.correct ? 'good' : ''} />
        {res ? (
          <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.3, color: res.ok ? 'var(--mint)' : 'var(--rood)' }}>
            {res.ok ? 'Goedgekeurd!' : 'Afgekeurd'}
            <br />
            <span style={{ fontSize: 34, color: 'var(--gedempt)', fontWeight: 700 }}>
              {res.ok ? (res.awarded ? `+1 token voor ${p.name}` : `${p.name} zit al op Max 5`) : `${fout} bezwaren · geen token`}
            </span>
          </div>
        ) : (
          <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.5 }}>
            Bezwaren: <span className="num" style={{ color: 'var(--rood)' }}>{fout}</span> van {o.eligible.length}
            <br />
            <span style={{ fontSize: 28, color: 'var(--gedempt)', fontWeight: 600 }}>
              {o.needed} {o.needed === 1 ? 'bezwaar' : 'bezwaren'} nodig om het af te keuren
            </span>
            <br />
            <span style={{ fontSize: 28, color: 'var(--gedempt)', fontWeight: 600 }}>
              Geen bezwaar = <b style={{ color: 'var(--amber)' }}>+1 token</b> voor {p.name}
            </span>
          </div>
        )}
      </div>
      <Bottombar
        ph="Bezwaar?"
        sub={res ? 'uitslag' : 'alleen tikken als het fout was · 6 s'}
        frac={res ? 1 : fracLeft(s, 6000 * s.settings.tempo)}
        room={room}
        lokaal={lokaal}
      />
    </>
  );
}

function Standings({ s, room, lokaal, paused }: { s: GameState; room: { code: string; chan: string }; lokaal: boolean; paused?: boolean }) {
  const pub = toPublic(s).players;
  const rows = [...pub].sort((a, b) => b.cards.length - a.cards.length || b.tokens - a.tokens);
  const next = s.players[s.turnIndex];
  const mp = pub.filter((p) => p.cards.length === s.settings.goal - 1);
  return (
    <>
      <div className="phase" style={{ top: 70 }}>
        <div className="big" style={{ fontSize: 80 }}>
          {paused ? 'Pauze ☕' : 'Tussenstand'}
        </div>
        <div className="sub">
          {paused ? `ronde ${s.round}` : `na ronde ${s.round - 1}`} · doel {s.settings.goal} kaarten
          {mp.length > 0 && <span style={{ color: 'var(--rood)' }}> · {mp.map((p) => p.name).join(' en ')} {mp.length > 1 ? 'staan' : 'staat'} op match point</span>}
        </div>
      </div>
      <div className="grid10">
        {rows.map((p, i) => (
          <StandRow key={p.id} p={p} pos={i + 1} lead={i === 0} all={pub} goal={s.settings.goal} />
        ))}
      </div>
      <Bottombar
        ph={paused ? 'Pauze' : 'Tussenstand'}
        sub={paused ? 'de host gaat verder via het hostmenu' : `volgende beurt: ${next?.name} · 6 s`}
        frac={paused ? 1 : fracLeft(s, 6000 * s.settings.tempo)}
        room={room}
        lokaal={lokaal}
      />
    </>
  );
}

function StandRow({ p, pos, lead, all, goal }: { p: PublicPlayer; pos: number; lead: boolean; all: PublicPlayer[]; goal: number }) {
  return (
    <div className={`g10 ${lead ? 'lead' : ''}`}>
      <div className="pos num">{pos}</div>
      <Avatar p={p} all={all} />
      <div className="who">
        <b>{p.name}</b>
        <span className="num">
          {p.cards.length}/{goal} · <i className="coin" style={{ display: 'inline-block', width: 18, height: 18, verticalAlign: -2 }} /> {p.tokens}
        </span>
      </div>
      <div className="yrs">
        {p.cards.slice(0, 12).map((c) => (
          <i key={c.songId} className="num" style={{ ['--band' as string]: band(c.year)[0] }}>
            '{String(c.year).slice(2)}
          </i>
        ))}
      </div>
    </div>
  );
}

function Winner({ s }: { s: GameState }) {
  const pub = toPublic(s);
  const w = s.players.find((p) => p.id === s.winnerId) as Player;
  const cols = ['#FFD23F', '#FF8C42', '#FF4F8B', '#E07BFF', '#4D7CFF', '#3BC9F5', '#2ED3B7', '#A6E35A', '#FFAD9E', '#C9CED8'];
  const playerCols = s.players.map((p) => p.color);
  const palette = playerCols.length ? playerCols : cols;
  const n = w.cards.length;
  const cw = n > 10 ? 130 : 150;
  return (
    <>
      <div className="confetti">
        {Array.from({ length: 70 }, (_, i) => (
          <i
            key={i}
            style={{
              left: (i * 137) % 1920,
              background: palette[i % palette.length],
              animationDuration: `${2.4 + (i % 7) * 0.35}s`,
              animationDelay: `-${(i % 11) * 0.3}s`,
            }}
          />
        ))}
      </div>
      <div className="wtitle">
        <div className="crown">👑</div>
        <div className="who">{w.name} wint!</div>
        <div className="s">
          {n} kaarten · {w.stats.correct} goed geraden
        </div>
      </div>
      <div className="wtl" style={{ gap: n > 10 ? 8 : 14 }}>
        {w.cards.map((c) => (
          <TvCard key={c.songId} c={c} w={cw} />
        ))}
      </div>
      <div className="awards">
        {pub.awards.map((a) => (
          <div key={a.title} className="award">
            {a.icon} {a.title}
            <b>
              {s.players.find((p) => p.id === a.playerId)?.name} · {a.detail}
            </b>
          </div>
        ))}
        <div className="award" style={{ background: 'var(--inkt)', color: 'var(--amber)' }}>
          Host: <b>Nog een potje?</b>
        </div>
      </div>
    </>
  );
}

// ---------------- opstartschermen ----------------

function Center({ children }: { children: ReactNode }) {
  return <div className="centerbox">{children}</div>;
}

function Brand() {
  return (
    <div className="logo" style={{ justifyContent: 'center' }}>
      <Logo />
      TUNE·TIMELINE
    </div>
  );
}

export default function TvApp() {
  const g = useTvGame();
  const { state: s, room, setup } = g;
  const lokaal = g.flags.net === 'lokaal';

  if (setup === 'loading' || !s || !room) {
    return (
      <Stage>
        <Center>
          <Brand />
          {setup === 'error' ? <ErrorCard text={g.error ?? ''} /> : <p>Laden…</p>}
        </Center>
      </Stage>
    );
  }

  if (setup === 'error') {
    return (
      <Stage>
        <Center>
          <Brand />
          <ErrorCard text={g.error ?? 'Er ging iets mis.'} />
        </Center>
      </Stage>
    );
  }

  if (setup === 'connect') {
    return (
      <Stage>
        <Center>
          <Brand />
          <div style={{ height: 40 }} />
          {clientId() ? (
            <button className="bigbtn" onClick={() => void login('/tv' + window.location.search)} data-testid="connect">
              Verbind Spotify
            </button>
          ) : (
            <p>VITE_SPOTIFY_CLIENT_ID ontbreekt in de instellingen.</p>
          )}
          <p style={{ fontSize: 24 }}>Alleen de host. Eén keer per avond.</p>
        </Center>
      </Stage>
    );
  }

  if (setup === 'sound' || setup === 'starting') {
    return (
      <Stage>
        <Center>
          <Brand />
          <div style={{ height: 30 }} />
          {g.resumed && <h2 style={{ fontSize: 64 }}>Het spel gaat verder waar het was</h2>}
          <button className="bigbtn" onClick={() => void g.begin()} disabled={setup === 'starting'} data-testid="begin">
            {setup === 'starting' ? 'Spotify verbinden…' : g.resumed ? 'Muziek hervatten 🔊' : 'Klik om te beginnen 🔊'}
          </button>
          <div className="checklist" style={{ marginTop: 20 }}>
            ✓ <b>Spotify-app op je telefoon</b> helemaal afgesloten? (anders zie je wat er speelt)
            <br />✓ <b>Laptop</b> op "nooit slapen" en geluid via de tv
            <br />✓ Chrome of Edge, geen adblocker op deze pagina
          </div>
          {g.resumed && (
            <button className="bigbtn sec" onClick={g.newGame} style={{ marginTop: 10 }}>
              Nieuw spel beginnen
            </button>
          )}
          {g.flags.nep && <p className="smallnote">Nep-speler aan (?nep=1): er klinkt geen muziek.</p>}
        </Center>
      </Stage>
    );
  }

  let screen: ReactNode;
  switch (s.phase) {
    case 'lobby':
      screen = <Lobby s={s} room={room} lokaal={lokaal} />;
      break;
    case 'deal':
      screen = <Deal s={s} room={room} lokaal={lokaal} />;
      break;
    case 'turnStart':
      screen = <TurnStart s={s} room={room} lokaal={lokaal} />;
      break;
    case 'placing':
      screen = <Placing s={s} room={room} lokaal={lokaal} />;
      break;
    case 'stealing':
      screen = <Stealing s={s} room={room} lokaal={lokaal} />;
      break;
    case 'reveal':
      screen = <Reveal s={s} room={room} lokaal={lokaal} />;
      break;
    case 'objection':
      screen = s.objection && s.reveal ? <ObjectionScreen s={s} room={room} lokaal={lokaal} /> : null;
      break;
    case 'standings':
      screen = <Standings s={s} room={room} lokaal={lokaal} />;
      break;
    case 'winner':
      screen = <Winner s={s} />;
      break;
  }

  if (s.paused) screen = <Standings s={s} room={room} lokaal={lokaal} paused />;

  return (
    <Stage win={s.phase === 'winner'} ten={s.players.length >= 7}>
      <div data-phase={s.paused ? 'paused' : s.phase} data-testid="tv" style={{ position: 'absolute', inset: 0 }}>
        {screen}
      </div>
      {s.notice && (
        <div className="toastTv tvnotice" style={s.phase === 'placing' ? { top: 130 } : undefined}>
          {s.notice.kind === 'songFailed' ? '⚠ ' : ''}{s.notice.text}
        </div>
      )}
      {g.net === 'error' && (
        <div className="overlaywrap">
          <div className="ocard">
            <div className="ic">📡</div>
            <h3>Geen verbinding met de spelers</h3>
            <p>Bezig met opnieuw verbinden… Het spel staat stil, er gaat niets verloren.</p>
          </div>
        </div>
      )}
      {g.problem && (
        <div className="overlaywrap">
          <div className="ocard">
            <div className="ic">🔌</div>
            <h3>Spotify is even weg</h3>
            <p>{g.problem}</p>
            <div className="btns">
              <button className="btn-tv" onClick={() => window.location.reload()}>
                Opnieuw verbinden
              </button>
              <button className="btn-tv sec" onClick={() => void login('/tv')}>
                Opnieuw inloggen
              </button>
              <button className="btn-tv sec" onClick={g.clearProblem}>
                Doorgaan
              </button>
            </div>
          </div>
        </div>
      )}
      {(s.phase === 'lobby' || s.phase === 'winner') && (
        <button
          className="resume-corner smallnote"
          onClick={() => {
            if (window.confirm('Nieuw spel met een nieuwe code? Iedereen moet opnieuw meedoen.')) g.newGame();
          }}
          style={{ color: s.phase === 'winner' ? 'var(--inkt)' : 'var(--gedempt)' }}
        >
          Nieuwe kamer
        </button>
      )}
    </Stage>
  );
}

function ErrorCard({ text }: { text: string }) {
  return (
    <div className="ocard" style={{ marginTop: 30 }}>
      <div className="ic">⚠</div>
      <h3>Dat lukt nog niet</h3>
      <p>{text}</p>
      <div className="btns">
        <button className="btn-tv" onClick={() => window.location.reload()}>
          Opnieuw proberen
        </button>
        <button className="btn-tv sec" onClick={() => void login('/tv')}>
          Opnieuw inloggen bij Spotify
        </button>
      </div>
    </div>
  );
}
