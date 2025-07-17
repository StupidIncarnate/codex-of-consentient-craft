# Task 21: Unit Tests

## Objective
Create comprehensive unit tests for all modules to ensure reliability and maintainability of the Questmaestro CLI.

## Dependencies
- Tasks 1-20: All implementation modules
- Jest testing framework

## Implementation

### 1. Test Setup and Configuration

**File: jest.config.js**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
  restoreMocks: true,
};
```

**File: src/test/setup.ts**
```typescript
import { jest } from '@jest/globals';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after tests
afterEach(() => {
  jest.restoreAllMocks();
});
```

### 2. Core Module Tests

**File: src/cli/__tests__/quest-executor.test.ts**
```typescript
import { runQuest } from '../quest-executor';
import { spawnAndWait } from '../agent-spawner';
import { runWardGate } from '../ward/ward-gate';
import { handleWardFailure } from '../ward/spiritmender-handler';
import { Quest } from '../types/quest';
import { loadQuest, saveQuest } from '../quest-storage';

jest.mock('../agent-spawner');
jest.mock('../ward/ward-gate');
jest.mock('../ward/spiritmender-handler');
jest.mock('../quest-storage');

describe('QuestExecutor', () => {
  const mockQuest: Quest = {
    id: 'test-123',
    folder: '01-test',
    title: 'Test Quest',
    status: 'in_progress',
    userRequest: 'Test user request',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    phases: {
      discovery: { status: 'complete' },
      implementation: { status: 'pending' },
      testing: { status: 'pending' },
      review: { status: 'pending' },
    },
    tasks: [
      {
        id: 'task-1',
        name: 'Implement feature',
        type: 'implementation',
        status: 'queued',
        description: 'Implement the main feature',
        dependencies: [],
        filesToCreate: ['feature.ts'],
        filesToEdit: [],
        addedBy: 'pathseeker',
      },
      {
        id: 'task-2',
        name: 'Add tests',
        type: 'test',
        status: 'queued',
        description: 'Add unit tests',
        dependencies: ['task-1'],
        filesToCreate: ['feature.test.ts'],
        filesToEdit: [],
        addedBy: 'pathseeker',
      },
    ],
    executionPlan: ['task-1', 'task-2'],
    executionLog: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (loadQuest as jest.Mock).mockResolvedValue(mockQuest);
    (saveQuest as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Full Quest Execution', () => {
    it('should execute all phases successfully', async () => {
      // Mock successful agent spawns
      (spawnAndWait as jest.Mock).mockResolvedValue({
        status: 'complete',
        report: { success: true },
      });

      // Mock successful ward validations
      (runWardGate as jest.Mock).mockResolvedValue({
        passed: true,
        shouldBlock: false,
        canAutoFix: false,
        summary: 'Ward passed',
      });

      await runQuest(mockQuest.folder);

      // Should spawn all agents in order
      expect(spawnAndWait).toHaveBeenCalledWith('pathseeker', expect.any(Object));
      expect(spawnAndWait).toHaveBeenCalledWith('codeweaver', expect.any(Object));
      expect(spawnAndWait).toHaveBeenCalledWith('siegemaster', expect.any(Object));
      
      // Should run ward validations
      expect(runWardGate).toHaveBeenCalled();
      
      // Should update quest status
      expect(saveQuest).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'complete',
        })
      );
    });

    it('should handle ward failures with Spiritmender', async () => {
      (spawnAndWait as jest.Mock).mockResolvedValue({
        status: 'complete',
        report: { success: true },
      });

      // First ward fails, then succeeds after Spiritmender
      (runWardGate as jest.Mock)
        .mockResolvedValueOnce({
          passed: false,
          shouldBlock: false,
          canAutoFix: true,
          summary: 'Ward failed',
        })
        .mockResolvedValueOnce({
          passed: true,
          shouldBlock: false,
          canAutoFix: false,
          summary: 'Ward passed',
        });

      (handleWardFailure as jest.Mock).mockResolvedValue(undefined);

      await runQuest(mockQuest.folder);

      expect(handleWardFailure).toHaveBeenCalled();
      expect(mockQuest.status).toBe('complete');
    });

    it('should block quest on critical ward failures', async () => {
      (spawnAndWait as jest.Mock).mockResolvedValue({
        status: 'complete',
        report: { success: true },
      });

      (runWardGate as jest.Mock).mockResolvedValue({
        passed: false,
        shouldBlock: true,
        canAutoFix: false,
        summary: 'Critical ward failure',
      });

      await expect(runQuest(mockQuest.folder)).rejects.toThrow('blocked');
    });

    it('should handle agent failures gracefully', async () => {
      (spawnAndWait as jest.Mock).mockRejectedValue(new Error('Agent crashed'));

      await expect(runQuest(mockQuest.folder)).rejects.toThrow('Agent crashed');
      
      expect(mockQuest.status).toBe('failed');
    });
  });

  describe('Phase Management', () => {
    it('should update phase status correctly', async () => {
      (spawnAndWait as jest.Mock).mockImplementation((agent) => {
        if (agent === 'pathseeker') {
          return Promise.resolve({
            status: 'complete',
            report: { tasks: mockQuest.tasks },
          });
        }
        return Promise.resolve({
          status: 'complete',
          report: { success: true },
        });
      });

      (runWardGate as jest.Mock).mockResolvedValue({
        passed: true,
        shouldBlock: false,
        canAutoFix: false,
        summary: 'Ward passed',
      });

      await runQuest(mockQuest.folder);

      expect(mockQuest.phases.discovery.status).toBe('complete');
      expect(mockQuest.phases.implementation.status).toBe('complete');
      expect(mockQuest.phases.testing.status).toBe('complete');
      expect(mockQuest.phases.review.status).toBe('complete');
    });

    it('should track implementation progress', async () => {
      const questWith5Tasks = {
        ...mockQuest,
        tasks: Array(5).fill(null).map((_, i) => ({
          ...mockQuest.tasks[0],
          id: `task-${i}`,
        })),
      };

      (loadQuest as jest.Mock).mockResolvedValue(questWith5Tasks);

      (spawnAndWait as jest.Mock).mockImplementation((agent, context) => {
        if (agent === 'codeweaver') {
          // Complete 2 of 5 tasks
          questWith5Tasks.tasks[0].status = 'complete';
          questWith5Tasks.tasks[1].status = 'complete';
        }
        return Promise.resolve({
          status: 'complete',
          report: { success: true },
        });
      });

      (runWardGate as jest.Mock).mockResolvedValue({
        passed: true,
        shouldBlock: false,
        canAutoFix: false,
        summary: 'Ward passed',
      });

      await runQuest(questWith5Tasks.folder);

      expect(questWith5Tasks.phases.implementation.progress).toBe('2/5');
    });
  });
});
```

**File: src/cli/__tests__/agent-spawner.test.ts**
```typescript
import { spawnAndWait, monitorAgentProgress } from '../agent-spawner';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import { EventEmitter } from 'events';

