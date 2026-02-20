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
      guildChat: '/api/guilds/:guildId/chat',
      guildChatStop: '/api/guilds/:guildId/chat/:chatProcessId/stop',
      guildChatHistory: '/api/guilds/:guildId/chat/history',
      directoriesBrowse: '/api/directories/browse',
      quests: '/api/quests',
      questById: '/api/quests/:questId',
      questStart: '/api/quests/:questId/start',
      questVerify: '/api/quests/:questId/verify',
      questChat: '/api/quests/:questId/chat',
      questChatStop: '/api/quests/:questId/chat/:chatProcessId/stop',
      questChatHistory: '/api/quests/:questId/chat/history',
      guildSessionResolve: '/api/guilds/:guildId/sessions/:sessionId',
      processStatus: '/api/process/:processId',
    },
  },
  polling: {
    intervalMs: 2000,
  },
  websocket: {
    reconnectDelayMs: 3000,
  },
} as const;
