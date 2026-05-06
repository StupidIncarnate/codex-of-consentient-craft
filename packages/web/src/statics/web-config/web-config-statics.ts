/**
 * PURPOSE: Defines immutable API route paths, polling intervals, and WebSocket configuration for the web client
 *
 * USAGE:
 * webConfigStatics.api.routes.quests;
 * // Returns '/api/quests'
 */

export const webConfigStatics = {
  api: {
    routes: {
      guilds: '/api/guilds',
      guildById: '/api/guilds/:guildId',
      directoriesBrowse: '/api/directories/browse',
      quests: '/api/quests',
      questsQueue: '/api/quests/queue',
      questById: '/api/quests/:questId',
      guildSessions: '/api/guilds/:guildId/sessions',
      sessionChatHistory: '/api/sessions/:sessionId/chat/history',
      questNew: '/api/guilds/:guildId/quests',
      questChat: '/api/quests/:questId/chat',
      questClarify: '/api/quests/:questId/clarify',
      processStatus: '/api/process/:processId',
      questStart: '/api/quests/:questId/start',
      questPause: '/api/quests/:questId/pause',
      questResume: '/api/quests/:questId/resume',
      questAbandon: '/api/quests/:questId/abandon',
      designStart: '/api/quests/:questId/design/start',
      designStop: '/api/quests/:questId/design/stop',
      designSession: '/api/quests/:questId/design/session',
      toolingSmoketestRun: '/api/tooling/smoketest/run',
      toolingSmoketestState: '/api/tooling/smoketest/state',
      rateLimits: '/api/rate-limits',
    },
  },
  polling: {
    intervalMs: 2000,
  },
  websocket: {
    reconnectDelayMs: 3000,
  },
} as const;
