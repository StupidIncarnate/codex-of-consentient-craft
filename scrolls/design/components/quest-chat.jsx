import React, { useState, useRef, useEffect } from 'react';
import { useTheme, questStatusColorKey } from '../themes.jsx';
import { PixelBtn } from './pixel-btn.jsx';

const mono = { fontFamily: 'monospace' };

/* ------------------------------------------------------------------ mock transcript */

const HOME = '/home/brutus-home/projects/codex-of-consentient-craft';

const buildTranscript = (title) => [
  {
    type: 'user',
    text: `I want to work on "${title}". Start by looking at how the web package does this today.`,
    tokens: '0.4k',
    ctx: '118.2k context (+0.4k)',
  },
  {
    type: 'agent',
    tokens: '1.2k',
    ctx: '119.4k context (+1.2k)',
    blocks: [
      {
        p: "Understood. I'll map the relevant packages and read the current widgets before proposing any flows.",
      },
    ],
  },
  {
    type: 'tools',
    ctx: '196.7k context (+3.6k) · SubAgents · 315.1k',
    items: [
      { kind: 'tool', name: 'Read', arg: `${HOME}/packages/web/CLAUDE.md`, ok: true },
      {
        kind: 'tool',
        name: 'Read',
        arg: `${HOME}/packages/web/src/widgets/home-content/home-content-widget.tsx`,
        ok: true,
      },
      { kind: 'tool', name: 'get-project-map', arg: 'packages: [web]', ok: true },
      {
        kind: 'agent',
        name: 'Agent',
        title: 'explore: how guild selection persists',
        duration: '2m 14s',
        ok: true,
        calls: [
          { name: 'discover', arg: 'grep: dungeonmaster-last-guild', ok: true },
          {
            name: 'Read',
            arg: `${HOME}/packages/web/src/widgets/guild-list/guild-list-widget.tsx`,
            ok: true,
          },
          {
            name: 'Read',
            arg: `${HOME}/packages/web/src/bindings/use-guilds/use-guilds-binding.ts`,
            ok: true,
          },
        ],
      },
    ],
  },
  {
    type: 'agent',
    tokens: '2.1k',
    ctx: '198.8k context (+2.1k)',
    blocks: [
      { h: 'What I found' },
      {
        ul: [
          '**Guild selection** persists in localStorage under `dungeonmaster-last-guild`',
          'The home view reads quests and sessions through two separate bindings',
          `No route exists yet for "${title}"`,
        ],
      },
      {
        p: 'Two things are not obvious from the code, so I need one answer before drafting flows.',
      },
    ],
  },
  {
    type: 'tools',
    ctx: '201.4k context (+2.6k)',
    items: [
      { kind: 'tool', name: 'get-quest', arg: 'questId: current', ok: true },
      {
        kind: 'tool',
        name: 'modify-quest',
        arg: 'flows: [signed-out]',
        ok: false,
        err: 'validation: flow "signed-out" has no observables',
      },
      { kind: 'tool', name: 'modify-quest', arg: 'userRequest: refined', ok: true },
    ],
  },
  {
    type: 'clarify',
    ctx: '202.0k context (+0.6k)',
    question: 'Should the signed-out state be its own flow, or fold into the main flow?',
    options: ['Separate flow', 'Fold into main flow', 'Skip signed-out'],
  },
];

const STREAMING_TEXT = "Thanks. I'll draft the main flow first, then";

const statusHeader = (s) =>
  ({
    created: 'EXPLORING FLOWS',
    explore_flows: 'EXPLORING FLOWS',
    review_flows: 'REVIEWING FLOWS',
    review_observables: 'REVIEWING OBSERVABLES',
    approved: 'APPROVED',
    in_progress: 'IN PROGRESS',
    paused: 'PAUSED',
    blocked: 'BLOCKED',
    complete: 'COMPLETE',
    abandoned: 'ABANDONED',
  })[s] || 'EXPLORING FLOWS';

/* ------------------------------------------------------------------ pieces */

