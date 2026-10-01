import React, { useState, useEffect } from 'react';
import { PixelSprite } from './pixel-sprite.jsx';
import { fireballPixels } from '../sprites/fireball.jsx';
import {
  raccoonStaffPixels,
  raccoonStaffSize,
  ratWarriorPixels,
  ratWarriorSize,
  frogClericPixels,
  frogClericSize,
  owlRangerPixels,
  owlRangerSize,
  lintGoblinPixels,
  lintGoblinSize,
  slimePixels,
  slimeSize,
  skeletonPixels,
  skeletonSize,
} from '../sprites/raid.jsx';
import { useTheme } from '../themes.jsx';
import { PixelBtn } from './pixel-btn.jsx';

const HEROES = {
  raccoon: { pixels: raccoonStaffPixels, ...raccoonStaffSize },
  rat: { pixels: ratWarriorPixels, ...ratWarriorSize },
  frog: { pixels: frogClericPixels, ...frogClericSize },
  owl: { pixels: owlRangerPixels, ...owlRangerSize },
};
const MONSTERS = {
  goblin: { name: 'lint goblin', pixels: lintGoblinPixels, ...lintGoblinSize },
  skeleton: { name: 'flaky skeleton', pixels: skeletonPixels, ...skeletonSize },
  slime: { name: 'bug slime', pixels: slimePixels, ...slimeSize },
};

export const NEED_KIND = {
  APPROVE: 'approve',
  BLOCKED: 'blocked',
  QUESTION: 'question',
  'WARD FAIL': 'wardfail',
};
const NEED_HERO = { approve: 'owl', question: 'frog', blocked: 'rat', wardfail: 'raccoon' };

const CSS = `
@keyframes r-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2px) } }
@keyframes r-lunge { 0%,24%,100% { transform: translateX(0) } 32% { transform: translateX(7px) } 40% { transform: translateX(0) } }
@keyframes r-fire { 0%,27% { opacity: 0; left: 26% } 30% { opacity: 1; left: 26% } 58% { opacity: 1; left: 62% } 61%,100% { opacity: 0; left: 66% } }
@keyframes r-hit { 0%,58% { filter: none; transform: translateX(0) } 62% { filter: brightness(3) saturate(0.2); transform: translateX(4px) } 70% { filter: none; transform: translateX(0) } 74% { filter: brightness(2); } 80%,100% { filter: none } }
@keyframes r-dmg { 0%,59% { opacity: 0; transform: translateY(0) } 62% { opacity: 1; transform: translateY(0) } 92% { opacity: 0; transform: translateY(-22px) } 100% { opacity: 0 } }
@keyframes r-xp { 0% { opacity: 0; transform: translateY(6px) } 25% { opacity: 1 } 100% { opacity: 0; transform: translateY(-20px) } }
@keyframes r-ground { from { background-position: 0 0 } to { background-position: -28px 0 } }
@keyframes r-far { from { background-position: 0 0 } to { background-position: -60px 0 } }
@keyframes r-walk { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2px) } }
@keyframes rs-pulse { 0%,100% { opacity: .25; transform: scale(.9) } 50% { opacity: 1; transform: scale(1.15) } }
@keyframes rs-glow { 0%,100% { box-shadow: 0 0 0 0 #ef444400 } 50% { box-shadow: 0 0 6px 2px #ef4444aa } }
@keyframes rs-pop { 0%,100% { transform: scale(1) } 50% { transform: scale(1.12) } }
@keyframes rs-tap { 0%,60%,100% { transform: translateY(0) } 75% { transform: translateY(-2px) } 90% { transform: translateY(0) } }
@keyframes rs-hop { 0% { transform: translateY(0) } 40% { transform: translateY(-8px) } 100% { transform: translateY(0) } }
@keyframes rs-push { 0%,100% { transform: rotate(7deg) translateX(0) } 50% { transform: rotate(7deg) translateX(3px) } }
@keyframes rs-shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(1px) } 75% { transform: translateX(-1px) } }
@keyframes rs-orbit { to { transform: rotate(360deg) } }
.r-bob { animation: r-bob 1.2s steps(2, jump-none) infinite }
.r-lunge { animation: r-lunge 3s ease-in-out infinite }
.r-fire { animation: r-fire 3s linear infinite }
.r-hit { animation: r-hit 3s linear infinite }
.r-dmg { animation: r-dmg 3s linear infinite }
.r-xp { animation: r-xp 1.4s ease-out forwards }
.r-lane-lunge { animation: r-lunge 2.4s ease-in-out infinite }
.r-lane-hit { animation: r-hit 2.4s linear infinite }
.r-ground { animation: r-ground 0.5s linear infinite }
.r-far { animation: r-far 3s linear infinite }
.r-walk { animation: r-walk 0.35s steps(2, jump-none) infinite }
.rs-pulse { animation: rs-pulse 1.1s ease-in-out infinite }
.rs-glow { animation: rs-glow 1.4s ease-in-out infinite }
.rs-pop { animation: rs-pop 1.2s ease-in-out infinite }
.rs-tap { animation: rs-tap 0.9s steps(3, jump-none) infinite }
.rs-hop { animation: rs-hop 0.5s ease-out 1 }
.rs-push { animation: rs-push 1s ease-in-out infinite }
.rs-shake { animation: rs-shake 0.5s linear infinite }
.rs-orbit { animation: rs-orbit 1.4s linear infinite }
@media (prefers-reduced-motion: reduce) { .raid-scene * { animation: none !important; transition: none !important } }
`;

