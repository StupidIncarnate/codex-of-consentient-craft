/**
 * PURPOSE: Configuration constants for the programmatic-service headline renderer
 *
 * USAGE:
 * projectMapHeadlineProgrammaticServiceStatics.apiSectionHeader;
 * // '## Public API'
 *
 * WHEN-TO-USE: project-map-headline-programmatic-service broker and its layer brokers
 */

export const projectMapHeadlineProgrammaticServiceStatics = {
  methodNamePadWidth: 28,
  apiSectionHeader: '## Public API',
  apiSectionEmpty: '(no exported namespace methods found in this package)',
  apiSectionDescription:
    'Exhaustive: every method on the exported namespace object. Methods are grouped by domain noun (e.g. Guild, Quest, Chat).',
  eventsSectionHeader: '## Event bus emissions',
  eventsSectionEmpty: '(no WS events emitted by this package)',
  stateWritesSectionHeader: '## State writes',
  stateWritesSectionEmpty: '(no state writes found in this package)',
  inMemoryLabel: 'in-memory:',
  filesLabel: 'files:    ',
  browserLabel: 'browser:  ',
  exemplarSectionPrefix: '## Detailed exemplar — `',
  exemplarSectionSuffix: '`',
  exemplarDescription:
    'The API-table entry above shows the call shape. This section traces the same method end-to-end including internal flow, state writes, file writes, spawns, and bus emissions.',
  exemplarRequestChainHeader: '### Call trace',
  boundaryBoxInnerWidth: 56,
  boundaryBoxPad: 2,
  genericBoundaryBoxLabel: 'BOUNDARY →',
  genericBoundaryBoxNote: '(cross-package adapter call)',
  genericBoundaryBoxFill: '═',
  genericBoundaryBoxCornerTL: '╔',
  genericBoundaryBoxCornerTR: '╗',
  genericBoundaryBoxCornerBL: '╚',
  genericBoundaryBoxCornerBR: '╝',
  genericBoundaryBoxSide: '║',
  genericBoundaryBoxIndent: '      ',
  // Domain groupings: verb prefix → domain group label
  methodGroupPrefixes: {
    listGuilds: 'Guilds',
    getGuild: 'Guilds',
    addGuild: 'Guilds',
    updateGuild: 'Guilds',
    removeGuild: 'Guilds',
    listQuests: 'Quests',
    loadQuest: 'Quests',
    addQuest: 'Quests',
    getQuest: 'Quests',
    modifyQuest: 'Quests',
    deleteQuest: 'Quests',
    getPlanningNotes: 'Quests',
    startQuest: 'Orchestration',
    pauseQuest: 'Orchestration',
    resumeQuest: 'Orchestration',
    abandonQuest: 'Orchestration',
    getQuestStatus: 'Orchestration',
    recoverActiveQuests: 'Orchestration',
    startChat: 'Chat',
    clarifyAnswer: 'Chat',
    stopChat: 'Chat',
    stopAllChats: 'Chat',
    replayChat: 'Chat',
    startDesignChat: 'Chat',
    browseDirectories: 'Directory',
    bootstrapExecutionQueue: 'ExecutionQueue',
    syncExecutionQueue: 'ExecutionQueue',
    setWebPresence: 'ExecutionQueue',
    getExecutionQueue: 'ExecutionQueue',
    runSmoketest: 'Smoketest',
    getSmoketestState: 'Smoketest',
    persistWardResult: 'Ward',
    getWardDetail: 'Ward',
  },
} as const;