const inline = (text, c) =>
  text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((part, i) => {
    if (part.startsWith('**'))
      return (
        <strong key={i} style={{ color: c['text'] }}>
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith('`'))
      return (
        <code
          key={i}
          style={{
            background: c['bg-raised'],
            padding: '0 4px',
            borderRadius: 2,
            fontSize: '0.95em',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });

function Blocks({ blocks, cursor }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <div
      style={{ ...mono, fontSize: 12, color: c['text'], lineHeight: 1.5, wordBreak: 'break-word' }}
    >
      {blocks.map((b, i) => {
        if (b.h)
          return (
            <div
              key={i}
              style={{
                fontWeight: 700,
                margin: '6px 0 2px',
                borderBottom: `1px solid ${c['text-dim']}`,
                paddingBottom: 2,
                fontSize: 13,
              }}
            >
              {b.h}
            </div>
          );
        if (b.ul)
          return (
            <ul key={i} style={{ margin: '2px 0 4px', paddingLeft: 18 }}>
              {b.ul.map((li, j) => (
                <li key={j}>{inline(li, c)}</li>
              ))}
            </ul>
          );
        return (
          <p key={i} style={{ margin: '2px 0' }}>
            {inline(b.p, c)}
            {cursor && i === blocks.length - 1 && (
              <span style={{ animation: 'pulse 1s infinite', color: c['primary'] }}> ▌</span>
            )}
          </p>
        );
      })}
    </div>
  );
}

function Message({ e, details, role: roleName = 'chaoswhisperer' }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const isUser = e.type === 'user';
  const color = isUser ? c['loot-gold'] : c['primary'];
  const role = isUser ? 'YOU' : roleName.toUpperCase();
  const blocks = isUser ? [{ p: e.text }] : e.blocks;
  if (details) {
    return (
      <div
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: isUser ? c['bg-raised'] : 'transparent',
          borderLeft: `2px solid ${color}`,
          borderRight: `2px solid ${color}`,
        }}
      >
        <div style={{ ...mono, fontSize: 11, fontWeight: 600, color, marginBottom: 2 }}>
          {role}
          {!isUser && (
            <span style={{ color: c['text-dim'], fontWeight: 400 }}> claude-opus-5-5</span>
          )}
        </div>
        <Blocks blocks={blocks} cursor={e.streaming} />
        {!e.streaming && (
          <div style={{ ...mono, fontSize: 10, color: c['text-dim'], marginTop: 3 }}>
            +{e.tokens} context
          </div>
        )}
      </div>
    );
  }
  return (
    <div
      title={`${e.ctx} · claude-opus-5-5`}
      style={{
        padding: '3px 10px',
        borderRadius: 2,
        backgroundColor: isUser ? `${c['loot-gold']}14` : 'transparent',
        borderLeft: `1px solid ${c['border']}`,
      }}
    >
      <div
        style={{
          ...mono,
          fontSize: 9,
          letterSpacing: 0.5,
          color: c['text-dim'],
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 1,
        }}
      >
        <span style={{ textTransform: 'uppercase' }}>{isUser ? 'you' : roleName}</span>
        <span>{e.tokens}</span>
      </div>
      <Blocks blocks={blocks} cursor={e.streaming} />
    </div>
  );
}

function Divider({ text }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        ...mono,
        fontSize: 10,
        color: c['text-dim'],
      }}
    >
      <div style={{ flex: 1, height: 1, background: c['border'] }} />
      <span>{text}</span>
      <div style={{ flex: 1, height: 1, background: c['border'] }} />
    </div>
  );
}