function Sprite({ def, scale, flip }) {
  return (
    <div
      style={{
        width: def.width * scale,
        height: def.height * scale,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <PixelSprite
        pixels={def.pixels}
        scale={scale}
        width={def.width}
        height={def.height}
        flip={flip}
      />
    </div>
  );
}

const hpBar = (pct) => {
  const filled = Math.round((pct / 100) * 8);
  return '▰'.repeat(filled) + '▱'.repeat(8 - filled);
};

function useDeathCycle(period = 8000) {
  const [dying, setDying] = useState(false);
  const [kills, setKills] = useState(0);
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return undefined;
    let t2;
    const t1 = setInterval(() => {
      setDying(true);
      t2 = setTimeout(() => {
        setDying(false);
        setKills((k) => k + 1);
      }, 1500);
    }, period);
    return () => {
      clearInterval(t1);
      clearTimeout(t2);
    };
  }, [period]);
  return { dying, kills };
}

const toSec = (str) => {
  const m = str.match(/(\d+)m\s*(\d+)s/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
};
const fmt = (sec) => `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, '0')}s`;

function useTick() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return n;
}

const ellipsis = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

function OpenArrow({ onOpen }) {
  const { theme } = useTheme();
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      title="Open quest chat"
      style={{
        fontFamily: 'monospace',
        fontSize: 11,
        color: theme.colors['primary'],
        cursor: 'pointer',
        padding: '0 2px',
        flexShrink: 0,
      }}
    >
      ↗
    </span>
  );
}

function laneFrame(c, highlighted) {
  return {
    cursor: 'pointer',
    background: highlighted ? c['bg-raised'] : 'transparent',
    borderLeft: `2px solid ${highlighted ? c['loot-gold'] : 'transparent'}`,
  };
}

/* ------------------------------------------------------------------ needs-attention scenes */

