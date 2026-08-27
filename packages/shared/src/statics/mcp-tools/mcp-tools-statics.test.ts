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
          'ask-user-question',
          'get-agent-prompt',
          'get-project-map',
          'get-quest-planning-notes',
          'get-qa-checklist',
          'get-blight-checklist',
          'get-project-inventory',
          'create-quest',
          'get-next-step',
          'run-ward',
          'run-riftcarver',
          'get-server-config',
          'reset-flow-signoffs',
          'get-quest-summary',
          'get-planner-information',
          'get-worker-information',
          'get-reviewer-information',
        ],
      },
    });
  });
});
