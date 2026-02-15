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
    chat: '/api/quests/:questId/chat',
    chatStop: '/api/quests/:questId/chat/:chatProcessId/stop',
    chatHistory: '/api/quests/:questId/chat/history',
  },
  process: {
    status: '/api/process/:processId',
    output: '/api/process/:processId/output',
  },
  discover: {
    search: '/api/discover',
  },
  guilds: {
    list: '/api/guilds',
    byId: '/api/guilds/:guildId',
  },
  directories: {
    browse: '/api/directories/browse',
  },
  docs: {
    architecture: '/api/docs/architecture',
    folderDetail: '/api/docs/folder-detail/:type',
    syntaxRules: '/api/docs/syntax-rules',
    testingPatterns: '/api/docs/testing-patterns',
  },
} as const;
