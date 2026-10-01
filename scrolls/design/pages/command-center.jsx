import React, { useState, useRef, useEffect } from 'react';
import { useTheme, questStatusColorKey, globalCss } from '../themes.jsx';
import { PixelBtn } from '../components/pixel-btn.jsx';
import { MapFrame } from '../components/map-frame.jsx';
import { Logo } from '../components/logo.jsx';
import { RateLimitCard } from '../components/rate-limit-card.jsx';
import { RaidPanel, FocusScene } from '../components/raid-scene.jsx';
import { BountyDocPanel } from '../components/bounty-doc.jsx';
import { QuestChat, QuestSpecPanel, SparkwrightChat } from '../components/quest-chat.jsx';
import { PixelSprite } from '../components/pixel-sprite.jsx';
import { guildGate, guildGateSize } from '../sprites/guild.jsx';

/* ------------------------------------------------------------------ mock data */

const GUILDS = [
  { id: 'codex', name: 'codex' },
  { id: 'siegelense', name: 'siegelense' },
  { id: 'acme-web', name: 'acme-web' },
];

const INIT_QUESTS = [
  { id: 'q1', guild: 'codex', title: 'Ward spawns its children as itself', status: 'in_progress' },
  { id: 'q2', guild: 'codex', title: 'Guild idea backlog', status: 'review_flows' },
  {
    id: 'q3',
    guild: 'codex',
    title: 'Orchestrator starts tools from the run folder',
    status: 'approved',
  },
  { id: 'q4', guild: 'codex', title: 'Rate-limit guardrail holds the queue', status: 'blocked' },
  { id: 'q5', guild: 'codex', title: 'Consumer jest skips ts-jest for CJS', status: 'complete' },
  { id: 'q6', guild: 'codex', title: 'Quest delete confirmation popover', status: 'abandoned' },
  { id: 'q7', guild: 'siegelense', title: 'Walk records console errors', status: 'in_progress' },
  {
    id: 'q8',
    guild: 'siegelense',
    title: 'Seeding recipe for headless instance',
    status: 'review_observables',
  },
  { id: 'q9', guild: 'siegelense', title: 'Screenshot diff readings', status: 'paused' },
  { id: 'q10', guild: 'acme-web', title: 'Login page', status: 'in_progress' },
  { id: 'q11', guild: 'acme-web', title: 'Checkout address form validation', status: 'blocked' },
  { id: 'q12', guild: 'acme-web', title: 'Dark mode toggle', status: 'complete' },
];

const ACTIVE = [
  { id: 'q1', role: 'codeweaver', elapsed: '12m 04s', done: 5, total: 9 },
  { id: 'q7', role: 'siegemaster', elapsed: '4m 41s', done: 2, total: 6 },
  { id: 'q10', role: 'spiritmender', elapsed: '31m 17s', done: 7, total: 8 },
];

const INIT_QUEUED = ['q3', 'q9', 'q11', 'q5'];

const INIT_NEEDS = [
  { nid: 'n1', kind: 'APPROVE', color: 'loot-gold', id: 'q2', age: '3h' },
  { nid: 'n2', kind: 'APPROVE', color: 'loot-gold', id: 'q8', age: '40m' },
  { nid: 'n3', kind: 'BLOCKED', color: 'danger', id: 'q4', age: '1h' },
  { nid: 'n4', kind: 'BLOCKED', color: 'danger', id: 'q11', age: '2h' },
  {
    nid: 'n5',
    kind: 'QUESTION',
    color: 'loot-rare',
    id: 'q10',
    age: '6m',
    note: 'Should the login keep a "remember me" cookie?',
    options: ['Yes, 30 days', 'Session only', 'No cookie'],
  },
  {
    nid: 'n6',
    kind: 'WARD FAIL',
    color: 'warning',
    id: 'q1',
    age: '12m',
    note: 'lint: 2 errors in packages/ward',
    files: [
      'packages/ward/src/brokers/spawn/spawn-broker.ts:41:9  no-unused-vars',
      'packages/ward/src/brokers/spawn/spawn-broker.ts:57:3  prefer-const',
    ],
  },
];

const INIT_ACTIVITY = [
  { t: '1m', text: 'acme-web / Login page — spiritmender fixed 1 lint error' },
  { t: '4m', text: 'siegelense / Walk records console errors — siegemaster started' },
  { t: '12m', text: 'codex / Ward spawns its children as itself — ward failed (lint)' },
  { t: '38m', text: 'codex — server error merged into DEFECT (×14)' },
  { t: '1h', text: 'codex / Rate-limit guardrail holds the queue — blocked' },
  { t: '2h', text: 'acme-web / Dark mode toggle — complete' },
  { t: '3h', text: 'codex / Guild idea backlog — flows ready for review' },
  { t: '5h', text: 'siegelense — steward logged IDEA: record network waterfall' },
  { t: '6h', text: 'codex / Consumer jest skips ts-jest for CJS — complete' },
  { t: '1d', text: 'acme-web — you promoted "Login page" from the bounty board' },
];

const INIT_BOUNTY = [
  {
    id: 'b1',
    guild: 'codex',
    kind: 'IDEA',
    origin: 'you',
    title: 'Show quest cost per role on the queue page',
    age: '2h',
    state: 'live',
  },
  {
    id: 'b2',
    guild: 'codex',
    kind: 'IDEA',
    origin: 'steward',
    title: 'Merge duplicate follow-ups before dispatch',
    age: '5h',
    state: 'promoted',
    quest: 'Guild idea backlog',
  },
  {
    id: 'b3',
    guild: 'codex',
    kind: 'DEFECT',
    origin: 'you',
    title: 'Ward detail loses the first failing file',
    age: '1d',
    state: 'live',
  },
  {
    id: 'b4',
    guild: 'codex',
    kind: 'DEFECT',
    origin: 'server error',
    title: '500 on POST /api/quests/:id/start',
    age: '38m',
    state: 'live',
    count: 14,
  },
  {
    id: 'b5',
    guild: 'codex',
    kind: 'DEFECT',
    origin: 'server error',
    title: 'ENOENT reading quest.json in carved worktree',
    age: '3h',
    state: 'live',
    count: 3,
  },
  {
    id: 'b6',
    guild: 'codex',
    kind: 'FOLLOW-UP',
    origin: 'tavernkeeper',
    title: 'Document dispatch hold notice in README',
    age: '6h',
    state: 'live',
  },
  {
    id: 'b7',
    guild: 'codex',
    kind: 'FOLLOW-UP',
    origin: 'tavernkeeper',
    title: 'Delete dead use-agent-output binding',
    age: '2d',
    state: 'abandoned',
  },
  {
    id: 'b8',
    guild: 'siegelense',
    kind: 'IDEA',
    origin: 'you',
    title: 'Record network waterfall as a reading',
    age: '3d',
    state: 'live',
  },
  {
    id: 'b9',
    guild: 'siegelense',
    kind: 'DEFECT',
    origin: 'steward',
    title: 'Throwaway instance leaks a vite port on crash',
    age: '1d',
    state: 'promoted',
    quest: 'Seeding recipe for headless instance',
  },
  {
    id: 'b10',
    guild: 'siegelense',
    kind: 'FOLLOW-UP',
    origin: 'tavernkeeper',
    title: 'Trim screenshot filenames to 80 chars',
    age: '4h',
    state: 'live',
  },
  {
    id: 'b11',
    guild: 'acme-web',
    kind: 'IDEA',
    origin: 'you',
    title: 'Passkey sign-in',
    age: '9h',
    state: 'live',
  },
  {
    id: 'b12',
    guild: 'acme-web',
    kind: 'DEFECT',
    origin: 'server error',
    title: 'TypeError: cart.items is undefined in /api/checkout',
    age: '52m',
    state: 'live',
    count: 6,
  },
  {
    id: 'b13',
    guild: 'acme-web',
    kind: 'DEFECT',
    origin: 'you',
    title: 'Login button double-submits on slow network',
    age: '2d',
    state: 'promoted',
    quest: 'Login page',
  },
  {
    id: 'b14',
    guild: 'acme-web',
    kind: 'IDEA',
    origin: 'steward',
    title: 'Remember last visited tab',
    age: '6d',
    state: 'abandoned',
  },
];

