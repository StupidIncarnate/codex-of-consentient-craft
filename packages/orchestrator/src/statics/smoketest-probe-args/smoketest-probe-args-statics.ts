/**
 * PURPOSE: Per-MCP-tool probe specification — the call-mode, arguments, and success summary for each tool. Consumed by `smoketestPromptsStatics` to synthesize a probe prompt per tool, and by `smoketestCaseCatalogStatics` to synthesize a case entry per tool
 *
 * USAGE:
 * smoketestProbeArgsStatics['discover'];
 * // Returns: { mode: 'call', args: { glob: '...' }, summary: 'mcp-discover-probe-ok' }
 *
 * WHEN-TO-USE: Every entry in `mcpToolsStatics.tools.names` must have a matching key here. A colocated
 * test pins this 1:1 alignment so that adding a new MCP tool forces the smoketest spec to be extended
 * rather than silently skipped.
 *
 * MODES:
 * - `call`     — the probe invokes the tool with `args`, then signals complete.
 * - `signal-only` — the probe skips the tool call and just signals complete (used for `signal-back` itself).
 * - `skip-call`   — the probe deliberately does NOT call the tool (used for `ask-user-question`, which would block the harness).
 */

import { smoketestStatics } from '../smoketest/smoketest-statics';

const Q = smoketestStatics.questId;
const G = smoketestStatics.guildId;

export const smoketestProbeArgsStatics = {
  discover: {
    mode: 'call',
    args: { glob: 'packages/*/src/statics/**' },
    summary: 'mcp-discover-probe-ok',
  },
  'get-architecture': {
    mode: 'call',
    args: {},
    summary: 'mcp-get-architecture-probe-ok',
  },
  'get-folder-detail': {
    mode: 'call',
    args: { folderType: 'brokers' },
    summary: 'mcp-get-folder-detail-probe-ok',
  },
  'get-syntax-rules': {
    mode: 'call',
    args: {},
    summary: 'mcp-get-syntax-rules-probe-ok',
  },
  'get-testing-patterns': {
    mode: 'call',
    args: {},
    summary: 'mcp-get-testing-patterns-probe-ok',
  },
  'get-quest': {
    mode: 'call',
    args: { questId: Q },
    summary: 'mcp-get-quest-probe-ok',
  },
  'modify-quest': {
    mode: 'call',
    args: { questId: Q },
    summary: 'mcp-modify-quest-probe-ok',
  },
  'signal-back': {
    mode: 'signal-only',
    summary: 'mcp-signal-back-probe-ok',
  },
  'start-quest': {
    mode: 'call',
    args: { questId: Q },
    summary: 'mcp-start-quest-probe-ok',
  },
  'get-quest-status': {
    mode: 'call',
    args: { questId: Q },
    summary: 'mcp-get-quest-status-probe-ok',
  },
  'list-quests': {
    mode: 'call',
    args: { guildId: G },
    summary: 'mcp-list-quests-probe-ok',
  },
  'list-guilds': {
    mode: 'call',
    args: {},
    summary: 'mcp-list-guilds-probe-ok',
  },
  'ask-user-question': {
    mode: 'skip-call',
    summary:
      'mcp-ask-user-question-probe-ok (deferred: calling ask-user-question would block the smoketest)',
    note: 'Do not call ask-user-question and do not output anything else.',
  },
  'get-agent-prompt': {
    mode: 'call',
    args: { agent: 'chaoswhisperer-gap-minion' },
    summary: 'mcp-get-agent-prompt-probe-ok',
  },
  'get-project-map': {
    mode: 'call',
    args: {},
    summary: 'mcp-get-project-map-probe-ok',
  },
  'get-planning-notes': {
    mode: 'call',
    args: { questId: Q },
    summary: 'mcp-get-planning-notes-probe-ok',
  },
} as const;
