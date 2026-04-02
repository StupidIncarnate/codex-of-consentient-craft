/**
 * PURPOSE: Message shown when Grep/Glob is blocked, guiding the model to use the discover MCP tool
 *
 * USAGE:
 * discoverSuggestionMessageStatics.blockMessage;
 * // Returns the full discover tool usage guide for injection into hook output
 */

export const discoverSuggestionMessageStatics = {
  blockMessage: [
    'BLOCKED: Use the `discover` MCP tool (mcp__dungeonmaster__discover) instead of Grep/Glob/Search/Find.',
    'Examples: { "glob": "**/*.ts" }, { "grep": "keyword" }, { "glob": "src/**", "grep": "pattern" }',
    'Full parameter docs in the architecture overview (loaded at session start).',
  ].join('\n'),
} as const;