const SESSIONS = [
  {
    guild: 'codex',
    summary: 'Ward spawns its children as itself',
    quest: true,
    status: 'in_progress',
    age: '2m',
  },
  { guild: 'codex', summary: 'Why does the e2e runner pick two ports?', quest: false, age: '1h' },
  { guild: 'codex', summary: 'Guild idea backlog', quest: true, status: 'review_flows', age: '3h' },
  {
    guild: 'siegelense',
    summary: 'Walk records console errors',
    quest: true,
    status: 'in_progress',
    age: '5m',
  },
  { guild: 'siegelense', summary: 'Untitled session', quest: false, age: '1d' },
  { guild: 'acme-web', summary: 'Login page', quest: true, status: 'in_progress', age: '31m' },
  { guild: 'acme-web', summary: 'Dark mode toggle', quest: true, status: 'complete', age: '2d' },
];

const BACKENDS = {
  claude: {
    name: 'Claude',
    state: 'up',
    p50: '1.8s',
    p95: '6.4s',
    tps: '74',
    inflight: 3,
    err: '0.4%',
    windows: [
      { label: '5h', pct: 62, reset: '2h5m' },
      { label: '7d', pct: 31, reset: '3d4h' },
    ],
  },
  local: [
    {
      name: 'ollama · qwen2.5-coder:32b',
      state: 'up',
      p50: '0.9s',
      p95: '3.1s',
      tps: '38',
      inflight: 1,
      err: '1.2%',
      gpu: 'RTX 4090',
      vram: [19.4, 24],
    },
    {
      name: 'llama.cpp · deepseek-r1:14b',
      state: 'degraded',
      p50: '2.7s',
      p95: '14.9s',
      tps: '17',
      inflight: 2,
      err: '8.6%',
      gpu: 'RTX 3090',
      vram: [22.8, 24],
    },
  ],
  errors: {
    count: 23,
    last: "500 POST /api/quests/q1/start — ENOENT: no such file or directory, open '.../quest.json'",
    at: '38m ago',
  },
  orchestrator: { slotsUsed: 3, slotsTotal: 4, lag: '14ms', uptime: '6h 12m' },
};

const ROLE_ROUTING = [
  { role: 'chaoswhisperer', backend: 'Claude', req: 41, local: false },
  { role: 'codeweaver', backend: 'ollama · qwen2.5-coder:32b', req: 58, local: true },
  { role: 'spiritmender', backend: 'ollama · qwen2.5-coder:32b', req: 17, local: true },
  { role: 'siegemaster', backend: 'Claude', req: 26, local: false },
  { role: 'flowrider', backend: 'llama.cpp · deepseek-r1:14b', req: 12, local: true },
  { role: 'ward', backend: '(no model)', req: null, local: false },
];

const RAID_LANES = [
  {
    id: 'q1',
    guild: 'codex',
    short: 'ward-children',
    role: 'codeweaver',
    hero: 'raccoon',
    monster: 'goblin',
    done: 5,
    total: 9,
    phase: 'battle',
  },
  {
    id: 'q7',
    guild: 'siegelense',
    short: 'console-errors',
    role: 'siegemaster',
    hero: 'rat',
    monster: 'skeleton',
    done: 2,
    total: 6,
    phase: 'battle',
  },
  {
    id: 'q10',
    guild: 'acme-web',
    short: 'login-page',
    role: 'spiritmender',
    hero: 'frog',
    monster: 'slime',
    done: 7,
    total: 8,
    phase: 'battle',
  },
];

const KIND_ORDER = ['IDEA', 'DEFECT', 'FOLLOW-UP'];
const KIND_COLOR = { IDEA: 'loot-gold', DEFECT: 'danger', 'FOLLOW-UP': 'loot-rare' };
const ORIGIN_TAG = {
  you: 'you',
  steward: 'steward',
  tavernkeeper: 'tavern',
  'server error': 'srv-err',
};
const STATUS_WORDS = (s) => s.toUpperCase().split('_').join(' ');
const isLater = (b) => b.origin === 'tavernkeeper' || b.origin === 'server error';

const FALLBACK_INFO = {
  items: ['Draft flows', 'Review flows', 'Implement', 'Ward: lint + typecheck', 'Final review'],
  log: ['(quest created from a bounty — waiting for a free slot)'],
};

const QUEST_INFO = {
  q1: {
    items: [
      'Contract: child spawn identity',
      'Broker: spawn child as ward',
      'Adapter: child_process wrapper',
      'Wire start responder',
      'Unit tests: spawn broker',
      'Ward: lint + typecheck',
      'Integration: spawn as itself',
      'Siege check: ward e2e',
      'Final review',
    ],
    log: [
      '[codeweaver] wrote packages/ward/src/brokers/spawn/spawn-broker.ts',
      '[codeweaver] wrote spawn-broker.test.ts (6 cases)',
      '[ward] lint: 2 errors in spawn-broker.ts',
      '[codeweaver] reading ward output for spawn-broker.ts',
      '[codeweaver] starting item "Ward: lint + typecheck"',
    ],
  },
  q2: {
    items: ['Explore flows', 'Review flows', 'Observables', 'Implement', 'Ward', 'Final review'],
    log: [
      '[chaoswhisperer] flows drafted: 3 flows, 11 observables',
      '[chaoswhisperer] waiting for APPROVE on flows',
    ],
  },
  q3: {
    items: [
      'Contract: run folder',
      'Broker: resolve tool path',
      'Unit tests',
      'Ward',
      'Final review',
    ],
    log: ['[queue] approved, waiting for a free slot (3/4 in use)'],
  },
  q4: {
    items: [
      'Contract: hold notice',
      'Guardrail broker',
      'Dispatch toggle wiring',
      'Ward',
      'Final review',
    ],
    log: [
      '[guardrail] 5h window at 62%, hold armed',
      '[queue] dispatch holding until the 5h window resets (2h5m)',
    ],
  },
  q5: {
    items: ['Jest transform skip for CJS', 'Consumer check', 'Ward', 'Final review'],
    log: ['[ward] all checks passed', '[quest] complete in 41m'],
  },
  q6: { items: ['Popover', 'Confirm copy', 'Ward'], log: ['[quest] abandoned by you'] },
  q7: {
    items: [
      'Contract: console reading',
      'Broker: attach console listener',
      'Walk step: capture page errors',
      'Seed throwaway instance',
      'Siege: run the walk',
      'Final review',
    ],
    log: [
      '[siegemaster] booting throwaway instance on :4311',
      '[siegemaster] walk step 3/6: click #login',
      '[siegemaster] console: 1 error — TypeError: reading "map"',
      '[siegemaster] screenshot saved: walk-03.png',
    ],
  },
  q8: {
    items: ['Explore flows', 'Observables', 'Review observables', 'Implement', 'Ward'],
    log: [
      '[chaoswhisperer] 9 observables drafted',
      '[chaoswhisperer] waiting for APPROVE on observables',
    ],
  },
  q9: {
    items: [
      'Contract: diff reading',
      'Broker: pixel diff',
      'Report writer',
      'Ward',
      'Final review',
    ],
    log: ['[codeweaver] item "Report writer" paused by you', '[queue] 1 slot reserved'],
  },
  q10: {
    items: [
      'Contract: login form',
      'Widget: LoginForm',
      'Binding: useLogin',
      'Broker: POST /api/login',
      'Unit tests: LoginForm',
      'Integration: login flow',
      'Ward: lint + typecheck',
      'Fix lint leftovers',
    ],
    log: [
      '[codeweaver] wrote packages/web/src/widgets/login-form/login-form-widget.tsx',
      '[ward] lint: 1 error — react/jsx-key in login-form-widget.tsx',
      '[spiritmender] fixing react/jsx-key in login-form-widget.tsx',
      '[spiritmender] asked: keep a "remember me" cookie?',
    ],
  },
  q11: {
    items: ['Contract: address', 'Widget: AddressForm', 'Validation rules', 'Ward', 'Final review'],
    log: [
      '[ward] lint: 3 errors in address-form-widget.tsx',
      '[quest] blocked after 2 spiritmender attempts',
    ],
  },
  q12: {
    items: ['Theme tokens', 'Toggle widget', 'Persist choice', 'Ward'],
    log: ['[ward] all checks passed', '[quest] complete in 18m'],
  },
};
const DONE_COUNT = { q4: 2, q9: 3, q11: 4 };

const ledgerFor = (q) => {
  const info = QUEST_INFO[q.id] || FALLBACK_INFO;
  const act = ACTIVE.find((a) => a.id === q.id);
  const done = act ? act.done : q.status === 'complete' ? info.items.length : DONE_COUNT[q.id] || 0;
  return info.items.map((name, i) => ({
    name,
    state: i < done ? 'done' : i === done && act ? 'in progress' : 'pending',
  }));
};
const logFor = (q) => (QUEST_INFO[q.id] || FALLBACK_INFO).log;

