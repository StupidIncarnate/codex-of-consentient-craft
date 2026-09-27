/**
 * PURPOSE: The names the hooks package and the MCP server share for the caller context a
 *   PreToolUse hook stamps onto every dungeonmaster MCP call. The hook writes the context into the
 *   tool arguments under `keys.argument`, because `updatedInput` is the only channel a hook has into
 *   an MCP call. The MCP server lifts it out of the arguments again before any tool's own input
 *   contract parses them, and hands it on under `keys.meta` beside Claude Code's own `_meta`
 *   entries. Both sides read these names from here so they cannot drift apart.
 *
 * USAGE:
 * mcpCallerContextStatics.keys.argument;
 * // Returns 'dungeonmasterCaller'
 */

export const mcpCallerContextStatics = {
  keys: {
    argument: 'dungeonmasterCaller',
    meta: 'dungeonmaster/caller',
  },
  hook: {
    matcher: 'mcp__dungeonmaster__.*',
  },
} as const;
