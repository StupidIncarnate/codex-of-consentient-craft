import type { QuestManager } from '../../src/core/quest-manager';
import type { FileSystem } from '../../src/core/file-system';
import type { AgentSpawner } from '../../src/agents/agent-spawner';
import type { Logger } from '../../src/utils/logger';

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
    isQuestComplete: jest.fn(),
    getCurrentPhase: jest.fn(),
    addTasks: jest.fn(),
    applyReconciliation: jest.fn(),
    getCreatedFiles: jest.fn().mockReturnValue([]),
    getChangedFiles: jest.fn().mockReturnValue([]),
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
    spawnAndWait: jest.fn(),
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
