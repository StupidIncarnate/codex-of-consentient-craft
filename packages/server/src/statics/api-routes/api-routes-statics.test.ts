import { apiRoutesStatics } from './api-routes-statics';

describe('apiRoutesStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(apiRoutesStatics).toStrictEqual({
      health: {
        check: '/api/health',
      },
      quests: {
        list: '/api/quests',
        byId: '/api/quests/:questId',
        start: '/api/quests/:questId/start',
        pause: '/api/quests/:questId/pause',
      },
      process: {
        status: '/api/process/:processId',
        output: '/api/process/:processId/output',
      },
      guilds: {
        list: '/api/guilds',
        byId: '/api/guilds/:guildId',
      },
      sessions: {
        new: '/api/sessions/new',
        list: '/api/guilds/:guildId/sessions',
        chat: '/api/sessions/:sessionId/chat',
        chatStop: '/api/sessions/:sessionId/chat/:chatProcessId/stop',
        clarify: '/api/sessions/:sessionId/clarify',
      },
      design: {
        start: '/api/quests/:questId/design/start',
        stop: '/api/quests/:questId/design/stop',
        session: '/api/quests/:questId/design/session',
      },
      directories: {
        browse: '/api/directories/browse',
      },
    });
  });
});
