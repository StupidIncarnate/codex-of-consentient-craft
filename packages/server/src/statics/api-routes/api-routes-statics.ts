/**
 * PURPOSE: Defines immutable API route path constants for all server endpoints
 *
 * USAGE:
 * apiRoutesStatics.quests.list;
 * // Returns '/api/quests'
 */

export const apiRoutesStatics = {
  health: {
    check: '/api/health',
  },
  quests: {
    list: '/api/quests',
    byId: '/api/quests/:questId',
    verify: '/api/quests/:questId/verify',
    start: '/api/quests/:questId/start',
  },
  process: {
    status: '/api/process/:processId',
    output: '/api/process/:processId/output',
  },
  guilds: {
    list: '/api/guilds',
    byId: '/api/guilds/:guildId',
    chat: '/api/guilds/:guildId/chat',
  },
  sessions: {
    list: '/api/guilds/:guildId/sessions',
    chat: '/api/sessions/:sessionId/chat',
    chatStop: '/api/sessions/:sessionId/chat/:chatProcessId/stop',
    chatHistory: '/api/sessions/:sessionId/chat/history',
  },
  directories: {
    browse: '/api/directories/browse',
  },
} as const;
