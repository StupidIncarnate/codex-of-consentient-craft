# Task 06: Quest Execution

## Objective
Build the main quest execution flow that orchestrates agents through the quest phases.

## Dependencies
- Task 04: Quest Model (for quest types)
- Task 05: Quest Commands (for quest runner integration)

## Implementation

### 1. Quest Runner Implementation

**File: src/cli/quest-runner.ts**
```typescript
import { Quest, Task } from './types/quest';
import { saveQuest, loadQuest } from './quest-storage';
import { getCurrentPhase, updateQuestPhase } from './quest-phases';
import { spawnAndWait } from './agent-spawner';
import { runWardAll } from './ward-runner';
import { handleWardFailure } from './ward-handler';
import { validateQuestFreshness } from './quest-validator';
import { completeQuest } from './quest-completion';
import chalk from 'chalk';

const SESSION_START = new Date().toISOString();

/**
 * Main quest execution flow
 */
export async function runQuest(quest: Quest): Promise<void> {
  try {
    // Check if quest is blocked
    if (quest.status === 'blocked') {
      const shouldResume = await handleBlockedQuest(quest);
      if (!shouldResume) return;
      
      quest.status = 'in_progress';
      await saveQuest(quest);
    }
    
    // Validate freshness if old
    if (quest.createdAt < SESSION_START && quest.tasks.length > 0) {
      console.log(chalk.gray('🔄 Validating quest freshness...'));
      await validateQuestFreshness(quest);
      // Reload quest after validation
      quest = await loadQuest(quest.folder);
    }
    
    // Sequential phase execution
    while (!isQuestComplete(quest)) {
      const phase = getCurrentPhase(quest);
      
      console.log(chalk.bold(`\n📍 Current Phase: ${phase}`));
      
      switch (phase) {
        case 'discovery':
          await runDiscoveryPhase(quest);
          break;
          
        case 'implementation':
          await runImplementationPhase(quest);
          break;
          
        case 'testing':
          await runTestingPhase(quest);
          break;
          
        case 'review':
          await runReviewPhase(quest);
          break;
          
        case 'complete':
          await completeQuest(quest);
          return;
          
        default:
          throw new Error(`Unknown phase: ${phase}`);
      }
      
      // Reload quest to get latest state
      quest = await loadQuest(quest.folder);
    }
    
    // Complete the quest
    await completeQuest(quest);
    
  } catch (error) {
    console.error(chalk.red('\n❌ Quest execution failed:'), error);
    quest.status = 'blocked';
    quest.blockReason = `Execution error: ${error.message}`;
    await saveQuest(quest);
  }
}

/**
 * Runs the discovery phase with Pathseeker
 */
async function runDiscoveryPhase(quest: Quest): Promise<void> {
  console.log(chalk.cyan('\n🔍 Discovery Phase - Spawning Pathseeker...'));
  
  await updateQuestPhase(quest, 'discovery', 'in_progress');
  
  const result = await spawnAndWait('pathseeker', {
    questFolder: quest.folder,
    questMode: quest.tasks.length > 0 ? 'validation' : 'creation',
    userRequest: quest.title,
    existingTasks: quest.tasks,
  });
  
  // Update quest with tasks from Pathseeker
  if (result.report.tasks) {
    quest.tasks = result.report.tasks;
    quest.executionPlan = calculateExecutionPlan(quest.tasks);
  }
  
  // Handle task modifications during resume
  if (result.report.newTasks) {
    quest.tasks.push(...result.report.newTasks);
    quest.executionPlan = calculateExecutionPlan(quest.tasks);
  }
  
  if (result.report.modifiedDependencies) {
    applyDependencyModifications(quest, result.report.modifiedDependencies);
  }
  
  await updateQuestPhase(quest, 'discovery', 'complete', result.reportFilename);
  await saveQuest(quest);
}

/**
 * Runs the implementation phase with Codeweaver agents
 */
async function runImplementationPhase(quest: Quest): Promise<void> {
  console.log(chalk.cyan('\n⚒️  Implementation Phase'));
  
  await updateQuestPhase(quest, 'implementation', 'in_progress');
  
  // Get implementation tasks
  const implTasks = quest.tasks.filter(t => t.type === 'implementation');
  const completedTasks = implTasks.filter(t => t.status === 'complete');
  
  console.log(chalk.gray(`Progress: ${completedTasks.length}/${implTasks.length} tasks`));
  
  // Validate dependency chain before starting
  await validateAndFixDependencies(quest);
  
  // Process tasks in dependency order
  const processed = new Set(completedTasks.map(t => t.id));
  
  while (processed.size < implTasks.length) {
    // Find next task with all dependencies met
    const nextTask = implTasks.find(task => 
      !processed.has(task.id) &&
      task.status !== 'complete' &&
      task.dependencies.every(dep => processed.has(dep))
    );
    
    if (!nextTask) {
      console.error(chalk.red('❌ No executable task found - possible circular dependency'));
      quest.status = 'blocked';
      quest.blockReason = 'Circular dependency detected in tasks';
      await saveQuest(quest);
      return;
    }
    
    // Run the task
    await runImplementationTask(quest, nextTask);
    
    // Reload quest to get updated state
    quest = await loadQuest(quest.folder);
    
    // Mark as processed
    processed.add(nextTask.id);
    
    // Update progress
    const progress = `${processed.size}/${implTasks.length}`;
    await updateQuestPhase(quest, 'implementation', 'in_progress', undefined, progress);
  }
  
  await updateQuestPhase(quest, 'implementation', 'complete');
  await saveQuest(quest);
}

/**
 * Runs a single implementation task with Codeweaver
 */
async function runImplementationTask(quest: Quest, task: Task): Promise<void> {
  console.log(chalk.blue(`\n🔨 Task: ${task.name}`));
  console.log(chalk.gray(`Description: ${task.description}`));
  
  // Update task status
  task.status = 'in_progress';
  await saveQuest(quest);
  
  // Spawn Codeweaver
  const result = await spawnAndWait('codeweaver', {
    questFolder: quest.folder,
    questTitle: quest.title,
    task: task,
  });
  
  // Update task status
  task.status = result.status === 'complete' ? 'complete' : 'failed';
  task.completedBy = result.reportFilename;
  await saveQuest(quest);
  
  // Run ward validation
  console.log(chalk.gray('\n🛡️  Running ward validation...'));
  const wardOk = await runWardAll();
  
  if (!wardOk.success) {
    console.log(chalk.yellow('⚠️  Ward validation failed'));
    await handleWardFailure(quest, wardOk.errors);
  } else {
    console.log(chalk.green('✅ Ward validation passed'));
  }
}

/**
 * Runs the testing phase with Siegemaster
 */
async function runTestingPhase(quest: Quest): Promise<void> {
  console.log(chalk.cyan('\n🏰 Testing Phase - Spawning Siegemaster...'));
  
  await updateQuestPhase(quest, 'testing', 'in_progress');
  
  const result = await spawnAndWait('siegemaster', {
    questFolder: quest.folder,
    questTitle: quest.title,
    filesCreated: getCreatedFiles(quest),
    testFramework: await detectTestFramework(),
  });
  
  await updateQuestPhase(quest, 'testing', 'complete', result.reportFilename);
  await saveQuest(quest);
  
  // Run ward validation
  const wardOk = await runWardAll();
  if (!wardOk.success) {
    await handleWardFailure(quest, wardOk.errors);
  }
}

/**
 * Runs the review phase with Lawbringer
 */
async function runReviewPhase(quest: Quest): Promise<void> {
  console.log(chalk.cyan('\n⚖️  Review Phase - Spawning Lawbringer...'));
  
  await updateQuestPhase(quest, 'review', 'in_progress');
  
  const result = await spawnAndWait('lawbringer', {
    questFolder: quest.folder,
    questTitle: quest.title,
    changedFiles: await getChangedFiles(quest),
    wardCommands: await getWardCommands(),
  });
  
  await updateQuestPhase(quest, 'review', 'complete', result.reportFilename);
  await saveQuest(quest);
  
  // Final ward validation
  const wardOk = await runWardAll();
  if (!wardOk.success) {
    await handleWardFailure(quest, wardOk.errors);
  }
}

// Helper functions

async function handleBlockedQuest(quest: Quest): Promise<boolean> {
  console.log(chalk.yellow(`\n⚠️  Quest is blocked: ${quest.blockReason}`));
  
  const readline = await import('readline/promises');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  try {
    const answer = await rl.question('Resume quest? [Y/n]: ');
    return answer.toLowerCase() !== 'n';
  } finally {
    rl.close();
  }
}

function isQuestComplete(quest: Quest): boolean {
  return quest.phases.review.status === 'complete' ||
         quest.status === 'complete';
}

function calculateExecutionPlan(tasks: Task[]): string[] {
  // Import from quest-factory
  const { calculateExecutionPlan } = require('./quest-factory');
  return calculateExecutionPlan(tasks);
}

function applyDependencyModifications(
  quest: Quest, 
  modifications: Record<string, any>
): void {
  for (const [taskId, mods] of Object.entries(modifications)) {
    const task = quest.tasks.find(t => t.id === taskId);
    if (task && mods.addDependencies) {
      task.dependencies = [...new Set([...task.dependencies, ...mods.addDependencies])];
    }
  }
}

async function validateAndFixDependencies(quest: Quest): Promise<void> {
  const { validateDependencyChain } = await import('./dependency-validator');
  const validation = validateDependencyChain(quest.tasks);
  
  if (!validation.valid) {
    console.error(chalk.red('❌ Task dependency issues detected:'));
    validation.issues.forEach(issue => console.error(`   - ${issue}`));
    
    // Spawn Pathseeker to fix
    console.log(chalk.yellow('🔧 Spawning Pathseeker to fix dependencies...'));
    
    const result = await spawnAndWait('pathseeker', {
      questFolder: quest.folder,
      questMode: 'dependency_repair',
      existingTasks: quest.tasks,
      dependencyIssues: validation.issues,
    });
    
    // Update quest with fixed tasks
    quest.tasks = result.report.tasks;
    quest.executionPlan = calculateExecutionPlan(quest.tasks);
    await saveQuest(quest);
  }
}

function getCreatedFiles(quest: Quest): string[] {
  const files: string[] = [];
  
  for (const task of quest.tasks) {
    if (task.status === 'complete' && task.filesToCreate) {
      files.push(...task.filesToCreate);
    }
  }
  
  return [...new Set(files)];
}

async function detectTestFramework(): Promise<string> {
  const config = await import('./config-manager').then(m => m.loadConfig());
  return config.project.testFrameworks[0] || 'jest';
}

async function getChangedFiles(quest: Quest): Promise<string[]> {
  const files: string[] = [];
  
  for (const task of quest.tasks) {
    if (task.status === 'complete') {
      if (task.filesToCreate) files.push(...task.filesToCreate);
      if (task.filesToEdit) files.push(...task.filesToEdit);
    }
  }
  
  return [...new Set(files)];
}

async function getWardCommands(): Promise<any> {
  const { detectWardCommands } = await import('./ward-detector');
  return detectWardCommands();
}
```

