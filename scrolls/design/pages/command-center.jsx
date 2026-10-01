import React, { useState, useRef, useEffect } from 'react';
import { useTheme, questStatusColorKey, globalCss } from '../themes.jsx';
import { PixelBtn } from '../components/pixel-btn.jsx';
import { MapFrame } from '../components/map-frame.jsx';
import { Logo } from '../components/logo.jsx';
import { RateLimitCard } from '../components/rate-limit-card.jsx';
import { RaidPanel, FocusScene } from '../components/raid-scene.jsx';
import { BountyDocPanel, docFor } from '../components/bounty-doc.jsx';
import { tokensFor, topCtx, fmtK, CtxBar } from '../components/tokens.jsx';
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
  {
    id: 'q13',
    guild: 'codex',
    title: 'Bounty board record',
    status: 'complete',
    epic: 'e1',
    step: 1,
  },
  { id: 'q14', guild: 'codex', title: 'RAID panel', status: 'in_progress', epic: 'e1', step: 2 },
  { id: 'q15', guild: 'codex', title: 'Steward chat', status: 'created', epic: 'e1', step: 3 },
];

const ACTIVE = [
  { id: 'q1', role: 'codeweaver', elapsed: '12m 04s', done: 5, total: 9 },
  { id: 'q7', role: 'siegemaster', elapsed: '4m 41s', done: 2, total: 6 },
  { id: 'q10', role: 'spiritmender', elapsed: '31m 17s', done: 7, total: 8 },
  { id: 'q14', role: 'codeweaver', elapsed: '8m 20s', done: 3, total: 7 },
];

const INIT_QUEUED = ['q3', 'q9', 'q11', 'q15', 'q5'];

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
  {
    id: 'q14',
    guild: 'codex',
    short: 'raid-panel',
    role: 'codeweaver',
    hero: 'owl',
    monster: 'slime',
    done: 3,
    total: 7,
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
  q13: {
    items: ['Contract: bounty record', 'Broker: list bounties', 'Bounty board tab', 'Ward'],
    log: ['[ward] all checks passed', '[quest] complete in 26m'],
  },
  q14: {
    items: [
      'Contract: raid lane',
      'Widget: NeedScene',
      'Widget: BattleLane',
      'Widget: TravelLane',
      'Drawers + persistence',
      'Ward: lint + typecheck',
      'Final review',
    ],
    log: [
      '[codeweaver] wrote components/raid-scene.jsx',
      '[codeweaver] drawers persist to localStorage',
      '[ward] lint: 0 errors',
    ],
  },
  q15: {
    items: ['Contract: steward scope', 'Chat widget', 'Command parser', 'Ward', 'Final review'],
    log: ['[queue] waiting on epic step #2 (RAID panel)'],
  },
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
function GuildsColumn({ selected, onSelect, laterOn, onAllSessions, compact, onRail }) {
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
            <span style={{ fontSize: 9, color: c['text-dim'], whiteSpace: 'nowrap' }}>
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
  const bottomBtn = {
    ...mono,
    fontSize: 11,
    height: 30,
    padding: 0,
    borderRadius: 2,
    color: c['text'],
    backgroundColor: c['bg-raised'],
    border: `1px solid ${c['border']}`,
    flexShrink: 0,
  };
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
          flexDirection: 'column',
          gap: 8,
          alignItems: compact ? 'center' : 'stretch',
        }}
      >
        <button
          onClick={onAllSessions}
          title="All sessions"
          style={{ ...bottomBtn, width: compact ? ICON : '100%', cursor: 'pointer' }}
        >
          {compact ? '▤' : 'ALL SESSIONS'}
        </button>
        <button
          onClick={onRail}
          title={
            onRail
              ? compact
                ? 'Expand the guild column'
                : 'Collapse to the rail'
              : 'Guild column (pinned in this view)'
          }
          style={{
            ...bottomBtn,
            width: ICON,
            alignSelf: compact ? 'center' : 'flex-start',
            cursor: onRail ? 'pointer' : 'default',
            opacity: onRail ? 1 : 0.5,
          }}
        >
          ≡
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ tabs */

const EPICS = [
  { id: 'e1', guild: 'codex', title: 'Command Center', quests: ['q13', 'q14', 'q15'] },
];

