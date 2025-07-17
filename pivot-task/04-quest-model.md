# Task 04: Quest Model

## Objective
Create the quest data model, storage mechanisms, and core quest management functions.

## Dependencies
- Task 02: Project Structure (for directory paths)
- Task 03: Config Management (for types)

## Implementation

### 1. Quest Type Definitions

**File: src/cli/types/quest.ts**
```typescript
export interface Quest {
  id: string;
  folder: string;
  title: string;
  status: QuestStatus;
  createdAt: string;
  lastUpdated: string;
  
  // Blocking information
  blockReason?: string;
  blockedAt?: string;
  
  // Phase tracking
  phases: {
    discovery: PhaseStatus;
    implementation: PhaseStatus;
    testing: PhaseStatus;
    review: PhaseStatus;
  };
  
  // Task management
  tasks: Task[];
  executionPlan: string[]; // Task IDs in execution order
  
  // Execution tracking
  executionLog: ExecutionLogEntry[];
  
  // Metadata
  estimatedTasks?: number;
  completedTasks?: number;
  userRequest?: string; // Original user request
}

export type QuestStatus = 'in_progress' | 'blocked' | 'complete' | 'abandoned';

export interface PhaseStatus {
  status: 'pending' | 'in_progress' | 'complete' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  report?: string; // Report filename
  progress?: string; // e.g., "3/5"
}

export interface Task {
  id: string;
  name: string;
  type: TaskType;
  status: TaskStatus;
  description: string;
  dependencies: string[]; // Task IDs
  
  // File operations
  filesToCreate: string[];
  filesToEdit: string[];
  
  // Tracking
  addedBy: string; // Report filename that added this task
  completedBy?: string; // Report filename that completed it
  modifiedBy?: string; // Report filename that modified it
  currentAgent?: string; // Currently working agent report
  
  // Testing specific
  testTechnology?: string;
  
  // Execution metadata
  runBefore?: string[]; // Task IDs that must run after this
  retryCount?: number;
}

export type TaskType = 'implementation' | 'testing' | 'validation';
export type TaskStatus = 'queued' | 'in_progress' | 'complete' | 'failed' | 'skipped';

export interface ExecutionLogEntry {
  report: string; // Report filename
  taskId?: string; // Task being worked on
  timestamp: string;
  agentType?: string;
  status?: 'started' | 'completed' | 'failed' | 'blocked';
}

export interface QuestSummary {
  id: string;
  folder: string;
  title: string;
  status: QuestStatus;
  createdAt: string;
  progress: string; // e.g., "3/5 tasks"
  currentPhase: string;
}
```

### 2. Quest Storage Manager

**File: src/cli/quest-storage.ts**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { Quest, QuestSummary } from './types/quest';
import { DIRECTORIES, getQuestPath, getActiveQuestFolders } from './directory-manager';

/**
 * Saves a quest to its quest.json file
 */
export async function saveQuest(quest: Quest): Promise<void> {
  const questPath = getQuestPath(quest.folder);
  const questFile = path.join(questPath, 'quest.json');
  
  quest.lastUpdated = new Date().toISOString();
  
  await fs.writeFile(questFile, JSON.stringify(quest, null, 2));
}

/**
 * Loads a quest from its folder
 */
