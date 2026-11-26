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
}: {
  cards: Card[];
  insertAt?: number | null;
  mystery?: (w: number) => ReactNode;
  top?: number;
}) {
  const items = cards.length + (mystery && insertAt !== null && insertAt !== undefined ? 1 : 0);
  const gapW = items > 9 ? 24 : 56;
  const w = cardWidth(items, gapW);
  const out: ReactNode[] = [];
  for (let g = 0; g <= cards.length; g++) {
    if (insertAt === g && mystery) {
      out.push(<div key={`m-gap`} className="gap" style={{ width: gapW }} />);
      out.push(<div key="m">{mystery(w)}</div>);
    }
    out.push(<div key={`g${g}`} className="gap" style={{ width: gapW }} />);
    if (g < cards.length) out.push(<TvCard key={cards[g].songId} c={cards[g]} w={w} />);
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

function TurnStart({ s, room, lokaal }: { s: GameState; room: { code: string; chan: string }; lokaal: boolean }) {
  const p = s.players.find((x) => x.id === s.turn?.playerId)!;
  const left = secsLeft(s);
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
        Muziek start over <b className="num">{left}</b> · {p.name} kan ook zelf starten op de telefoon
      </div>
      <Bottombar ph="Beurtstart" sub={`ronde ${s.round}`} frac={fracLeft(s, 6000 * s.settings.tempo)} room={room} lokaal={lokaal} />
    </>
  );
}

function Placing({ s, room, lokaal }: { s: GameState; room: { code: string; chan: string }; lokaal: boolean }) {
  const p = s.players.find((x) => x.id === s.turn?.playerId)!;
  const slot = s.turn?.slot ?? null;
  const total = s.settings.placeSeconds * 1000 * s.settings.tempo;
  const years = p.cards.map((c) => c.year);
  const sub = `nummer ${s.songsPlayed + 1} van ${toPublic(s).deckSize}`;
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
            {range(years, slot)}?
          </div>
        </>
      )}
      <Bottombar ph="Luisteren & plaatsen" sub={sub} frac={total ? fracLeft(s, total) : 1} room={room} lokaal={lokaal} />
    </>
  );
}

function Reveal({ s, room, lokaal }: { s: GameState; room: { code: string; chan: string }; lokaal: boolean }) {
  const r = s.reveal!;
  const p = s.players.find((x) => x.id === r.playerId)!;
  const song = r.song;
  const card: Card = { songId: song.id, year: song.year, title: song.title, artist: song.artist };
  // Tijdlijn zonder de zojuist gewonnen kaart; de flipkaart staat op de gekozen plek.
  const base = r.correct ? p.cards.filter((c) => c.songId !== song.id) : p.cards;
  const flags = r.correct ? { [p.id]: { flag: '+1 kaart' } } : undefined;
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
            </div>
          </>
        ) : (
          <>
            <div className="result pop" style={{ color: 'var(--rood)' }}>
              MIS!
            </div>
            <div className="sub reveal-sub">
              {r.slot === null ? `${p.name} koos geen plek · ` : ''}Dit nummer is uit <b style={{ color: 'var(--creme)' }}>{song.year}</b> en {hoorde(r.between)}
            </div>
          </>
        )}
      </div>
      {r.slot === null ? (
        <>
          <div style={{ position: 'absolute', left: '50%', top: 340, transform: 'translateX(-50%) scale(.85)', transformOrigin: '50% 0' }}>
            <FlipCard c={card} cls="bad" />
          </div>
          <TvTimeline cards={base} top={570} />
        </>
      ) : (
        <TvTimeline cards={base} insertAt={r.slot} mystery={(w) => <FlipCard c={card} w={w} cls={r.correct ? 'good' : 'bad'} drop={!r.correct} />} />
      )}
      <div className="banner reveal-sub">{r.correct ? `${p.name} heeft nu ${r.cardsAfter} kaarten` : 'De kaart gaat weg'}</div>
      <Bottombar ph="Onthulling" sub={`${song.artist} — ${song.title}`} frac={1} room={room} lokaal={lokaal} />
    </>
  );
}

function Standings({ s, room, lokaal }: { s: GameState; room: { code: string; chan: string }; lokaal: boolean }) {
  const pub = toPublic(s).players;
  const rows = [...pub].sort((a, b) => b.cards.length - a.cards.length || b.tokens - a.tokens);
  const next = s.players[s.turnIndex];
  const mp = pub.filter((p) => p.cards.length === s.settings.goal - 1);
  return (
    <>
      <div className="phase" style={{ top: 70 }}>
        <div className="big" style={{ fontSize: 80 }}>
          Tussenstand
        </div>
        <div className="sub">
          na ronde {s.round - 1} · doel {s.settings.goal} kaarten
          {mp.length > 0 && <span style={{ color: 'var(--rood)' }}> · {mp.map((p) => p.name).join(' en ')} {mp.length > 1 ? 'staan' : 'staat'} op match point</span>}
        </div>
      </div>
      <div className="grid10">
        {rows.map((p, i) => (
          <StandRow key={p.id} p={p} pos={i + 1} lead={i === 0} all={pub} goal={s.settings.goal} />
        ))}
      </div>
      <Bottombar ph="Tussenstand" sub={`volgende beurt: ${next?.name} · 6 s`} frac={fracLeft(s, 6000 * s.settings.tempo)} room={room} lokaal={lokaal} />
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
    case 'reveal':
      screen = <Reveal s={s} room={room} lokaal={lokaal} />;
      break;
    case 'standings':
      screen = <Standings s={s} room={room} lokaal={lokaal} />;
      break;
    case 'winner':
      screen = <Winner s={s} />;
      break;
  }

  return (
    <Stage win={s.phase === 'winner'} ten={s.players.length >= 7}>
      <div data-phase={s.phase} data-testid="tv" style={{ position: 'absolute', inset: 0 }}>
        {screen}
      </div>
      {s.notice && (
        <div className="toastTv tvnotice" style={s.phase === 'placing' ? { top: 130 } : undefined}>
          ⚠ {s.notice.text}
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
