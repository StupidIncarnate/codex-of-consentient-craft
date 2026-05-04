/**
 * PURPOSE: Message shown when Grep/Glob is blocked, guiding the model to use the discover MCP tool
 *
 * USAGE:
 * discoverSuggestionMessageStatics.blockMessage;
 * // Returns the full discover tool usage guide for injection into hook output
 */

export const discoverSuggestionMessageStatics = {
  blockMessage: [
    "BLOCKED: Native search tools are disabled. Pick the package(s) you need and call `get-project-map({ packages: ['<name>', ...] })` to load slices, then use `discover` (mcp__dungeonmaster__discover) to search.",
    'Examples: { "glob": "packages/web/src/widgets/**" }, { "grep": "isNewSession" }, { "glob": "packages/hooks/**", "grep": "isNew" }',
  ].join('\n'),
} as const;