const epicInfo = (q) => {
  if (!q || !q.epic) return null;
  const e = EPICS.find((x) => x.id === q.epic);
  return { id: e.id, title: e.title, step: q.step, total: e.quests.length };
};

// A step waits on the first earlier step that is not complete.
const epicLock = (q, quests) => {
  if (!q || !q.epic) return null;
  const e = EPICS.find((x) => x.id === q.epic);
  const blocker = e.quests
    .slice(0, q.step - 1)
    .map((id) => quests.find((x) => x.id === id))
    .find((x) => x && x.status !== 'complete');
  return blocker ? { waitsOn: blocker.step } : null;
};

const FINAL_TIME = { q5: '41m', q12: '18m', q13: '26m', q6: '—' };
const itemCounts = (q) => {
  const led = ledgerFor(q);
  return { done: led.filter((i) => i.state === 'done').length, total: led.length };
};
const smallBar = (done, total) => {
  const n = total ? Math.round((done / total) * 6) : 0;
  return '▰'.repeat(n) + '▱'.repeat(6 - n);
};

function LockMini() {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        width: 9,
        height: 11,
        verticalAlign: 'middle',
        marginRight: 4,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 2,
          width: 5,
          height: 5,
          border: `1px solid ${c['warning']}`,
          borderBottom: 'none',
          borderRadius: '3px 3px 0 0',
          boxSizing: 'border-box',
        }}
      />
      <span
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: 9,
          height: 6,
          background: c['warning'],
          borderRadius: 1,
        }}
      />
    </span>
  );
}

function QuestRow({ q, showGuild, onOpen, stepNo, lock }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [narrow, setNarrow] = useState(() => window.innerWidth < 1400);
  useEffect(() => {
    const f = () => setNarrow(window.innerWidth < 1400);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  const act = ACTIVE.find((a) => a.id === q.id);
  const { done, total } = itemCounts(q);
  const finished = ['complete', 'abandoned'].includes(q.status);
  const abandoned = q.status === 'abandoned';
  const tok = tokensFor(q.id);
  const colorKey = questStatusColorKey[q.status] || 'text-dim';
  const stat = { fontSize: 10, color: c['text-dim'], whiteSpace: 'nowrap', flexShrink: 0 };
  const elapsed = act
    ? act.elapsed.replace(/ \d+s$/, '')
    : finished
      ? FINAL_TIME[q.id] || '—'
      : '—';
  const stats = [
    <span
      key="r"
      style={{
        ...stat,
        width: narrow ? 'auto' : 74,
        textAlign: 'right',
        color: act ? c['primary'] : c['text-dim'],
      }}
    >
      {act ? act.role : '—'}
    </span>,
    <span key="i" style={{ ...stat, width: narrow ? 'auto' : 84 }}>
      items {done}/{total} {smallBar(done, total)}
    </span>,
    <span key="e" style={{ ...stat, width: narrow ? 'auto' : 44, textAlign: 'right' }}>
      {elapsed}
    </span>,
    <span key="t" style={{ ...stat, width: narrow ? 'auto' : 112, textAlign: 'right' }}>
      ctx {topCtx(q.id) ? fmtK(topCtx(q.id)) : '—'} · Σ {tok.total ? fmtK(tok.total) : '0'}
    </span>,
  ];
  return (
    <div
      onClick={() => onOpen(q.id)}
      style={{
        ...mono,
        fontSize: 12,
        color: c['text'],
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: narrow ? '1px 8px' : 8,
        padding: '3px 8px',
        borderRadius: 2,
        cursor: 'pointer',
        opacity: abandoned ? 0.45 : 1,
      }}
    >
      <span
        style={{
          width: 124,
          flexShrink: 0,
          boxSizing: 'border-box',
          textAlign: 'center',
          fontSize: 9,
          fontWeight: 600,
          padding: '1px 4px',
          borderRadius: 2,
          border: `1px solid ${c[colorKey]}`,
          color: c[colorKey],
        }}
      >
        {STATUS_WORDS(q.status)}
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textDecoration: abandoned ? 'line-through' : 'none',
        }}
        title={q.title}
      >
        {stepNo && <span style={{ color: c['text-dim'] }}>{stepNo}. </span>}
        {showGuild && <span style={{ color: c['text-dim'] }}>{q.guild} / </span>}
        {q.title}
        {lock && (
          <span style={{ color: c['warning'], fontSize: 10 }}>
            {' '}
            <LockMini />
            waits on #{lock.waitsOn}
          </span>
        )}
      </span>
      {narrow ? (
        <span
          style={{
            flexBasis: '100%',
            display: 'flex',
            gap: 10,
            paddingLeft: 132,
            justifyContent: 'flex-start',
          }}
        >
          {stats}
        </span>
      ) : (
        stats
      )}
    </div>
  );
}