function ToolRow({ t, nested, onClick, open, chev }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const failed = t.ok === false;
  return (
    <div
      onClick={onClick}
      title={failed ? t.err : undefined}
      style={{
        ...mono,
        fontSize: 11,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        borderRadius: 2,
        marginLeft: nested ? 18 : 0,
        cursor: onClick ? 'pointer' : 'default',
        background: c['bg-raised'],
        border: `1px solid ${failed ? c['danger'] : c['border']}`,
      }}
    >
      <span style={{ color: c['text-dim'] }}>{chev || '▸'}</span>
      <span style={{ fontWeight: 600, color: c['text'], flexShrink: 0 }}>{t.name}</span>
      <span
        style={{
          color: c['text-dim'],
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {t.title || t.arg}
        {failed && <span style={{ color: c['danger'] }}> — {t.err}</span>}
      </span>
      {t.duration && <span style={{ color: c['text-dim'], flexShrink: 0 }}>{t.duration}</span>}
      <span style={{ color: failed ? c['danger'] : c['success'], flexShrink: 0 }}>
        {failed ? '✗' : '✓'}
      </span>
    </div>
  );
}

function SubagentChain({ t, details }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [open, setOpen] = useState(details);
  if (details) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <ToolRow t={t} onClick={() => setOpen(!open)} chev={open ? '▾' : '▸'} />
        {open && t.calls.map((k, i) => <ToolRow key={i} t={k} nested />)}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ ...mono, fontSize: 10, color: c['text-dim'], cursor: 'pointer', paddingLeft: 12 }}
      >
        {open ? '▾' : '▸'} sub-agent · {t.title} · {t.duration}{' '}
        <span style={{ opacity: 0.6 }}>✓</span>
      </div>
      {open &&
        t.calls.map((k, i) => (
          <div key={i} style={{ paddingLeft: 24 }}>
            <ToolRow t={k} nested={false} />
          </div>
        ))}
    </div>
  );
}

function ToolGroup({ e, details }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [open, setOpen] = useState(false);
  const counts = [];
  e.items.forEach((it) => {
    const f = counts.find((x) => x.name === it.name);
    if (f) f.n += 1;
    else counts.push({ name: it.name, n: 1 });
  });
  const failed = e.items.filter((i) => i.ok === false).length;
  const rows = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {e.items.map((it, i) =>
        it.kind === 'agent' ? (
          <SubagentChain key={i} t={it} details={details} />
        ) : (
          <ToolRow key={i} t={it} />
        ),
      )}
    </div>
  );
  if (details) return rows;
  const total = e.items.reduce((n, i) => n + 1 + (i.calls ? 0 : 0), 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          ...mono,
          fontSize: 10,
          color: c['text-dim'],
          cursor: 'pointer',
          padding: '0 10px',
        }}
      >
        {open ? '▾' : '▸'} {total} tools ·{' '}
        {counts.map((x) => (x.n > 1 ? `${x.name} ×${x.n}` : x.name)).join(', ')}
        {failed > 0 && <span style={{ color: c['danger'] }}> · {failed} failed</span>}
      </div>
      {open && <div style={{ paddingLeft: 10 }}>{rows}</div>}
    </div>
  );
}

function Clarify({ e }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [picked, setPicked] = useState(null);
  return (
    <div
      style={{
        border: `2px solid ${c['loot-rare']}`,
        borderRadius: 2,
        padding: '8px 10px',
        background: c['bg-surface'],
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span style={{ ...mono, fontSize: 10, fontWeight: 600, color: c['loot-rare'] }}>
        CHAOSWHISPERER ASKS
      </span>
      <span style={{ ...mono, fontSize: 13, color: c['text'] }}>{e.question}</span>
      {picked ? (
        <span style={{ ...mono, fontSize: 11, color: c['success'] }}>answered: {picked}</span>
      ) : (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {e.options.map((o) => (
            <PixelBtn key={o} label={o} variant="ghost" onClick={() => setPicked(o)} />
          ))}
          <PixelBtn label="Other…" variant="ghost" onClick={() => {}} />
        </div>
      )}
    </div>
  );
}

function ToggleBtn({ on, onChange, label }) {
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
        padding: '2px 8px',
      }}
    >
      {on ? '[x]' : '[ ]'} {label}
    </button>
  );
}

/* ------------------------------------------------------------------ chat */

