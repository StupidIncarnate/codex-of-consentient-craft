import React, { useState } from 'react';
import { useTheme } from '../themes.jsx';
import { PixelBtn } from './pixel-btn.jsx';

const mono = { fontFamily: 'monospace' };
const F = '```';

/* ------------------------------------------------------------------ seeded documents */

const DOCS = {
  b1: [
    '# Show quest cost per role on the queue page',
    '',
    'Operators keep asking *which role burned the tokens* on a long quest. Today the queue page only shows elapsed time.',
    '',
    '## Proposal',
    '',
    'Add a **cost strip** under each queue row:',
    '',
    '- one chip per role that ran (`codeweaver`, `ward`, ...)',
    '- tokens in / out and an estimated dollar figure',
    "- a tiny bar showing the role's share of the quest total",
    '',
    '![The live queue today: rows carry no cost information](/mock/shot-1.png)',
    '',
    '## Data we already have',
    '',
    '| source | field | note |',
    '|---|---|---|',
    '| orchestrator | `usage` on each chat entry | per API call |',
    '| quest.json | `workItems[].role` | maps calls to roles |',
    '| shared | `chatUsageContract` | already validated |',
    '',
    'The numbers are an estimate: the API reports one `usage` per turn, not per tool.',
    '',
    '![Sketch: the quest chat with a per-role token figure on the label line](/mock/shot-2.png)',
    '',
    '## Open questions',
    '',
    '- Should local-model roles show tokens only, with no dollar figure?',
    '- Roll the totals up per guild on the home page?',
    '',
    '![The guild column is the natural home for a per-guild total](/mock/shot-3.png)',
  ].join('\n'),
  b4: [
    '# 500 on POST /api/quests/:id/start',
    '',
    'Auto-created from a server error. **14 occurrences** in the last hour, first seen 38m ago. Repeats merge into this one row.',
    '',
    '## Last error',
    '',
    F,
    "Error: ENOENT: no such file or directory, open '.../quest.json'",
    '    at readFile (node:internal/fs/promises:612:20)',
    '    at questLoadBroker (packages/orchestrator/src/brokers/quest/load/quest-load-broker.ts:41:11)',
    '    at startQuestResponder (packages/server/src/responders/quest/start/quest-start-responder.ts:27:9)',
    F,
    '',
    '## Occurrences by quest',
    '',
    '| quest | count | last seen |',
    '|---|---|---|',
    '| Ward spawns its children as itself | 11 | 38m |',
    '| Consumer jest skips ts-jest for CJS | 3 | 2h |',
    '',
    '## Likely cause',
    '',
    'The start responder reads `quest.json` before the carved worktree finishes copying it. See the server log at the moment of the failure:',
    '',
    '![Dev log around the first occurrence](/mock/shot-2.png)',
    '',
    '- Reproduce: start a quest from a fresh worktree',
    '- Expected: `200` with the run id',
    '- Actual: `500` with an empty body',
  ].join('\n'),
  b6: [
    '# Document dispatch hold notice in README',
    '',
    'Follow-up from **Rate-limit guardrail holds the queue**, proposed by the tavernkeeper after the quest completed.',
    '',
    '## What to write',
    '',
    '- when the hold appears (5-hour window at or above the threshold)',
    '- why PLAY is disabled while the hold is live',
    '- how long it lasts (until `resumeAt`)',
    '',
    '![The queue bar with the hold notice showing](/mock/shot-3.png)',
    '',
    '## Notes',
    '',
    'Keep it to one short section under *Runtime configuration*. No new headings in the table of contents.',
  ].join('\n'),
};

const fallbackDoc = (b) =>
  [
    `# ${b.title}`,
    '',
    `Origin: **${b.origin}** · age ${b.age}.`,
    '',
    'No further notes yet. Ask the Sparkwright to flesh this out.',
  ].join('\n');

/* ------------------------------------------------------------------ tiny markdown renderer */

