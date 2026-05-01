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
 * - `call`            — the probe invokes the tool with `args`. If the tool errors, the probe signals `failed` with `<tool>-tool-error`. Otherwise it signals `complete` with `summary`.
 * - `signal-only`     — the probe skips the tool call and just signals complete (used for `signal-back` itself).
 * - `skip-call`       — the probe deliberately does NOT call the tool (used for `ask-user-question`, which would block the harness).
 * - `skip-from-suite` — the tool is registered globally but is NOT exercised by the MCP smoketest suite (e.g. `start-quest`, whose semantics are covered by the orchestration suite). The prompt builder and case catalog filter these out.
 *
 * PLACEHOLDERS in `args`:
 * - `'{{questId}}'`   is rewritten to the running smoketest's questId at enqueue time (live id).
 * - `'{{guildId}}'`   is rewritten to the smoketest guild's GuildId at enqueue time.
 * - `'{{processId}}'` is rewritten to the smoketest's pre-registered orchestration processId at enqueue time (live id; the queue runner adopts this same id when it picks the quest up).
 *
 * Failure-signaling rule: any tool-call error during a `call` probe makes the agent signal `failed` —
 * masked errors used to silently pass when the agent dutifully called signal-back complete. With every
 * placeholder substituted to a live id at enqueue time, there is no legitimate reason for an MCP probe
 * to error, so a tool error means a real regression (permission gap, contract drift, broken handler).
 */

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
    args: { questId: '{{questId}}' },
    summary: 'mcp-get-quest-probe-ok',
  },
  'modify-quest': {
    mode: 'call',
    args: { questId: '{{questId}}' },
    summary: 'mcp-modify-quest-probe-ok',
  },
  'signal-back': {
    mode: 'signal-only',
    summary: 'mcp-signal-back-probe-ok',
  },
  'start-quest': {
    mode: 'skip-from-suite',
    summary: 'mcp-start-quest-not-in-mcp-suite',
    note: 'start-quest semantics belong to the orchestration smoketest suite (end-to-end quest lifecycle).',
  },
  'get-quest-status': {
    mode: 'call',
    args: { processId: '{{processId}}' },
    summary: 'mcp-get-quest-status-probe-ok',
  },
  'list-quests': {
    mode: 'call',
    args: { guildId: '{{guildId}}' },
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
  'get-quest-planning-notes': {
    mode: 'call',
    args: { questId: '{{questId}}' },
    summary: 'mcp-get-quest-planning-notes-probe-ok',
  },
  'get-project-inventory': {
    mode: 'call',
    args: { packageName: 'shared' },
    summary: 'mcp-get-project-inventory-probe-ok',
  },
} as const;
