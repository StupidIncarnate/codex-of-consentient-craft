import React from 'react';
import { useTheme } from '../themes.jsx';

// Mock token accounting, in thousands of tokens. ctx = current session context, total = whole quest.
export const CTX_LIMIT = 1000;

export const TOKENS = {
  q1: {
    total: 3400,
    input: 2900,
    output: 500,
    cost: 18.4,
    roles: {
      codeweaver: 1500,
      chaoswhisperer: 900,
      ward: 300,
      spiritmender: 400,
      siegemaster: 300,
    },
    sessions: [
      { role: 'codeweaver', ctx: 142 },
      { role: 'ward', ctx: 38 },
    ],
  },
  q2: {
    total: 410,
    input: 360,
    output: 50,
    cost: 3.2,
    roles: { chaoswhisperer: 410 },
    sessions: [],
  },
  q3: {
    total: 620,
    input: 540,
    output: 80,
    cost: 4.1,
    roles: { chaoswhisperer: 620 },
    sessions: [],
  },
  q4: {
    total: 1250,
    input: 1100,
    output: 150,
    cost: 8.7,
    roles: { chaoswhisperer: 500, codeweaver: 600, ward: 150 },
    sessions: [],
  },
  q5: {
    total: 2100,
    input: 1800,
    output: 300,
    cost: 12.9,
    roles: { chaoswhisperer: 400, codeweaver: 1100, ward: 250, spiritmender: 350 },
    sessions: [],
  },
  q6: { total: 90, input: 80, output: 10, cost: 0.6, roles: { chaoswhisperer: 90 }, sessions: [] },
  q7: {
    total: 5200,
    input: 4500,
    output: 700,
    cost: 27.8,
    roles: { siegemaster: 2600, codeweaver: 1500, chaoswhisperer: 700, ward: 400 },
    sessions: [{ role: 'siegemaster', ctx: 720 }],
  },
  q8: {
    total: 540,
    input: 470,
    output: 70,
    cost: 3.5,
    roles: { chaoswhisperer: 540 },
    sessions: [],
  },
  q9: {
    total: 1600,
    input: 1400,
    output: 200,
    cost: 9.8,
    roles: { chaoswhisperer: 500, codeweaver: 1100 },
    sessions: [],
  },
  q10: {
    total: 6100,
    input: 5300,
    output: 800,
    cost: 33.1,
    roles: { codeweaver: 2400, spiritmender: 1700, chaoswhisperer: 1100, ward: 900 },
    sessions: [
      { role: 'spiritmender', ctx: 930 },
      { role: 'ward', ctx: 44 },
    ],
  },
  q11: {
    total: 2300,
    input: 2000,
    output: 300,
    cost: 14.2,
    roles: { codeweaver: 1300, spiritmender: 600, chaoswhisperer: 400 },
    sessions: [],
  },
  q12: {
    total: 1700,
    input: 1500,
    output: 200,
    cost: 10.3,
    roles: { chaoswhisperer: 300, codeweaver: 1000, ward: 400 },
    sessions: [],
  },
  q13: {
    total: 1200,
    input: 1050,
    output: 150,
    cost: 7.6,
    roles: { chaoswhisperer: 300, codeweaver: 700, ward: 200 },
    sessions: [],
  },
  q14: {
    total: 1500,
    input: 1300,
    output: 200,
    cost: 9.4,
    roles: { chaoswhisperer: 350, codeweaver: 1000, ward: 150 },
    sessions: [{ role: 'codeweaver', ctx: 260 }],
  },
  q15: { total: 0, input: 0, output: 0, cost: 0, roles: {}, sessions: [] },
};
const EMPTY = { total: 0, input: 0, output: 0, cost: 0, roles: {}, sessions: [] };
export const tokensFor = (id) => TOKENS[id] || EMPTY;
export const topCtx = (id) => Math.max(0, ...tokensFor(id).sessions.map((s) => s.ctx));

export const fmtK = (k) => (k >= 1000 ? `${(k / 1000).toFixed(k % 1000 === 0 ? 0 : 1)}M` : `${k}k`);

const barColor = (pct, c) => (pct > 90 ? c['danger'] : pct > 70 ? c['warning'] : c['text-dim']);

export function CtxBar({ ctx, width = 34 }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const pct = (ctx / CTX_LIMIT) * 100;
  return (
    <span
      title={`${Math.round(pct)}% of the context window`}
      style={{
        display: 'inline-block',
        width,
        height: 4,
        background: c['border'],
        verticalAlign: 'middle',
        borderRadius: 1,
      }}
    >
      <span
        style={{
          display: 'block',
          width: `${Math.min(100, pct)}%`,
          height: '100%',
          background: barColor(pct, c),
          borderRadius: 1,
        }}
      />
    </span>
  );
}

// "ctx 142k/1M ▬▬ · Σ 3.4M" — the one format used on lanes, rows and the chat header.
export function TokenLine({ id, style }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = tokensFor(id);
  const ctx = topCtx(id);
  const pct = (ctx / CTX_LIMIT) * 100;
  return (
    <span
      style={{
        fontFamily: 'monospace',
        fontSize: 9,
        color: c['text-dim'],
        whiteSpace: 'nowrap',
        ...style,
      }}
      title={`Context now ${fmtK(ctx)} of 1M · ${fmtK(t.total)} tokens in total`}
    >
      ctx{' '}
      <span style={{ color: pct > 90 ? c['danger'] : pct > 70 ? c['warning'] : c['text'] }}>
        {ctx ? `${fmtK(ctx)}/1M` : '—'}
      </span>{' '}
      <CtxBar ctx={ctx} /> · Σ{' '}
      <span style={{ color: c['text'] }}>{t.total ? fmtK(t.total) : '0'}</span>
    </span>
  );
}

export function CtxMeter({ ctx, style }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const pct = (ctx / CTX_LIMIT) * 100;
  return (
    <span
      style={{ fontFamily: 'monospace', fontSize: 10, color: c['text-dim'], ...style }}
      title="Context window used by this session"
    >
      ctx{' '}
      <span style={{ color: pct > 90 ? c['danger'] : pct > 70 ? c['warning'] : c['text'] }}>
        {fmtK(ctx)}/1M
      </span>{' '}
      <CtxBar ctx={ctx} width={48} />
    </span>
  );
}