// Everything is positioned in units of `s` px so the same scene renders as a 110px lane
// thumbnail (s=2) and as the large focus scene (s=4).
export function NeedScene({ kind, s = 2, resolving = false }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const hero = HEROES[NEED_HERO[kind]];
  const u = (n) => n * s;
  const at = (left, extra) => ({ position: 'absolute', left: u(left), bottom: u(3), ...extra });
  const box = {
    position: 'relative',
    width: u(55),
    height: u(22),
    flexShrink: 0,
    overflow: 'hidden',
  };
  const ground = (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: u(3),
        height: 1,
        background: c['border'],
      }}
    />
  );
  if (kind === 'approve') {
    const door = (side) => ({
      position: 'absolute',
      top: 0,
      bottom: 0,
      [side]: 0,
      width: '50%',
      background: '#6b4a2a',
      transformOrigin: side,
      transform: resolving ? 'scaleX(0)' : 'scaleX(1)',
      transition: 'transform .7s ease-in',
    });
    return (
      <div style={box}>
        {ground}
        <div className={resolving ? 'rs-hop' : 'r-bob'} style={at(3)}>
          <Sprite def={hero} scale={s} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: u(17),
            bottom: u(9),
            width: u(4),
            height: u(6),
            background: '#e8d3a8',
            border: `1px solid ${c['border']}`,
            transform: 'rotate(-12deg)',
          }}
        />
        <div
          className="rs-pulse"
          style={{
            position: 'absolute',
            left: u(6),
            top: 0,
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: u(7),
            color: c['loot-gold'],
            opacity: resolving ? 0 : undefined,
          }}
        >
          !
        </div>
        <div
          style={at(36, {
            width: u(16),
            height: u(17),
            borderRadius: `${u(8)}px ${u(8)}px 0 0`,
            overflow: 'hidden',
            background: '#ffd70066',
            border: `1px solid ${c['loot-gold']}`,
          })}
        >
          <div style={door('left')} />
          <div style={door('right')} />
          <div
            className={resolving ? '' : 'rs-glow'}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: u(5),
              height: u(5),
              marginLeft: -u(2.5),
              marginTop: -u(2.5),
              borderRadius: '50%',
              background: c['danger'],
              border: `1px solid ${c['loot-gold']}`,
              opacity: resolving ? 0 : 1,
              transition: 'opacity .3s',
            }}
          />
        </div>
      </div>
    );
  }
  if (kind === 'question') {
    return (
      <div style={box}>
        {ground}
        <div className={resolving ? 'rs-hop' : 'rs-tap'} style={at(6)}>
          <Sprite def={hero} scale={s} />
        </div>
        <div
          className={resolving ? '' : 'rs-pop'}
          style={{
            position: 'absolute',
            left: u(22),
            top: u(1),
            width: u(11),
            height: u(8),
            borderRadius: u(3),
            background: c['text'],
            color: c['bg-deep'],
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: u(6),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: resolving ? 'scale(2)' : undefined,
            opacity: resolving ? 0 : 1,
            transition: 'all .45s ease-out',
          }}
        >
          ?
          <div
            style={{
              position: 'absolute',
              left: u(1),
              bottom: -u(1.5),
              width: u(3),
              height: u(3),
              background: c['text'],
              transform: 'rotate(45deg)',
              zIndex: -1,
            }}
          />
        </div>
      </div>
    );
  }
  if (kind === 'blocked') {
    return (
      <div style={box}>
        {ground}
        <div className="rs-push" style={at(14, { transformOrigin: 'bottom center' })}>
          <Sprite def={hero} scale={s} />
        </div>
        <div
          className="rs-shake"
          style={at(31, {
            width: u(14),
            height: u(13),
            borderRadius: '50%',
            background: '#5a5a6a',
            border: `${Math.max(1, s / 2)}px solid #8a8a9a`,
          })}
        />
      </div>
    );
  }
  // wardfail: hero knocked onto its back with stars circling, goblin standing over it
  const gob = MONSTERS.goblin;
  return (
    <div style={box}>
      {ground}
      <div
        style={at(4, {
          transform: resolving ? 'rotate(0deg)' : 'rotate(180deg)',
          transition: 'transform .6s ease-out',
        })}
      >
        <Sprite def={hero} scale={s} />
      </div>
      <div
        className="rs-orbit"
        style={{
          position: 'absolute',
          left: u(5),
          top: u(4),
          width: u(9),
          height: u(9),
          opacity: resolving ? 0 : 1,
          transition: 'opacity .3s',
        }}
      >
        {[
          [0, 0],
          [5, 0],
          [2.5, 5],
        ].map(([x, y], i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: u(x),
              top: u(y),
              fontSize: u(4),
              lineHeight: 1,
              color: c['loot-gold'],
            }}
          >
            ★
          </span>
        ))}
      </div>
      <div style={at(34, { opacity: resolving ? 0.35 : 1, transition: 'opacity .6s' })}>
        <div className="r-bob">
          <Sprite def={gob} scale={s} flip />
        </div>
      </div>
    </div>
  );
}