export function QuestChat({ quest, onBack }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [details, setDetails] = useState(false);
  const [draft, setDraft] = useState('');
  const [extra, setExtra] = useState([]);
  const scroller = useRef(null);
  const entries = buildTranscript(quest.title);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [extra.length, details]);

  const send = () => {
    if (!draft.trim()) return;
    setExtra((x) => [
      ...x,
      { type: 'user', text: draft, tokens: '0.1k', ctx: '202.1k context (+0.1k)' },
    ]);
    setDraft('');
  };

  const rendered = [];
  entries.forEach((e, i) => {
    if (e.type === 'user' || e.type === 'agent')
      rendered.push(<Message key={`m${i}`} e={e} details={details} />);
    if (e.type === 'tools') rendered.push(<ToolGroup key={`t${i}`} e={e} details={details} />);
    if (e.type === 'clarify') rendered.push(<Clarify key={`c${i}`} e={e} />);
    if (details && e.ctx && e.type !== 'clarify')
      rendered.push(<Divider key={`d${i}`} text={e.ctx} />);
  });
  extra.forEach((e, i) => rendered.push(<Message key={`x${i}`} e={e} details={details} />));
  rendered.push(
    <Message
      key="stream"
      details={details}
      e={{
        type: 'agent',
        tokens: '…',
        ctx: 'streaming',
        streaming: true,
        blocks: [{ p: STREAMING_TEXT }],
      }}
    />,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          paddingBottom: 6,
          borderBottom: `1px solid ${c['border']}`,
          flexShrink: 0,
        }}
      >
        <PixelBtn label="← COMMAND CENTER" variant="ghost" onClick={onBack} title="Esc" />
        <span
          style={{ ...mono, fontSize: 10, color: c['text-dim'], flex: 1, textAlign: 'right' }}
          title="Context window used by this quest's chat agent"
        >
          ctx <span style={{ color: c['text'] }}>202.0k</span> / 1M {'▰▰▱▱▱▱▱▱'}
        </span>
        <ToggleBtn on={details} onChange={setDetails} label="show details" />
      </div>
      <div
        ref={scroller}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: details ? 8 : 6,
          padding: '10px 0',
        }}
      >
        <div style={{ flex: 1 }} />
        {rendered}
        <div style={{ ...mono, fontSize: 10, color: c['primary'], paddingLeft: 10 }}>
          <span style={{ animation: 'pulse 1.2s infinite' }}>●</span> chaoswhisperer is writing…
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexShrink: 0,
          borderTop: `1px solid ${c['border']}`,
          paddingTop: 8,
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Reply to chaoswhisperer..."
          rows={2}
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
            width: 40,
            height: 40,
            fontSize: 18,
            cursor: 'pointer',
            color: c['bg-deep'],
            backgroundColor: c['primary'],
            border: `1px solid ${c['border']}`,
            borderRadius: 2,
          }}
        >
          ▶
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ spec panel */

