/**
 * PURPOSE: Defines immutable API route path constants for all server endpoints
 *
 * USAGE:
 * apiRoutesStatics.quests.list;
 * // Returns '/api/quests'
 */

import { pastedImageStatics } from '@dungeonmaster/shared/statics';

export const apiRoutesStatics = {
  health: {
    check: '/api/health',
  },
  images: {
    serve: pastedImageStatics.serveRoutePath,
    pathQueryParam: 'path',
  },
  quests: {
    list: '/api/quests',
    queue: '/api/quests/queue',
    bySession: '/api/quests/by-session/:sessionId',
    byId: '/api/quests/:questId',
    new: '/api/guilds/:guildId/quests',
    chat: '/api/quests/:questId/chat',
    followup: '/api/quests/:questId/followup',
    followupStop: '/api/quests/:questId/followup/stop',
    clarify: '/api/quests/:questId/clarify',
    comments: '/api/quests/:questId/comments',
    start: '/api/quests/:questId/start',
    pause: '/api/quests/:questId/pause',
    resume: '/api/quests/:questId/resume',
    abandon: '/api/quests/:questId/abandon',
    merge: '/api/quests/:questId/merge',
    delete: '/api/quests/:questId',
    wardDetail: '/api/quests/:questId/ward-results/:wardResultId',
    riftcarverDetail: '/api/quests/:questId/riftcarver-results/:riftcarverResultId',
    summary: '/api/quests/:questId/summary',
    humanVerdict: '/api/quests/:questId/human-verdict',
    signalBack: '/api/quests/:questId/signal-back',
    projection: '/api/quests/:questId/projection',
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
  directories: {
    browse: '/api/directories/browse',
  },
  tooling: {
    smoketestRun: '/api/tooling/smoketest/run',
    smoketestState: '/api/tooling/smoketest/state',
  },
  rateLimits: {
    get: '/api/rate-limits',
  },
  orchestration: {
    dispatch: '/api/orchestration/dispatch',
    dispatchPlay: '/api/orchestration/dispatch/play',
    dispatchPause: '/api/orchestration/dispatch/pause',
    mode: '/api/orchestration/mode',
  },
} as const;
