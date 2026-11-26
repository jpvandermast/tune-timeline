// Gedeelde bouwstenen in de stijl van de mockup.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import QRCode from 'qrcode';
import type { Card } from '../game/types';
import type { PublicPlayer } from '../game/public';
import { avatarFor } from '../game/rules';

const DEC: Record<string, string> = {
  50: '#9A8C7A',
  60: '#E9A23B',
  70: '#D9653B',
  80: '#E0457B',
  90: '#7A5CFF',
  0: '#2FA7E0',
  10: '#20BFA0',
  20: '#8BCF3F',
};

export function band(y: number): [string, string] {
  if (y < 1960) return [DEC[50], '≤50s'];
  if (y < 1970) return [DEC[60], '60s'];
  if (y < 1980) return [DEC[70], '70s'];
  if (y < 1990) return [DEC[80], '80s'];
  if (y < 2000) return [DEC[90], '90s'];
  if (y < 2010) return [DEC[0], '00s'];
  if (y < 2020) return [DEC[10], '10s'];
  return [DEC[20], '20s'];
}

export function Avatar({ p, all, style }: { p: { name: string; color: string }; all?: { name: string }[]; style?: CSSProperties }) {
  return (
    <div className="av" style={{ background: p.color, ...style }}>
      {avatarFor(p.name, all ?? [p])}
    </div>
  );
}

export const Coin = ({ style }: { style?: CSSProperties }) => <i className="coin" style={style} />;

export function Logo({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 56) / 120} viewBox="0 0 64 30" aria-hidden="true">
      <path d="M2 15 H22 Q27 3 32 15 Q37 27 42 15 H62" stroke="#F6F1E7" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="2" cy="15" r="3" fill="#F6F1E7" />
      <circle cx="14" cy="15" r="3" fill="#F6F1E7" />
      <circle cx="32" cy="15" r="6" fill="#FFB23F" />
      <circle cx="50" cy="15" r="3" fill="#F6F1E7" />
      <circle cx="62" cy="15" r="3" fill="#F6F1E7" />
    </svg>
  );
}

/** Onthoudt het vorige getal en geeft een verschil terug (voor "+1"/"−1"-animaties). */
function useDelta(value: number): { d: number; key: number } {
  const prev = useRef(value);
  const [out, setOut] = useState({ d: 0, key: 0 });
  useEffect(() => {
    const d = value - prev.current;
    prev.current = value;
    if (d !== 0) setOut((o) => ({ d, key: o.key + 1 }));
  }, [value]);
  return out;
}

export function Chip({
  p,
  all,
  goal,
  active,
  flag,
  mp,
  emo,
}: {
  p: PublicPlayer;
  all: PublicPlayer[];
  goal: number;
  active?: boolean;
  flag?: string;
  mp?: boolean;
  /** Emoji-reactie die nu naast het bordje zweeft. */
  emo?: { emoji: string; id: string } | null;
}) {
  const off = !p.online;
  const tok = useDelta(p.tokens);
  const crd = useDelta(p.cards.length);
  return (
    <div className={`chip ${active ? 'active' : ''} ${off ? 'off' : ''}`} data-testid={`chip-${p.name}`} data-chip={p.id}>
      {flag && <div className={`flag ${mp ? 'mp' : ''}`}>{flag}</div>}
      {emo && (
        <div key={emo.id} className="emo" data-testid="emo">
          {emo.emoji}
        </div>
      )}
      {crd.d > 0 && (
        <div key={`c${crd.key}`} className="plusone" aria-hidden="true">
          +{crd.d}
        </div>
      )}
      <div className="row1">
        <Avatar p={p} all={all} />
        <div className="nm">
          {p.name}
          {off && <span style={{ fontSize: 20 }}> 📶✕</span>}
        </div>
      </div>
      <div className="row2">
        <div className="cnt num">
          {p.cards.length}
          <small>/{goal}</small>
        </div>
        <div className="tokc num" key={`t${tok.key}`} data-anim={tok.d > 0 ? 'up' : tok.d < 0 ? 'down' : undefined}>
          <i className="coin" />
          {p.tokens}
          {tok.d !== 0 && (
            <>
              <i className={`coinfly ${tok.d > 0 ? 'in' : 'out'}`} aria-hidden="true" />
              <b className={`tokdelta ${tok.d > 0 ? 'up' : 'down'}`} aria-hidden="true">
                {tok.d > 0 ? `+${tok.d}` : `−${-tok.d}`}
              </b>
            </>
          )}
        </div>
      </div>
      <div className="pips">
        {Array.from({ length: goal }, (_, i) => (
          <i key={i} style={i < p.cards.length ? { background: p.color } : undefined} />
        ))}
      </div>
    </div>
  );
}

