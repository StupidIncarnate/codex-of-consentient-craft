import { mcpToolsStatics } from './mcp-tools-statics';

describe('mcpToolsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(mcpToolsStatics).toStrictEqual({
      server: {
        name: 'dungeonmaster',
      },
      tools: {
        names: [
          'discover',
          'get-architecture',
          'get-folder-detail',
          'get-syntax-rules',
          'get-testing-patterns',
          'get-quest',
          'modify-quest',
          'signal-back',
          'start-quest',
          'get-quest-status',
          'list-quests',
          'list-guilds',
          'verify-quest',
          'ask-user-question',
        ],
      },
    });
  });
});
