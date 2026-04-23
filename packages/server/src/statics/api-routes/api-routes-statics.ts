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
    start: '/api/quests/:questId/start',
    pause: '/api/quests/:questId/pause',
    resume: '/api/quests/:questId/resume',
    abandon: '/api/quests/:questId/abandon',
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
  tooling: {
    smoketestRun: '/api/tooling/smoketest/run',
    smoketestState: '/api/tooling/smoketest/state',
  },
} as const;