function NeedLane({ need, onFocus, onOpen, highlighted }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <div
      onClick={onFocus}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 46,
        flexShrink: 0,
        overflow: 'hidden',
        borderBottom: `1px solid ${c['border']}`,
        fontFamily: 'monospace',
        borderLeft: `2px solid ${c[need.color]}`,
        paddingLeft: 4,
        cursor: 'pointer',
        background: highlighted ? c['bg-raised'] : 'transparent',
      }}
    >
      <NeedScene kind={NEED_KIND[need.kind]} s={2} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 8,
              fontWeight: 600,
              padding: '0 4px',
              borderRadius: 2,
              border: `1px solid ${c[need.color]}`,
              color: c[need.color],
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {need.kind}
          </span>
          <span
            style={{ fontSize: 10, color: c['text'], ...ellipsis }}
            title={`${need.guild} / ${need.title}`}
          >
            {need.title}
          </span>
        </div>
        <div style={{ fontSize: 9, color: c['text-dim'], ...ellipsis }} title={need.note || ''}>
          {need.guild} · {need.age}
          {need.note ? ` · ${need.note}` : ''}
        </div>
      </div>
      <OpenArrow onOpen={onOpen} />
    </div>
  );
}

/* ------------------------------------------------------------------ battle + travel */

function MainBattle({ lane, elapsed, onFocus, onOpen, highlighted }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const hero = HEROES[lane.hero];
  const mon = MONSTERS[lane.monster];
  const { dying, kills } = useDeathCycle();
  const pct = Math.round((1 - lane.done / lane.total) * 100);
  return (
    <div
      onClick={onFocus}
      style={{
        position: 'relative',
        height: 86,
        flexShrink: 0,
        borderRadius: 2,
        overflow: 'hidden',
        background: `linear-gradient(${c['bg-deep']}, ${c['bg-surface']})`,
        border: `1px solid ${highlighted ? c['loot-gold'] : c['border']}`,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 8,
          height: 1,
          background: c['border'],
        }}
      />
      <div className="r-lunge" style={{ position: 'absolute', left: 8, bottom: 9 }}>
        <div className="r-bob">
          <Sprite def={hero} scale={3} />
        </div>
      </div>
      <div className="r-fire" style={{ position: 'absolute', bottom: 16, left: '24%' }}>
        <Sprite def={{ pixels: fireballPixels, width: 12, height: 12 }} scale={3} />
      </div>
      <div
        style={{
          position: 'absolute',
          right: 14,
          bottom: 9,
          opacity: dying ? 0 : 1,
          transition: 'opacity 1.2s ease-out, transform 1.2s',
          transform: dying ? 'translateY(6px)' : 'none',
        }}
      >
        <div className="r-hit">
          <div className="r-bob">
            <Sprite def={mon} scale={3} flip />
          </div>
        </div>
      </div>
      <div
        className="r-dmg"
        style={{
          position: 'absolute',
          right: 34,
          bottom: 46,
          fontFamily: 'monospace',
          fontSize: 13,
          fontWeight: 700,
          color: c['loot-gold'],
          textShadow: `0 0 3px ${c['danger']}`,
        }}
      >
        -12
      </div>
      {dying && (
        <div
          key={kills}
          className="r-xp"
          style={{
            position: 'absolute',
            right: 30,
            bottom: 30,
            fontFamily: 'monospace',
            fontSize: 12,
            fontWeight: 700,
            color: c['success'],
          }}
        >
          +40 XP
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          left: 8,
          right: 170,
          top: 4,
          fontFamily: 'monospace',
          fontSize: 10,
          color: c['loot-gold'],
          ...ellipsis,
        }}
        title={`${lane.guild} / ${lane.title}`}
      >
        <span style={{ color: c['text-dim'] }}>{lane.guild} / </span>
        {lane.title}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 8,
          top: 17,
          fontFamily: 'monospace',
          fontSize: 9,
          color: c['text-dim'],
        }}
      >
        <span style={{ color: c['primary'] }}>{lane.role}</span> · {fmt(elapsed)} · items{' '}
        {lane.done}/{lane.total}
      </div>
      <div
        style={{
          position: 'absolute',
          right: 24,
          top: 5,
          fontFamily: 'monospace',
          fontSize: 9,
          color: c['text-dim'],
          textAlign: 'right',
        }}
      >
        {mon.name}{' '}
        <span style={{ color: pct < 50 ? c['warning'] : c['danger'] }}>
          {dying ? '▱▱▱▱▱▱▱▱ 0%' : `${hpBar(pct)} ${pct}%`}
        </span>
      </div>
      <div style={{ position: 'absolute', right: 6, top: 3 }}>
        <OpenArrow onOpen={onOpen} />
      </div>
    </div>
  );
}