const StoreCtx = React.createContext(null);
const useStore = () => React.useContext(StoreCtx);

let idCounter = 100;

function useCommandStore() {
  const [quests, setQuests] = useState(INIT_QUESTS);
  const [bounty, setBounty] = useState(INIT_BOUNTY);
  const [queued, setQueued] = useState(INIT_QUEUED);
  const [needs, setNeeds] = useState(INIT_NEEDS);
  const [activity, setActivity] = useState(INIT_ACTIVITY);
  const questById = (id) => quests.find((q) => q.id === id);
  const logLine = (text) => setActivity((a) => [{ t: 'now', text }, ...a].slice(0, 30));
  const setStatus = (id, status) =>
    setQuests((qs) => qs.map((q) => (q.id === id ? { ...q, status } : q)));
  const label = (q) => `${q.guild} / ${q.title}`;
  return {
    quests,
    bounty,
    queued,
    needs,
    activity,
    questById,
    approve: (id) => {
      const q = questById(id);
      setStatus(id, 'approved');
      setQueued((qq) => (qq.includes(id) ? qq : [...qq, id]));
      setNeeds((n) => n.filter((x) => !(x.id === id && x.kind === 'APPROVE')));
      logLine(`${label(q)} — approved by you`);
    },
    togglePause: (id) => {
      const q = questById(id);
      const paused = q.status === 'paused';
      setStatus(id, paused ? 'in_progress' : 'paused');
      logLine(`${label(q)} — ${paused ? 'resumed' : 'paused'} by you`);
    },
    answer: (nid, option) => {
      const n = needs.find((x) => x.nid === nid);
      setNeeds((ns) => ns.filter((x) => x.nid !== nid));
      logLine(`${label(questById(n.id))} — you answered "${option}"`);
    },
    retryWard: (nid) => {
      const n = needs.find((x) => x.nid === nid);
      setNeeds((ns) => ns.filter((x) => x.nid !== nid));
      logLine(`${label(questById(n.id))} — ward retry started`);
    },
    abandon: (bid) => {
      const b = bounty.find((x) => x.id === bid);
      setBounty((bs) => bs.map((x) => (x.id === bid ? { ...x, state: 'abandoned' } : x)));
      logLine(`${b.guild} — abandoned ${b.kind}: ${b.title}`);
    },
    promote: (bid) => {
      const b = bounty.find((x) => x.id === bid);
      idCounter += 1;
      const q = { id: `q${idCounter}`, guild: b.guild, title: b.title, status: 'created' };
      setQuests((qs) => [...qs, q]);
      setQueued((qq) => [...qq, q.id]);
      setBounty((bs) =>
        bs.map((x) =>
          x.id === bid ? { ...x, state: 'promoted', quest: q.title, questId: q.id } : x,
        ),
      );
      logLine(`${b.guild} — promoted "${b.title}" to a quest`);
      return q;
    },
    logDefect: (guild, text) => {
      idCounter += 1;
      const b = {
        id: `b${idCounter}`,
        guild,
        kind: 'DEFECT',
        origin: 'steward',
        title: text,
        age: '0m',
        state: 'live',
      };
      setBounty((bs) => [b, ...bs]);
      logLine(`${guild} — steward logged DEFECT: ${text}`);
      return b;
    },
  };
}

const mono = { fontFamily: 'monospace' };

/* ------------------------------------------------------------------ small pieces */

function Label({ children, right, style }) {
  const { theme } = useTheme();
  return (
    <div
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...style }}
    >
      <span style={{ ...mono, fontSize: 11, color: theme.colors['text-dim'] }}>{children}</span>
      {right}
    </div>
  );
}

function Chip({ children, color, solid, dim, style, onClick }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <span
      onClick={onClick}
      style={{
        ...mono,
        fontSize: 9,
        fontWeight: 600,
        padding: '1px 5px',
        borderRadius: 2,
        border: `1px solid ${c[color]}`,
        color: solid ? c['bg-deep'] : c[color],
        backgroundColor: solid ? c[color] : 'transparent',
        opacity: dim ? 0.6 : 1,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function StatusDot({ state }) {
  const { theme } = useTheme();
  const color = state === 'up' ? 'success' : state === 'degraded' ? 'warning' : 'danger';
  return <span style={{ color: theme.colors[color], fontSize: 10 }}>●</span>;
}

const bar = (done, total) => {
  const filled = Math.round((done / total) * 8);
  return '▰'.repeat(filled) + '▱'.repeat(8 - filled);
};

function Toggle({ on, onChange, label }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        ...mono,
        fontSize: 10,
        cursor: 'pointer',
        background: 'transparent',
        whiteSpace: 'nowrap',
        color: on ? c['loot-gold'] : c['text-dim'],
        border: `1px solid ${on ? c['loot-gold'] : c['border']}`,
        borderRadius: 2,
        padding: '3px 8px',
      }}
    >
      {on ? '[x]' : '[ ]'} {label}
    </button>
  );
}

/* ------------------------------------------------------------------ live band */

/* ------------------------------------------------------------------ left column */

const ICON = 38;

// One component serves the full column and the quest-mode rail, so every icon square sits at the
// same y in both: fixed-height header row, 38px icon rows, 1px divider, pinned bottom button.
function GuildsColumn({ selected, onSelect, laterOn, onAllSessions, compact }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { quests, bounty } = useStore();
  const activeCount = (g) =>
    quests.filter(
      (q) => (g === 'all' || q.guild === g) && !['complete', 'abandoned'].includes(q.status),
    ).length;
  const bountyCount = (g) =>
    bounty.filter(
      (b) => (g === 'all' || b.guild === g) && b.state === 'live' && (laterOn || !isLater(b)),
    ).length;
  const row = (id, name, glyph) => {
    const sel = selected === id;
    const n = activeCount(id);
    return (
      <button
        key={id}
        data-guild={id}
        onClick={() => onSelect(id)}
        title={id === 'all' ? 'All guilds' : `${name} · ${n} active`}
        style={{
          ...mono,
          textAlign: 'left',
          cursor: 'pointer',
          width: compact ? ICON : '100%',
          height: ICON,
          padding: 0,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          borderRadius: 2,
          color: sel ? c['loot-gold'] : c['text'],
          background: sel ? c['bg-raised'] : 'transparent',
          border: `1px solid ${sel ? c['loot-gold'] : c['border']}`,
        }}
      >
        <span
          style={{
            width: ICON - 2,
            height: ICON - 2,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {glyph}
          {id !== 'all' && (
            <span
              style={{ fontSize: 8, lineHeight: '8px', color: n ? c['primary'] : c['text-dim'] }}
            >
              {'●'.repeat(Math.min(n, 4))}
            </span>
          )}
        </span>
        {!compact && (
          <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: 12 }}>{name}</span>
            <span style={{ fontSize: 10, color: c['text-dim'] }}>
              <span style={{ color: n ? c['primary'] : c['text-dim'] }}>{n} active</span>
              {' · '}
              {bountyCount(id)} {bountyCount(id) === 1 ? 'bounty' : 'bounties'}
            </span>
          </span>
        )}
      </button>
    );
  };
  const gate = (
    <div
      style={{
        width: guildGateSize.width * 2,
        height: guildGateSize.height * 2,
        position: 'relative',
      }}
    >
      <PixelSprite
        pixels={guildGate}
        scale={2}
        width={guildGateSize.width}
        height={guildGateSize.height}
      />
    </div>
  );
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: '100%',
        alignItems: compact ? 'center' : 'stretch',
      }}
    >
      <div
        style={{
          height: 28,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: compact ? 'center' : 'space-between',
        }}
      >
        {!compact && <span style={{ ...mono, fontSize: 11, color: c['text-dim'] }}>GUILDS</span>}
        <PixelBtn label="+" variant="ghost" icon onClick={() => {}} title="Add guild" />
      </div>
      {row('all', 'ALL GUILDS', gate)}
      <div style={{ height: 1, background: c['border'], flexShrink: 0, alignSelf: 'stretch' }} />
      {GUILDS.map((g) => row(g.id, g.name, g.name.slice(0, 2).toUpperCase()))}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 12,
          alignSelf: 'stretch',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={onAllSessions}
          title="All sessions"
          style={{
            ...mono,
            fontSize: 11,
            width: compact ? ICON : '100%',
            height: 30,
            padding: 0,
            borderRadius: 2,
            cursor: 'pointer',
            color: c['text'],
            backgroundColor: c['bg-raised'],
            border: `1px solid ${c['border']}`,
          }}
        >
          {compact ? '≡' : 'ALL SESSIONS'}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ tabs */