function QuestsTab({ guild, onOpen, onFocus }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { quests } = useStore();
  const [openEpic, setOpenEpic] = useState({ e1: true });
  const inGuild = (g) => guild === 'all' || g === guild;
  const plain = quests.filter((q) => !q.epic && inGuild(q.guild));
  const epics = EPICS.filter((e) => inGuild(e.guild));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {epics.map((e) => {
        const steps = e.quests.map((id) => quests.find((q) => q.id === id));
        const done = steps.filter((s) => s.status === 'complete').length;
        const total = steps.reduce((n, s) => n + tokensFor(s.id).total, 0);
        const isOpen = openEpic[e.id];
        return (
          <div key={e.id}>
            <div
              onClick={() => onFocus({ type: 'epic', id: e.id })}
              style={{
                ...mono,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '3px 8px',
                borderRadius: 2,
                cursor: 'pointer',
                background: c['bg-surface'],
              }}
            >
              <span
                onClick={(ev) => {
                  ev.stopPropagation();
                  setOpenEpic({ ...openEpic, [e.id]: !isOpen });
                }}
                style={{ width: 10, color: c['text-dim'] }}
                title={isOpen ? 'Collapse epic' : 'Expand epic'}
              >
                {isOpen ? '▾' : '▸'}
              </span>
              <span
                style={{
                  width: 106,
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  fontSize: 9,
                  fontWeight: 600,
                  padding: '1px 4px',
                  borderRadius: 2,
                  border: `1px solid ${c['loot-gold']}`,
                  color: c['loot-gold'],
                }}
              >
                ⛓ EPIC
              </span>
              <span style={{ flex: 1, minWidth: 0, color: c['loot-gold'] }}>
                {guild === 'all' && <span style={{ color: c['text-dim'] }}>{e.guild} / </span>}
                {e.title}
              </span>
              <span style={{ fontSize: 10, color: c['text-dim'] }}>
                {done}/{steps.length} done · Σ {fmtK(total)}
              </span>
            </div>
            {isOpen && (
              <div
                style={{
                  marginLeft: 22,
                  borderLeft: `1px solid ${c['loot-gold']}`,
                  paddingLeft: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  marginTop: 2,
                }}
              >
                {steps.map((s) => (
                  <QuestRow
                    key={s.id}
                    q={s}
                    stepNo={s.step}
                    showGuild={false}
                    onOpen={onOpen}
                    lock={epicLock(s, quests)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
      {plain.map((q) => (
        <QuestRow key={q.id} q={q} showGuild={guild === 'all'} onOpen={onOpen} />
      ))}
      {plain.length + epics.length === 0 && (
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
        {tab === 'quests' && <QuestsTab guild={guild} onOpen={onOpen} onFocus={onFocus} />}
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
  if (focus.type === 'epic') crumb = `FOCUS · EPIC · ${EPICS.find((e) => e.id === focus.id).title}`;
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

function TokensBlock({ id }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = tokensFor(id);
  const roles = Object.entries(t.roles).sort((a, b) => b[1] - a[1]);
  const maxRole = Math.max(1, ...roles.map((r) => r[1]));
  const row = { ...mono, fontSize: 10, display: 'flex', alignItems: 'center', gap: 8 };
  return (
    <div>
      <Label>TOKENS</Label>
      <div
        style={{
          border: `1px solid ${c['border']}`,
          background: c['bg-surface'],
          borderRadius: 2,
          padding: '6px 8px',
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ ...mono, fontSize: 9, color: c['text-dim'] }}>CONTEXT NOW</span>
          {t.sessions.length === 0 && (
            <span style={{ ...mono, fontSize: 10, color: c['text-dim'] }}>no active session</span>
          )}
          {t.sessions.map((s) => (
            <div key={s.role} style={row}>
              <span style={{ width: 92, color: c['primary'] }}>{s.role}</span>
              <span
                style={{
                  color: s.ctx > 900 ? c['danger'] : s.ctx > 700 ? c['warning'] : c['text'],
                }}
              >
                {fmtK(s.ctx)}/1M
              </span>
              <CtxBar ctx={s.ctx} width={90} />
              <span style={{ color: c['text-dim'] }}>{Math.round(s.ctx / 10)}%</span>
            </div>
          ))}
        </div>
        <div style={{ ...row, justifyContent: 'space-between' }}>
          <span style={{ color: c['text-dim'] }}>
            in <span style={{ color: c['text'] }}>{fmtK(t.input)}</span> · out{' '}
            <span style={{ color: c['text'] }}>{fmtK(t.output)}</span> · Σ{' '}
            <span style={{ color: c['text'] }}>{fmtK(t.total)}</span>
          </span>
          <span style={{ color: c['text-dim'] }}>
            est. cost <span style={{ color: c['loot-gold'] }}>${t.cost.toFixed(2)}</span>
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ ...mono, fontSize: 9, color: c['text-dim'] }}>BY ROLE</span>
          {roles.length === 0 && (
            <span style={{ ...mono, fontSize: 10, color: c['text-dim'] }}>nothing spent yet</span>
          )}
          {roles.map(([role, k]) => (
            <div key={role} style={row}>
              <span style={{ width: 92, color: c['text-dim'] }}>{role}</span>
              <span style={{ flex: 1, height: 6, background: c['border'], borderRadius: 1 }}>
                <span
                  style={{
                    display: 'block',
                    height: '100%',
                    width: `${(k / maxRole) * 100}%`,
                    background: c['primary'],
                    borderRadius: 1,
                  }}
                />
              </span>
              <span style={{ width: 40, textAlign: 'right', color: c['text'] }}>{fmtK(k)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuestFocus({ id, nid, onOpen, onEpic }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { questById, needs, queued, quests, approve, togglePause, answer, retryWard } = useStore();
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
  const ep = epicInfo(q);
  const lock = epicLock(q, quests);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <FocusScene
        need={needForScene}
        lane={lane}
        queuedLane={lock ? null : queuedLane}
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
        {ep && (
          <div
            onClick={() => onEpic(ep.id)}
            style={{
              ...mono,
              fontSize: 10,
              color: c['loot-gold'],
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            ⛓ EPIC · {ep.title} {ep.step}/{ep.total}
            {lock ? ` · waits on #${lock.waitsOn}` : ''}
          </div>
        )}
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
      <TokensBlock id={id} />
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

function EpicView({ id, onFocusQuest }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { quests } = useStore();
  const [reorder, setReorder] = useState(false);
  const e = EPICS.find((x) => x.id === id);
  const steps = e.quests.map((qid) => quests.find((q) => q.id === qid));
  const done = steps.filter((s) => s.status === 'complete').length;
  const total = steps.reduce((n, s) => n + tokensFor(s.id).total, 0);
  const cost = steps.reduce((n, s) => n + tokensFor(s.id).cost, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...mono, fontSize: 13, fontWeight: 600, color: c['loot-gold'] }}>
            ⛓ EPIC · {e.title}
          </div>
          <div style={{ ...mono, fontSize: 10, color: c['text-dim'], marginTop: 2 }}>
            {e.guild} · {done}/{steps.length} done · Σ{' '}
            <span style={{ color: c['text'] }}>{fmtK(total)}</span> · est.{' '}
            <span style={{ color: c['loot-gold'] }}>${cost.toFixed(2)}</span>
          </div>
        </div>
        <PixelBtn
          label={reorder ? 'DONE' : 'REORDER'}
          variant={reorder ? 'primary' : 'ghost'}
          onClick={() => setReorder(!reorder)}
        />
      </div>
      {reorder && (
        <div style={{ ...mono, fontSize: 10, color: c['text-dim'] }}>
          Drag the handles to change the execution order (mock).
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {steps.map((s, i) => {
          const lock = epicLock(s, quests);
          const { done: d, total: t } = itemCounts(s);
          const colorKey = questStatusColorKey[s.status] || 'text-dim';
          return (
            <div key={s.id} style={{ display: 'flex', gap: 8 }}>
              <div
                style={{
                  width: 22,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: `1px solid ${c[colorKey]}`,
                    color: c[colorKey],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...mono,
                    fontSize: 10,
                    fontWeight: 600,
                    background: s.status === 'complete' ? `${c['success']}22` : 'transparent',
                  }}
                >
                  {s.status === 'complete' ? '✓' : s.step}
                </div>
                {i < steps.length - 1 && (
                  <div style={{ flex: 1, width: 1, background: c['border'], minHeight: 14 }} />
                )}
              </div>
              <div
                onClick={() => onFocusQuest(s.id)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: `1px solid ${c['border']}`,
                  borderRadius: 2,
                  padding: '5px 8px',
                  marginBottom: 8,
                  background: c['bg-surface'],
                  cursor: 'pointer',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                {reorder && (
                  <span
                    style={{ ...mono, color: c['loot-gold'], cursor: 'grab', fontSize: 14 }}
                    title="Drag to reorder"
                  >
                    ⠿
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...mono, fontSize: 12, color: c['text'] }}>{s.title}</div>
                  <div
                    style={{
                      ...mono,
                      fontSize: 10,
                      color: c['text-dim'],
                      marginTop: 2,
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        padding: '0 4px',
                        borderRadius: 2,
                        border: `1px solid ${c[colorKey]}`,
                        color: c[colorKey],
                      }}
                    >
                      {STATUS_WORDS(s.status)}
                    </span>
                    <span>
                      items {d}/{t} {smallBar(d, t)}
                    </span>
                    <span>Σ {fmtK(tokensFor(s.id).total)}</span>
                    {lock && (
                      <span style={{ color: c['warning'] }}>
                        <LockMini />
                        waits on #{lock.waitsOn}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
  const [openBounty, setOpenBounty] = useState(null);
  const [lastOpened, setLastOpened] = useState(null);
  const [ov, setOv] = useState(null);
  const [ovShown, setOvShown] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [bsess, setBsess] = useState({});
  const [bUpdating, setBUpdating] = useState(false);
  const [bNotice, setBNotice] = useState(null);
  const [narrow, setNarrow] = useState(() => window.innerWidth < 1400);
  const store = useCommandStore();
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 1400);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const openOv = (f) => {
    setOv(f);
    setRailOpen(false);
    if (reduced) setOvShown(true);
    else requestAnimationFrame(() => requestAnimationFrame(() => setOvShown(true)));
  };
  const closeOv = () => {
    setOvShown(false);
    if (reduced) setOv(null);
    else setTimeout(() => setOv(null), 190);
  };
  const leaveDetail = () => {
    setOpenQuest(null);
    setOpenBounty(null);
    setRailOpen(false);
  };
  const openQuestMode = (id) => {
    setOpenQuest(id);
    setOpenBounty(null);
    setLastOpened(id);
    setRailOpen(false);
  };
  const openBountyMode = (id) => {
    setOpenBounty(id);
    setOpenQuest(null);
    setRailOpen(false);
  };
  const focusOrOpen = (f) => {
    if (f.type === 'bounties' && f.highlight) openBountyMode(f.highlight);
    else setFocus(f);
  };

  useEffect(() => {
    if (!ov && !railOpen && !openQuest && !openBounty) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (ov) closeOv();
      else if (railOpen) setRailOpen(false);
      else leaveDetail();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ov, railOpen, openQuest, openBounty]);

  const openQ = openQuest ? store.questById(openQuest) : null;
  const openB = openBounty ? store.bounty.find((b) => b.id === openBounty) : null;
  const detail = Boolean(openQ || openB);

  const running = RAID_LANES.map((l) => {
    const q = store.questById(l.id);
    return {
      ...l,
      title: q.title,
      elapsed: ACTIVE.find((a) => a.id === l.id).elapsed,
      epic: epicInfo(q),
    };
  });
  const queuedLanes = store.queued.map((id, i) => {
    const q = store.questById(id);
    const lock = epicLock(q, store.quests);
    return {
      id,
      guild: q.guild,
      title: q.title,
      hero: ['owl', 'raccoon', 'rat', 'frog'][i % 4],
      epic: epicInfo(q),
      locked: Boolean(lock),
      waitsOn: lock ? lock.waitsOn : null,
    };
  });
  const needsFull = store.needs.map((n) => {
    const q = store.questById(n.id);
    return { ...n, guild: q.guild, title: q.title, epic: epicInfo(q) };
  });
  const showChip = detail || focus.type !== 'overview';

  // bounty document session: edits, chat, and Sparkwright's follow-up
  const bText = openB ? (bsess[openB.id]?.text ?? docFor(openB)) : '';
  const bMsgs = openB ? (bsess[openB.id]?.msgs ?? []) : [];
  const patchB = (id, fn) => setBsess((s) => ({ ...s, [id]: fn(s[id] || {}) }));
  const sendBounty = (text) => {
    const b = openB;
    patchB(b.id, (x) => ({
      ...x,
      msgs: [
        ...(x.msgs || []),
        { type: 'user', text, tokens: '0.1k', ctx: '' },
        {
          type: 'agent',
          tokens: '0.4k',
          ctx: '',
          blocks: [
            { p: '(mock) Noted. I would update the document and keep the headings as they are.' },
          ],
        },
      ],
    }));
  };
  const saveBounty = (newText) => {
    const b = openB;
    const o = bText.split('\n');
    const n = newText.split('\n');
    let changed = 0;
    let first = '';
    for (let i = 0; i < Math.max(o.length, n.length); i += 1) {
      if (o[i] !== n[i]) {
        changed += 1;
        if (!first) first = (n[i] ?? o[i] ?? '').trim().slice(0, 48);
      }
    }
    if (changed === 0) return;
    patchB(b.id, (x) => ({
      ...x,
      text: newText,
      msgs: [
        ...(x.msgs || []),
        {
          type: 'user',
          text: `Edited the document — ${changed} line${changed === 1 ? '' : 's'} changed: ${first || 'whitespace'}`,
          tokens: '0.1k',
          ctx: '',
        },
      ],
    }));
    setBUpdating(true);
    setTimeout(() => {
      patchB(b.id, (x) => ({
        ...x,
        msgs: [
          ...(x.msgs || []),
          {
            type: 'agent',
            tokens: '0.4k',
            ctx: '',
            blocks: [
              {
                p: 'Read your edits. I tightened the wording around them and kept your structure.',
              },
            ],
          },
        ],
      }));
    }, 600);
    setTimeout(() => {
      patchB(b.id, (x) => ({
        ...x,
        text: `${x.text}\n\n## Notes from Sparkwright\n\n- Tightened the section you edited and checked the table columns still line up.`,
      }));
      setBUpdating(false);
      setBNotice('Sparkwright applied a follow-up change: added "Notes from Sparkwright"');
      setTimeout(() => setBNotice(null), 3500);
    }, 1700);
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

  // The right-pane body, shared by the normal pane and the slide-over.
  const renderPane = (f, setF, inOverlay) => {
    const open = inOverlay
      ? (id) => {
          closeOv();
          openQuestMode(id);
        }
      : openQuestMode;
    const openBnty = inOverlay
      ? (id) => {
          closeOv();
          openBountyMode(id);
        }
      : openBountyMode;
    return (
      <>
        <PaneHeader focus={f} onBack={() => setF({ type: 'overview' })} />
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: f.type === 'overview' ? 'hidden' : 'auto',
            overflowX: 'hidden',
            wordBreak: 'break-word',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {f.type === 'overview' && (
            <RaidPanel
              needs={needsFull}
              running={running}
              queued={queuedLanes}
              playing={playing}
              onToggle={() => setPlaying(!playing)}
              onFocusNeed={(n) => setF({ type: 'quest', id: n.id, nid: n.nid })}
              onFocusQuest={(id) => setF({ type: 'quest', id })}
              onOpen={open}
              onEpic={(id) => setF({ type: 'epic', id })}
              highlightId={openQuest || lastOpened}
            />
          )}
          {f.type === 'quest' && (
            <QuestFocus
              key={f.id + (f.nid || '')}
              id={f.id}
              nid={f.nid}
              onOpen={open}
              onEpic={(id) => setF({ type: 'epic', id })}
            />
          )}
          {f.type === 'epic' && (
            <EpicView id={f.id} onFocusQuest={(id) => setF({ type: 'quest', id })} />
          )}
          {f.type === 'health' && <HealthView laterOn={laterOn} playing={playing} />}
          {f.type === 'bounties' && (
            <BountyTab
              key={f.guild + (f.highlight || '')}
              guild={f.guild}
              laterOn={laterOn}
              highlight={f.highlight}
              compact
              onFocusQuest={setF}
              onRowClick={(b) => openBnty(b.id)}
            />
          )}
        </div>
      </>
    );
  };

  const colBorder = `1px solid ${c['border']}`;
  const guildName = guild === 'all' ? 'ALL GUILDS' : guild;
  const railSelect = (g) => {
    setGuild(g);
    leaveDetail();
  };
  const railSessions = () => {
    setGuild('all');
    setTab('sessions');
    leaveDetail();
  };
  const slide = reduced ? 'none' : 'transform 180ms ease-out';

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
                onClick={() => openOv({ type: 'overview' })}
                title={
                  openQ
                    ? `Open quest: ${openQ.guild} / ${openQ.title} — click to slide the RAID in`
                    : openB
                      ? `Open bounty: ${openB.title} — click to slide the RAID in`
                      : 'Slide the RAID in'
                }
              />
            )}
            <HealthStrip
              narrow={narrow}
              laterOn={laterOn}
              active={focus.type === 'health' || (ov && ov.type === 'health')}
              onClick={() =>
                detail || focus.type !== 'overview'
                  ? openOv({ type: 'health' })
                  : setFocus({ type: 'health' })
              }
              playing={playing}
            />
            <Toggle on={laterOn} onChange={setLaterOn} label="Show later features" />
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', padding: '0 16px 16px' }}>
          <MapFrame padding={12}>
            {detail ? (
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
                    onSelect={railSelect}
                    laterOn={laterOn}
                    onAllSessions={railSessions}
                    onRail={() => setRailOpen(!railOpen)}
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
                      msgs={bMsgs}
                      onSend={sendBounty}
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
                      text={bText}
                      onSave={saveBounty}
                      updating={bUpdating}
                      notice={bNotice}
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
                  {renderPane(focus, setFocus, false)}
                </ResizablePane>
              </div>
            )}

            {(ov || railOpen) && (
              <div
                onClick={() => (ov ? closeOv() : setRailOpen(false))}
                style={{ position: 'absolute', inset: 0, zIndex: 18 }}
              />
            )}
            {railOpen && detail && (
              <div
                style={{
                  position: 'absolute',
                  left: 12,
                  top: 18,
                  bottom: 20,
                  width: 190,
                  zIndex: 25,
                  background: c['bg-deep'],
                  borderRight: colBorder,
                  paddingRight: 12,
                  overflowY: 'auto',
                  boxShadow: '8px 0 16px rgba(0,0,0,.5)',
                }}
              >
                <GuildsColumn
                  selected={(openQ || openB).guild}
                  onSelect={railSelect}
                  laterOn={laterOn}
                  onAllSessions={railSessions}
                  onRail={() => setRailOpen(false)}
                />
              </div>
            )}
            {ov && (
              <div
                data-slideover
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 400,
                  maxWidth: '90%',
                  zIndex: 20,
                  boxSizing: 'border-box',
                  background: c['bg-deep'],
                  borderLeft: `1px solid ${c['loot-gold']}`,
                  boxShadow: '-10px 0 18px rgba(0,0,0,.55)',
                  padding: '8px 12px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  transform: ovShown ? 'translateX(0)' : 'translateX(100%)',
                  transition: slide,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ ...mono, fontSize: 10, color: c['text-dim'] }}>
                    slide-over · Esc or click outside to close
                  </span>
                  <button
                    onClick={closeOv}
                    title="Close"
                    style={{
                      ...mono,
                      fontSize: 12,
                      cursor: 'pointer',
                      color: c['text'],
                      background: c['bg-raised'],
                      border: colBorder,
                      borderRadius: 2,
                      padding: '0 8px',
                    }}
                  >
                    ✕
                  </button>
                </div>
                {renderPane(ov, setOv, true)}
              </div>
            )}
          </MapFrame>
        </div>
      </div>
    </StoreCtx.Provider>
  );
}
