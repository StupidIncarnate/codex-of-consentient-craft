import { agentSessionWallStatics } from './agent-session-wall-statics';

describe('agentSessionWallStatics', () => {
  it('VALID: {agentSessionWallStatics} => holds the MCP server key, the wall marker and the nudge budget', () => {
    expect(agentSessionWallStatics).toStrictEqual({
      mcp: {
        serverName: 'dungeonmaster',
        wallStatuses: ['failed', 'needs-auth', 'disabled'],
      },
      marker: {
        text: 'DUNGEONMASTER-WALL:',
      },
      unsignalledExit: {
        maxNudges: 1,
      },
    });
  });
});
