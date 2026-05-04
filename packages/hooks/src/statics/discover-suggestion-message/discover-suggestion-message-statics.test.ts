import { discoverSuggestionMessageStatics } from './discover-suggestion-message-statics';

describe('discoverSuggestionMessageStatics', () => {
  it('VALID: discoverSuggestionMessageStatics => contains blockMessage with discover tool hint', () => {
    expect(discoverSuggestionMessageStatics).toStrictEqual({
      blockMessage: [
        "BLOCKED: Native search tools are disabled. Pick the package(s) you need and call `get-project-map({ packages: ['<name>', ...] })` to load slices, then use `discover` (mcp__dungeonmaster__discover) to search.",
        'Examples: { "glob": "packages/web/src/widgets/**" }, { "grep": "isNewSession" }, { "glob": "packages/hooks/**", "grep": "isNew" }',
      ].join('\n'),
    });
  });
});
