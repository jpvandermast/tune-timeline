import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useTvGame, type Issue } from './useTvGame';
import { matchPointIds } from '../game/engine';
import type { Card, GameState, Player } from '../game/types';
import { awards as computeAwards, toPublic, type PublicPlayer } from '../game/public';
import { LEVEL_NAMES, LEVEL_TOKENS, estimateMinutes, formatMinutes, gapNeighbours } from '../game/rules';
import { Avatar, Chip, FlipCard, Logo, MysteryCard, QrSvg, Ring, TvCard, band, cardWidth } from '../ui/components';
import { play as playSound } from '../audio/sfx';
import { login, clientId } from '../spotify/auth';
import type { Device } from '../spotify/player';

type Room = { code: string; chan: string };

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

const nm = (s: GameState, id: string | null | undefined) => s.players.find((x) => x.id === id);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const tempo = (s: GameState) => s.settings.tempo || 1;

function names(list: string[]) {
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} en ${list[list.length - 1]}`;
}

function teamLabel(p: { name: string; members?: string[] } | undefined, teams: boolean) {
  if (!p) return '?';
  if (teams && p.members?.length) return `${p.name} (${p.members.join(', ')})`;
  return p.name;
}

/** Drankspel-balk op de tv: toont wie er moet drinken of slokken mag uitdelen. */
function DrinkBar({ s, delayed, top }: { s: GameState; delayed?: boolean; top?: number }) {
  if (!s.settings.drinking) return null;
  const list = (s.drinks ?? []).filter((d) => d.kind !== 'bak');
  if (!list.length) return null;
  const pub = toPublic(s).players;
  const teams = s.settings.teams;
  return (
    <div
      className={`drinkbar ${delayed ? 'reveal-sub' : ''}`}
      style={top !== undefined ? { top } : undefined}
      data-testid="tv-drank"
    >
      {list.map((d) => {
        const who = d.playerId ? nm(s, d.playerId) : undefined;
        const whoPub = d.playerId ? pub.find((x) => x.id === d.playerId) : undefined;
        const target = d.targetId ? nm(s, d.targetId) : undefined;
        const targetPub = d.targetId ? pub.find((x) => x.id === d.targetId) : undefined;
        const sipTxt = `${d.sips} ${d.sips === 1 ? 'slok' : 'slokken'}`;
        if (d.kind === 'all') {
          return (
            <div key={d.id} className="dpill all">
              <span className="dic">🍻</span>
              <div>
                <b>IEDEREEN: {sipTxt}!</b>
                <span>{d.reason}</span>
              </div>
            </div>
          );
        }
        if (d.kind === 'give') {
          if (target && targetPub) {
            return (
              <div key={d.id} className="dpill given">
                <Avatar p={targetPub} all={pub} style={{ width: 44, height: 44, fontSize: 22 }} />
                <div>
                  <b>
                    🍺 {teamLabel(target, teams)}: {sipTxt}!
                  </b>
                  <span>
                    uitgedeeld door {who?.name ?? '?'}
                    {teams ? ' · heel het team drinkt!' : ''}
                  </span>
                </div>
              </div>
            );
          }
          return (
            <div key={d.id} className="dpill give">
              {whoPub && <Avatar p={whoPub} all={pub} style={{ width: 44, height: 44, fontSize: 22 }} />}
              <div>
                <b>
                  👉 {who?.name ?? '?'} deelt {sipTxt} uit!
                </b>
                <span>{d.reason} · kies op je telefoon</span>
              </div>
            </div>
          );
        }
        return (
          <div key={d.id} className="dpill drink">
            {whoPub && <Avatar p={whoPub} all={pub} style={{ width: 44, height: 44, fontSize: 22 }} />}
            <div>
              <b>
                🍺 {teamLabel(who, teams)}: {sipTxt}!
              </b>
              <span>
                {d.reason}
                {teams ? ' · heel het team!' : ''}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------- bovenbalk: vlaggen per fase ----------------

type Flags = Record<string, { flag?: string; mp?: boolean }>;

function flagsFor(s: GameState): Flags {
  const out: Flags = {};
  for (const id of matchPointIds(s)) out[id] = { flag: 'MATCH POINT', mp: true };
  const r = s.reveal;
  if (s.phase === 'turnStart' && s.lastBuy) out[s.lastBuy.playerId] = { flag: '−3 tokens' };
  if ((s.phase === 'reveal' || s.phase === 'objection') && r && !r.pending) {
    if (r.correct) out[r.playerId] = { flag: '+1 kaart' };
    for (const st of r.steals) {
      if (st.outcome === 'won') out[st.playerId] = { flag: '+1 kaart' };
      else if (st.outcome === 'lost') out[st.playerId] = { flag: '−1 token' };
      else out[st.playerId] = { flag: 'token terug' };
    }
  }
  const o = s.objection;
  if (s.phase === 'objection' && o?.result && o.mode === 'earn') {
    if (o.result.awarded) out[o.playerId] = { flag: '+1 token' };
    if (o.result.maxed) out[o.playerId] = { flag: 'Max 5' };
  }
  return out;
}

function Topbar({ s }: { s: GameState }) {
  const pub = toPublic(s).players;
  const goal = s.settings.goal;
  const flags = flagsFor(s);
  const emo = latestReactions(s);
  return (
    <div className="topbar">
      {pub.map((p) => {
        const f = flags[p.id];
        return (
          <Chip
            key={p.id}
            p={p}
            all={pub}
            goal={goal}
            active={s.turn?.playerId === p.id && s.phase !== 'standings'}
            flag={f?.flag}
            mp={f?.mp}
            emo={emo[p.id] ?? null}
          />
        );
      })}
    </div>
  );
}

function latestReactions(s: GameState): Record<string, { emoji: string; id: string }> {
  const out: Record<string, { emoji: string; id: string }> = {};
  for (const r of s.reactions) out[r.playerId] = { emoji: r.emoji, id: r.id };
  return out;
}

/** Reacties van toeschouwers (geen bordje): zweven linksonder. */
function SpectatorReactions({ s }: { s: GameState }) {
  const list = s.reactions.filter((r) => s.spectators.some((x) => x.id === r.playerId));
  if (!list.length) return null;
  return (
    <div className="specreact">
      {list.map((r) => (
        <span key={r.id} className="emoin">
          {s.spectators.find((x) => x.id === r.playerId)?.name} {r.emoji}
        </span>
      ))}
    </div>
  );
}

function Bottombar({ ph, sub, frac, violet, room, lokaal }: { ph: string; sub: string; frac: number; violet?: boolean; room: Room; lokaal: boolean }) {
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

// ---------------- tijdlijn ----------------

function TvTimeline({
  cards,
  insertAt,
  mystery,
  mysteryKey,
  top,
  stealable,
  stealGaps,
  stealMarks,
  highlight,
  all,
  slide,
}: {
  cards: Card[];
  insertAt?: number | null;
  mystery?: (w: number) => ReactNode;
  /** Wisselt bij elke verschuiving: korte glij-animatie. */
  mysteryKey?: string | number;
  top?: number;
  /** Steelvenster: vrije gaten violet gestippeld (behalve de plek van de actieve speler). */
  stealable?: boolean;
  /** Geclaimde steelgaten: gat → speler. */
  stealGaps?: Record<number, PublicPlayer>;
  /** Na de onthulling: ✓/✕ bij elke steelfiche. */
  stealMarks?: Record<number, boolean>;
  /** songId van een kaart die oplicht (gekochte kaart). */
  highlight?: string;
  all?: PublicPlayer[];
  slide?: boolean;
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
      out.push(
        <div key={`m${mysteryKey ?? ''}`} className="mslot" data-fly-src="1">
          {mystery!(w)}
        </div>,
      );
    }
    const taken = stealGaps?.[g];
    const isSteal = Boolean((stealable && insertAt !== g) || taken);
    const mark = stealMarks?.[g];
    out.push(
      <div key={`g${g}`} className={`gap ${isSteal ? 'steal' : ''} ${taken ? 'taken' : ''}`} style={{ width: isSteal ? stealW : plainW }}>
        {taken && (
          <div className="tok">
            <Avatar p={taken} all={all} style={stealW < 80 ? { width: 40, height: 40, fontSize: 20 } : undefined} />
            <span style={stealW < 80 ? { fontSize: 18, padding: '1px 5px' } : undefined}>{taken.name}</span>
            {mark !== undefined && <em className={`tokmark ${mark ? 'ok' : 'no'}`}>{mark ? '✓' : '✕'}</em>}
          </div>
        )}
      </div>,
    );
    if (g < cards.length) out.push(<TvCard key={cards[g].songId} c={cards[g]} w={w} cls={highlight === cards[g].songId ? 'good' : ''} />);
  }
  return (
    <div className={`tl ${slide ? 'slidein' : ''}`} style={top !== undefined ? { top } : undefined} data-testid="tv-timeline">
      {out}
    </div>
  );
}

function Ringer({ s, total, violet }: { s: GameState; total: number; violet?: boolean }) {
  const left = secsLeft(s);
  // Laatste 3 s: zachte tik per seconde, cijfer pulseert (CONCEPT 4.2).
  useEffect(() => {
    if (left !== null && left > 0 && left <= 3 && !s.paused) playSound('tick');
  }, [left, s.paused]);
  if (left === null) return null;
  const red = !violet && left <= 10;
  return (
    <div className="ring">
      <Ring sec={(s.deadline! - Date.now()) / 1000} total={total / 1000} color={violet ? 'var(--violet)' : red ? 'var(--rood)' : 'var(--amber)'} />
      <div className={`t num ${red ? 'red' : ''} ${left <= 3 ? 'pulse' : ''}`} key={left <= 3 ? left : 'x'}>
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

function rangeShort(years: number[], slot: number) {
  const [l, r] = gapNeighbours(years, slot);
  if (l === null && r === null) return 'ergens';
  if (l === null) return `vóór ${r}`;
  if (r === null) return `na ${l}`;
  return `${l}–${r}`;
}

function hoorde(between: [number | null, number | null]) {
  const [l, r] = between;
  if (l === null && r === null) return '';
  if (l === null) return `hoorde vóór ${r}`;
  if (r === null) return `hoorde na ${l}`;
  if (l === r) return `hoorde naast ${l}`;
  return `hoorde tussen ${l} en ${r}`;
}

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

const guessers = (s: GameState) => Object.keys(s.turn?.guesses ?? {}).length;

// ---------------- schermen ----------------

function Lobby({ s, room, lokaal }: { s: GameState; room: Room; lokaal: boolean }) {
  const pub = toPublic(s).players;
  const n = pub.length;
  const lv = s.settings.level;
  const est = formatMinutes(estimateMinutes(Math.max(n, 2), s.settings.goal, s.settings.placeSeconds, lv));
  const emo = latestReactions(s);
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
          <div className="s">
            {s.settings.teams ? 'van max 10 teams (2–3 pers.) · 1 telefoon per team' : 'van max 10 spelers · in speelvolgorde'}
          </div>
        </div>
        <div className="seats" style={{ marginTop: 50 }}>
          {Array.from({ length: 10 }, (_, i) => {
            const p = pub[i];
            return (
              <div key={p?.id ?? `leeg${i}`} className={`seat ${p ? 'f' : ''}`} style={p && !p.online ? { opacity: 0.5 } : undefined}>
                <span style={{ position: 'absolute', top: -14, left: 12, fontSize: 20, background: 'var(--nacht)', padding: '0 6px', color: 'var(--gedempt)' }}>
                  {i + 1}
                </span>
                {p && emo[p.id] && (
                  <span key={emo[p.id].id} className="seatemo">
                    {emo[p.id].emoji}
                  </span>
                )}
                {p ? (
                  <>
                    <Avatar p={p} all={pub} />
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      {s.settings.teams && p.members?.length ? (
                        <div className="seatmem">{p.members.join(' · ')}</div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize: 24 }}>vrij</span>
                )}
              </div>
            );
          })}
        </div>
        {n >= 8 && s.settings.goal > 8 && (
          <div className="advice" data-testid="advies">
            Advies bij {n} {s.settings.teams ? 'teams' : 'spelers'}: doel 8 ({formatMinutes(estimateMinutes(n, 8, s.settings.placeSeconds, lv))})
          </div>
        )}
        <div className="settings">
          <div className="pill">
            {LEVEL_NAMES[lv]}
            {lv !== 'original' && <span className="pillsub"> · {LEVEL_TOKENS[lv]} tokens</span>}
          </div>
          <div className="pill">Doel: {s.settings.goal} kaarten</div>
          <div className="pill">Plaatsen: {s.settings.placeSeconds ? `${s.settings.placeSeconds} s` : 'geen timer'}</div>
          {s.settings.teams && <div className="pill hi">👥 Teams (2–3)</div>}
          {s.settings.drinking && <div className="pill hi">🍺 Drankspel aan</div>}
          <div className="pill est" data-testid="speelduur">
            Geschatte speelduur {est}
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 36, fontSize: 30, color: 'var(--gedempt)', fontWeight: 600 }}>
          {n < 2
            ? `Wachten op minstens 2 ${s.settings.teams ? 'teams' : 'spelers'}…`
            : `${pub.find((p) => p.id === s.hostId)?.name ?? 'De host'} start het spel op de telefoon`}
          {!s.settings.reactions && ' · reacties staan uit'}
        </div>
      </div>
    </div>
  );
}

function Explain({ s, room, lokaal, onDone }: { s: GameState; room: Room; lokaal: boolean; onDone: () => void }) {
  const goal = s.settings.goal;
  const lv = s.settings.level;
  const drinking = s.settings.drinking;
  const teams = s.settings.teams;
  const others = s.players.filter((p) => p.id !== s.hostId);
  const ready = s.explainReady.filter((id) => others.some((p) => p.id === id)).length;
  const host = nm(s, s.hostId);
  const keep = lv === 'pro' ? ' + titel + artiest' : lv === 'expert' ? ' + titel + artiest + exact jaar' : '';
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setStep((cur) => (cur + 1) % 4), 4500);
    return () => clearInterval(id);
  }, []);
  const compact = drinking || teams;
  return (
    <>
      <div style={{ position: 'absolute', top: 48, left: 0, right: 0, textAlign: 'center' }}>
        <div className="logo" style={{ justifyContent: 'center' }}>
          <Logo />
          Zo werkt het
        </div>
        <div style={{ fontSize: 30, color: 'var(--gedempt)', marginTop: 12, fontWeight: 600 }}>
          4 stappen · {host?.name ?? 'de host'} tikt “Begrepen” als iedereen klaar is
          {others.length > 0 && (
            <>
              {' '}
              · klaar: <b className="num" style={{ color: 'var(--creme)' }}>{ready}</b> van {others.length}
            </>
          )}
        </div>
      </div>
      <div className={`uitleg ${compact ? 'compact' : ''}`} data-testid="uitleg">
        <div className={`ublok ${step === 0 ? 'on' : ''}`} onClick={() => setStep(0)}>
          <div className="utop">
            <div className="nr">1</div>
            <h4>Luister</h4>
          </div>
          <div className="visbox vis-listen" aria-hidden="true">
            <div className="vinyl">
              <i />
            </div>
            <div className="vnotes">
              <span>♪</span>
              <span>♫</span>
            </div>
            <div className="vmys">
              <div className="eq">
                <i />
                <i />
                <i />
              </div>
              <b>?</b>
            </div>
          </div>
          <p>De tv speelt een hit. Niemand ziet jaar of titel.</p>
        </div>

        <div className={`ublok ${step === 1 ? 'on' : ''}`} onClick={() => setStep(1)}>
          <div className="utop">
            <div className="nr">2</div>
            <h4>Leg ’m neer</h4>
          </div>
          <div className="visbox vis-place" aria-hidden="true">
            <div className="vcard">&apos;78</div>
            <div className="vslot">
              <div className="vdrop">
                <span className="vq">?</span>
                <span className="vy">&apos;87 ✓</span>
              </div>
            </div>
            <div className="vcard">&apos;95</div>
            <div className="vcard">&apos;12</div>
          </div>
          <p>
            Kies op {teams ? 'jullie' : 'je'} telefoon waar hij hoort{lv === 'expert' ? ' + exact jaar' : ''} → Vastzetten.
          </p>
        </div>

        <div className={`ublok ${step === 2 ? 'on' : ''}`} onClick={() => setStep(2)}>
          <div className="utop">
            <div className="nr">3</div>
            <h4>Steel!</h4>
          </div>
          <div className="visbox vis-steal" aria-hidden="true">
            <div className="vcard">&apos;82</div>
            <div className="vstealgap">
              <span className="vchip">🦊</span>
              <span className="vminus">−1 🪙</span>
            </div>
            <div className="vcard">&apos;04</div>
          </div>
          <p>Zit een ander fout? 10 s om met 1 token de goede plek te stelen!</p>
        </div>

        <div className={`ublok ${step === 3 ? 'on' : ''}`} onClick={() => setStep(3)}>
          <div className="utop">
            <div className="nr">4</div>
            <h4>{goal} wint</h4>
          </div>
          <div className="visbox vis-win" aria-hidden="true">
            <div className="vcrown">👑</div>
            <div className="vpips">
              {Array.from({ length: Math.min(goal, 8) }, (_, i) => (
                <i key={i} style={{ animationDelay: `${i * 0.14}s` }} />
              ))}
            </div>
            <div className="vcoinrow">
              <span className="coin" style={{ display: 'inline-block', width: 32, height: 32 }} />
              <b>{lv === 'original' ? 'Titel + artiest = +1' : 'Titel + artiest verplicht'}</b>
            </div>
          </div>
          <p>
            Eerste {teams ? 'team ' : ''}met {goal} kaarten op volgorde wint.{lv === 'original' ? '' : ` Kaart houden = plek${keep}.`}
          </p>
        </div>
      </div>

      {compact && (
        <div className="udrink" data-testid="uitleg-drank">
          {teams && (
            <div className="udbadge team">
              <span>👥</span>
              <b>Teams (2–3 pers.)</b>
              <small>1 telefoon per team · heel het team drinkt mee</small>
            </div>
          )}
          {drinking && (
            <div className="udrules">
              <div className="udr">
                <b>✕ Mis</b>
                <span>2 🍺</span>
              </div>
              <div className="udr">
                <b>🦊 Gestolen</b>
                <span>3 🍺 + 2 uitdelen</span>
              </div>
              <div className="udr">
                <b>⚡ Foute steal</b>
                <span>2 🍺</span>
              </div>
              <div className="udr">
                <b>⭐ Perfect</b>
                <span>2 🍺 uitdelen</span>
              </div>
              <div className="udr">
                <b>🏁 Laatste / Niemand goed</b>
                <span>1 🍺</span>
              </div>
              <div className="udr bak">
                <b>💀 Verliezer</b>
                <span>BAK TREKKEN!</span>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        className="btn-tv sec tvclick"
        style={{ position: 'absolute', right: 90, top: compact ? 872 : 800 }}
        onClick={onDone}
        data-testid="tv-begrepen"
      >
        Begrepen (tv)
      </button>
      <Bottombar
        ph="Uitleg"
        sub={drinking ? 'Shazam = bak trekken 🍺' : 'Shazam = je bent af'}
        frac={(step + 1) / 4}
        room={room}
        lokaal={lokaal}
      />
    </>
  );
}

function Deal({ s, room, lokaal }: { s: GameState; room: Room; lokaal: boolean }) {
  const starter = s.players.find((p) => p.id === s.dealInfo?.playerId);
  const w = s.players.length > 6 ? 150 : 180;
  return (
    <>
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
      <Bottombar ph="Startkaarten" sub="iedereen krijgt 1 open kaart" frac={fracLeft(s, 6000 * tempo(s))} room={room} lokaal={lokaal} />
    </>
  );
}

function TurnStart({ s, room, lokaal }: { s: GameState; room: Room; lokaal: boolean }) {
  const p = s.players.find((x) => x.id === s.turn?.playerId)!;
  const left = secsLeft(s);
  const buy = s.lastBuy && s.lastBuy.playerId === p.id ? s.lastBuy : null;
  if (s.turn?.waiting) {
    // Actieve speler offline (CONCEPT 2.9 / mockup "afwezig").
    const zij = p.name;
    return (
      <>
        <div className="phase" style={{ top: 300 }} data-testid="wachten-op">
          <div className="big" style={{ color: p.color, fontSize: 84 }}>
            {zij} is even offline
          </div>
        </div>
        <TvTimeline cards={p.cards} />
        <div className="waitstrip">
          Wachten op {zij}… <span className="num" style={{ color: 'var(--amber)' }}>{left}</span> · daarna slaan we de beurt over
        </div>
        <Bottombar ph="Beurtstart" sub="speler offline" frac={fracLeft(s, 20_000 * tempo(s))} room={room} lokaal={lokaal} />
      </>
    );
  }
  if (buy) {
    return (
      <>
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
        <Bottombar ph="Kaart gekocht" sub="beurt gaat gewoon door" frac={fracLeft(s, 6000 * tempo(s))} room={room} lokaal={lokaal} />
      </>
    );
  }
  const mp = p.cards.length === s.settings.goal - 1;
  return (
    <>
      <div className="phase">
        <div className="big" style={{ color: p.color, fontSize: 110 }}>
          {p.name}
        </div>
        <div className="sub" style={{ fontSize: 44, color: 'var(--creme)' }}>
          is aan de beurt{mp && <span style={{ color: 'var(--rood)' }}> · match point!</span>}
        </div>
      </div>
      <TvTimeline cards={p.cards} slide />
      <DrinkBar s={s} top={805} />
      <div className="banner" style={s.settings.drinking && s.drinks?.length ? { top: 896 } : undefined}>
        Muziek start over <b className="num">{left}</b> ·{' '}
        {p.tokens >= 3 ? (
          <>
            {p.name} kan eerst een kaart <b>kopen</b> (3 tokens)
          </>
        ) : (
          `${p.name} kan ook zelf starten op de telefoon`
        )}
      </div>
      <Bottombar ph="Beurtstart" sub={p.tokens >= 3 ? 'kopen kan alleen nu' : `ronde ${s.round}`} frac={fracLeft(s, 6000 * tempo(s))} room={room} lokaal={lokaal} />
    </>
  );
}

function Placing({ s, room, lokaal }: { s: GameState; room: Room; lokaal: boolean }) {
  const p = s.players.find((x) => x.id === s.turn?.playerId)!;
  const t = s.turn!;
  const slot = t.slot ?? null;
  const total = s.settings.placeSeconds * 1000 * tempo(s);
  const years = p.cards.map((c) => c.year);
  const sub = s.paused ? 'gepauzeerd' : `nummer ${s.songsPlayed + 1} van ${toPublic(s).deckSize}`;
  const lv = s.settings.level;
  const extras: string[] = [];
  const g = guessers(s);
  if (lv === 'expert') extras.push(t.yearGuess !== null ? 'jaar gekozen ✓' : 'kiest ook een jaar');
  if (t.claim) extras.push(lv === 'original' ? 'titel + artiest geclaimd 🎤' : 'titel + artiest hardop 🎤');
  return (
    <>
      <div className="phase">
        <div className="big">Luister…</div>
        <div className="sub">
          {slot === null ? `${p.name} kiest een plek in de tijdlijn` : `${p.name} schuift de kaart live heen en weer`}
          {slot === null && ` · meegokkers: ${g}`}
        </div>
      </div>
      <Ringer s={s} total={total} />
      {slot === null ? (
        <>
          <div style={{ position: 'absolute', left: '50%', top: 366, transform: 'translateX(-50%) scale(.74)', transformOrigin: '50% 0' }}>
            <MysteryCard />
          </div>
          <TvTimeline cards={p.cards} top={560} />
          {extras.length > 0 && (
            <div className="banner" style={{ top: 960, fontSize: 26 }}>
              {extras.join(' · ')}
            </div>
          )}
        </>
      ) : (
        <>
          <TvTimeline
            cards={p.cards}
            insertAt={slot}
            mysteryKey={slot}
            mystery={(w) => (
              <MysteryCard w={w} cls="lift">
                <div className="arrow">{p.name} legt hier</div>
              </MysteryCard>
            )}
          />
          <div className="banner">
            {range(years, slot)}? · Meegokkers: <b>{g}</b>
            {extras.length ? ` · ${extras.join(' · ')}` : ''}
          </div>
        </>
      )}
      <Bottombar ph="Luisteren & plaatsen" sub={sub} frac={total ? fracLeft(s, total) : 1} room={room} lokaal={lokaal} />
    </>
  );
}

function Stealing({ s, room, lokaal }: { s: GameState; room: Room; lokaal: boolean }) {
  const t = s.turn!;
  const p = nm(s, t.playerId)!;
  const years = p.cards.map((c) => c.year);
  const pub = toPublic(s).players;
  const lv = s.settings.level;
  const parts = [
    ...t.steals.map((st) => (
      <span key={st.playerId}>
        <b>{nm(s, st.playerId)?.name}</b> ({rangeShort(years, st.slot)}
        {st.slot === t.slot ? ', zelfde plek' : ''})
      </span>
    )),
    ...t.passed.map((id) => <span key={id}>{nm(s, id)?.name} past</span>),
  ];
  // In het steelvenster knippert alleen de violette rand, niet ook de raadselkaart.
  const sameSlot = t.slot !== null ? t.steals.find((x) => x.slot === t.slot) : undefined;
  const sameP = sameSlot ? pub.find((x) => x.id === sameSlot.playerId) : undefined;
  const stamp = (w: number) => (
    <MysteryCard w={w} still>
      <div className="stamp" style={w < 180 ? { top: 70, fontSize: 22 } : undefined}>
        VASTGEZET
      </div>
      {sameP && (
        <div className="sametok">
          <Avatar p={sameP} all={pub} style={{ width: 40, height: 40, fontSize: 20 }} />
          <span>{sameP.name} ook</span>
        </div>
      )}
    </MysteryCard>
  );
  const mp = p.cards.length === s.settings.goal - 1;
  return (
    <>
      <div className="glow-v" />
      <div className="phase">
        <div className="big" style={{ color: '#b9a8ff', fontSize: 96 }}>
          Wie steelt?
        </div>
        <div className="sub">
          {t.slot === null
            ? `${p.name} koos geen plek: elke plek is te stelen`
            : mp
              ? `${p.name} zette vast ${rangeShort(years, t.slot)} · nog één goede kaart en ${p.name} wint`
              : `Denk je dat ${p.name} fout zit? Kies de goede plek`}
          {' · 1 token'}
          {lv !== 'original' && ' · ook zijn plek mag'}
        </div>
      </div>
      <Ringer s={s} total={10_000 * tempo(s)} violet />
      {t.slot === null ? (
        <>
          <div style={{ position: 'absolute', left: '50%', top: 366, transform: 'translateX(-50%) scale(.74)', transformOrigin: '50% 0' }}>{stamp(200)}</div>
          <TvTimeline cards={p.cards} top={560} stealable stealGaps={stealMap(s, t.steals)} all={pub} />
        </>
      ) : (
        <TvTimeline
          cards={p.cards}
          insertAt={t.slot}
          mystery={stamp}
          stealable={lv === 'original'}
          stealGaps={stealMap(s, t.steals.filter((x) => x.slot !== t.slot))}
          all={pub}
        />
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
      <Bottombar ph="Steelvenster" sub="wie het eerst tikt, heeft de plek" frac={fracLeft(s, 10_000 * tempo(s))} violet room={room} lokaal={lokaal} />
    </>
  );
}

/** Kaart vliegt in een boog naar het bordje van de steler (800 ms, CONCEPT 4.2). */
function FlyToChip({ card, to, delay }: { card: Card; to: string; delay: number }) {
  const [pos, setPos] = useState<{ x: number; y: number; dx: number; dy: number; w: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const t = window.setTimeout(() => {
      const tv = ref.current?.closest('.tv') as HTMLElement | null;
      const src = tv?.querySelector('[data-fly-src] .flipwrap') as HTMLElement | null;
      const chip = tv?.querySelector(`[data-chip="${to}"]`) as HTMLElement | null;
      if (!tv || !src || !chip) return;
      const k = tv.getBoundingClientRect().width / 1920;
      const tr = tv.getBoundingClientRect();
      const a = src.getBoundingClientRect();
      const b = chip.getBoundingClientRect();
      const x = (a.left - tr.left) / k;
      const y = (a.top - tr.top) / k;
      const w = a.width / k;
      const dx = (b.left - tr.left) / k + b.width / k / 2 - (x + w / 2);
      const dy = (b.top - tr.top) / k + b.height / k / 2 - (y + (w * 1.33) / 2);
      setPos({ x, y, dx, dy, w });
    }, delay);
    return () => clearTimeout(t);
  }, [to, delay]);
  return (
    <div ref={ref} className="flylayer" aria-hidden="true">
      {pos && (
        <div className="flyx" style={{ left: pos.x, top: pos.y, ['--dx' as string]: `${pos.dx}px` }}>
          <div className="flyy" style={{ ['--dy' as string]: `${pos.dy}px` }}>
            <TvCard c={card} w={pos.w} cls="good" />
          </div>
        </div>
      )}
    </div>
  );
}

function Reveal({ s, room, lokaal }: { s: GameState; room: Room; lokaal: boolean }) {
  const r = s.reveal!;
  const p = nm(s, r.playerId)!;
  const song = r.song;
  const card: Card = { songId: song.id, year: song.year, title: song.title, artist: song.artist };
  const thief = r.stolenBy ? nm(s, r.stolenBy) : null;
  const cand = r.pending && r.candidate ? nm(s, r.candidate) : null;
  const pub = toPublic(s).players;
  // Tijdlijn zonder de zojuist gewonnen kaart; de flipkaart staat op de gekozen plek.
  const base = r.correct ? p.cards.filter((c) => c.songId !== song.id) : p.cards;
  const losers = r.steals.filter((x) => x.outcome === 'lost').map((x) => nm(s, x.playerId)?.name ?? '');
  const refunds = r.steals.filter((x) => x.outcome === 'refund').map((x) => nm(s, x.playerId)?.name ?? '');
  const g = r.guesses;
  const gOk = g.filter((x) => x.correct).length;
  const bannerParts: string[] = [];
  if (r.pending) bannerParts.push('Titel + artiest beslist zo wie de kaart krijgt');
  else if (thief) bannerParts.push(`De kaart vliegt naar ${thief.name}`);
  else if (r.correct) bannerParts.push(`${p.name} heeft nu ${r.cardsAfter} kaarten`);
  else bannerParts.push(r.steals.length ? 'Niemand stal goed · de kaart gaat weg' : 'De kaart gaat weg');
  if (g.length) bannerParts.push(`Meegokkers goed: ${gOk} van ${g.length}`);
  if (!r.pending && losers.length) bannerParts.push(`${names(losers)} ${losers.length > 1 ? 'verliezen hun token' : 'verliest een token'}`);
  if (!r.pending && refunds.length) bannerParts.push(`${names(refunds)} krijgt de token terug`);
  const marks: Record<number, boolean> = {};
  for (const st of r.steals) marks[st.slot] = st.correct;
  const yearLine =
    r.level === 'expert' && r.yearGuess !== null ? ` · ${p.name} koos ${r.yearGuess}${r.yearCorrect ? ' ✓' : ' ✕'}` : '';
  let head: ReactNode;
  if (r.pending && r.placeCorrect && (r.yearCorrect ?? true)) {
    head = (
      <>
        <div className="result pop" style={{ color: 'var(--mint)' }}>
          GOED GELEGD!
        </div>
        <div className="sub reveal-sub">
          Dit nummer is uit <b style={{ color: 'var(--creme)' }}>{song.year}</b>
          {yearLine} · nu nog titel + artiest
        </div>
      </>
    );
  } else if (r.correct) {
    head = (
      <>
        <div className="result pop" style={{ color: 'var(--mint)' }}>
          GOED!
        </div>
        <div className="sub reveal-sub">
          {p.name} houdt de kaart · {r.cardsAfter} van {s.settings.goal}
          {r.flipped ? ' · omgedraaid door de host' : ''}
        </div>
      </>
    );
  } else if (thief) {
    head = (
      <>
        <div className="result pop" style={{ color: thief.color, fontSize: 96 }}>
          GESTOLEN DOOR {thief.name.toUpperCase()}!
        </div>
        <div className="sub reveal-sub">
          {p.name} zat mis: dit nummer is uit <b style={{ color: 'var(--creme)' }}>{song.year}</b> en {hoorde(r.between)}
        </div>
      </>
    );
  } else {
    const yearMiss = r.level === 'expert' && r.placeCorrect && r.yearCorrect === false;
    head = (
      <>
        <div className="result pop" style={{ color: 'var(--rood)' }}>
          {yearMiss ? 'JAAR MIS!' : 'MIS!'}
        </div>
        <div className="sub reveal-sub">
          {r.slot === null ? `${p.name} koos geen plek · ` : ''}
          {yearMiss ? (
            <>
              Plek goed, maar {p.name} koos {r.yearGuess}: het was <b style={{ color: 'var(--creme)' }}>{song.year}</b>
            </>
          ) : (
            <>
              Dit nummer is uit <b style={{ color: 'var(--creme)' }}>{song.year}</b> en {hoorde(r.between)}
            </>
          )}
          {cand ? ` · ${cand.name} stal op een goede plek` : !r.pending && r.steals.length ? ' · niemand stal goed' : ''}
          {r.flipped ? ' · omgedraaid door de host' : ''}
        </div>
      </>
    );
  }
  const flipCls = r.pending ? (r.placeCorrect ? 'good' : 'bad') : r.correct || thief ? 'good' : 'bad';
  return (
    <>
      <div className="phase">{head}</div>
      {r.slot === null ? (
        <>
          <div style={{ position: 'absolute', left: '50%', top: 340, transform: 'translateX(-50%) scale(.85)', transformOrigin: '50% 0' }} data-fly-src="1">
            <FlipCard c={card} cls={thief ? 'good flown' : flipCls} />
          </div>
          <TvTimeline cards={base} top={570} stealGaps={stealMap(s, r.steals)} stealMarks={marks} all={pub} />
        </>
      ) : (
        <TvTimeline
          cards={base}
          insertAt={r.slot}
          mystery={(w) => <FlipCard c={card} w={w} cls={thief ? 'bad flown' : flipCls} drop={!r.correct && !thief && !r.pending} />}
          stealGaps={stealMap(s, r.steals.filter((x) => x.slot !== r.slot))}
          stealMarks={marks}
          all={pub}
        />
      )}
      {thief && <FlyToChip card={card} to={thief.id} delay={2100} />}
      <DrinkBar s={s} delayed top={828} />
      <div className="banner reveal-sub" style={s.settings.drinking && s.drinks?.length ? { top: 904, fontSize: 24 } : undefined}>
        {bannerParts.join(' · ')}
      </div>
      <Bottombar ph="Onthulling" sub={`${song.artist} — ${song.title}`} frac={1} room={room} lokaal={lokaal} />
    </>
  );
}

function ObjectionScreen({ s, room, lokaal }: { s: GameState; room: Room; lokaal: boolean }) {
  const o = s.objection!;
  const r = s.reveal!;
  const p = nm(s, o.playerId)!;
  const ex = o.extra ? nm(s, o.extra.playerId) : null;
  const fout = Object.values(o.votes).filter((v) => v === 'fout').length;
  const card: Card = { songId: r.song.id, year: r.song.year, title: r.song.title, artist: r.song.artist };
  const res = o.result;
  const keep = o.mode === 'keep';
  const who = ex ? `${p.name} en ${ex.name}` : p.name;
  let resultText: ReactNode = null;
  if (res) {
    if (!keep) {
      resultText = (
        <>
          {res.ok ? 'Goedgekeurd!' : 'Afgekeurd'}
          <br />
          <span className="restext">{res.ok ? (res.awarded ? `+1 token voor ${p.name}` : `${p.name} zit al op Max 5`) : `${fout} bezwaren · geen token`}</span>
        </>
      );
    } else {
      const winner = r.correct ? nm(s, r.playerId) : r.stolenBy ? nm(s, r.stolenBy) : null;
      resultText = (
        <>
          {winner ? 'Goedgekeurd!' : 'Afgekeurd'}
          <br />
          <span className="restext">
            {winner ? (r.stolenBy ? `${winner.name} krijgt de kaart · token terug` : `${winner.name} houdt de kaart`) : 'De kaart gaat weg'}
          </span>
        </>
      );
    }
  }
  const okColor = res ? (keep ? r.correct || r.stolenBy : res.ok) : false;
  const rowView = (label: string, row: { votes: Record<string, string>; eligible: string[]; needed: number }) => {
    const f = Object.values(row.votes).filter((v) => v === 'fout').length;
    return (
      <div>
        {label}Bezwaren: <span className="num" style={{ color: 'var(--rood)' }}>{f}</span> van {row.eligible.length}
        <br />
        <span className="restext small">
          {row.needed} {row.needed === 1 ? 'bezwaar' : 'bezwaren'} nodig om het af te keuren
        </span>
      </div>
    );
  };
  return (
    <>
      <div className="phase">
        <div className="big" style={{ fontSize: 72 }}>
          Had {who} titel + artiest goed?
        </div>
        <div className="sub">
          Het was: “{r.song.title} — {r.song.artist}”
        </div>
      </div>
      <div style={{ position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 60, alignItems: 'center' }}>
        <TvCard c={card} cls={res ? (okColor ? 'good' : 'bad') : r.placeCorrect ? 'good' : ''} />
        {res ? (
          <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.3, color: okColor ? 'var(--mint)' : 'var(--rood)' }}>{resultText}</div>
        ) : (
          <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {rowView(ex ? `${p.name} · ` : '', o)}
            {o.extra && ex && rowView(`${ex.name} · `, o.extra)}
            <span className="restext small">
              {keep ? (
                <>
                  Geen bezwaar = <b style={{ color: 'var(--amber)' }}>{ex ? `${p.name} houdt de kaart` : `de kaart voor ${p.name}`}</b>
                </>
              ) : (
                <>
                  Geen bezwaar = <b style={{ color: 'var(--amber)' }}>+1 token</b> voor {p.name}
                </>
              )}
            </span>
          </div>
        )}
      </div>
      {res && <DrinkBar s={s} top={800} />}
      <Bottombar ph="Bezwaar?" sub={res ? 'uitslag' : 'alleen tikken als het fout was · 6 s'} frac={res ? 1 : fracLeft(s, 6000 * tempo(s))} room={room} lokaal={lokaal} />
    </>
  );
}

function Standings({ s, room, lokaal, paused }: { s: GameState; room: Room; lokaal: boolean; paused?: boolean }) {
  const pub = toPublic(s).players;
  const rows = [...pub].sort((a, b) => b.cards.length - a.cards.length || b.tokens - a.tokens);
  const next = s.players[s.turnIndex];
  const mp = pub.filter((p) => p.cards.length === s.settings.goal - 1);
  const emo = latestReactions(s);
  return (
    <>
      <div className="phase" style={{ top: 70 }}>
        <div className="big" style={{ fontSize: 80 }}>
          {paused ? 'Pauze ☕' : 'Tussenstand'}
        </div>
        <div className="sub">
          {paused ? `ronde ${s.round}` : `na ronde ${s.round - 1}`} · doel {s.settings.goal} kaarten
          {mp.length > 0 && (
            <span style={{ color: 'var(--rood)' }}>
              {' '}
              · {mp.map((p) => p.name).join(' en ')} {mp.length > 1 ? 'staan' : 'staat'} op match point
            </span>
          )}
        </div>
      </div>
      <div className="grid10">
        {rows.map((p, i) => (
          <StandRow key={p.id} p={p} pos={i + 1} lead={i === 0} all={pub} goal={s.settings.goal} emo={emo[p.id]} />
        ))}
      </div>
      {!paused && <DrinkBar s={s} top={840} />}
      <Bottombar
        ph={paused ? 'Pauze' : 'Tussenstand'}
        sub={paused ? 'de host gaat verder via het hostmenu' : `volgende beurt: ${next?.name} · 6 s`}
        frac={paused ? 1 : fracLeft(s, 6000 * tempo(s))}
        room={room}
        lokaal={lokaal}
      />
    </>
  );
}

function StandRow({ p, pos, lead, all, goal, emo }: { p: PublicPlayer; pos: number; lead: boolean; all: PublicPlayer[]; goal: number; emo?: { emoji: string; id: string } }) {
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
      {emo && (
        <span key={emo.id} className="rowemo">
          {emo.emoji}
        </span>
      )}
    </div>
  );
}

function Confetti({ s }: { s: GameState }) {
  const palette = s.players.length ? s.players.map((p) => p.color) : ['#FFD23F', '#FF4F8B', '#4D7CFF'];
  return (
    <div className="confetti">
      {Array.from({ length: 70 }, (_, i) => (
        <i
          key={i}
          style={{
            left: (i * 137) % 1920,
            background: palette[i % palette.length],
            animationDuration: `${2.2 + (i % 7) * 0.25}s`,
            animationDelay: `${(i % 11) * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

function Winner({ s }: { s: GameState }) {
  const pub = toPublic(s);
  const w = s.players.find((p) => p.id === s.winnerId) as Player;
  const n = w.cards.length;
  const cw = n > 10 ? 130 : 150;
  const baks = s.settings.drinking
    ? (s.drinks ?? []).filter((d) => d.kind === 'bak').map((d) => nm(s, d.playerId)).filter(Boolean) as Player[]
    : [];
  const teams = s.settings.teams;
  return (
    <>
      <Confetti s={s} />
      <div className="wtitle" style={baks.length ? { top: 150 } : undefined}>
        <div className="crown">👑</div>
        <div className="who namein">{w.name} wint!</div>
        <div className="s">
          {plural(n, 'kaart', 'kaarten')} · {w.tokens} {w.tokens === 1 ? 'token' : 'tokens'} over
          {w.stats.steals ? ` · ${w.stats.steals} keer gestolen` : ''}
        </div>
      </div>
      {baks.length > 0 && (
        <div className="bakbanner" data-testid="tv-bak">
          <span>🍺 BAK TREKKEN!</span>
          <b>
            {baks.map((b) => teamLabel(b, teams)).join(' & ')} —{' '}
            {teams ? 'heel het team at zijn glas!' : baks.length > 1 ? 'allebei een glas atten!' : 'glas atten!'}
          </b>
        </div>
      )}
      <div className="wtl" style={{ gap: n > 10 ? 8 : 14, ...(baks.length ? { top: 675 } : {}) }}>
        {w.cards.map((c) => (
          <TvCard key={c.songId} c={c} w={cw} />
        ))}
      </div>
      <AwardRow s={s} awards={pub.awards} />
    </>
  );
}

function AwardRow({ s, awards }: { s: GameState; awards: ReturnType<typeof computeAwards> }) {
  const who = (id: string) => s.players.find((p) => p.id === id)?.name ?? s.spectators.find((x) => x.id === id)?.name ?? '?';
  return (
    <div className="awards" data-testid="prijzen">
      {awards.map((a) => (
        <div key={a.title} className="award">
          {a.icon} {a.title}
          <b>
            {who(a.playerId)} · {a.detail.replace(' goed meegegokt', '')}
          </b>
        </div>
      ))}
      <div className="award" style={{ background: 'var(--inkt)', color: 'var(--amber)' }}>
        Host: <b>Nog een potje?</b>
      </div>
    </div>
  );
}

/** Eindoverzicht (blijft staan): ranglijst + 4 prijzen + overgeslagen nummers (CONCEPT 3.6). */
function Overview({ s }: { s: GameState }) {
  const pub = toPublic(s);
  const rows = [...pub.players].sort((a, b) => b.cards.length - a.cards.length || b.tokens - a.tokens);
  const drinking = s.settings.drinking;
  const teams = s.settings.teams;
  const thirstyTitle = teams ? 'Dorstigste team' : 'Dorstigste speler';
  const all = drinking ? ['Beste oor', 'Meesterdief', 'Tijdreiziger', 'Bijna!', thirstyTitle] : ['Beste oor', 'Meesterdief', 'Tijdreiziger', 'Bijna!'];
  const icons: Record<string, string> = { 'Beste oor': '👂', Meesterdief: '🦊', Tijdreiziger: '⏳', 'Bijna!': '😬', [thirstyTitle]: '🍺' };
  const bakIds = new Set(drinking ? (s.drinks ?? []).filter((d) => d.kind === 'bak').map((d) => d.playerId) : []);
  const who = (id: string) => s.players.find((p) => p.id === id)?.name ?? s.spectators.find((x) => x.id === id)?.name ?? '?';
  return (
    <div className="overview" data-testid="eindoverzicht">
      <div className="ovhead">
        <div className="logo" style={{ justifyContent: 'center', fontSize: 44 }}>
          <Logo size={90} />
          Eindoverzicht
        </div>
        <div className="sub">
          {nm(s, s.winnerId)?.name} won met {plural(nm(s, s.winnerId)?.cards.length ?? 0, 'kaart', 'kaarten')} ·{' '}
          {plural(s.songsPlayed, 'nummer', 'nummers')} gespeeld
        </div>
      </div>
      <div className="ovgrid">
        <div className="ranks">
          {rows.map((p, i) => (
            <div key={p.id} className={`rk ${i === 0 ? 'lead' : ''} ${bakIds.has(p.id) ? 'bakrow' : ''}`}>
              <div className="pos num">{i + 1}</div>
              <Avatar p={p} all={pub.players} />
              <b>
                {p.name}
                {teams && p.members?.length ? <small className="rkmem"> ({p.members.join(', ')})</small> : null}
              </b>
              {bakIds.has(p.id) && <span className="baktag">🍺 BAK!</span>}
              {drinking && !bakIds.has(p.id) && p.sips !== undefined && <span className="siptag num">🍺 {p.sips}</span>}
              <span className="num">
                {p.cards.length}/{s.settings.goal}
              </span>
              <span className="num tk">
                <i className="coin" style={{ display: 'inline-block', width: 20, height: 20, verticalAlign: -3 }} /> {p.tokens}
              </span>
            </div>
          ))}
        </div>
        <div className="prizes">
          {all.map((title) => {
            const a = pub.awards.find((x) => x.title === title);
            return (
              <div key={title} className={`prize ${a ? '' : 'none'}`}>
                <div className="pi">{icons[title]}</div>
                <div>
                  <div className="pt">{title}</div>
                  <div className="pw">{a ? `${who(a.playerId)} · ${a.detail}` : 'niemand deze keer'}</div>
                </div>
              </div>
            );
          })}
          {pub.skipped.length > 0 && (
            <div className="skipped">
              <b>Overgeslagen:</b> {pub.skipped.map((c) => `${c.title} (${c.year})`).join(' · ')}
            </div>
          )}
          <div className="ovhost">
            Host: <b>Nog een potje</b> of <b>Terug naar lobby</b> op de telefoon
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- overlays ----------------

function SpotifyIssue({ issue, onRetry, onApp }: { issue: Issue; onRetry: () => void; onApp: () => void }) {
  const auth = issue.kind === 'auth';
  const autoplay = issue.kind === 'autoplay';
  return (
    <div className="overlaywrap" data-testid="spotify-storing">
      <div className="ocard">
        <div className="ic">{auth ? '🔑' : autoplay ? '🔊' : '🔌'}</div>
        <h3>{auth ? 'Spotify-inlog verlopen' : autoplay ? 'Klik om muziek te hervatten' : 'Spotify is even weg'}</h3>
        <p>
          {autoplay
            ? 'De browser hield het geluid tegen.'
            : issue.final
              ? issue.text
              : `${issue.text} poging ${issue.attempt} van 3.`}
          <br />
          Het spel staat stil, er gaat niets verloren.
        </p>
        {issue.final && (
          <div className="btns">
            <button className="btn-tv" onClick={onRetry} data-testid="opnieuw-verbinden">
              {auth ? 'Opnieuw inloggen' : autoplay ? 'Muziek hervatten' : 'Opnieuw verbinden'}
            </button>
            {!autoplay && (
              <button className="btn-tv sec" onClick={onApp} data-testid="spotify-app">
                Gebruik de Spotify-app op deze pc
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DeviceChooser({
  chooser,
  onPick,
  onRefresh,
  onClose,
}: {
  chooser: { devices: Device[] | null; error: string | null };
  onPick: (d: Device) => void;
  onRefresh: () => void;
  onClose: () => void;
}) {
  return (
    <div className="overlaywrap" style={{ zIndex: 70 }} data-testid="apparaat-kiezen">
      <div className="ocard" style={{ width: 1100 }}>
        <div className="ic">💻</div>
        <h3>Gebruik de Spotify-app op deze pc</h3>
        <p>
          1. Open de Spotify-app op deze pc (log in met hetzelfde account).
          <br />
          2. Speel kort iets af en zet het op pauze, zodat Spotify de app ziet.
          <br />
          3. Kies hieronder de app. Minimaliseer hem daarna; de tv stuurt hem aan.
        </p>
        <div className="devlist">
          {chooser.devices === null && <p>Apparaten zoeken…</p>}
          {chooser.devices?.length === 0 && <p>{chooser.error ?? 'Nog geen Spotify-app gevonden. Volg de stappen en klik op Zoek opnieuw.'}</p>}
          {chooser.devices?.map((d) => (
            <button key={d.id} className="btn-tv" onClick={() => onPick(d)} data-testid="apparaat">
              {d.type === 'Computer' ? '💻' : d.type === 'Smartphone' ? '📱' : '🔈'} {d.name}
              {d.active ? ' · actief' : ''}
            </button>
          ))}
        </div>
        <div className="btns">
          <button className="btn-tv sec" onClick={onRefresh}>
            Zoek opnieuw
          </button>
          <button className="btn-tv sec" onClick={onClose}>
            Terug
          </button>
        </div>
      </div>
    </div>
  );
}

function ReclaimPrompt({ s, onAnswer }: { s: GameState; onAnswer: (id: string, ok: boolean) => void }) {
  const r = s.reclaims[0];
  if (!r) return null;
  const p = nm(s, r.target);
  if (!p) return null;
  const pub = toPublic(s).players;
  return (
    <div className="reclaimbox" data-testid="tv-reclaim">
      <Avatar p={pub.find((x) => x.id === p.id)!} all={pub} />
      <div>
        <b>Is dit {p.name}?</b>
        <span>Een nieuwe telefoon wil verder als {p.name} (lege accu?). De host bevestigt op de telefoon of hier.</span>
      </div>
      <button className="btn-tv" onClick={() => onAnswer(r.id, true)}>
        Ja
      </button>
      <button className="btn-tv sec" onClick={() => onAnswer(r.id, false)}>
        Nee
      </button>
    </div>
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

const IN_GAME_TOP = ['deal', 'turnStart', 'placing', 'stealing', 'reveal', 'objection'];

export default function TvApp() {
  const g = useTvGame();
  const { state: s, room, setup } = g;
  const lokaal = g.flags.net === 'lokaal';

  if (setup === 'second') {
    return (
      <Stage>
        <Center>
          <Brand />
          <div className="ocard" style={{ marginTop: 30 }} data-testid="tweede-tv">
            <div className="ic">📺</div>
            <h3>Er is al een tv actief voor deze kamer.</h3>
            <p>Deze pagina doet niets, zodat er geen dubbele muziek of verwarring is. Sluit dit tabblad, of neem het over als de andere tv dicht is.</p>
            <div className="btns">
              <button className="btn-tv sec" onClick={g.takeOver} data-testid="overnemen">
                Toch deze tv gebruiken
              </button>
            </div>
          </div>
        </Center>
      </Stage>
    );
  }

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

  if (setup === 'fallback') {
    return (
      <Stage>
        <Center>
          <Brand />
          <div className="ocard" style={{ marginTop: 30 }} data-testid="sdk-fallback">
            <div className="ic">🔌</div>
            <h3>Spotify-speler start niet</h3>
            <p>{g.error ?? 'De Spotify-speler werd niet klaar binnen 15 seconden.'} Probeer het opnieuw, of laat de Spotify-app op deze pc de muziek spelen.</p>
            <div className="btns">
              <button className="btn-tv" onClick={() => void g.begin()}>
                Opnieuw proberen
              </button>
              <button className="btn-tv sec" onClick={() => void g.openChooser()} data-testid="spotify-app">
                Gebruik de Spotify-app op deze pc
              </button>
            </div>
          </div>
        </Center>
        {g.chooser && <DeviceChooser chooser={g.chooser} onPick={g.chooseDevice} onRefresh={() => void g.openChooser()} onClose={g.closeChooser} />}
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

  const winnerFor = s.phase === 'winner' ? Date.now() - s.phaseStartedAt : 0;
  const overview = s.phase === 'winner' && winnerFor > 8000 * tempo(s);
  let screen: ReactNode;
  switch (s.phase) {
    case 'lobby':
      screen = <Lobby s={s} room={room} lokaal={lokaal} />;
      break;
    case 'explain':
      screen = <Explain s={s} room={room} lokaal={lokaal} onDone={g.understood} />;
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
      screen = overview ? <Overview s={s} /> : <Winner s={s} />;
      break;
  }

  // Pauze van de host: tussenstand. Pauze door Spotify-storing: het speelscherm blijft staan onder de melding.
  const paused = s.paused && s.pausedBy !== 'system';
  if (paused) screen = <Standings s={s} room={room} lokaal={lokaal} paused />;
  const top = IN_GAME_TOP.includes(s.phase) && !paused;

  return (
    <Stage win={s.phase === 'winner' && !overview} ten={s.players.length >= 7}>
      <div data-phase={s.paused ? 'paused' : s.phase} data-testid="tv" data-overview={overview ? '1' : undefined} style={{ position: 'absolute', inset: 0 }}>
        {top && <Topbar s={s} />}
        {screen}
        <SpectatorReactions s={s} />
      </div>
      {s.notice && (
        <div
          className={`toastTv tvnotice ${s.notice.kind === 'drink' ? 'drinktoast' : ''}`}
          style={s.phase === 'placing' ? { top: 130 } : undefined}
        >
          {s.notice.kind === 'songFailed' ? '⚠ ' : ''}
          {s.notice.text}
        </div>
      )}
      <ReclaimPrompt s={s} onAnswer={g.confirmReclaim} />
      {g.usingApp && <div className="appnote">Muziek via de Spotify-app: {g.usingApp}</div>}
      {g.net === 'error' && (
        <div className="overlaywrap">
          <div className="ocard">
            <div className="ic">📡</div>
            <h3>Geen verbinding met de spelers</h3>
            <p>Bezig met opnieuw verbinden… Het spel staat stil, er gaat niets verloren.</p>
          </div>
        </div>
      )}
      {g.issue && <SpotifyIssue issue={g.issue} onRetry={g.retrySpotify} onApp={() => void g.openChooser()} />}
      {g.chooser && <DeviceChooser chooser={g.chooser} onPick={g.chooseDevice} onRefresh={() => void g.openChooser()} onClose={g.closeChooser} />}
      {(s.phase === 'lobby' || s.phase === 'winner') && (
        <button
          className="resume-corner smallnote"
          onClick={() => {
            if (window.confirm('Nieuw spel met een nieuwe code? Iedereen moet opnieuw meedoen.')) g.newGame();
          }}
          style={{ color: s.phase === 'winner' && !overview ? 'var(--inkt)' : 'var(--gedempt)' }}
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
