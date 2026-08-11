import { discoverSuggestionMessageStatics } from './discover-suggestion-message-statics';

describe('discoverSuggestionMessageStatics', () => {
  it('VALID: discoverSuggestionMessageStatics => contains blockMessage with discover tool hint', () => {
    expect(discoverSuggestionMessageStatics).toStrictEqual({
      blockMessage: [
        "BLOCKED: Native search tools are disabled. Pick the package(s) you need and call `get-project-map({ packages: ['<name>', ...] })` to load slices, then use `discover` (mcp__dungeonmaster__discover) to search.",
        'Examples: { "glob": "packages/web/src/widgets/**" }, { "grep": "isNewSession" }, { "glob": "packages/hooks/**", "grep": "isNew" }',
        'Not searching? `ls` is NOT blocked — use it to list a directory whose path you already know.',
        'Compiled output is indexed too: `discover` reaches `dist/` when you give it an explicit glob.',
        'Outside this repo (a spilled tool-result under ~/.claude, a sibling checkout) `discover` cannot reach it at all — read the path with the Read tool, or scan it with `python3 -c` (os.walk + re).',
      ].join('\n'),
    });
  });
});