### 2. Quest Phase Manager

**File: src/cli/quest-phases.ts**
```typescript
import { Quest, PhaseStatus } from './types/quest';
import { saveQuest } from './quest-storage';

export type PhaseName = 'discovery' | 'implementation' | 'testing' | 'review';
export type PhaseState = 'pending' | 'in_progress' | 'complete' | 'skipped';

/**
 * Gets the current phase of a quest
 */
export function getCurrentPhase(quest: Quest): string {
  // Check if blocked
  if (quest.status === 'blocked') {
    return 'blocked';
  }
  
  // Check if complete
  if (quest.status === 'complete') {
    return 'complete';
  }
  
  // Discovery phase - need task list
  if (!quest.tasks || quest.tasks.length === 0) {
    return 'discovery';
  }
  
  // Implementation phase - work through tasks
  const implTasks = quest.tasks.filter(t => t.type === 'implementation');
  const implComplete = implTasks.filter(t => t.status === 'complete');
  if (implComplete.length < implTasks.length) {
    return 'implementation';
  }
  
  // Testing phase - run siegemaster once after all implementation
  if (quest.phases.testing.status !== 'complete') {
    return 'testing';
  }
  
  // Review phase - run lawbringer once after testing
  if (quest.phases.review.status !== 'complete') {
    return 'review';
  }
  
  return 'complete';
}

/**
 * Updates a quest phase status
 */
export async function updateQuestPhase(
  quest: Quest,
  phaseName: PhaseName,
  status: PhaseState,
  reportFilename?: string,
  progress?: string
): Promise<void> {
  const phase = quest.phases[phaseName];
  
  phase.status = status;
  
  if (status === 'in_progress' && !phase.startedAt) {
    phase.startedAt = new Date().toISOString();
  }
  
  if (status === 'complete') {
    phase.completedAt = new Date().toISOString();
  }
  
  if (reportFilename) {
    phase.report = reportFilename;
  }
  
  if (progress) {
    phase.progress = progress;
  }
  
  await saveQuest(quest);
}

/**
 * Checks if a phase is complete
 */
export function isPhaseComplete(quest: Quest, phaseName: PhaseName): boolean {
  return quest.phases[phaseName].status === 'complete';
}

/**
 * Gets the next pending phase
 */
export function getNextPhase(quest: Quest): PhaseName | null {
  const phases: PhaseName[] = ['discovery', 'implementation', 'testing', 'review'];
  
  for (const phase of phases) {
    if (quest.phases[phase].status === 'pending') {
      return phase;
    }
  }
  
  return null;
}

/**
 * Resets a phase to pending
 */
export async function resetPhase(
  quest: Quest,
  phaseName: PhaseName
): Promise<void> {
  quest.phases[phaseName] = {
    status: 'pending',
  };
  
  await saveQuest(quest);
}
```