/** Kaartmaat voor de tv: 200 px tot 6 kaarten, daarna kleiner zodat alles past. */
export function cardWidth(items: number, gapW: number): number {
  if (items <= 6) return 200;
  const avail = 1840 - (items + 1) * gapW;
  return Math.max(120, Math.min(150, Math.floor(avail / items)));
}

export function TvCard({ c, w = 200, cls = '', style }: { c: Card; w?: number; cls?: string; style?: CSSProperties }) {
  const [b, l] = band(c.year);
  const h = Math.round(w * 1.33);
  const year = Math.max(48, Math.round(w * 0.34));
  return (
    <div
      className={`card ${cls}`}
      style={{ ['--band' as string]: b, width: w, height: h, ...style }}
      data-year={c.year}
    >
      <div className="band" style={{ height: Math.round(h * 0.18), fontSize: Math.round(w * 0.1) }}>
        {l}
      </div>
      <div className="year" style={{ fontSize: year, marginTop: Math.round(w * 0.07) }}>
        {c.year}
      </div>
      <div className="ti" style={{ fontSize: Math.max(16, Math.round(w * 0.11)), marginTop: Math.round(w * 0.08), maxHeight: Math.round(w * 0.26) }}>
        {c.title}
      </div>
      <div className="ar" style={{ fontSize: Math.max(15, Math.round(w * 0.1)) }}>
        {c.artist}
      </div>
      {cls.includes('bad') && <div className="strike" />}
      {/* ✓/✕ naast de kleur: kleur is nooit het enige kenmerk (CONCEPT 8.2) */}
      {/\bgood\b/.test(cls) && <div className="mark ok">✓</div>}
      {/\bbad\b/.test(cls) && <div className="mark no">✕</div>}
    </div>
  );
}