function QuestsTab({ guild, onOpen }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { quests } = useStore();
  const rows = quests.filter((q) => guild === 'all' || q.guild === guild);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {rows.map((q) => (
        <div
          key={q.id}
          onClick={() => onOpen(q.id)}
          style={{
            ...mono,
            fontSize: 12,
            color: c['text'],
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '3px 8px',
            borderRadius: 2,
            cursor: 'pointer',
            opacity: q.status === 'abandoned' ? 0.5 : 1,
          }}
        >
          <span style={{ flex: 1, minWidth: 0 }}>
            {guild === 'all' && <span style={{ color: c['text-dim'] }}>{q.guild} / </span>}
            {q.title}
          </span>
          <span style={{ fontSize: 10, color: c[questStatusColorKey[q.status]], flexShrink: 0 }}>
            {STATUS_WORDS(q.status)}
          </span>
        </div>
      ))}
      {rows.length === 0 && (
        <span style={{ ...mono, fontSize: 11, color: c['text-dim'] }}>No quests yet</span>
      )}
    </div>
  );
}

function BountyActions({ b, onFocus }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { promote, abandon } = useStore();
  const [confirming, setConfirming] = useState(false);
  return (
    <div
      style={{
        border: `1px solid ${c['loot-gold']}`,
        borderRadius: 2,
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        background: c['bg-surface'],
      }}
    >
      <div style={{ ...mono, fontSize: 11, color: c['text'] }}>
        <span style={{ color: c['text-dim'] }}>
          SELECTED · {b.kind} · {b.guild}
        </span>
        <div style={{ marginTop: 2 }}>{b.title}</div>
      </div>
      {b.state === 'live' ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <PixelBtn
            label="PROMOTE TO QUEST"
            onClick={() => {
              const q = promote(b.id);
              onFocus && onFocus({ type: 'quest', id: q.id });
            }}
          />
          {confirming ? (
            <>
              <PixelBtn
                label="CONFIRM ABANDON"
                variant="danger"
                onClick={() => {
                  setConfirming(false);
                  abandon(b.id);
                }}
              />
              <PixelBtn label="CANCEL" variant="ghost" onClick={() => setConfirming(false)} />
            </>
          ) : (
            <PixelBtn label="ABANDON" variant="ghost" onClick={() => setConfirming(true)} />
          )}
        </div>
      ) : (
        <span
          style={{
            ...mono,
            fontSize: 10,
            color: b.state === 'promoted' ? c['loot-rare'] : c['text-dim'],
          }}
        >
          {b.state === 'promoted' ? `PROMOTED ↗ ${b.quest}` : 'ABANDONED'}
        </span>
      )}
    </div>
  );
}