### 3. Agent Spawner Stub

**File: src/cli/agent-spawner.ts**
```typescript
import { AgentContext, AgentResult } from './types/agent';
import chalk from 'chalk';

/**
 * Spawns an agent and waits for completion
 */
export async function spawnAndWait(
  agentType: string,
  context: AgentContext
): Promise<AgentResult> {
  console.log(chalk.gray(`Spawning ${agentType} agent...`));
  
  // TODO: Implement in task 07
  console.log(chalk.yellow('(Agent spawning implementation pending - Task 07)'));
  
  // Return mock result for now
  return {
    status: 'complete',
    agentType,
    reportFilename: `001-${agentType}-report.json`,
    report: {
      tasks: context.questMode === 'creation' ? [
        {
          id: 'mock-task',
          name: 'MockTask',
          type: 'implementation',
          status: 'queued',
          description: 'Mock task for testing',
          dependencies: [],
          filesToCreate: ['mock.ts'],
          filesToEdit: [],
          addedBy: '001-pathseeker-report.json',
        },
      ] : undefined,
    },
  };
}
```

### 4. Ward Runner Stub

**File: src/cli/ward-runner.ts**
```typescript
import chalk from 'chalk';

export interface WardResult {
  success: boolean;
  errors?: string;
  output?: string;
}

/**
 * Runs ward:all validation
 */
export async function runWardAll(): Promise<WardResult> {
  console.log(chalk.gray('Running ward:all...'));
  
  // TODO: Implement in task 16
  console.log(chalk.yellow('(Ward validation implementation pending - Task 16)'));
  
  // Return success for now
  return { success: true };
}
```

