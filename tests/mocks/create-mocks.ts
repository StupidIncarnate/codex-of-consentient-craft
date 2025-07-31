import type { QuestManager } from '../../src/core/quest-manager';
import type { FileSystem } from '../../src/core/file-system';
import type { AgentSpawner } from '../../src/agents/agent-spawner';
import type { Logger } from '../../src/utils/logger';
import type { PhaseRunner } from '../../src/core/phase-runner-interface';
import type { QuestOrchestrator } from '../../src/core/quest-orchestrator';
import type { ConfigManager } from '../../src/core/config-manager';
import type { PhaseType } from '../../src/models/quest';
import type { AgentType } from '../../src/models/agent';

export function createMockQuestManager(): jest.Mocked<QuestManager> {
  return {
    saveQuest: jest.fn().mockReturnValue({ success: true }),
    getNextReportNumber: jest.fn().mockReturnValue('001'),
    loadQuest: jest.fn(),
    createNewQuest: jest.fn(),
    getQuest: jest.fn(),
    getAllQuests: jest.fn(),
    getActiveQuests: jest.fn(),
    findQuest: jest.fn(),
    abandonQuest: jest.fn(),
    isQuestComplete: jest.fn().mockReturnValue(false),
    getCurrentPhase: jest.fn().mockReturnValue('discovery'),
    addTasks: jest.fn(),
    applyReconciliation: jest.fn(),
    getCreatedFiles: jest.fn().mockReturnValue([]),
    getChangedFiles: jest.fn().mockReturnValue([]),
    validateQuestFreshness: jest.fn().mockReturnValue({ isStale: false }),
    generateRetrospective: jest.fn().mockReturnValue('Generated retrospective content'),
    saveRetrospective: jest.fn(),
    completeQuest: jest.fn(),
  } as unknown as jest.Mocked<QuestManager>;
}

export function createMockFileSystem(): jest.Mocked<FileSystem> {
  return {
    getFolderStructure: jest.fn(),
    initializeStructure: jest.fn(),
    cleanOldQuests: jest.fn(),
    findPackageJsons: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    appendFile: jest.fn(),
  } as unknown as jest.Mocked<FileSystem>;
}

export function createMockAgentSpawner(): jest.Mocked<AgentSpawner> {
  return {
    spawnAndWait: jest.fn().mockResolvedValue({
      status: 'complete',
      report: {
        status: 'complete',
        summary: 'Mock agent execution completed successfully',
        findings: [],
        tasks: [],
        observableActions: [],
      },
    }),
  } as unknown as jest.Mocked<AgentSpawner>;
}

export function createMockLogger(): jest.Mocked<Logger> {
  return {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    bright: jest.fn(),
    blue: jest.fn(),
    yellow: jest.fn(),
    green: jest.fn(),
    red: jest.fn(),
  } as unknown as jest.Mocked<Logger>;
}

export function createMockPhaseRunner(phaseType: PhaseType): jest.Mocked<PhaseRunner> {
  const agentTypeMap: Record<PhaseType, AgentType> = {
    discovery: 'pathseeker',
    implementation: 'codeweaver',
    testing: 'siegemaster',
    review: 'lawbringer',
  };

  return {
    canRun: jest.fn().mockReturnValue(true),
    run: jest.fn().mockResolvedValue(undefined),
    getAgentType: jest.fn().mockReturnValue(agentTypeMap[phaseType]),
    getPhaseType: jest.fn().mockReturnValue(phaseType),
  } as unknown as jest.Mocked<PhaseRunner>;
}

export function createMockQuestOrchestrator(): jest.Mocked<QuestOrchestrator> {
  return {
    runQuest: jest.fn().mockResolvedValue(undefined),
    completeQuest: jest.fn(),
    checkAndWarnStaleness: jest.fn().mockResolvedValue(true),
    handleBlockedQuest: jest.fn().mockResolvedValue(true),
    executePhase: jest.fn().mockResolvedValue(undefined),
    getCurrentPhaseRunner: jest.fn(),
    getUserInput: jest.fn().mockResolvedValue('y'),
  } as unknown as jest.Mocked<QuestOrchestrator>;
}

export function createMockConfigManager(): jest.Mocked<ConfigManager> {
  return {
    initializeConfig: jest.fn().mockReturnValue(true),
    loadConfig: jest.fn().mockReturnValue({ discoveryComplete: true }),
    saveConfig: jest.fn(),
  } as unknown as jest.Mocked<ConfigManager>;
}
