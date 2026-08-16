import { webConfigStatics } from './web-config-statics';

describe('webConfigStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(webConfigStatics).toStrictEqual({
      api: {
        routes: {
          guilds: '/api/guilds',
          guildById: '/api/guilds/:guildId',
          directoriesBrowse: '/api/directories/browse',
          quests: '/api/quests',
          questsQueue: '/api/quests/queue',
          questById: '/api/quests/:questId',
          questWardDetail: '/api/quests/:questId/ward-results/:wardResultId',
          questRiftcarverDetail: '/api/quests/:questId/riftcarver-results/:riftcarverResultId',
          questSummary: '/api/quests/:questId/summary',
          guildSessions: '/api/guilds/:guildId/sessions',
          sessionChatHistory: '/api/sessions/:sessionId/chat/history',
          questNew: '/api/guilds/:guildId/quests',
          questChat: '/api/quests/:questId/chat',
          questFollowup: '/api/quests/:questId/followup',
          questFollowupStop: '/api/quests/:questId/followup/stop',
          questClarify: '/api/quests/:questId/clarify',
          questComments: '/api/quests/:questId/comments',
          processStatus: '/api/process/:processId',
          questStart: '/api/quests/:questId/start',
          questPause: '/api/quests/:questId/pause',
          questResume: '/api/quests/:questId/resume',
          questAbandon: '/api/quests/:questId/abandon',
          questMerge: '/api/quests/:questId/merge',
          designStart: '/api/quests/:questId/design/start',
          designStop: '/api/quests/:questId/design/stop',
          designSession: '/api/quests/:questId/design/session',
          toolingSmoketestRun: '/api/tooling/smoketest/run',
          toolingSmoketestState: '/api/tooling/smoketest/state',
          rateLimits: '/api/rate-limits',
          orchestrationDispatch: '/api/orchestration/dispatch',
          orchestrationDispatchPlay: '/api/orchestration/dispatch/play',
          orchestrationDispatchPause: '/api/orchestration/dispatch/pause',
          orchestrationMode: '/api/orchestration/mode',
        },
      },
      polling: {
        intervalMs: 2000,
      },
      websocket: {
        reconnectDelayMs: 3000,
        wardDetailTimeoutMs: 30000,
      },
    });
  });
});