### 5. Ward Handler Stub

**File: src/cli/ward-handler.ts**
```typescript
import { Quest } from './types/quest';
import chalk from 'chalk';

/**
 * Handles ward validation failures
 */
export async function handleWardFailure(
  quest: Quest,
  errors: string,
  attemptCount: number = 1
): Promise<void> {
  console.log(chalk.red('Ward validation failed'));
  
  // TODO: Implement in task 17
  console.log(chalk.yellow('(Spiritmender loop implementation pending - Task 17)'));
}
```

## Unit Tests

**File: src/cli/quest-runner.test.ts**
```typescript
import { runQuest } from './quest-runner';
import { Quest } from './types/quest';
import { saveQuest, loadQuest } from './quest-storage';
import { spawnAndWait } from './agent-spawner';
import { runWardAll } from './ward-runner';
import { completeQuest } from './quest-completion';

jest.mock('./quest-storage');
jest.mock('./agent-spawner');
jest.mock('./ward-runner');
jest.mock('./quest-completion');
jest.mock('./config-manager', () => ({
  loadConfig: jest.fn().mockResolvedValue({
    project: { testFrameworks: ['jest'] },
  }),
}));

describe('QuestRunner', () => {
  const mockQuest: Quest = {
    id: 'test-123',
    folder: '01-test',
    title: 'Test Quest',
    status: 'in_progress',
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (loadQuest as jest.Mock).mockResolvedValue(mockQuest);
    (saveQuest as jest.Mock).mockResolvedValue(undefined);
    (runWardAll as jest.Mock).mockResolvedValue({ success: true });
  });

  it('should run discovery phase for new quest', async () => {
    const questCopy = { ...mockQuest };
    (spawnAndWait as jest.Mock).mockResolvedValue({
      status: 'complete',
      agentType: 'pathseeker',
      reportFilename: '001-pathseeker-report.json',
      report: {
        tasks: [{
          id: 'task-1',
          name: 'Task1',
          type: 'implementation',
          status: 'queued',
          dependencies: [],
        }],
      },
    });

    // Mock quest progression
    (loadQuest as jest.Mock)
      .mockResolvedValueOnce(questCopy) // Initial load
      .mockResolvedValueOnce({ // After discovery
        ...questCopy,
        tasks: [{ id: 'task-1', status: 'queued' }],
        phases: {
          ...questCopy.phases,
          discovery: { status: 'complete' },
        },
      })
      .mockResolvedValue({ // Complete
        ...questCopy,
        status: 'complete',
        phases: {
          discovery: { status: 'complete' },
          implementation: { status: 'complete' },
          testing: { status: 'complete' },
          review: { status: 'complete' },
        },
      });

    await runQuest(questCopy);

    expect(spawnAndWait).toHaveBeenCalledWith('pathseeker', expect.any(Object));
  });

  it('should handle blocked quest', async () => {
    const blockedQuest = {
      ...mockQuest,
      status: 'blocked' as const,
      blockReason: 'Test block',
    };

    // Mock readline
    const mockQuestion = jest.fn().mockResolvedValue('y');
    jest.doMock('readline/promises', () => ({
      createInterface: () => ({
        question: mockQuestion,
        close: jest.fn(),
      }),
    }));

    await runQuest(blockedQuest);

    expect(mockQuestion).toHaveBeenCalledWith(expect.stringContaining('Resume quest?'));
  });

  it('should validate quest freshness for old quests', async () => {
    const oldQuest = {
      ...mockQuest,
      createdAt: '2020-01-01T00:00:00Z',
      tasks: [{ id: 'old-task' }],
    };

    const { validateQuestFreshness } = require('./quest-validator');
    jest.mock('./quest-validator', () => ({
      validateQuestFreshness: jest.fn(),
    }));

    await runQuest(oldQuest);

    expect(validateQuestFreshness).toHaveBeenCalled();
  });
});
```

