import { apiRoutesStatics } from './api-routes-statics';

describe('apiRoutesStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(apiRoutesStatics).toStrictEqual({
      health: {
        check: '/api/health',
      },
      quests: {
        list: '/api/quests',
        queue: '/api/quests/queue',
        byId: '/api/quests/:questId',
        new: '/api/guilds/:guildId/quests',
        chat: '/api/quests/:questId/chat',
        clarify: '/api/quests/:questId/clarify',
        start: '/api/quests/:questId/start',
        pause: '/api/quests/:questId/pause',
        resume: '/api/quests/:questId/resume',
        abandon: '/api/quests/:questId/abandon',
        delete: '/api/quests/:questId',
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
        list: '/api/guilds/:guildId/sessions',
      },
      design: {
        start: '/api/quests/:questId/design/start',
        stop: '/api/quests/:questId/design/stop',
        session: '/api/quests/:questId/design/session',
      },
      directories: {
        browse: '/api/directories/browse',
      },
      tooling: {
        smoketestRun: '/api/tooling/smoketest/run',
        smoketestState: '/api/tooling/smoketest/state',
      },
    });
  });
});