function BattleLane({ lane, elapsed, index, onFocus, onOpen, highlighted }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const hero = HEROES[lane.hero];
  const mon = MONSTERS[lane.monster];
  const pct = Math.round((1 - lane.done / lane.total) * 100);
  const delay = `${-index * 0.7}s`;
  return (
    <div
      onClick={onFocus}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        height: 38,
        flexShrink: 0,
        overflow: 'hidden',
        borderBottom: `1px solid ${c['border']}`,
        fontFamily: 'monospace',
        ...laneFrame(c, highlighted),
      }}
    >
      <div
        className="r-lane-lunge"
        style={{
          animationDelay: delay,
          marginBottom: 2,
          width: 50,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <Sprite def={hero} scale={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: 3, lineHeight: 1.25 }}>
        <div
          style={{ fontSize: 10, color: c['loot-gold'], ...ellipsis }}
          title={`${lane.guild} / ${lane.title}`}
        >
          <span style={{ color: c['text-dim'] }}>{lane.guild} / </span>
          {lane.title}
        </div>
        <div style={{ fontSize: 9, color: c['text-dim'], ...ellipsis }}>
          <span style={{ color: c['primary'] }}>{lane.role}</span> · {fmt(elapsed)} · items{' '}
          {lane.done}/{lane.total}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span
          style={{ fontSize: 9, color: c['danger'], paddingBottom: 3 }}
          title={`${mon.name} ${pct}% HP`}
        >
          {hpBar(pct)}
        </span>
        <div className="r-lane-hit" style={{ animationDelay: delay, marginBottom: 2 }}>
          <Sprite def={mon} scale={2} flip />
        </div>
      </div>
      <div style={{ paddingBottom: 3 }}>
        <OpenArrow onOpen={onOpen} />
      </div>
    </div>
  );
}

function TravelLane({ lane, index, onFocus, onOpen, highlighted }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const hero = HEROES[lane.hero];
  const label = `${lane.guild} / ${lane.title}`;
  return (
    <div
      onClick={onFocus}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        height: 32,
        flexShrink: 0,
        overflow: 'hidden',
        borderBottom: `1px solid ${c['border']}`,
        fontFamily: 'monospace',
        ...laneFrame(c, highlighted),
      }}
    >
      <div
        className="r-walk"
        style={{
          animationDelay: `${-index * 0.17}s`,
          marginBottom: 2,
          width: 50,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <Sprite def={hero} scale={2} />
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 10,
          paddingBottom: 3,
          color: index === 0 ? c['loot-gold'] : c['text'],
          ...ellipsis,
        }}
        title={label}
      >
        <span style={{ color: c['text-dim'] }}>{index + 1}.</span> {label}
      </div>
      <div
        style={{
          width: 54,
          flexShrink: 0,
          alignSelf: 'stretch',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          className="r-ground"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 3,
            backgroundImage: `repeating-linear-gradient(90deg, ${c['text-dim']} 0 8px, transparent 8px 14px)`,
            backgroundSize: '28px 3px',
          }}
        />
      </div>
      <div style={{ paddingBottom: 3 }}>
        <OpenArrow onOpen={onOpen} />
      </div>
    </div>
  );
}

function TravelBig({ lane, index }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const hero = HEROES[lane.hero];
  return (
    <div
      style={{
        position: 'relative',
        height: 86,
        overflow: 'hidden',
        borderRadius: 2,
        border: `1px solid ${c['border']}`,
        background: `linear-gradient(${c['bg-deep']}, ${c['bg-surface']})`,
      }}
    >
      <div
        className="r-far"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 20,
          height: 18,
          backgroundImage: `linear-gradient(135deg, transparent 50%, ${c['border']} 50%)`,
          backgroundSize: '24px 18px',
        }}
      />
      <div className="r-walk" style={{ position: 'absolute', left: '38%', bottom: 12 }}>
        <Sprite def={hero} scale={3} />
      </div>
      <div
        className="r-ground"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 6,
          height: 4,
          backgroundImage: `repeating-linear-gradient(90deg, ${c['text-dim']} 0 12px, transparent 12px 20px)`,
          backgroundSize: '32px 4px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 8,
          top: 5,
          fontFamily: 'monospace',
          fontSize: 10,
          color: c['text-dim'],
        }}
      >
        queued · position <span style={{ color: c['loot-gold'] }}>{index + 1}</span> — travelling to
        the front of the line
      </div>
    </div>
  );
}