jest.mock('child_process');
jest.mock('fs/promises');

describe('AgentSpawner', () => {
  let mockChildProcess: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockChildProcess = new EventEmitter();
    mockChildProcess.stdout = new EventEmitter();
    mockChildProcess.stderr = new EventEmitter();
    mockChildProcess.kill = jest.fn();
    
    (spawn as jest.Mock).mockReturnValue(mockChildProcess);
  });

  describe('spawnAndWait', () => {
    it('should spawn agent and wait for report', async () => {
      const reportContent = {
        status: 'complete',
        tasks: [],
        retrospective: { notes: [] },
      };

      // Mock file monitoring
      let fileWatchCallback: any;
      (fs.watch as jest.Mock).mockImplementation((path, callback) => {
        fileWatchCallback = callback;
        return { close: jest.fn() };
      });

      // Start spawn
      const spawnPromise = spawnAndWait('pathseeker', {
        questFolder: '01-test',
        questTitle: 'Test Quest',
      });

      // Simulate file creation after delay
      setTimeout(() => {
        fileWatchCallback('rename', 'pathseeker-report-001.json');
        
        // Mock reading the report
        (fs.readFile as jest.Mock).mockResolvedValue(
          JSON.stringify(reportContent)
        );
      }, 100);

      const result = await spawnPromise;

      expect(spawn).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining(['--agent', 'pathseeker']),
        expect.any(Object)
      );
      
      expect(result.status).toBe('complete');
      expect(result.report).toEqual(reportContent);
    });

    it('should handle agent timeout', async () => {
      (fs.watch as jest.Mock).mockReturnValue({ close: jest.fn() });

      const spawnPromise = spawnAndWait('codeweaver', {
        questFolder: '01-test',
      }, 100); // 100ms timeout

      await expect(spawnPromise).rejects.toThrow('Agent timeout');
      expect(mockChildProcess.kill).toHaveBeenCalled();
    });

    it('should handle agent errors', async () => {
      const spawnPromise = spawnAndWait('siegemaster', {
        questFolder: '01-test',
      });

      // Emit error
      mockChildProcess.emit('error', new Error('Spawn failed'));

      await expect(spawnPromise).rejects.toThrow('Spawn failed');
    });

    it('should parse blocked status from report', async () => {
      const reportContent = {
        status: 'blocked',
        blockReason: 'User input required',
      };

      let fileWatchCallback: any;
      (fs.watch as jest.Mock).mockImplementation((path, callback) => {
        fileWatchCallback = callback;
        return { close: jest.fn() };
      });

      const spawnPromise = spawnAndWait('lawbringer', {
        questFolder: '01-test',
      });

      setTimeout(() => {
        fileWatchCallback('rename', 'lawbringer-report-001.json');
        (fs.readFile as jest.Mock).mockResolvedValue(
          JSON.stringify(reportContent)
        );
      }, 100);

      const result = await spawnPromise;

      expect(result.status).toBe('blocked');
      expect(result.blockReason).toBe('User input required');
    });
  });

  describe('monitorAgentProgress', () => {
    it('should emit progress events from stdout', async () => {
      const progressHandler = jest.fn();
      
      const monitor = monitorAgentProgress(mockChildProcess);
      monitor.on('progress', progressHandler);

      // Simulate agent output
      mockChildProcess.stdout.emit('data', Buffer.from('Processing task 1/5\n'));
      mockChildProcess.stdout.emit('data', Buffer.from('[PROGRESS] 40%\n'));

      expect(progressHandler).toHaveBeenCalledWith('Processing task 1/5');
      expect(progressHandler).toHaveBeenCalledWith('[PROGRESS] 40%');
    });

    it('should emit error events from stderr', async () => {
      const errorHandler = jest.fn();
      
      const monitor = monitorAgentProgress(mockChildProcess);
      monitor.on('error', errorHandler);

      mockChildProcess.stderr.emit('data', Buffer.from('Error: Failed to parse\n'));

      expect(errorHandler).toHaveBeenCalledWith('Error: Failed to parse');
    });

    it('should handle multi-line output', async () => {
      const progressHandler = jest.fn();
      
      const monitor = monitorAgentProgress(mockChildProcess);
      monitor.on('progress', progressHandler);

      // Send incomplete line
      mockChildProcess.stdout.emit('data', Buffer.from('Starting '));
      expect(progressHandler).not.toHaveBeenCalled();

      // Complete the line
      mockChildProcess.stdout.emit('data', Buffer.from('task execution\n'));
      expect(progressHandler).toHaveBeenCalledWith('Starting task execution');
    });
  });
});
```

### 3. Quest Management Tests

**File: src/cli/__tests__/quest-storage.test.ts**
```typescript
import * as fs from 'fs/promises';
import { loadQuest, saveQuest, listQuests } from '../quest-storage';
import { Quest } from '../types/quest';
import { DIRECTORIES } from '../directory-manager';