const inline = (text, c) =>
  text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/).map((part, i) => {
    if (part.startsWith('**'))
      return (
        <strong key={i} style={{ color: c['text'] }}>
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith('`'))
      return (
        <code key={i} style={{ background: c['bg-raised'], padding: '0 4px', borderRadius: 2 }}>
          {part.slice(1, -1)}
        </code>
      );
    if (part.startsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });

function Markdown({ text }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const lines = text.split('\n');
  const out = [];
  let i = 0;
  const key = () => out.length;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith(F)) {
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith(F)) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      out.push(
        <pre
          key={key()}
          style={{
            ...mono,
            fontSize: 10,
            background: c['bg-deep'],
            border: `1px solid ${c['border']}`,
            borderRadius: 2,
            padding: '6px 8px',
            margin: '6px 0',
            overflowX: 'auto',
            color: c['text-dim'],
            whiteSpace: 'pre',
          }}
        >
          {code.join('\n')}
        </pre>,
      );
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      out.push(
        <div
          key={key()}
          style={{
            fontWeight: 700,
            fontSize: h[1].length === 1 ? 15 : 13,
            margin: h[1].length === 1 ? '0 0 8px' : '14px 0 4px',
            color: h[1].length === 1 ? c['loot-gold'] : c['text'],
            borderBottom: h[1].length < 3 ? `1px solid ${c['text-dim']}` : 'none',
            paddingBottom: 2,
          }}
        >
          {inline(h[2], c)}
        </div>,
      );
      i += 1;
      continue;
    }
    const img = line.match(/^!\[(.*)\]\((.*)\)$/);
    if (img) {
      out.push(
        <figure key={key()} style={{ margin: '8px 0' }}>
          <img
            src={img[2]}
            alt={img[1]}
            style={{
              width: '100%',
              display: 'block',
              border: `1px solid ${c['border']}`,
              borderRadius: 2,
            }}
          />
          <figcaption
            style={{
              ...mono,
              fontSize: 10,
              color: c['text-dim'],
              marginTop: 3,
              textAlign: 'center',
            }}
          >
            {img[1]}
          </figcaption>
        </figure>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i]);
        i += 1;
      }
      const cells = (r) =>
        r
          .split('|')
          .slice(1, -1)
          .map((x) => x.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      out.push(
        <table
          key={key()}
          style={{
            ...mono,
            fontSize: 11,
            borderCollapse: 'collapse',
            width: '100%',
            margin: '6px 0',
          }}
        >
          <thead>
            <tr>
              {head.map((x, j) => (
                <th
                  key={j}
                  style={{
                    textAlign: 'left',
                    padding: '3px 6px',
                    borderBottom: `1px solid ${c['text-dim']}`,
                    color: c['text-dim'],
                    fontWeight: 600,
                  }}
                >
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((r, j) => (
              <tr key={j}>
                {r.map((x, k) => (
                  <td
                    key={k}
                    style={{ padding: '3px 6px', borderBottom: `1px solid ${c['border']}` }}
                  >
                    {inline(x, c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>,
      );
      continue;
    }
    if (line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i += 1;
      }
      out.push(
        <ul key={key()} style={{ margin: '4px 0', paddingLeft: 18 }}>
          {items.map((x, j) => (
            <li key={j}>{inline(x, c)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (line.trim() === '') {
      i += 1;
      continue;
    }
    out.push(
      <p key={key()} style={{ margin: '4px 0' }}>
        {inline(line, c)}
      </p>,
    );
    i += 1;
  }
  return (
    <div
      style={{ ...mono, fontSize: 12, lineHeight: 1.55, color: c['text'], wordBreak: 'break-word' }}
    >
      {out}
    </div>
  );
}

/* ------------------------------------------------------------------ panel */

const KIND_COLOR = { IDEA: 'loot-gold', DEFECT: 'danger', 'FOLLOW-UP': 'loot-rare' };
const ORIGIN_TAG = {
  you: 'you',
  steward: 'steward',
  tavernkeeper: 'tavern',
  'server error': 'srv-err',
};

export const docFor = (b) => DOCS[b.id] ?? fallbackDoc(b);

export function BountyDocPanel({
  bounty,
  text,
  onSave,
  updating,
  notice,
  onPromote,
  onAbandon,
  onOpenQuest,
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const kindColor = c[KIND_COLOR[bounty.kind]];
  const isDefect = bounty.kind === 'DEFECT';
  const startEdit = () => {
    setDraft(text);
    setEditing(true);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <div
        style={{
          flexShrink: 0,
          paddingBottom: 8,
          borderBottom: `1px solid ${c['border']}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span
            style={{
              ...mono,
              fontSize: 9,
              fontWeight: 600,
              padding: '1px 5px',
              borderRadius: 2,
              border: `1px solid ${kindColor}`,
              color: kindColor,
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            {bounty.kind}
          </span>
          <span
            style={{
              ...mono,
              fontSize: 12,
              fontWeight: 600,
              color: c['loot-gold'],
              flex: 1,
              minWidth: 0,
              wordBreak: 'break-word',
            }}
          >
            {bounty.title}
          </span>
          {editing ? (
            <>
              <PixelBtn
                label="SAVE"
                onClick={() => {
                  setEditing(false);
                  onSave(draft);
                }}
              />
              <PixelBtn label="CANCEL" variant="ghost" onClick={() => setEditing(false)} />
            </>
          ) : (
            <>
              <PixelBtn label="EDIT" variant="ghost" disabled={updating} onClick={startEdit} />
              {bounty.state === 'live' &&
                (confirming ? (
                  <>
                    <PixelBtn
                      label="CONFIRM ABANDON"
                      variant="danger"
                      onClick={() => {
                        setConfirming(false);
                        onAbandon();
                      }}
                    />
                    <PixelBtn label="CANCEL" variant="ghost" onClick={() => setConfirming(false)} />
                  </>
                ) : (
                  <PixelBtn label="ABANDON" variant="ghost" onClick={() => setConfirming(true)} />
                ))}
            </>
          )}
        </div>
        <div
          style={{
            ...mono,
            fontSize: 10,
            color: c['text-dim'],
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span>
            guild <span style={{ color: c['text'] }}>{bounty.guild}</span>
          </span>
          <span>
            origin <span style={{ color: c['text'] }}>{ORIGIN_TAG[bounty.origin]}</span>
          </span>
          <span>
            age <span style={{ color: c['text'] }}>{bounty.age}</span>
          </span>
          {bounty.count && (
            <span>
              occurrences <span style={{ color: c['danger'] }}>×{bounty.count}</span>
            </span>
          )}
          <span>
            state {bounty.state === 'live' && <span style={{ color: c['success'] }}>LIVE</span>}
            {bounty.state === 'abandoned' && (
              <span style={{ color: c['text-dim'] }}>ABANDONED</span>
            )}
            {bounty.state === 'promoted' && (
              <span
                onClick={() => onOpenQuest(bounty.questId)}
                style={{ color: c['loot-rare'], cursor: 'pointer' }}
              >
                PROMOTED ↗ {bounty.quest}
              </span>
            )}
          </span>
        </div>
      </div>
      {(updating || notice) && (
        <div
          style={{
            ...mono,
            fontSize: 10,
            padding: '4px 8px',
            marginTop: 6,
            borderRadius: 2,
            flexShrink: 0,
            color: updating ? c['primary'] : c['success'],
            border: `1px solid ${updating ? c['primary'] : c['success']}`,
            background: c['bg-surface'],
          }}
        >
          {updating ? (
            <span style={{ animation: 'pulse 1s infinite' }}>● Sparkwright is updating…</span>
          ) : (
            `✓ ${notice}`
          )}
        </div>
      )}
      <div
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '10px 0' }}
      >
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            autoFocus
            style={{
              ...mono,
              fontSize: 11,
              lineHeight: 1.5,
              width: '100%',
              height: '100%',
              minHeight: 300,
              boxSizing: 'border-box',
              resize: 'none',
              color: c['text'],
              background: c['bg-deep'],
              border: `1px solid ${c['loot-gold']}`,
              borderRadius: 2,
              padding: 8,
              outline: 'none',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          />
        ) : (
          <Markdown text={text} />
        )}
      </div>
      <div
        style={{
          flexShrink: 0,
          borderTop: `1px solid ${c['border']}`,
          paddingTop: 8,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        {bounty.state === 'promoted' ? (
          <span
            onClick={() => onOpenQuest(bounty.questId)}
            style={{ ...mono, fontSize: 11, color: c['loot-rare'], cursor: 'pointer' }}
          >
            Promoted → {bounty.quest} ↗
          </span>
        ) : bounty.state === 'abandoned' ? (
          <span style={{ ...mono, fontSize: 11, color: c['text-dim'] }}>
            Abandoned — nothing to promote.
          </span>
        ) : (
          <PixelBtn
            label={isDefect ? 'PROMOTE TO BUG HUNT' : 'PROMOTE TO QUEST'}
            disabled={editing}
            onClick={onPromote}
          />
        )}
      </div>
    </div>
  );
}