export function Eq({ style }: { style?: CSSProperties }) {
  return (
    <div className="eq" style={style}>
      <i />
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}

export function MysteryCard({ w = 200, cls = '', children, still }: { w?: number; cls?: string; children?: ReactNode; still?: boolean }) {
  return (
    <div className={`card mystery ${cls} ${still ? 'still' : ''}`} style={{ position: 'relative', width: w, height: Math.round(w * 1.33) }}>
      {children}
      <Eq style={w < 180 ? { height: 50 } : undefined} />
      <div className="q" style={w < 180 ? { fontSize: 56 } : undefined}>
        ?
      </div>
    </div>
  );
}

export function FlipCard({ c, w = 200, cls, drop }: { c: Card; w?: number; cls: string; drop?: boolean }) {
  const h = Math.round(w * 1.33);
  return (
    <div className={`flipwrap ${drop ? 'drop' : ''}`} style={{ width: w, height: h, marginTop: -20 }}>
      <div className="flipper">
        <div className="card mystery" style={{ animation: 'none', width: w, height: h }}>
          <Eq />
          <div className="q">?</div>
        </div>
        <TvCard c={c} w={w} cls={`back ${cls}`} />
      </div>
    </div>
  );
}

export function Ring({
  sec,
  total,
  color = 'var(--amber)',
  size = 170,
  stroke = 14,
}: {
  sec: number;
  total: number;
  color?: string;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const f = total > 0 ? Math.max(0, Math.min(1, sec / total)) : 1;
  return (
    <svg viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#2A2350" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - f)}
        style={{ transition: 'stroke-dashoffset .25s linear' }}
      />
    </svg>
  );
}

export function QrSvg({ text, size, className = 'qrsvg' }: { text: string; size: number; className?: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let live = true;
    QRCode.toString(text, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#1A1530', light: '#F4EBDD' } })
      .then((s) => live && setSvg(s.replace('<svg ', `<svg width="${size}" height="${size}" `)))
      .catch(() => setSvg(''));
    return () => {
      live = false;
    };
  }, [text, size]);
  return <div className={className} style={{ width: size + 16 }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

// ---------------- telefoon ----------------

export function PCard({ c, cls = '' }: { c: Card; cls?: string }) {
  const [b] = band(c.year);
  return (
    <div className={`pcard ${cls}`} style={{ ['--band' as string]: b }}>
      <div className="b" />
      <div className="y">{c.year}</div>
      <div className="t">
        <b>{c.title}</b>
        <span>{c.artist}</span>
      </div>
      {/\bgood\b/.test(cls) && <div className="pmark ok">✓</div>}
      {/\bbad\b/.test(cls) && <div className="pmark no">✕</div>}
    </div>
  );
}

/** Jaarwiel (Expert): grote − / + knoppen en snelle stappen van 10; tikken, niet vegen. */
export function YearWheel({
  value,
  onChange,
  min = 1950,
  max = new Date().getFullYear(),
}: {
  value: number | null;
  onChange: (y: number) => void;
  min?: number;
  max?: number;
}) {
  const v = value ?? Math.round((min + max) / 2);
  const set = (y: number) => onChange(Math.max(min, Math.min(max, y)));
  return (
    <div className="yearwheel" data-testid="jaarwiel">
      <button onClick={() => set(v - 10)} aria-label="10 jaar eerder">
        −10
      </button>
      <button onClick={() => set(v - 1)} aria-label="1 jaar eerder">
        −
      </button>
      <div className={`yw num ${value === null ? 'unset' : ''}`} data-testid="jaar" aria-live="polite">
        {value === null ? 'jaar?' : value}
      </div>
      <button onClick={() => set(v + 1)} aria-label="1 jaar later">
        +
      </button>
      <button onClick={() => set(v + 10)} aria-label="10 jaar later">
        +10
      </button>
    </div>
  );
}

/** Emoji-reactieknoppen (telefoon); max 1 per 3 s. */
export function ReactBar({ onReact, disabled }: { onReact: (e: string) => void; disabled?: boolean }) {
  const [cool, setCool] = useState(false);
  return (
    <div className="react" data-testid="reacties" style={{ width: '100%', margin: 0 }}>
      {['🔥', '😂', '😱', '🎶'].map((e) => (
        <button
          key={e}
          className={cool || disabled ? 'cool' : ''}
          disabled={cool || disabled}
          aria-label={`Reactie ${e}`}
          onClick={() => {
            onReact(e);
            setCool(true);
            window.setTimeout(() => setCool(false), 3000);
          }}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

export function PMystery({ text = 'Dit nummer', onClick }: { text?: string; onClick?: () => void }) {
  return (
    <div className="pcard mys" onClick={onClick} role={onClick ? 'button' : undefined} data-testid="pmystery">
      <Eq />
      {text}
    </div>
  );
}

/** Seconden over tot een deadline, met klokverschil (offset) tussen tv en dit apparaat. */
export function useCountdown(deadline: number | null, offset = 0): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (deadline === null) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [deadline]);
  if (deadline === null) return null;
  return Math.max(0, Math.ceil((deadline - (now + offset)) / 1000));
}