export function QuestSpecPanel({ quest }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [tab, setTab] = useState('spec');
  const [confirming, setConfirming] = useState(false);
  const sectionLabel = {
    ...mono,
    fontSize: 11,
    fontWeight: 600,
    color: c['text-dim'],
    marginBottom: 4,
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 0 8px',
          borderBottom: `1px solid ${c['border']}`,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            ...mono,
            fontSize: 11,
            fontWeight: 600,
            color: c['loot-gold'],
            flex: 1,
            minWidth: 0,
          }}
        >
          {quest.title}
        </span>
        {confirming ? (
          <>
            <PixelBtn
              label="CONFIRM ABANDON"
              variant="danger"
              onClick={() => setConfirming(false)}
            />
            <PixelBtn label="CANCEL" variant="ghost" onClick={() => setConfirming(false)} />
          </>
        ) : (
          <PixelBtn label="ABANDON QUEST" variant="ghost" onClick={() => setConfirming(true)} />
        )}
      </div>
      <div style={{ display: 'flex', borderBottom: `1px solid ${c['border']}`, flexShrink: 0 }}>
        {[
          ['spec', 'SPEC'],
          ['details', 'DETAILS'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              ...mono,
              fontSize: 10,
              fontWeight: 600,
              padding: '5px 12px',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              color: tab === id ? c['primary'] : c['text-dim'],
              borderBottom: `2px solid ${tab === id ? c['primary'] : 'transparent'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {tab === 'spec' ? (
          <>
            <div
              style={{
                ...mono,
                fontSize: 11,
                fontWeight: 600,
                color: c[questStatusColorKey[quest.status] || 'primary'],
              }}
            >
              {statusHeader(quest.status)}
            </div>
            <div>
              <div style={sectionLabel}>USER REQUEST</div>
              <div
                style={{
                  ...mono,
                  fontSize: 12,
                  color: c['text'],
                  background: c['bg-surface'],
                  border: `1px solid ${c['border']}`,
                  borderRadius: 2,
                  padding: '6px 8px',
                  maxHeight: 120,
                  overflowY: 'auto',
                }}
              >
                I want to work on "{quest.title}". Start by looking at how the web package does this
                today.
              </div>
            </div>
            <div>
              <div style={sectionLabel}>FLOWS (0)</div>
              <div
                style={{
                  ...mono,
                  fontSize: 11,
                  color: c['text-dim'],
                  border: `1px dashed ${c['border']}`,
                  borderRadius: 2,
                  padding: '14px 10px',
                  textAlign: 'center',
                }}
              >
                No flows yet — chaoswhisperer is still exploring.
              </div>
            </div>
          </>
        ) : (
          ['DESIGN DECISIONS (0)', 'OPERATIONS (0)', 'TOOLING (0)'].map((l) => (
            <div key={l}>
              <div style={sectionLabel}>{l}</div>
              <div style={{ ...mono, fontSize: 11, color: c['text-dim'] }}>
                Nothing recorded yet.
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ sparkwright chat (bounty mode) */

export function SparkwrightChat({ bounty, onBack }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [details, setDetails] = useState(false);
  const [draft, setDraft] = useState('');
  const [msgs, setMsgs] = useState([]);
  const scroller = useRef(null);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [msgs.length]);
  const send = () => {
    if (!draft.trim()) return;
    setMsgs((m) => [
      ...m,
      { type: 'user', text: draft, tokens: '0.1k', ctx: 'context (+0.1k)' },
      {
        type: 'agent',
        tokens: '0.4k',
        ctx: 'context (+0.4k)',
        blocks: [
          { p: '(mock) Noted. I would update the document and keep the headings as they are.' },
        ],
      },
    ]);
    setDraft('');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          paddingBottom: 6,
          borderBottom: `1px solid ${c['border']}`,
          flexShrink: 0,
        }}
      >
        <PixelBtn label="← COMMAND CENTER" variant="ghost" onClick={onBack} title="Esc" />
        <span style={{ ...mono, fontSize: 10, color: c['text-dim'], flex: 1, textAlign: 'right' }}>
          sparkwright · {bounty.kind.toLowerCase()} · {bounty.guild}
        </span>
        <ToggleBtn on={details} onChange={setDetails} label="show details" />
      </div>
      <div
        ref={scroller}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '10px 0',
        }}
      >
        <div style={{ flex: 1 }} />
        {msgs.length === 0 && (
          <div
            style={{
              ...mono,
              fontSize: 11,
              color: c['text-dim'],
              textAlign: 'center',
              padding: '0 24px 12px',
            }}
          >
            Sparkwright reads this document first. Ask it to flesh out, format, or add to it.
          </div>
        )}
        {msgs.map((e, i) => (
          <Message key={i} e={e} details={details} role="sparkwright" />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexShrink: 0,
          borderTop: `1px solid ${c['border']}`,
          paddingTop: 8,
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Describe your idea..."
          rows={2}
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
            width: 40,
            height: 40,
            fontSize: 18,
            cursor: 'pointer',
            color: c['bg-deep'],
            backgroundColor: c['primary'],
            border: `1px solid ${c['border']}`,
            borderRadius: 2,
          }}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
