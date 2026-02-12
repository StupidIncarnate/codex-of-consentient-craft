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
      quests: '/api/quests',
      questById: '/api/quests/:questId',
      questStart: '/api/quests/:questId/start',
      questVerify: '/api/quests/:questId/verify',
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