export async function loadQuest(questFolder: string): Promise<Quest> {
  const questPath = getQuestPath(questFolder);
  const questFile = path.join(questPath, 'quest.json');
  
  try {
    const data = await fs.readFile(questFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to load quest from ${questFolder}: ${error}`);
  }
}

/**
 * Loads all active quests
 */
export async function loadActiveQuests(): Promise<Quest[]> {
  const questFolders = await getActiveQuestFolders();
  const quests: Quest[] = [];
  
  for (const folder of questFolders) {
    try {
      const quest = await loadQuest(folder);
      quests.push(quest);
    } catch (error) {
      console.warn(`Failed to load quest ${folder}:`, error);
    }
  }
  
  // Sort by creation date (newest first)
  return quests.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Gets quest summaries for listing
 */
export async function getQuestSummaries(): Promise<QuestSummary[]> {
  const quests = await loadActiveQuests();
  
  return quests.map(quest => ({
    id: quest.id,
    folder: quest.folder,
    title: quest.title,
    status: quest.status,
    createdAt: quest.createdAt,
    progress: calculateProgress(quest),
    currentPhase: getCurrentPhaseName(quest),
  }));
}

/**
 * Checks if a quest exists by ID or folder
 */
export async function questExists(idOrFolder: string): Promise<boolean> {
  const questFolders = await getActiveQuestFolders();
  
  // Check by folder name
  if (questFolders.includes(idOrFolder)) {
    return true;
  }
  
  // Check by ID
  for (const folder of questFolders) {
    try {
      const quest = await loadQuest(folder);
      if (quest.id === idOrFolder) {
        return true;
      }
    } catch {
      // Ignore load errors
    }
  }
  
  return false;
}

/**
 * Finds a quest by partial title match
 */
export async function findQuestByTitle(partialTitle: string): Promise<Quest | null> {
  const quests = await loadActiveQuests();
  const lower = partialTitle.toLowerCase();
  
  // Try exact match first
  const exact = quests.find(q => 
    q.title.toLowerCase() === lower || 
    q.id === lower ||
    q.folder === lower
  );
  if (exact) return exact;
  
  // Try substring match
  const matches = quests.filter(q => 
    q.title.toLowerCase().includes(lower) ||
    q.folder.toLowerCase().includes(lower)
  );
  
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    // Return null to trigger disambiguation
    return null;
  }
  
  return null;
}

/**
 * Gets the next report number for a quest
 */
export async function getNextReportNumber(quest: Quest): Promise<string> {
  const questPath = getQuestPath(quest.folder);
  
  try {
    const files = await fs.readdir(questPath);
    const reportFiles = files.filter(f => f.match(/^\d{3}-.*-report\.json$/));
    const nextNumber = reportFiles.length + 1;
    
    return nextNumber.toString().padStart(3, '0');
  } catch {
    return '001';
  }
}

// Helper functions

function calculateProgress(quest: Quest): string {
  const totalTasks = quest.tasks.length;
  const completedTasks = quest.tasks.filter(t => t.status === 'complete').length;
  
  if (totalTasks === 0) {
    return 'Not started';
  }
  
  return `${completedTasks}/${totalTasks} tasks`;
}

function getCurrentPhaseName(quest: Quest): string {
  if (quest.status === 'blocked') return 'Blocked';
  if (quest.status === 'complete') return 'Complete';
  
  // Check phases in order
  if (quest.phases.discovery.status === 'in_progress') return 'Discovery';
  if (quest.phases.implementation.status === 'in_progress') return 'Implementation';
  if (quest.phases.testing.status === 'in_progress') return 'Testing';
  if (quest.phases.review.status === 'in_progress') return 'Review';
  
  // Check what's pending
  if (quest.phases.discovery.status === 'pending') return 'Discovery';
  if (quest.phases.implementation.status === 'pending') return 'Implementation';
  if (quest.phases.testing.status === 'pending') return 'Testing';
  if (quest.phases.review.status === 'pending') return 'Review';
  
  return 'Unknown';
}
```

### 3. Quest Factory

**File: src/cli/quest-factory.ts**
```typescript
import { Quest, Task, PhaseStatus } from './types/quest';
import { createQuestDirectory } from './directory-manager';
import { saveQuest } from './quest-storage';

/**
 * Creates a new quest
 */
export async function createQuest(title: string): Promise<Quest> {
  const questId = generateQuestId();
  const questFolder = await createQuestDirectory(questId, title);
  
  const quest: Quest = {
    id: questId,
    folder: questFolder,
    title: title,
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    phases: {
      discovery: createPhaseStatus(),
      implementation: createPhaseStatus(),
      testing: createPhaseStatus(),
      review: createPhaseStatus(),
    },
    tasks: [],
    executionPlan: [],
    executionLog: [],
    userRequest: title,
  };
  
  await saveQuest(quest);
  return quest;
}

/**
 * Generates a unique quest ID
 */
export function generateQuestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `${timestamp}-${random}`;
}

/**
 * Creates a new phase status
 */
function createPhaseStatus(): PhaseStatus {
  return {
    status: 'pending',
  };
}

/**
 * Updates quest status
 */
export async function updateQuestStatus(
  quest: Quest, 
  status: Quest['status'], 
  blockReason?: string
): Promise<Quest> {
  quest.status = status;
  
  if (status === 'blocked' && blockReason) {
    quest.blockReason = blockReason;
    quest.blockedAt = new Date().toISOString();
  } else if (status !== 'blocked') {
    delete quest.blockReason;
    delete quest.blockedAt;
  }
  
  await saveQuest(quest);
  return quest;
}

/**
 * Adds a task to a quest
 */
export function addTaskToQuest(quest: Quest, task: Task): void {
  // Check if task already exists
  const existing = quest.tasks.find(t => t.id === task.id);
  if (!existing) {
    quest.tasks.push(task);
  }
}

/**
 * Updates a task in a quest
 */
export function updateTaskInQuest(
  quest: Quest, 
  taskId: string, 
  updates: Partial<Task>
): void {
  const task = quest.tasks.find(t => t.id === taskId);
  if (task) {
    Object.assign(task, updates);
  }
}

/**
 * Adds an execution log entry
 */
export function addExecutionLog(
  quest: Quest,
  report: string,
  taskId?: string,
  agentType?: string,
  status?: 'started' | 'completed' | 'failed' | 'blocked'
): void {
  quest.executionLog.push({
    report,
    taskId,
    timestamp: new Date().toISOString(),
    agentType,
    status,
  });
}

/**
 * Calculates the execution plan from task dependencies
 */
export function calculateExecutionPlan(tasks: Task[]): string[] {
  const plan: string[] = [];
  const completed = new Set<string>();
  const inProgress = new Set<string>();
  
  function canExecute(task: Task): boolean {
    return task.dependencies.every(dep => completed.has(dep));
  }
  
  function visit(task: Task): void {
    if (completed.has(task.id) || inProgress.has(task.id)) {
      return;
    }
    
    inProgress.add(task.id);
    
    // Visit dependencies first
    for (const depId of task.dependencies) {
      const depTask = tasks.find(t => t.id === depId);
      if (depTask && !completed.has(depId)) {
        visit(depTask);
      }
    }
    
    plan.push(task.id);
    completed.add(task.id);
    inProgress.delete(task.id);
  }
  
  // Process all tasks
  const entryPoints = tasks.filter(t => t.dependencies.length === 0);
  for (const task of entryPoints) {
    visit(task);
  }
  
  // Add any remaining tasks (in case of disconnected components)
  for (const task of tasks) {
    if (!completed.has(task.id)) {
      visit(task);
    }
  }
  
  return plan;
}
```

### 4. Quest Finder

**File: src/cli/quest-finder.ts**
```typescript
import { Quest } from './types/quest';
import { findQuestByTitle, getQuestSummaries } from './quest-storage';
import * as readline from 'readline/promises';

/**
 * Finds a quest by user input
 */
export async function findQuest(input: string): Promise<Quest | null> {
  // Try to find by title
  const quest = await findQuestByTitle(input);
  
  if (quest) {
    return quest;
  }
  
  // Check if there are multiple matches
  const summaries = await getQuestSummaries();
  const lower = input.toLowerCase();
  const matches = summaries.filter(s => 
    s.title.toLowerCase().includes(lower) ||
    s.folder.toLowerCase().includes(lower)
  );
  
  if (matches.length === 0) {
    return null;
  }
  
  if (matches.length === 1) {
    return findQuestByTitle(matches[0].id);
  }
  
  // Multiple matches - ask user to choose
  return askUserToChoose(matches);
}

/**
 * Asks user to choose from multiple quests
 */
async function askUserToChoose(matches: Quest[] | any[]): Promise<Quest | null> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  try {
    console.log('\n🔍 Multiple quests found:');
    matches.forEach((match, index) => {
      console.log(`${index + 1}. ${match.title} (${match.status}) - ${match.progress || ''}`);
    });
    console.log('0. Create new quest\n');
    
    const answer = await rl.question('Select quest number: ');
    const choice = parseInt(answer);
    
    if (choice === 0 || isNaN(choice)) {
      return null;
    }
    
    if (choice > 0 && choice <= matches.length) {
      const selected = matches[choice - 1];
      return findQuestByTitle(selected.id || selected.title);
    }
    
    return null;
  } finally {
    rl.close();
  }
}
```

## Unit Tests

**File: src/cli/quest-storage.test.ts**
```typescript
import * as fs from 'fs/promises';
import {
  saveQuest,
  loadQuest,
  loadActiveQuests,
  getQuestSummaries,
  findQuestByTitle,
} from './quest-storage';
import { Quest } from './types/quest';
import { getActiveQuestFolders } from './directory-manager';

jest.mock('fs/promises');
jest.mock('./directory-manager');

describe('QuestStorage', () => {
  const mockQuest: Quest = {
    id: 'test-123',
    folder: '01-test-quest',
    title: 'Test Quest',
    status: 'in_progress',
    createdAt: '2024-01-01T00:00:00Z',
    lastUpdated: '2024-01-01T00:00:00Z',
    phases: {
      discovery: { status: 'complete' },
      implementation: { status: 'in_progress' },
      testing: { status: 'pending' },
      review: { status: 'pending' },
    },
    tasks: [
      {
        id: 'task-1',
        name: 'CreateAuth',
        type: 'implementation',
        status: 'complete',
        description: 'Create auth system',
        dependencies: [],
        filesToCreate: ['auth.ts'],
        filesToEdit: [],
        addedBy: '001-pathseeker-report.json',
        completedBy: '002-codeweaver-report.json',
      },
    ],
    executionPlan: ['task-1'],
    executionLog: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveQuest', () => {
    it('should save quest to JSON file', async () => {
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await saveQuest(mockQuest);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('quest.json'),
        expect.stringContaining('"id": "test-123"')
      );
    });

    it('should update lastUpdated timestamp', async () => {
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      const questCopy = { ...mockQuest };

      await saveQuest(questCopy);

      const savedData = (fs.writeFile as jest.Mock).mock.calls[0][1];
      const saved = JSON.parse(savedData);
      expect(new Date(saved.lastUpdated).getTime()).toBeGreaterThan(
        new Date(mockQuest.lastUpdated).getTime()
      );
    });
  });

  describe('loadQuest', () => {
    it('should load quest from JSON file', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockQuest));

      const quest = await loadQuest('01-test-quest');

      expect(quest.id).toBe('test-123');
      expect(quest.title).toBe('Test Quest');
    });

    it('should throw error if quest not found', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      await expect(loadQuest('missing-quest')).rejects.toThrow();
    });
  });

  describe('loadActiveQuests', () => {
    it('should load all active quests', async () => {
      (getActiveQuestFolders as jest.Mock).mockResolvedValue(['01-quest', '02-quest']);
      (fs.readFile as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockQuest))
        .mockResolvedValueOnce(JSON.stringify({ ...mockQuest, id: 'test-456' }));

      const quests = await loadActiveQuests();

      expect(quests).toHaveLength(2);
      expect(quests[0].id).toBe('test-123');
      expect(quests[1].id).toBe('test-456');
    });

    it('should handle quest load errors gracefully', async () => {
      (getActiveQuestFolders as jest.Mock).mockResolvedValue(['01-quest', '02-quest']);
      (fs.readFile as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockQuest))
        .mockRejectedValueOnce(new Error('Corrupt'));

      const quests = await loadActiveQuests();

      expect(quests).toHaveLength(1);
      expect(quests[0].id).toBe('test-123');
    });
  });

  describe('getQuestSummaries', () => {
    it('should return quest summaries with progress', async () => {
      (getActiveQuestFolders as jest.Mock).mockResolvedValue(['01-quest']);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockQuest));

      const summaries = await getQuestSummaries();

      expect(summaries).toHaveLength(1);
      expect(summaries[0].progress).toBe('1/1 tasks');
      expect(summaries[0].currentPhase).toBe('Implementation');
    });
  });

  describe('findQuestByTitle', () => {
    it('should find quest by exact title match', async () => {
      (getActiveQuestFolders as jest.Mock).mockResolvedValue(['01-quest']);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockQuest));

      const quest = await findQuestByTitle('Test Quest');

      expect(quest?.id).toBe('test-123');
    });

    it('should find quest by partial title match', async () => {
      (getActiveQuestFolders as jest.Mock).mockResolvedValue(['01-quest']);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockQuest));

      const quest = await findQuestByTitle('test');

      expect(quest?.id).toBe('test-123');
    });

    it('should return null for multiple matches', async () => {
      (getActiveQuestFolders as jest.Mock).mockResolvedValue(['01-quest', '02-quest']);
      (fs.readFile as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockQuest))
        .mockResolvedValueOnce(JSON.stringify({ ...mockQuest, id: 'test-456', title: 'Test Quest 2' }));

      const quest = await findQuestByTitle('test');

      expect(quest).toBeNull();
    });
  });
});
```

**File: src/cli/quest-factory.test.ts**
```typescript
import { createQuest, generateQuestId, calculateExecutionPlan } from './quest-factory';
import { createQuestDirectory } from './directory-manager';
import { saveQuest } from './quest-storage';
import { Task } from './types/quest';

jest.mock('./directory-manager');
jest.mock('./quest-storage');

describe('QuestFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createQuest', () => {
    it('should create quest with all required fields', async () => {
      (createQuestDirectory as jest.Mock).mockResolvedValue('01-test-quest');
      (saveQuest as jest.Mock).mockResolvedValue(undefined);

      const quest = await createQuest('Test Quest');

      expect(quest.title).toBe('Test Quest');
      expect(quest.status).toBe('in_progress');
      expect(quest.phases.discovery.status).toBe('pending');
      expect(quest.tasks).toEqual([]);
      expect(saveQuest).toHaveBeenCalledWith(quest);
    });
  });

  describe('generateQuestId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateQuestId();
      const id2 = generateQuestId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    });
  });

  describe('calculateExecutionPlan', () => {
    it('should order tasks by dependencies', () => {
      const tasks: Task[] = [
        {
          id: 'task-3',
          name: 'Task3',
          type: 'implementation',
          status: 'queued',
          description: '',
          dependencies: ['task-1', 'task-2'],
          filesToCreate: [],
          filesToEdit: [],
          addedBy: 'report',
        },
        {
          id: 'task-1',
          name: 'Task1',
          type: 'implementation',
          status: 'queued',
          description: '',
          dependencies: [],
          filesToCreate: [],
          filesToEdit: [],
          addedBy: 'report',
        },
        {
          id: 'task-2',
          name: 'Task2',
          type: 'implementation',
          status: 'queued',
          description: '',
          dependencies: ['task-1'],
          filesToCreate: [],
          filesToEdit: [],
          addedBy: 'report',
        },
      ];

      const plan = calculateExecutionPlan(tasks);

      expect(plan).toEqual(['task-1', 'task-2', 'task-3']);
    });

    it('should handle circular dependencies gracefully', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task1',
          type: 'implementation',
          status: 'queued',
          description: '',
          dependencies: ['task-2'],
          filesToCreate: [],
          filesToEdit: [],
          addedBy: 'report',
        },
        {
          id: 'task-2',
          name: 'Task2',
          type: 'implementation',
          status: 'queued',
          description: '',
          dependencies: ['task-1'],
          filesToCreate: [],
          filesToEdit: [],
          addedBy: 'report',
        },
      ];

      // Should not throw, but order may vary
      const plan = calculateExecutionPlan(tasks);
      expect(plan).toHaveLength(2);
    });
  });
});
```

## Validation Criteria

1. **Quest Creation**
   - [ ] Creates quest with unique ID
   - [ ] Creates quest directory
   - [ ] Saves quest.json file
   - [ ] All phases initialized as pending

2. **Quest Loading**
   - [ ] Loads single quest from folder
   - [ ] Loads all active quests
   - [ ] Handles missing/corrupt quests gracefully
   - [ ] Sorts quests by creation date

3. **Quest Finding**
   - [ ] Finds by exact title match
   - [ ] Finds by partial title match
   - [ ] Finds by ID or folder name
   - [ ] Returns null for no match

4. **Task Management**
   - [ ] Adds tasks to quest
   - [ ] Updates task status
   - [ ] Calculates execution plan
   - [ ] Handles dependencies correctly

5. **Quest Summaries**
   - [ ] Calculates progress correctly
   - [ ] Shows current phase
   - [ ] Includes all required fields

## Next Steps

After completing this task:
1. Run `npm test` to verify all tests pass
2. Test quest creation and loading
3. Verify quest.json structure
4. Test quest finding logic
5. Proceed to [05-quest-commands.md](05-quest-commands.md)