import { webConfigStatics } from './web-config-statics';

describe('webConfigStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(webConfigStatics).toStrictEqual({
      api: {
        routes: {
          guilds: '/api/guilds',
          guildById: '/api/guilds/:guildId',
          sessionNew: '/api/sessions/new',
          directoriesBrowse: '/api/directories/browse',
          quests: '/api/quests',
          questById: '/api/quests/:questId',
          guildSessions: '/api/guilds/:guildId/sessions',
          sessionChat: '/api/sessions/:sessionId/chat',
          sessionChatStop: '/api/sessions/:sessionId/chat/:chatProcessId/stop',
          sessionClarify: '/api/sessions/:sessionId/clarify',
          sessionChatHistory: '/api/sessions/:sessionId/chat/history',
          processStatus: '/api/process/:processId',
          questStart: '/api/quests/:questId/start',
          questPause: '/api/quests/:questId/pause',
          questResume: '/api/quests/:questId/resume',
          questAbandon: '/api/quests/:questId/abandon',
          designStart: '/api/quests/:questId/design/start',
          designStop: '/api/quests/:questId/design/stop',
          designSession: '/api/quests/:questId/design/session',
        },
      },
      polling: {
        intervalMs: 2000,
      },
      websocket: {
        reconnectDelayMs: 3000,
      },
    });
  });
});