jest.mock('fs/promises');

describe('QuestStorage', () => {
  const mockQuest: Quest = {
    id: 'test-123',
    folder: '01-test',
    title: 'Test Quest',
    status: 'active',
    userRequest: 'Create a test feature',
    createdAt: '2024-01-01T00:00:00Z',
    lastUpdated: '2024-01-01T00:00:00Z',
    phases: {
      discovery: { status: 'complete' },
      implementation: { status: 'pending' },
      testing: { status: 'pending' },
      review: { status: 'pending' },
    },
    tasks: [],
    executionPlan: [],
    executionLog: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadQuest', () => {
    it('should load quest from JSON file', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockQuest));

      const quest = await loadQuest('01-test');

      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('quest.json'),
        'utf-8'
      );
      expect(quest).toEqual(mockQuest);
    });

    it('should handle missing quest file', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      await expect(loadQuest('99-missing')).rejects.toThrow('Quest not found');
    });

    it('should handle invalid JSON', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue('invalid json');

      await expect(loadQuest('01-test')).rejects.toThrow();
    });
  });

  describe('saveQuest', () => {
    it('should save quest to JSON file', async () => {
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await saveQuest(mockQuest);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('quest.json'),
        expect.stringContaining('"id":"test-123"'),
        'utf-8'
      );
    });

    it('should update lastUpdated timestamp', async () => {
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      
      const questCopy = { ...mockQuest };
      await saveQuest(questCopy);

      expect(new Date(questCopy.lastUpdated).getTime()).toBeGreaterThan(
        new Date(mockQuest.lastUpdated).getTime()
      );
    });

    it('should handle write errors', async () => {
      (fs.writeFile as jest.Mock).mockRejectedValue(new Error('EACCES'));

      await expect(saveQuest(mockQuest)).rejects.toThrow('EACCES');
    });
  });

  describe('listQuests', () => {
    it('should list active quests', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue(['01-test', '02-another']);
      (fs.readFile as jest.Mock).mockImplementation((path) => {
        if (path.includes('01-test')) {
          return Promise.resolve(JSON.stringify(mockQuest));
        }
        return Promise.resolve(JSON.stringify({
          ...mockQuest,
          id: 'test-456',
          folder: '02-another',
          title: 'Another Quest',
        }));
      });

      const quests = await listQuests();

      expect(quests).toHaveLength(2);
      expect(quests[0].title).toBe('Test Quest');
      expect(quests[1].title).toBe('Another Quest');
    });

    it('should handle empty directory', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([]);

      const quests = await listQuests();

      expect(quests).toEqual([]);
    });

    it('should skip invalid quest folders', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue(['01-valid', 'invalid-folder']);
      (fs.readFile as jest.Mock).mockImplementation((path) => {
        if (path.includes('01-valid')) {
          return Promise.resolve(JSON.stringify(mockQuest));
        }
        return Promise.reject(new Error('No quest.json'));
      });

      const quests = await listQuests();

      expect(quests).toHaveLength(1);
    });
  });
});
```

### 4. Integration Test Suite

**File: src/cli/__tests__/integration/quest-flow.test.ts**
```typescript
import { createQuest } from '../../quest-factory';
import { runQuest } from '../../quest-executor';
import { completeQuest } from '../../quest-completion';
import { Quest } from '../../types/quest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DIRECTORIES } from '../../directory-manager';