function BountyTab({ guild, laterOn, onRowClick, highlight: extHighlight, compact, onFocusQuest }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { bounty } = useStore();
  const [kinds, setKinds] = useState(new Set());
  const [ownHighlight, setHighlight] = useState(null);
  const highlight = ownHighlight ?? extHighlight;
  const selected = compact ? bounty.find((b) => b.id === highlight) : null;
  const rows = bounty.filter(
    (b) =>
      (guild === 'all' || b.guild === guild) &&
      (laterOn || !isLater(b)) &&
      (kinds.size === 0 || kinds.has(b.kind)),
  );
  const toggle = (k) => {
    const n = new Set(kinds);
    n.has(k) ? n.delete(k) : n.add(k);
    setKinds(n);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ ...mono, fontSize: 10, color: c['text-dim'] }}>KIND</span>
        {KIND_ORDER.map((k) => (
          <Chip
            key={k}
            color={KIND_COLOR[k]}
            solid={kinds.has(k)}
            style={{ cursor: 'pointer' }}
            onClick={() => toggle(k)}
          >
            {k}
          </Chip>
        ))}
        {kinds.size > 0 && (
          <span
            onClick={() => setKinds(new Set())}
            style={{ ...mono, fontSize: 10, color: c['text-dim'], cursor: 'pointer' }}
          >
            clear
          </span>
        )}
      </div>
      {selected && <BountyActions b={selected} onFocus={onFocusQuest} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {rows.map((b) => {
          const abandoned = b.state === 'abandoned';
          const hl = highlight === b.id;
          return (
            <div
              key={b.id}
              onClick={() => {
                setHighlight(b.id);
                onRowClick && onRowClick(b);
              }}
              style={{
                ...mono,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '3px 8px',
                flexWrap: compact ? 'wrap' : 'nowrap',
                borderRadius: 2,
                cursor: 'pointer',
                opacity: abandoned ? 0.45 : 1,
                backgroundColor: hl ? c['bg-raised'] : 'transparent',
                borderLeft: `2px solid ${hl ? c['loot-gold'] : 'transparent'}`,
              }}
            >
              <Chip
                color={KIND_COLOR[b.kind]}
                style={{ width: 62, textAlign: 'center', flexShrink: 0, boxSizing: 'border-box' }}
              >
                {b.kind}
              </Chip>
              <span
                style={{
                  flex: compact ? '1 1 0' : 1,
                  minWidth: 0,
                  color: c['text'],
                  textDecoration: abandoned ? 'line-through' : 'none',
                }}
              >
                {guild === 'all' && <span style={{ color: c['text-dim'] }}>{b.guild} / </span>}
                {b.title}
                {b.count && (
                  <span
                    style={{ color: c['danger'], marginLeft: 6, fontWeight: 600 }}
                    title="repeats merge into one row"
                  >
                    ×{b.count}
                  </span>
                )}
              </span>
              <div
                style={
                  compact
                    ? {
                        flex: '1 0 100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        paddingLeft: 70,
                      }
                    : { display: 'contents' }
                }
              >
                {b.state === 'promoted' && (
                  <span
                    style={{
                      fontSize: 10,
                      color: c['loot-rare'],
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                    title={b.quest}
                  >
                    ↗ {b.quest.length > 20 ? b.quest.slice(0, 19) + '…' : b.quest}
                  </span>
                )}
                {b.state === 'live' && (
                  <span style={{ fontSize: 10, color: c['success'], flexShrink: 0 }}>LIVE</span>
                )}
                {abandoned && (
                  <span style={{ fontSize: 10, color: c['text-dim'], flexShrink: 0 }}>
                    ABANDONED
                  </span>
                )}
                <span
                  style={{
                    fontSize: 10,
                    color: c['text-dim'],
                    width: 46,
                    textAlign: 'right',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ORIGIN_TAG[b.origin]}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: c['text-dim'],
                    width: 26,
                    textAlign: 'right',
                    flexShrink: 0,
                  }}
                >
                  {b.age}
                </span>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <span style={{ ...mono, fontSize: 11, color: c['text-dim'] }}>Nothing on the board</span>
        )}
      </div>
    </div>
  );
}

function SessionsTab({ guild }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const rows = SESSIONS.filter((s) => guild === 'all' || s.guild === guild);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {rows.map((s, i) => (
        <div
          key={i}
          style={{
            ...mono,
            fontSize: 12,
            color: c['text'],
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '3px 8px',
            borderRadius: 2,
            cursor: 'pointer',
          }}
        >
          <span style={{ flex: 1, minWidth: 0 }}>
            {guild === 'all' && <span style={{ color: c['text-dim'] }}>{s.guild} / </span>}
            {s.summary}
          </span>
          {s.quest && (
            <Chip color="primary" dim>
              QUEST
            </Chip>
          )}
          {s.status && (
            <span style={{ fontSize: 10, color: c[questStatusColorKey[s.status]] }}>
              {STATUS_WORDS(s.status)}
            </span>
          )}
          <span style={{ fontSize: 10, color: c['text-dim'], width: 28, textAlign: 'right' }}>
            {s.age}
          </span>
        </div>
      ))}
    </div>
  );
}

function Tabs({ guild, laterOn, onFocus, onOpen, onOpenBounty, tab, setTab }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { bounty } = useStore();
  const bountyCount = bounty.filter(
    (b) => (guild === 'all' || b.guild === guild) && b.state === 'live' && (laterOn || !isLater(b)),
  ).length;
  const hints = {
    quests: '+ start a quest, or tell the steward what you need',
    bounty: '+ add an idea, or tell the steward',
    sessions: 'sessions appear here as agents run',
  };
  const tabs = [
    { id: 'quests', label: 'QUESTS' },
    { id: 'bounty', label: `BOUNTY BOARD (${bountyCount})` },
    { id: 'sessions', label: 'SESSIONS' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${c['border']}`,
          flexShrink: 0,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...mono,
              fontSize: 10,
              fontWeight: 600,
              padding: '5px 12px',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              color: tab === t.id ? c['primary'] : c['text-dim'],
              borderBottom: `2px solid ${tab === t.id ? c['primary'] : 'transparent'}`,
            }}
          >
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <PixelBtn
          label="+"
          variant="ghost"
          icon
          onClick={() => {}}
          title="New quest / idea / defect"
        />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 0' }}>
        {tab === 'quests' && <QuestsTab guild={guild} onOpen={onOpen} />}
        {tab === 'bounty' && (
          <BountyTab guild={guild} laterOn={laterOn} onRowClick={(b) => onOpenBounty(b.id)} />
        )}
        {tab === 'sessions' && <SessionsTab guild={guild} />}
        <div
          style={{
            ...mono,
            fontSize: 10,
            color: c['text-dim'],
            opacity: 0.6,
            textAlign: 'center',
            marginTop: 18,
          }}
        >
          {hints[tab]}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ steward chat */

function Bubble({ who, text, link, onLink }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const color = who === 'you' ? c['loot-gold'] : c['primary'];
  return (
    <div
      style={{
        padding: '4px 10px',
        borderRadius: 2,
        textAlign: 'left',
        backgroundColor: who === 'you' ? c['bg-raised'] : 'transparent',
        borderLeft: `2px solid ${color}`,
        borderRight: `2px solid ${color}`,
      }}
    >
      <div style={{ ...mono, fontSize: 10, fontWeight: 600, color, marginBottom: 1 }}>
        {who === 'you' ? 'YOU' : 'STEWARD'}
      </div>
      <div
        style={{
          ...mono,
          fontSize: 11,
          color: c['text'],
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {text}
        {link && (
          <span onClick={onLink} style={{ color: c['primary'], marginLeft: 6, cursor: 'pointer' }}>
            [{link}]
          </span>
        )}
      </div>
    </div>
  );
}

const STOP_WORDS = new Set([
  'the',
  'page',
  'quest',
  'me',
  'show',
  'focus',
  'on',
  'to',
  'open',
  'a',
]);

// Canned steward: maps the user's text to a reply and an optional focus change.
// Runs store actions directly (log a defect, promote) and returns what to say.
const stewardReply = (text, store, selectedGuild) => {
  const t = text.trim().toLowerCase();
  const ld = text
    .trim()
    .match(/^log (?:a |an )?(?:defect|def|bug)(?: in| to| for| on)? ([a-z0-9-]+)\s*:\s*(.+)$/i);
  if (ld) {
    const g = GUILDS.find((x) => x.id === ld[1].toLowerCase());
    if (!g) return { text: `I do not know a guild called "${ld[1]}".` };
    const b = store.logDefect(g.id, ld[2].trim());
    return {
      text: `Logged DEF in ${g.name}`,
      link: 'open ↗',
      linkFocus: { type: 'bounties', guild: g.id, highlight: b.id },
    };
  }
  const ldNoGuild = text.trim().match(/^log (?:a |an )?(?:defect|def|bug)\s*:\s*(.+)$/i);
  if (ldNoGuild) {
    if (selectedGuild === 'all')
      return { text: 'Which guild? Try: log a defect in codex: ' + ldNoGuild[1].trim() };
    const b = store.logDefect(selectedGuild, ldNoGuild[1].trim());
    return {
      text: `Logged DEF in ${selectedGuild}`,
      link: 'open ↗',
      linkFocus: { type: 'bounties', guild: selectedGuild, highlight: b.id },
    };
  }
  const pr = t.match(/^promote (.+)$/);
  if (pr) {
    const words = pr[1]
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w && !STOP_WORDS.has(w) && !['idea', 'defect', 'bounty', 'about'].includes(w));
    const hit = store.bounty.find(
      (b) =>
        b.state === 'live' &&
        words.length > 0 &&
        words.every((w) => b.title.toLowerCase().includes(w)),
    );
    if (!hit) return { text: `I could not find a live bounty matching "${pr[1]}".` };
    const q = store.promote(hit.id);
    return {
      text: `Promoted "${hit.title}" to a quest in ${hit.guild}. It is at the end of the queue.`,
      link: 'open ↗',
      linkFocus: { type: 'quest', id: q.id },
    };
  }
  if (/^(show( me)?( the)? )?health$/.test(t) || /\bhealth\b/.test(t)) {
    return { text: 'Focused the right pane on HEALTH.', focus: { type: 'health' } };
  }
  const b = t.match(/bount(?:y|ies)(?: board)?(?: for| in| of)? ([a-z0-9-]+)/);
  if (b) {
    const g = GUILDS.find((x) => x.id === b[1]);
    if (g)
      return {
        text: `Focused the right pane on bounties for ${g.name}.`,
        focus: { type: 'bounties', guild: g.id },
      };
  }
  const f = t.match(/^(?:focus(?: on)?|show me|open)\s+(.+)$/);
  if (f) {
    const words = f[1]
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w && !STOP_WORDS.has(w));
    const scored = store.quests
      .map((q) => ({ q, hit: words.filter((w) => q.title.toLowerCase().includes(w)).length }))
      .filter((x) => words.length > 0 && x.hit === words.length)
      .sort((a, b2) => b2.hit - a.hit);
    if (scored.length) {
      const q = scored[0].q;
      return { text: `Focused the right pane on ${q.title}.`, focus: { type: 'quest', id: q.id } };
    }
    return { text: `I could not find a quest matching "${f[1]}".` };
  }
  if (/block/.test(t)) {
    return {
      text: 'Two quests are blocked: codex / Rate-limit guardrail holds the queue (waiting on the 5h window) and acme-web / Checkout address form validation (failing ward lint).',
    };
  }
  return {
    text: "I can focus the right pane for you: try 'focus login page', 'show health' or 'show bounties for siegelense'. Otherwise I'll just answer here.",
  };
};

function StewardChat({ selected, msgs, onSend, onNewChat, onFocus }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);
  useEffect(() => {
    if (endRef.current) endRef.current.scrollTop = endRef.current.scrollHeight;
  }, [msgs]);
  const send = () => {
    if (!draft.trim()) return;
    onSend(draft);
    setDraft('');
  };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '55%',
        flex: '0 0 auto',
        borderTop: `1px solid ${c['border']}`,
        paddingTop: 6,
        minHeight: 0,
      }}
    >
      {msgs.length > 0 && (
        <div
          ref={endRef}
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            paddingBottom: 6,
          }}
        >
          {msgs.map((m, i) => (
            <Bubble
              key={i}
              who={m.who}
              text={m.text}
              link={m.link}
              onLink={() => m.linkFocus && onFocus(m.linkFocus)}
            />
          ))}
        </div>
      )}
      {msgs.length === 0 && (
        <div
          style={{ ...mono, fontSize: 10, color: c['text-dim'], paddingBottom: 4, flexShrink: 0 }}
        >
          try: show health · show me the login page · show bounties for siegelense · log a defect in
          codex: …
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <span style={{ ...mono, fontSize: 10, fontWeight: 600, color: c['primary'] }}>STEWARD</span>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask the steward..."
          rows={1}
          style={{
            ...mono,
            fontSize: 12,
            flex: 1,
            resize: 'none',
            color: c['text'],
            backgroundColor: c['bg-deep'],
            border: `1px solid ${c['border']}`,
            borderRadius: 2,
            padding: 8,
            outline: 'none',
            lineHeight: 1.4,
            minWidth: 0,
          }}
        />
        <button
          onClick={send}
          style={{
            ...mono,
            width: 34,
            height: 34,
            fontSize: 16,
            cursor: 'pointer',
            color: c['bg-deep'],
            backgroundColor: c['primary'],
            border: `1px solid ${c['border']}`,
            borderRadius: 2,
          }}
        >
          ▶
        </button>
        <PixelBtn
          label="NEW CHAT"
          variant="ghost"
          onClick={onNewChat}
          disabled={msgs.length === 0}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ focus pane */

function PaneHeader({ focus, onBack }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { questById } = useStore();
  const home = focus.type === 'overview';
  let crumb = '';
  if (focus.type === 'quest') crumb = `FOCUS · ${questById(focus.id).title}`;
  if (focus.type === 'health') crumb = 'FOCUS · HEALTH';
  if (focus.type === 'activity') crumb = 'FOCUS · ACTIVITY';
  if (focus.type === 'bounties') crumb = `FOCUS · BOUNTIES · ${focus.guild}`;
  return (
    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        onClick={home ? undefined : onBack}
        style={{
          ...mono,
          fontSize: 11,
          fontWeight: 600,
          width: '100%',
          padding: '5px 12px',
          borderRadius: 2,
          cursor: home ? 'default' : 'pointer',
          textAlign: 'center',
          color: home ? c['loot-gold'] : c['text'],
          backgroundColor: home ? c['bg-raised'] : c['bg-surface'],
          border: `1px solid ${home ? c['loot-gold'] : c['border']}`,
        }}
      >
        {home ? 'RAID' : '← RAID'}
      </button>
      {!home && (
        <div
          style={{
            ...mono,
            fontSize: 11,
            fontWeight: 600,
            color: c['loot-gold'],
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            borderBottom: `1px solid ${c['border']}`,
            paddingBottom: 4,
          }}
        >
          {crumb}
        </div>
      )}
    </div>
  );
}

function Callout({ color, title, children }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <div
      style={{
        border: `1px solid ${c[color]}`,
        borderRadius: 2,
        padding: '6px 8px',
        background: c['bg-surface'],
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span style={{ ...mono, fontSize: 10, fontWeight: 600, color: c[color] }}>{title}</span>
      {children}
    </div>
  );
}

function QuestFocus({ id, nid, onOpen }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { questById, needs, queued, approve, togglePause, answer, retryWard } = useStore();
  const [resolving, setResolving] = useState(null);
  const [shown, setShown] = useState(null);
  const q = questById(id);
  const act = ACTIVE.find((a) => a.id === id);
  const ledger = ledgerFor(q);
  const myNeeds = needs.filter((n) => n.id === id);
  const stateColor = { done: 'success', 'in progress': 'primary', pending: 'text-dim' };
  const glyph = { done: '✓', 'in progress': '▶', pending: '○' };
  const awaiting = ['review_flows', 'review_observables'].includes(q.status);
  const finished = ['complete', 'abandoned'].includes(q.status);
  const play = (kind, action) => {
    setShown(myNeeds.find((n) => n.kind === kind) || null);
    setResolving(kind);
    setTimeout(() => {
      action();
      setResolving(null);
      setShown(null);
    }, 950);
  };
  const needForScene = shown || (nid ? needs.find((n) => n.nid === nid) : null);
  const laneBase = RAID_LANES.find((l) => l.id === id);
  const lane = laneBase ? { ...laneBase, title: q.title, elapsed: act.elapsed } : null;
  const qIdx = queued.indexOf(id);
  const queuedLane =
    qIdx >= 0
      ? { id, guild: q.guild, title: q.title, hero: ['owl', 'raccoon', 'rat', 'frog'][qIdx % 4] }
      : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <FocusScene
        need={needForScene}
        lane={lane}
        queuedLane={queuedLane}
        queuedIndex={qIdx}
        resolving={resolving}
      />
      <div>
        <div style={{ ...mono, fontSize: 13, fontWeight: 600, color: c['loot-gold'] }}>
          {q.title}
        </div>
        <div
          style={{
            ...mono,
            fontSize: 11,
            color: c['text-dim'],
            marginTop: 2,
            display: 'flex',
            gap: '2px 10px',
            flexWrap: 'wrap',
          }}
        >
          <span>
            guild <span style={{ color: c['text'] }}>{q.guild}</span>
          </span>
          <span>
            status{' '}
            <span style={{ color: c[questStatusColorKey[q.status]] }}>
              {STATUS_WORDS(q.status)}
            </span>
          </span>
          <span>
            role <span style={{ color: c['primary'] }}>{act ? act.role : '—'}</span>
          </span>
          {act && (
            <span>
              elapsed <span style={{ color: c['text'] }}>{act.elapsed}</span>
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {awaiting && (
            <PixelBtn
              label="APPROVE"
              disabled={resolving !== null}
              onClick={() => play('APPROVE', () => approve(id))}
            />
          )}
          <PixelBtn label="OPEN QUEST ↗" variant="ghost" onClick={() => onOpen(id)} />
          <PixelBtn
            label={q.status === 'paused' ? 'RESUME' : 'PAUSE'}
            variant="ghost"
            disabled={finished}
            onClick={() => togglePause(id)}
          />
        </div>
      </div>
      {myNeeds
        .filter((n) => n.kind === 'QUESTION')
        .map((n) => (
          <Callout key={n.nid} color="loot-rare" title="QUESTION FROM AGENT">
            <span style={{ ...mono, fontSize: 12, color: c['text'] }}>{n.note}</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {n.options.map((o) => (
                <PixelBtn
                  key={o}
                  label={o}
                  variant="ghost"
                  onClick={() => play('QUESTION', () => answer(n.nid, o))}
                />
              ))}
            </div>
          </Callout>
        ))}
      {myNeeds
        .filter((n) => n.kind === 'WARD FAIL')
        .map((n) => (
          <Callout key={n.nid} color="warning" title="WARD FAILED">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {n.files.map((f) => {
                const [path, rule] = f.split(/\s{2,}/);
                return (
                  <span
                    key={f}
                    style={{ ...mono, fontSize: 10, color: c['text'], wordBreak: 'break-all' }}
                  >
                    {path} <span style={{ color: c['warning'], whiteSpace: 'nowrap' }}>{rule}</span>
                  </span>
                );
              })}
            </div>
            <div>
              <PixelBtn
                label="RETRY WARD"
                variant="ghost"
                onClick={() => play('WARD FAIL', () => retryWard(n.nid))}
              />
            </div>
          </Callout>
        ))}
      <div>
        <Label>WORK ITEMS</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 4 }}>
          {ledger.map((it) => (
            <div
              key={it.name}
              style={{
                ...mono,
                fontSize: 11,
                display: 'flex',
                gap: 8,
                padding: '2px 8px',
                background: it.state === 'in progress' ? c['bg-raised'] : 'transparent',
                borderLeft: `2px solid ${it.state === 'in progress' ? c['primary'] : 'transparent'}`,
                opacity: it.state === 'pending' ? 0.7 : 1,
              }}
            >
              <span style={{ color: c[stateColor[it.state]], width: 12 }}>{glyph[it.state]}</span>
              <span style={{ flex: 1, color: c['text'] }}>{it.name}</span>
              <span style={{ fontSize: 10, color: c[stateColor[it.state]] }}>
                {it.state.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label>LOG</Label>
        <div
          style={{
            marginTop: 4,
            background: c['bg-deep'],
            border: `1px solid ${c['border']}`,
            borderRadius: 2,
            padding: '6px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {logFor(q).map((l, i) => (
            <div
              key={i}
              style={{ ...mono, fontSize: 10, color: c['text-dim'], wordBreak: 'break-word' }}
            >
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ health */

function HealthStrip({ laterOn, active, onClick, playing, narrow }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const o = BACKENDS.orchestrator;
  const cell = { ...mono, fontSize: 11, color: c['text-dim'], whiteSpace: 'nowrap' };
  const sep = <span style={{ color: c['border'] }}>│</span>;
  return (
    <button
      onClick={onClick}
      title="Show health in the focus pane"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        background: 'transparent',
        border: `1px solid ${active ? c['loot-gold'] : c['border']}`,
        borderRadius: 2,
        padding: '4px 10px',
      }}
    >
      <span style={cell}>
        <span style={{ color: playing ? c['success'] : c['warning'] }}>●</span>{' '}
        {playing ? 'dispatch' : 'paused'} {o.slotsUsed}/{o.slotsTotal}
      </span>
      {sep}
      <span style={cell}>
        claude <span style={{ color: c['warning'] }}>▰▰▰▰▰▱▱▱ 62%</span>
      </span>
      {sep}
      <span style={cell}>
        {BACKENDS.local.map((b) => (
          <span key={b.name} style={{ marginRight: 6 }}>
            <StatusDot state={b.state} />
            {narrow ? '' : ` ${b.name.split(' · ')[0]}`}
          </span>
        ))}
      </span>
      {laterOn && (
        <>
          {sep}
          <span style={{ ...cell, color: c['danger'] }}>⚠ {BACKENDS.errors.count} err/1h</span>
        </>
      )}
    </button>
  );
}

function Stat({ k, v, color }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <span style={{ ...mono, fontSize: 10, color: c['text-dim'], whiteSpace: 'nowrap' }}>
      {k} <span style={{ color: c[color || 'text'] }}>{v}</span>
    </span>
  );
}

function BackendCard({ b, children }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const errHigh = parseFloat(b.err) >= 5;
  const pct = b.vram ? Math.round((b.vram[0] / b.vram[1]) * 8) : 0;
  return (
    <div
      style={{
        border: `1px solid ${c['border']}`,
        background: c['bg-surface'],
        borderRadius: 2,
        padding: '6px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
      }}
    >
      <div
        style={{
          ...mono,
          fontSize: 11,
          color: c['text'],
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {b.name}
        </span>
        <span
          style={{
            color: c[b.state === 'up' ? 'success' : b.state === 'degraded' ? 'warning' : 'danger'],
            whiteSpace: 'nowrap',
          }}
        >
          <StatusDot state={b.state} /> {b.state.toUpperCase()}
        </span>
      </div>
      {children}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
        <Stat k="p50" v={b.p50} />
        <Stat k="p95" v={b.p95} color={b.state === 'degraded' ? 'warning' : undefined} />
        <Stat k="tok/s" v={b.tps} />
        <Stat k="in flight" v={b.inflight} />
        <Stat k="err 1h" v={b.err} color={errHigh ? 'danger' : undefined} />
      </div>
      {b.vram && (
        <div style={{ ...mono, fontSize: 10, color: c['text-dim'] }}>
          {b.gpu} VRAM{' '}
          <span style={{ color: c[b.vram[0] / b.vram[1] >= 0.9 ? 'warning' : 'text'] }}>
            {b.vram[0]}/{b.vram[1]} GB
          </span>{' '}
          {'▰'.repeat(pct) + '▱'.repeat(8 - pct)}
        </div>
      )}
    </div>
  );
}

function HealthView({ laterOn, playing }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const o = BACKENDS.orchestrator;
  const cl = BACKENDS.claude;
  const routes = ROLE_ROUTING.filter((r) => laterOn || !r.local);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <Label>ORCHESTRATOR</Label>
        <div
          style={{
            border: `1px solid ${c['border']}`,
            background: c['bg-surface'],
            borderRadius: 2,
            padding: '6px 10px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '3px 16px',
            marginTop: 4,
          }}
        >
          <Stat
            k="dispatch"
            v={playing ? 'PLAYING' : 'PAUSED'}
            color={playing ? 'success' : 'warning'}
          />
          <Stat k="slots" v={`${o.slotsUsed}/${o.slotsTotal}`} />
          <Stat k="event-loop lag" v={o.lag} />
          <Stat k="uptime" v={o.uptime} />
        </div>
      </div>
      <div>
        <Label>MODEL BACKENDS</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          <BackendCard b={cl}>
            <div style={{ display: 'flex', gap: '2px 14px', flexWrap: 'wrap' }}>
              {cl.windows.map((w) => (
                <RateLimitCard key={w.label} label={w.label} pct={w.pct} reset={w.reset} />
              ))}
            </div>
          </BackendCard>
          {BACKENDS.local.map((b) => (
            <BackendCard key={b.name} b={b} />
          ))}
        </div>
      </div>
      <div>
        <Label>ROLE ROUTING</Label>
        <div
          style={{
            border: `1px solid ${c['border']}`,
            background: c['bg-surface'],
            borderRadius: 2,
            marginTop: 4,
            padding: '4px 0',
          }}
        >
          <div
            style={{
              ...mono,
              fontSize: 9,
              color: c['text-dim'],
              display: 'grid',
              gridTemplateColumns: '100px 1fr 56px',
              gap: 8,
              padding: '0 10px 2px',
            }}
          >
            <span>ROLE</span>
            <span>BACKEND</span>
            <span style={{ textAlign: 'right' }}>REQ / 1h</span>
          </div>
          {routes.map((r) => (
            <div
              key={r.role}
              style={{
                ...mono,
                fontSize: 11,
                display: 'grid',
                gridTemplateColumns: '100px 1fr 56px',
                gap: 8,
                padding: '2px 10px',
              }}
            >
              <span style={{ color: c['primary'] }}>{r.role}</span>
              <span
                style={{
                  color: r.req === null ? c['text-dim'] : c['text'],
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                → {r.backend}
              </span>
              <span style={{ textAlign: 'right', color: c['text-dim'] }}>
                {r.req === null ? '—' : r.req}
              </span>
            </div>
          ))}
        </div>
      </div>
      {laterOn && (
        <div>
          <Label>SERVER ERRORS · 1h</Label>
          <div
            style={{
              border: `1px solid ${c['border']}`,
              background: c['bg-surface'],
              borderRadius: 2,
              padding: '6px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              marginTop: 4,
            }}
          >
            <span style={{ ...mono, fontSize: 11, color: c['danger'] }}>
              {BACKENDS.errors.count} errors · last {BACKENDS.errors.at}
            </span>
            <span style={{ ...mono, fontSize: 10, color: c['text-dim'], wordBreak: 'break-word' }}>
              {BACKENDS.errors.last}
            </span>
            <span style={{ ...mono, fontSize: 10, color: c['loot-rare'] }}>
              → merged into DEFECT rows on the bounty board
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ page */

function ResizablePane({ storageKey, defaultWidth, children }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const key = `cc-pane-w-${storageKey}`;
  const [w, setW] = useState(() => {
    try {
      const v = Number(window.localStorage.getItem(key));
      return v > 0 ? v : null;
    } catch (e) {
      return null;
    }
  });
  const [drag, setDrag] = useState(false);
  const [hover, setHover] = useState(false);
  const paneRef = useRef(null);
  const hot = drag || hover;
  const onDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = paneRef.current.getBoundingClientRect().width;
    const max = paneRef.current.parentElement.getBoundingClientRect().width * 0.6;
    let last = startW;
    setDrag(true);
    document.body.style.userSelect = 'none';
    const move = (ev) => {
      last = Math.max(320, Math.min(max, startW - (ev.clientX - startX)));
      setW(last);
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      document.body.style.userSelect = '';
      setDrag(false);
      try {
        window.localStorage.setItem(key, String(Math.round(last)));
      } catch (er) {
        /* storage unavailable */
      }
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  return (
    <>
      <div
        data-handle={storageKey}
        onMouseDown={onDown}
        onDoubleClick={() => {
          setW(null);
          try {
            window.localStorage.removeItem(key);
          } catch (e) {
            /* storage unavailable */
          }
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        title="Drag to resize · double-click to reset"
        style={{
          flex: '0 0 8px',
          width: 8,
          margin: '0 -10px',
          cursor: 'col-resize',
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: hot ? `${c['loot-gold']}22` : 'transparent',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            width: 1,
            background: hot ? c['loot-gold'] : c['border'],
          }}
        />
        <div
          style={{
            position: 'relative',
            ...mono,
            fontSize: 12,
            width: 8,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: c['bg-raised'],
            border: `1px solid ${hot ? c['loot-gold'] : c['border']}`,
            borderRadius: 2,
            color: hot ? c['loot-gold'] : c['text-dim'],
          }}
        >
          ⋮
        </div>
      </div>
      <div
        ref={paneRef}
        data-pane={storageKey}
        style={{
          flex: '0 0 auto',
          width: w ?? defaultWidth,
          minWidth: 320,
          maxWidth: '60%',
          boxSizing: 'border-box',
          overflow: 'hidden',
          paddingLeft: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 0,
        }}
      >
        {children}
      </div>
    </>
  );
}

function LiveChip({ needs, running, queued, playing, onToggle, onClick, title, narrow }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        border: `1px solid ${c['border']}`,
        borderRadius: 2,
        padding: '3px 4px 3px 8px',
        background: c['bg-surface'],
      }}
    >
      <span
        onClick={onClick}
        title={title}
        style={{ ...mono, fontSize: 11, color: c['text'], cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        <span style={{ color: c['primary'] }}>⚔</span>{' '}
        <span style={{ color: needs ? c['danger'] : c['text-dim'] }}>
          {needs} {narrow ? 'need' : 'need you'}
        </span>{' '}
        · {running} {narrow ? 'run' : 'running'} · {queued} {narrow ? 'q' : 'queued'}
      </span>
      <button
        onClick={onToggle}
        title="Dispatch play / pause"
        style={{
          ...mono,
          fontSize: 9,
          cursor: 'pointer',
          color: c['bg-deep'],
          background: c['primary'],
          border: `1px solid ${c['border']}`,
          borderRadius: 2,
          padding: '1px 6px',
        }}
      >
        {playing ? 'PAUSE' : 'PLAY'}
      </button>
    </div>
  );
}

export function CommandCenterPage() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [guild, setGuild] = useState('codex');
  const [laterOn, setLaterOn] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [focus, setFocus] = useState({ type: 'overview' });
  const [msgs, setMsgs] = useState([]);
  const [tab, setTab] = useState('quests');
  const [openQuest, setOpenQuest] = useState(null);
  const store = useCommandStore();
  const [lastOpened, setLastOpened] = useState(null);
  const [openBounty, setOpenBounty] = useState(null);
  const [narrow, setNarrow] = useState(() => window.innerWidth < 1400);
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 1400);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const openQuestMode = (id) => {
    setOpenQuest(id);
    setOpenBounty(null);
    setLastOpened(id);
  };
  const openBountyMode = (id) => {
    setOpenBounty(id);
    setOpenQuest(null);
  };
  const focusOrOpen = (f) => {
    if (f.type === 'bounties' && f.highlight) openBountyMode(f.highlight);
    else setFocus(f);
  };
  useEffect(() => {
    if (!openQuest && !openBounty) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpenQuest(null);
        setOpenBounty(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openQuest, openBounty]);
  const openQ = openQuest ? store.questById(openQuest) : null;
  const running = RAID_LANES.map((l) => ({
    ...l,
    title: store.questById(l.id).title,
    elapsed: ACTIVE.find((a) => a.id === l.id).elapsed,
  }));
  const queuedLanes = store.queued.map((id, i) => ({
    id,
    guild: store.questById(id).guild,
    title: store.questById(id).title,
    hero: ['owl', 'raccoon', 'rat', 'frog'][i % 4],
  }));
  const openB = openBounty ? store.bounty.find((b) => b.id === openBounty) : null;
  const needsFull = store.needs.map((n) => ({
    ...n,
    guild: store.questById(n.id).guild,
    title: store.questById(n.id).title,
  }));
  const showChip = Boolean(openQ) || Boolean(openB) || focus.type !== 'overview';
  const backToRaid = () => {
    setOpenQuest(null);
    setOpenBounty(null);
    setFocus({ type: 'overview' });
  };

  const send = (text) => {
    const r = stewardReply(text, store, guild);
    setMsgs((m) => [
      ...m,
      { who: 'you', text },
      { who: 'steward', text: r.text, link: r.link, linkFocus: r.linkFocus },
    ]);
    if (r.focus) focusOrOpen(r.focus);
  };

  const colBorder = `1px solid ${c['border']}`;
  const guildName = guild === 'all' ? 'ALL GUILDS' : guild;

  return (
    <StoreCtx.Provider value={store}>
      <div
        style={{
          paddingTop: 44,
          height: '100vh',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          color: c['text'],
          fontFamily: 'monospace',
        }}
      >
        <style>{globalCss(c)}</style>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 16px',
            gap: 16,
            flexShrink: 0,
          }}
        >
          <Logo scale={2} fontSize={3} gap={14} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'nowrap',
              justifyContent: 'flex-end',
            }}
          >
            {showChip && (
              <LiveChip
                narrow={narrow}
                needs={store.needs.length}
                running={running.length}
                queued={store.queued.length}
                playing={playing}
                onToggle={() => setPlaying(!playing)}
                onClick={backToRaid}
                title={
                  openQ
                    ? `Open quest: ${openQ.guild} / ${openQ.title} — click for the command center`
                    : openB
                      ? `Open bounty: ${openB.title} — click for the command center`
                      : 'Back to the RAID'
                }
              />
            )}
            <HealthStrip
              narrow={narrow}
              laterOn={laterOn}
              active={focus.type === 'health'}
              onClick={() => setFocus({ type: 'health' })}
              playing={playing}
            />
            <Toggle on={laterOn} onChange={setLaterOn} label="Show later features" />
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', padding: '0 16px 16px' }}>
          <MapFrame padding={12}>
            {openQ || openB ? (
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  minHeight: 0,
                  gap: 16,
                  paddingBottom: 8,
                  paddingTop: 6,
                }}
              >
                <div
                  style={{
                    flex: '0 0 48px',
                    width: 48,
                    borderRight: colBorder,
                    paddingRight: 8,
                    overflowY: 'auto',
                  }}
                >
                  <GuildsColumn
                    compact
                    selected={(openQ || openB).guild}
                    onSelect={(g) => {
                      setGuild(g);
                      setOpenQuest(null);
                      setOpenBounty(null);
                    }}
                    laterOn={laterOn}
                    onAllSessions={() => {
                      setGuild('all');
                      setTab('sessions');
                      setOpenQuest(null);
                      setOpenBounty(null);
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                  }}
                >
                  {openQ ? (
                    <QuestChat key={openQ.id} quest={openQ} onBack={() => setOpenQuest(null)} />
                  ) : (
                    <SparkwrightChat
                      key={openB.id}
                      bounty={openB}
                      onBack={() => setOpenBounty(null)}
                    />
                  )}
                </div>
                <ResizablePane
                  key={openQ ? 'quest' : 'bounty'}
                  storageKey={openQ ? 'quest' : 'bounty'}
                  defaultWidth="40%"
                >
                  {openQ ? (
                    <QuestSpecPanel key={openQ.id} quest={openQ} />
                  ) : (
                    <BountyDocPanel
                      key={openB.id}
                      bounty={openB}
                      onPromote={() => store.promote(openB.id)}
                      onAbandon={() => store.abandon(openB.id)}
                      onOpenQuest={openQuestMode}
                    />
                  )}
                </ResizablePane>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  minHeight: 0,
                  gap: 16,
                  paddingBottom: 8,
                  paddingTop: 6,
                }}
              >
                <div
                  style={{
                    flex: '0 0 190px',
                    borderRight: colBorder,
                    paddingRight: 12,
                    overflowY: 'auto',
                  }}
                >
                  <GuildsColumn
                    selected={guild}
                    onSelect={setGuild}
                    laterOn={laterOn}
                    onAllSessions={() => {
                      setGuild('all');
                      setTab('sessions');
                    }}
                  />
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                  }}
                >
                  <div
                    style={{
                      ...mono,
                      fontSize: 10,
                      color: c['text-dim'],
                      marginBottom: 2,
                      flexShrink: 0,
                    }}
                  >
                    FILTERED BY <span style={{ color: c['loot-gold'] }}>{guildName}</span>
                  </div>
                  <Tabs
                    guild={guild}
                    laterOn={laterOn}
                    onFocus={setFocus}
                    onOpen={openQuestMode}
                    onOpenBounty={openBountyMode}
                    tab={tab}
                    setTab={setTab}
                  />
                  <StewardChat
                    selected={guild}
                    msgs={msgs}
                    onSend={send}
                    onNewChat={() => setMsgs([])}
                    onFocus={focusOrOpen}
                  />
                </div>

                <ResizablePane key="normal" storageKey="normal" defaultWidth="400px">
                  <PaneHeader focus={focus} onBack={() => setFocus({ type: 'overview' })} />
                  <div
                    style={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: focus.type === 'overview' ? 'hidden' : 'auto',
                      overflowX: 'hidden',
                      wordBreak: 'break-word',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {focus.type === 'overview' && (
                      <RaidPanel
                        needs={needsFull}
                        running={running}
                        queued={queuedLanes}
                        playing={playing}
                        onToggle={() => setPlaying(!playing)}
                        onFocusNeed={(n) => setFocus({ type: 'quest', id: n.id, nid: n.nid })}
                        onFocusQuest={(id) => setFocus({ type: 'quest', id })}
                        onOpen={openQuestMode}
                        highlightId={openQuest || lastOpened}
                      />
                    )}
                    {focus.type === 'quest' && (
                      <QuestFocus
                        key={focus.id + (focus.nid || '')}
                        id={focus.id}
                        nid={focus.nid}
                        onOpen={openQuestMode}
                      />
                    )}
                    {focus.type === 'health' && <HealthView laterOn={laterOn} playing={playing} />}
                    {focus.type === 'bounties' && (
                      <BountyTab
                        key={focus.guild + (focus.highlight || '')}
                        guild={focus.guild}
                        laterOn={laterOn}
                        highlight={focus.highlight}
                        compact
                        onFocusQuest={setFocus}
                        onRowClick={(b) => openBountyMode(b.id)}
                      />
                    )}
                  </div>
                </ResizablePane>
              </div>
            )}
          </MapFrame>
        </div>
      </div>
    </StoreCtx.Provider>
  );
}
