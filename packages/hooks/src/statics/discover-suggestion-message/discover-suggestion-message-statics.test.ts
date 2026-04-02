import { discoverSuggestionMessageStatics } from './discover-suggestion-message-statics';

describe('discoverSuggestionMessageStatics', () => {
  it('VALID: discoverSuggestionMessageStatics => contains blockMessage with discover tool hint', () => {
    expect(discoverSuggestionMessageStatics).toStrictEqual({
      blockMessage: [
        'BLOCKED: Use the `discover` MCP tool (mcp__dungeonmaster__discover) instead of Grep/Glob/Search/Find.',
        'Examples: { "glob": "**/*.ts" }, { "grep": "keyword" }, { "glob": "src/**", "grep": "pattern" }',
        'Full parameter docs in the architecture overview (loaded at session start).',
      ].join('\n'),
    });
  });
});