// This is an integration test - no mocking
describe('Quest Flow Integration', () => {
  let testQuestFolder: string;

  beforeEach(async () => {
    // Create test directories
    await fs.mkdir(DIRECTORIES.active, { recursive: true });
    await fs.mkdir(DIRECTORIES.completed, { recursive: true });
    await fs.mkdir(DIRECTORIES.retros, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directories
    if (testQuestFolder) {
      try {
        await fs.rm(path.join(DIRECTORIES.active, testQuestFolder), { 
          recursive: true, 
          force: true 
        });
        await fs.rm(path.join(DIRECTORIES.completed, testQuestFolder), { 
          recursive: true, 
          force: true 
        });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('should complete full quest lifecycle', async () => {
    // Create quest
    const quest = await createQuest({
      title: 'Integration Test Quest',
      description: 'Test the full quest flow',
    });
    
    testQuestFolder = quest.folder;
    
    // Verify quest created
    expect(quest.status).toBe('pending');
    expect(quest.id).toBeDefined();
    
    const questPath = path.join(DIRECTORIES.active, quest.folder, 'quest.json');
    await expect(fs.access(questPath)).resolves.not.toThrow();

    // Mock agent execution (since we can't actually spawn Claude)
    jest.spyOn(require('../../agent-spawner'), 'spawnAndWait')
      .mockImplementation(async (agent, context) => {
        // Simulate agent reports
        if (agent === 'pathseeker') {
          return {
            status: 'complete',
            report: {
              tasks: [
                {
                  id: 'task-1',
                  name: 'Test Task',
                  type: 'implementation',
                  description: 'A test task',
                  dependencies: [],
                  filesToCreate: ['test.ts'],
                  filesToEdit: [],
                },
              ],
            },
          };
        }
        return {
          status: 'complete',
          report: { success: true },
        };
      });

    // Mock ward validation
    jest.spyOn(require('../../ward/ward-gate'), 'runWardGate')
      .mockResolvedValue({
        passed: true,
        shouldBlock: false,
        canAutoFix: false,
        summary: 'Ward passed',
      });

    // Run quest
    await runQuest(quest.folder);

    // Complete quest
    const completionResult = await completeQuest(quest);
    
    expect(completionResult.success).toBe(true);
    expect(completionResult.stats.tasksCompleted).toBeGreaterThan(0);

    // Verify quest moved to completed
    const completedPath = path.join(DIRECTORIES.completed, quest.folder, 'quest.json');
    await expect(fs.access(completedPath)).resolves.not.toThrow();

    // Verify retrospective created
    expect(completionResult.retrospectivePath).toBeDefined();
    if (completionResult.retrospectivePath) {
      await expect(fs.access(completionResult.retrospectivePath)).resolves.not.toThrow();
    }
  });
});
```

### 5. Test Utilities

**File: src/test/fixtures.ts**
```typescript
import { Quest, Task } from '../cli/types/quest';

export function createMockQuest(overrides?: Partial<Quest>): Quest {
  return {
    id: 'mock-quest-123',
    folder: '01-mock-quest',
    title: 'Mock Quest',
    status: 'active',
    userRequest: 'Create a mock feature',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    phases: {
      discovery: { status: 'pending' },
      implementation: { status: 'pending' },
      testing: { status: 'pending' },
      review: { status: 'pending' },
    },
    tasks: [],
    executionPlan: [],
    executionLog: [],
    ...overrides,
  };
}

export function createMockTask(overrides?: Partial<Task>): Task {
  return {
    id: 'mock-task-1',
    name: 'Mock Task',
    type: 'implementation',
    status: 'queued',
    description: 'A mock task for testing',
    dependencies: [],
    filesToCreate: [],
    filesToEdit: [],
    addedBy: 'pathseeker',
    ...overrides,
  };
}

export function createMockAgentReport(agent: string, overrides?: any): any {
  const baseReports = {
    pathseeker: {
      status: 'complete',
      tasks: [createMockTask()],
      architecture: {
        overview: 'Mock architecture',
        components: [],
      },
    },
    codeweaver: {
      status: 'complete',
      taskId: 'mock-task-1',
      filesCreated: ['mock.ts'],
      filesModified: [],
    },
    siegemaster: {
      status: 'complete',
      testsCreated: ['mock.test.ts'],
      coverage: 85,
    },
    lawbringer: {
      status: 'complete',
      checksRun: ['lint', 'typecheck', 'test'],
      passed: true,
    },
    spiritmender: {
      status: 'complete',
      fixes: [{ file: 'mock.ts', description: 'Fixed type error' }],
      remainingIssues: [],
    },
  };

  return {
    ...baseReports[agent],
    ...overrides,
  };
}
```

**File: src/test/test-helpers.ts**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { Quest } from '../cli/types/quest';

export async function setupTestDirectory(baseDir: string): Promise<void> {
  await fs.mkdir(baseDir, { recursive: true });
}

export async function cleanupTestDirectory(baseDir: string): Promise<void> {
  try {
    await fs.rm(baseDir, { recursive: true, force: true });
  } catch {
    // Ignore errors during cleanup
  }
}

export async function createTestQuest(
  directory: string,
  quest: Quest
): Promise<void> {
  const questDir = path.join(directory, quest.folder);
  await fs.mkdir(questDir, { recursive: true });
  
  const questPath = path.join(questDir, 'quest.json');
  await fs.writeFile(questPath, JSON.stringify(quest, null, 2));
}

export async function createTestFile(
  filePath: string,
  content: string
): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content);
}

export function expectFileToExist(filePath: string): Promise<void> {
  return expect(fs.access(filePath)).resolves.not.toThrow();
}

export function expectFileNotToExist(filePath: string): Promise<void> {
  return expect(fs.access(filePath)).rejects.toThrow();
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

// Test assertion helpers
export function expectQuestToBeComplete(quest: Quest): void {
  expect(quest.status).toBe('complete');
  expect(quest.completedAt).toBeDefined();
  expect(quest.phases.discovery.status).toBe('complete');
  expect(quest.phases.implementation.status).toBe('complete');
  expect(quest.phases.testing.status).toBe('complete');
  expect(quest.phases.review.status).toBe('complete');
}

export function expectTaskToBeComplete(task: any): void {
  expect(task.status).toBe('complete');
  expect(task.completedAt).toBeDefined();
}
```

## Unit Tests

**File: package.json (test scripts)**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern='^((?!integration).)*\\.test\\.ts$'",
    "test:integration": "jest --testPathPattern=integration",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

## Validation Criteria

1. **Test Coverage**
   - [ ] 80%+ line coverage
   - [ ] 80%+ branch coverage
   - [ ] 80%+ function coverage
   - [ ] All critical paths tested

2. **Test Categories**
   - [ ] Unit tests for each module
   - [ ] Integration tests for workflows
   - [ ] Error case coverage
   - [ ] Edge case handling

3. **Test Quality**
   - [ ] Clear test descriptions
   - [ ] Proper setup/teardown
   - [ ] No flaky tests
   - [ ] Fast execution

4. **Mock Strategy**
   - [ ] File system mocked
   - [ ] External commands mocked
   - [ ] Time/dates controlled
   - [ ] Console output captured

5. **Assertion Coverage**
   - [ ] Happy path scenarios
   - [ ] Error conditions
   - [ ] Boundary conditions
   - [ ] State transitions

## Next Steps

After completing this task:
1. Run full test suite
2. Check coverage reports
3. Fix any failing tests
4. Add missing test cases
5. Proceed to [22-integration-tests.md](22-integration-tests.md)