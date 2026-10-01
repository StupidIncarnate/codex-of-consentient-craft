/**
 * PURPOSE: The values the spawn layer uses to declare a `wall` for a dispatched session that cannot
 * declare one itself. Reach for this over `quest-work`'s own `outcome` payload when the thing that
 * failed IS the dungeonmaster MCP server, or anything else that leaves `quest-work` unreachable: the
 * session then has no tool to report through, and only its stdout reaches the orchestrator.
 *
 * USAGE:
 * agentSessionWallStatics.marker.text;
 * // Returns 'DUNGEONMASTER-WALL:'
 */

export const agentSessionWallStatics = {
  mcp: {
    // The server key `.mcp.json` registers, and the `name` the CLI's init line reports it under.
    serverName: 'dungeonmaster',
    // The init-line statuses that never become `connected` in this session. `pending` is absent on
    // purpose: the CLI writes the init line about 3s after spawn without waiting on a project-scoped
    // server, and a server still starting finishes connecting in the background and its tools arrive
    // for the session's later turns (measured on Claude Code 2.1.287). A server that never connects
    // still reaches `wall` through the session's own `DUNGEONMASTER-WALL:` result line.
    wallStatuses: ['failed', 'needs-auth', 'disabled'],
  },
  marker: {
    // The line a session ends its turn with when it cannot reach `quest-work`. Read off the CLI's
    // final `result` line, so prose that merely mentions the marker mid-session never trips it.
    text: 'DUNGEONMASTER-WALL:',
  },
  unsignalledExit: {
    // How many times a session that exits cleanly without signalling is resumed and told so, before
    // the spawn layer records a wall for it instead of resuming it again.
    maxNudges: 1,
  },
} as const;
