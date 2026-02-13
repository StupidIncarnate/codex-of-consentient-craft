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
  discover: {
    search: '/api/discover',
  },
  projects: {
    list: '/api/projects',
    byId: '/api/projects/:projectId',
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