**File: src/cli/quest-phases.test.ts**
```typescript
import { getCurrentPhase, updateQuestPhase, isPhaseComplete } from './quest-phases';
import { Quest } from './types/quest';
import { saveQuest } from './quest-storage';

jest.mock('./quest-storage');

describe('QuestPhases', () => {
  const mockQuest: Quest = {
    id: 'test-123',
    folder: '01-test',
    title: 'Test Quest',
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    phases: {
      discovery: { status: 'complete' },
      implementation: { status: 'in_progress' },
      testing: { status: 'pending' },
      review: { status: 'pending' },
    },
    tasks: [
      { id: '1', type: 'implementation', status: 'complete' },
      { id: '2', type: 'implementation', status: 'queued' },
    ],
    executionPlan: [],
    executionLog: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentPhase', () => {
    it('should return discovery for quest without tasks', () => {
      const quest = { ...mockQuest, tasks: [] };
      expect(getCurrentPhase(quest)).toBe('discovery');
    });

    it('should return implementation when tasks incomplete', () => {
      expect(getCurrentPhase(mockQuest)).toBe('implementation');
    });

    it('should return testing after implementation', () => {
      const quest = {
        ...mockQuest,
        tasks: [
          { id: '1', type: 'implementation', status: 'complete' },
          { id: '2', type: 'implementation', status: 'complete' },
        ],
      };
      expect(getCurrentPhase(quest)).toBe('testing');
    });

    it('should return blocked for blocked quest', () => {
      const quest = { ...mockQuest, status: 'blocked' as const };
      expect(getCurrentPhase(quest)).toBe('blocked');
    });
  });

  describe('updateQuestPhase', () => {
    it('should update phase status', async () => {
      await updateQuestPhase(mockQuest, 'testing', 'in_progress');

      expect(mockQuest.phases.testing.status).toBe('in_progress');
      expect(saveQuest).toHaveBeenCalledWith(mockQuest);
    });

    it('should set timestamps', async () => {
      const phase = { ...mockQuest.phases.testing };
      await updateQuestPhase(mockQuest, 'testing', 'in_progress');

      expect(mockQuest.phases.testing.startedAt).toBeDefined();

      await updateQuestPhase(mockQuest, 'testing', 'complete');
      expect(mockQuest.phases.testing.completedAt).toBeDefined();
    });

    it('should set report filename', async () => {
      await updateQuestPhase(mockQuest, 'testing', 'complete', 'test-report.json');

      expect(mockQuest.phases.testing.report).toBe('test-report.json');
    });
  });

  describe('isPhaseComplete', () => {
    it('should return true for complete phase', () => {
      expect(isPhaseComplete(mockQuest, 'discovery')).toBe(true);
    });

    it('should return false for incomplete phase', () => {
      expect(isPhaseComplete(mockQuest, 'testing')).toBe(false);
    });
  });
});
```

## Validation Criteria

1. **Quest Execution Flow**
   - [ ] Executes phases in correct order
   - [ ] Handles blocked quests
   - [ ] Validates quest freshness
   - [ ] Completes quest when done

2. **Discovery Phase**
   - [ ] Spawns Pathseeker agent
   - [ ] Updates quest with tasks
   - [ ] Handles task modifications
   - [ ] Updates phase status

3. **Implementation Phase**
   - [ ] Processes tasks in dependency order
   - [ ] Validates dependencies
   - [ ] Spawns Codeweaver for each task
   - [ ] Runs ward validation after each task

4. **Testing & Review Phases**
   - [ ] Spawns appropriate agents
   - [ ] Updates phase status
   - [ ] Runs ward validation

5. **Error Handling**
   - [ ] Handles agent failures
   - [ ] Blocks quest on errors
   - [ ] Provides clear error messages

## Next Steps

After completing this task:
1. Run `npm test` to verify all tests pass
2. Test quest execution flow
3. Verify phase transitions
4. Test error scenarios
5. Proceed to [07-agent-spawning.md](07-agent-spawning.md)