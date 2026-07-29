/**
 * PURPOSE: The browser permission `dungeonmaster init` grants in `.claude/settings.json` so
 * dispatched relay agents can drive the Claude-in-Chrome MCP.
 *
 * USAGE:
 * agentBrowserPermissionsStatics.allow;
 * // Returns ['mcp__claude-in-chrome'] — the settings.json allow entry
 *
 * A dispatched agent has no interactive approver: the Node dispatcher's headless `claude -p`
 * children (and Task sub-agents under `/dumpster-launch`) get a hard "you haven't granted it
 * yet" denial for any MCP tool outside `permissions.allow`, never a prompt. Siegemaster drives
 * the real browser to confirm every `ui-state` observable, so the grant is stated here rather
 * than left resting on the `--chrome` spawn flag authorising its own tools.
 *
 * The entry is server-scoped (no trailing tool name), matching how Claude Code reads a bare
 * `mcp__<server>` grant — so it covers every `mcp__claude-in-chrome__*` tool, including ones a
 * later CLI release adds.
 */

export const agentBrowserPermissionsStatics = {
  allow: ['mcp__claude-in-chrome'],
} as const;