// The large version of whichever lane was clicked. `need` wins, then a running battle, then a queued traveller.
export function FocusScene({ need, lane, queuedLane, queuedIndex, resolving }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const tick = useTick();
  let inner = null;
  if (need) {
    inner = (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '6px 0',
          background: `linear-gradient(${c['bg-deep']}, ${c['bg-surface']})`,
          border: `1px solid ${c[need.color]}`,
          borderRadius: 2,
        }}
      >
        <NeedScene kind={NEED_KIND[need.kind]} s={5} resolving={Boolean(resolving)} />
      </div>
    );
  } else if (lane) {
    inner = (
      <MainBattle
        lane={lane}
        elapsed={toSec(lane.elapsed) + tick}
        onFocus={() => {}}
        onOpen={() => {}}
        highlighted={false}
      />
    );
  } else if (queuedLane) {
    inner = <TravelBig lane={queuedLane} index={queuedIndex} />;
  }
  if (!inner) return null;
  return (
    <div className="raid-scene" style={{ flexShrink: 0 }}>
      <style>{CSS}</style>
      {inner}
    </div>
  );
}

/* ------------------------------------------------------------------ the panel */

function SubHeader({ children, count }) {
  const { theme } = useTheme();
  return (
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: 9,
        color: theme.colors['text-dim'],
        padding: '8px 0 2px',
        letterSpacing: 0.5,
      }}
    >
      {children} {count !== undefined && `(${count})`}
    </div>
  );
}

export function RaidPanel({
  needs,
  running,
  queued,
  playing,
  onToggle,
  onFocusNeed,
  onFocusQuest,
  onOpen,
  highlightId,
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const tick = useTick();
  const [main, ...rest] = running;
  return (
    <div
      className="raid-scene"
      style={{
        flex: 1,
        minHeight: 0,
        border: `1px solid ${c['border']}`,
        borderRadius: 2,
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        background: c['bg-surface'],
      }}
    >
      <style>{CSS}</style>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexShrink: 0,
          paddingBottom: 4,
          borderBottom: `1px solid ${c['border']}`,
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            fontWeight: 600,
            color: c['loot-gold'],
            ...ellipsis,
          }}
        >
          RAID{' '}
          <span style={{ color: c['text-dim'], fontWeight: 400 }}>
            ·{' '}
            <span style={{ color: needs.length ? c['danger'] : c['text-dim'] }}>
              {needs.length} need you
            </span>{' '}
            · {running.length} running · {queued.length} queued{playing ? '' : ' · paused'}
          </span>
        </span>
        <PixelBtn label={playing ? 'PAUSE' : 'PLAY'} onClick={onToggle} />
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <SubHeader count={needs.length}>NEEDS ATTENTION</SubHeader>
        {needs.length === 0 && (
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 10,
              color: c['text-dim'],
              padding: '4px 0',
            }}
          >
            Nothing is waiting on you.
          </div>
        )}
        {needs.map((n) => (
          <NeedLane
            key={n.nid}
            need={n}
            onFocus={() => onFocusNeed(n)}
            onOpen={() => onOpen(n.id)}
            highlighted={highlightId === n.id}
          />
        ))}
        <SubHeader count={running.length}>ACTIVE</SubHeader>
        {main && (
          <MainBattle
            lane={main}
            elapsed={toSec(main.elapsed) + tick}
            onFocus={() => onFocusQuest(main.id)}
            onOpen={() => onOpen(main.id)}
            highlighted={highlightId === main.id}
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
          {rest.map((l, i) => (
            <BattleLane
              key={l.id}
              lane={l}
              index={i}
              elapsed={toSec(l.elapsed) + tick}
              onFocus={() => onFocusQuest(l.id)}
              onOpen={() => onOpen(l.id)}
              highlighted={highlightId === l.id}
            />
          ))}
        </div>
        <SubHeader count={queued.length}>
          QUEUED · dispatch order{playing ? '' : ' (paused)'}
        </SubHeader>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            opacity: playing ? 1 : 0.6,
            paddingBottom: 4,
          }}
        >
          {queued.map((l, i) => (
            <TravelLane
              key={l.id}
              lane={l}
              index={i}
              onFocus={() => onFocusQuest(l.id)}
              onOpen={() => onOpen(l.id)}
              highlighted={highlightId === l.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
