# Task 05: Quest Commands

## Objective
Implement the core quest management commands: list, abandon, reorder, start, and the main quest handler.

## Dependencies
- Task 04: Quest Model (for quest types and storage)
- Task 02: Project Structure (for directory operations)

## Implementation

### 1. List Command

**File: src/cli/commands/list.ts**
```typescript
import { getQuestSummaries } from '../quest-storage';
import { QuestSummary } from '../types/quest';
import chalk from 'chalk';

/**
 * Shows all active quests
 */
export async function showQuestList(_args: string[]): Promise<void> {
  console.log('\n📋 Active Quests\n');
  
  const summaries = await getQuestSummaries();
  
  if (summaries.length === 0) {
    console.log(chalk.gray('No active quests. Start one with: questmaestro <quest name>'));
    return;
  }
  
  // Group by status
  const inProgress = summaries.filter(s => s.status === 'in_progress');
  const blocked = summaries.filter(s => s.status === 'blocked');
  
  // Show in-progress quests
  if (inProgress.length > 0) {
    console.log(chalk.bold('In Progress:'));
    inProgress.forEach((quest, index) => {
      displayQuest(quest, index + 1);
    });
  }
  
  // Show blocked quests
  if (blocked.length > 0) {
    console.log(chalk.bold('\nBlocked:'));
    blocked.forEach((quest, index) => {
      displayQuest(quest, inProgress.length + index + 1);
    });
  }
  
  console.log(chalk.gray('\nCommands: abandon | reorder | start <number>'));
}

function displayQuest(quest: QuestSummary, number: number): void {
  const statusIcon = getStatusIcon(quest.status);
  const age = getQuestAge(quest.createdAt);
  
  console.log(
    `${chalk.cyan(number.toString().padStart(2))}. ${statusIcon} ${chalk.bold(quest.title)}`
  );
  console.log(
    `    ${chalk.gray(`${quest.currentPhase} • ${quest.progress} • ${age}`)}`
  );
  
  if (quest.status === 'blocked') {
    console.log(`    ${chalk.red('⚠️  Blocked - needs attention')}`);
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'in_progress': return '🏃';
    case 'blocked': return '🚧';
    case 'complete': return '✅';
    default: return '❓';
  }
}

function getQuestAge(createdAt: string): string {
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const hours = Math.floor((now - created) / (1000 * 60 * 60));
  
  if (hours < 1) return 'just started';
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}
```

### 2. Abandon Command

**File: src/cli/commands/abandon.ts**
```typescript
import { getCurrentQuest, setCurrentQuest } from '../config-manager';
import { loadQuest, saveQuest } from '../quest-storage';
import { moveQuestToAbandoned } from '../directory-manager';
import { getQuestSummaries } from '../quest-storage';
import * as readline from 'readline/promises';
import chalk from 'chalk';

/**
 * Abandons the current quest or a selected quest
 */
export async function abandonCurrentQuest(args: string[]): Promise<void> {
  let questToAbandon: string | undefined;
  
  if (args.length > 0) {
    // Specific quest number provided
    const questNumber = parseInt(args[0]);
    if (!isNaN(questNumber)) {
      const summaries = await getQuestSummaries();
      if (questNumber > 0 && questNumber <= summaries.length) {
        questToAbandon = summaries[questNumber - 1].folder;
      } else {
        console.error(chalk.red(`Invalid quest number: ${questNumber}`));
        return;
      }
    }
  } else {
    // Use current quest
    questToAbandon = await getCurrentQuest();
    if (!questToAbandon) {
      console.log(chalk.yellow('No active quest. Use "questmaestro list" to see all quests.'));
      return;
    }
  }
  
  if (!questToAbandon) {
    console.error(chalk.red('No quest specified to abandon.'));
    return;
  }
  
  // Load and display quest details
  const quest = await loadQuest(questToAbandon);
  console.log(`\n🚮 Abandoning quest: ${chalk.bold(quest.title)}`);
  console.log(chalk.gray(`Started: ${new Date(quest.createdAt).toLocaleDateString()}`));
  console.log(chalk.gray(`Progress: ${quest.tasks.filter(t => t.status === 'complete').length}/${quest.tasks.length} tasks`));
  
  // Confirm abandonment
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  try {
    const answer = await rl.question('\nAre you sure you want to abandon this quest? [y/N]: ');
    
    if (answer.toLowerCase() !== 'y') {
      console.log(chalk.gray('Abandonment cancelled.'));
      return;
    }
    
    // Update quest status
    quest.status = 'abandoned';
    await saveQuest(quest);
    
    // Move to abandoned directory
    await moveQuestToAbandoned(quest.folder);
    
    // Clear current quest if it was the one abandoned
    const currentQuest = await getCurrentQuest();
    if (currentQuest === quest.folder) {
      await setCurrentQuest(undefined);
    }
    
    console.log(chalk.green(`\n✅ Quest abandoned: ${quest.title}`));
    console.log(chalk.gray('The quest has been moved to the abandoned directory.'));
    
  } finally {
    rl.close();
  }
}
```

### 3. Reorder Command

**File: src/cli/commands/reorder.ts**
```typescript
import { getQuestSummaries } from '../quest-storage';
import { loadQuest, saveQuest } from '../quest-storage';
import * as readline from 'readline/promises';
import chalk from 'chalk';

/**
 * Reorders quest priority
 */
export async function reorderQuests(_args: string[]): Promise<void> {
  const summaries = await getQuestSummaries();
  
  if (summaries.length < 2) {
    console.log(chalk.yellow('Need at least 2 quests to reorder.'));
    return;
  }
  
  console.log('\n🔢 Reorder Quests\n');
  console.log('Current order:');
  
  summaries.forEach((quest, index) => {
    console.log(`${chalk.cyan((index + 1).toString().padStart(2))}. ${quest.title}`);
  });
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  try {
    console.log(chalk.gray('\nEnter new order as comma-separated numbers (e.g., 3,1,2)'));
    const answer = await rl.question('New order: ');
    
    // Parse the new order
    const newOrder = answer.split(',').map(n => parseInt(n.trim()) - 1);
    
    // Validate the new order
    if (!validateOrder(newOrder, summaries.length)) {
      console.error(chalk.red('Invalid order. Please use each number exactly once.'));
      return;
    }
    
    // Update quest creation dates to reflect new order
    const now = Date.now();
    for (let i = 0; i < newOrder.length; i++) {
      const questIndex = newOrder[i];
      const quest = await loadQuest(summaries[questIndex].folder);
      
      // Set creation date based on new position (newer = higher priority)
      quest.createdAt = new Date(now - i * 1000 * 60).toISOString();
      await saveQuest(quest);
    }
    
    console.log(chalk.green('\n✅ Quests reordered successfully!'));
    
    // Show new order
    console.log('\nNew order:');
    const reorderedSummaries = await getQuestSummaries();
    reorderedSummaries.forEach((quest, index) => {
      console.log(`${chalk.cyan((index + 1).toString().padStart(2))}. ${quest.title}`);
    });
    
  } finally {
    rl.close();
  }
}

function validateOrder(order: number[], totalQuests: number): boolean {
  if (order.length !== totalQuests) return false;
  
  const seen = new Set<number>();
  for (const index of order) {
    if (isNaN(index) || index < 0 || index >= totalQuests) return false;
    if (seen.has(index)) return false;
    seen.add(index);
  }
  
  return true;
}
```

### 4. Start Command

**File: src/cli/commands/start.ts**
```typescript
import { getQuestSummaries } from '../quest-storage';
import { loadQuest } from '../quest-storage';
import { setCurrentQuest } from '../config-manager';
import { runQuest } from '../quest-runner';
import chalk from 'chalk';

/**
 * Starts a specific quest by number or name
 */
export async function startSpecificQuest(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.error(chalk.red('Please specify a quest number or name.'));
    console.log(chalk.gray('Usage: questmaestro start <number or name>'));
    return;
  }
  
  let questToStart: string | undefined;
  
  // Check if it's a number
  const questNumber = parseInt(args[0]);
  if (!isNaN(questNumber)) {
    const summaries = await getQuestSummaries();
    if (questNumber > 0 && questNumber <= summaries.length) {
      questToStart = summaries[questNumber - 1].folder;
    } else {
      console.error(chalk.red(`Invalid quest number: ${questNumber}`));
      return;
    }
  } else {
    // Try to find by name
    const questName = args.join(' ');
    const { findQuest } = await import('../quest-finder');
    const quest = await findQuest(questName);
    
    if (quest) {
      questToStart = quest.folder;
    } else {
      console.error(chalk.red(`Quest not found: ${questName}`));
      return;
    }
  }
  
  if (!questToStart) {
    console.error(chalk.red('Could not find quest to start.'));
    return;
  }
  
  // Load and run the quest
  const quest = await loadQuest(questToStart);
  
  console.log(`\n🚀 Starting quest: ${chalk.bold(quest.title)}`);
  
  // Set as current quest
  await setCurrentQuest(quest.folder);
  
  // Run the quest
  await runQuest(quest);
}
```

### 5. Quest Handler Update

**Update: src/cli/quest-handler.ts**
```typescript
import { findQuest } from './quest-finder';
import { createQuest } from './quest-factory';
import { runQuest } from './quest-runner';
import { setCurrentQuest, getCurrentQuest } from './config-manager';
import { loadActiveQuests } from './quest-storage';
import chalk from 'chalk';

export async function handleQuestOrCreate(input: string): Promise<void> {
  console.log(`\n🔍 Searching for quest: "${input}"`);
  
  // Check quest limit
  const activeQuests = await loadActiveQuests();
  const config = await import('./config-manager').then(m => m.loadConfig());
  
  // Try to find existing quest
  const existingQuest = await findQuest(input);
  
  if (existingQuest) {
    console.log(`📜 Resuming quest: ${chalk.bold(existingQuest.title)}`);
    await setCurrentQuest(existingQuest.folder);
    await runQuest(existingQuest);
  } else {
    // Check if at quest limit
    if (activeQuests.length >= config.preferences.maxActiveQuests) {
      console.error(chalk.red(
        `\n❌ Quest limit reached! You have ${activeQuests.length} active quests.`
      ));
      console.log(chalk.gray('Complete or abandon existing quests before starting new ones.'));
      console.log(chalk.gray('Use "questmaestro list" to see active quests.'));
      return;
    }
    
    console.log(`✨ Creating new quest: ${chalk.bold(input)}`);
    const quest = await createQuest(input);
    await setCurrentQuest(quest.folder);
    await runQuest(quest);
  }
}
```

### 6. Quest Runner Stub

**File: src/cli/quest-runner.ts**
```typescript
import { Quest } from './types/quest';
import chalk from 'chalk';

/**
 * Main quest execution flow
 */
export async function runQuest(quest: Quest): Promise<void> {
  console.log(chalk.gray(`\nQuest ID: ${quest.id}`));
  console.log(chalk.gray(`Status: ${quest.status}`));
  console.log(chalk.gray(`Phase: ${getCurrentPhase(quest)}`));
  
  // TODO: Implement in task 06
  console.log(chalk.yellow('\n(Quest execution implementation pending - Task 06)'));
  
  // For now, just show quest info
  if (quest.tasks.length > 0) {
    console.log(`\nTasks: ${quest.tasks.length}`);
    quest.tasks.forEach(task => {
      const icon = task.status === 'complete' ? '✅' : '⏳';
      console.log(`  ${icon} ${task.name} (${task.status})`);
    });
  }
}

function getCurrentPhase(quest: Quest): string {
  if (quest.phases.review.status === 'complete') return 'Complete';
  if (quest.phases.review.status === 'in_progress') return 'Review';
  if (quest.phases.testing.status === 'in_progress') return 'Testing';
  if (quest.phases.implementation.status === 'in_progress') return 'Implementation';
  if (quest.phases.discovery.status === 'in_progress') return 'Discovery';
  return 'Not started';
}
```

## Unit Tests

**File: src/cli/commands/list.test.ts**
```typescript
import { showQuestList } from './list';
import { getQuestSummaries } from '../quest-storage';
import chalk from 'chalk';

jest.mock('../quest-storage');

// Mock chalk to remove colors in tests
jest.mock('chalk', () => ({
  bold: (text: string) => text,
  gray: (text: string) => text,
  cyan: (text: string) => text,
  red: (text: string) => text,
  yellow: (text: string) => text,
  green: (text: string) => text,
}));

describe('List Command', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should show message when no quests', async () => {
    (getQuestSummaries as jest.Mock).mockResolvedValue([]);

    await showQuestList([]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('No active quests')
    );
  });

  it('should display quest summaries', async () => {
    (getQuestSummaries as jest.Mock).mockResolvedValue([
      {
        id: 'test-123',
        folder: '01-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        progress: '2/5 tasks',
        currentPhase: 'Implementation',
      },
    ]);

    await showQuestList([]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test Quest')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('2/5 tasks')
    );
  });

  it('should separate blocked quests', async () => {
    (getQuestSummaries as jest.Mock).mockResolvedValue([
      {
        id: 'test-1',
        folder: '01-test',
        title: 'Active Quest',
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        progress: '1/3 tasks',
        currentPhase: 'Implementation',
      },
      {
        id: 'test-2',
        folder: '02-blocked',
        title: 'Blocked Quest',
        status: 'blocked',
        createdAt: new Date().toISOString(),
        progress: '2/4 tasks',
        currentPhase: 'Testing',
      },
    ]);

    await showQuestList([]);

    const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
    expect(output).toContain('In Progress:');
    expect(output).toContain('Blocked:');
    expect(output).toContain('Active Quest');
    expect(output).toContain('Blocked Quest');
  });
});
```

**File: src/cli/commands/abandon.test.ts**
```typescript
import { abandonCurrentQuest } from './abandon';
import { getCurrentQuest, setCurrentQuest } from '../config-manager';
import { loadQuest, saveQuest, getQuestSummaries } from '../quest-storage';
import { moveQuestToAbandoned } from '../directory-manager';
import * as readline from 'readline/promises';

jest.mock('../config-manager');
jest.mock('../quest-storage');
jest.mock('../directory-manager');
jest.mock('readline/promises');

describe('Abandon Command', () => {
  let consoleLogSpy: jest.SpyInstance;
  let rlMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    rlMock = {
      question: jest.fn(),
      close: jest.fn(),
    };
    (readline.createInterface as jest.Mock).mockReturnValue(rlMock);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should abandon current quest when confirmed', async () => {
    const mockQuest = {
      id: 'test-123',
      folder: '01-test',
      title: 'Test Quest',
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      tasks: [],
    };

    (getCurrentQuest as jest.Mock).mockResolvedValue('01-test');
    (loadQuest as jest.Mock).mockResolvedValue(mockQuest);
    (saveQuest as jest.Mock).mockResolvedValue(undefined);
    (moveQuestToAbandoned as jest.Mock).mockResolvedValue(undefined);
    rlMock.question.mockResolvedValue('y');

    await abandonCurrentQuest([]);

    expect(saveQuest).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'abandoned' })
    );
    expect(moveQuestToAbandoned).toHaveBeenCalledWith('01-test');
    expect(setCurrentQuest).toHaveBeenCalledWith(undefined);
  });

  it('should not abandon when not confirmed', async () => {
    (getCurrentQuest as jest.Mock).mockResolvedValue('01-test');
    (loadQuest as jest.Mock).mockResolvedValue({ 
      title: 'Test Quest',
      tasks: [],
      createdAt: new Date().toISOString(),
    });
    rlMock.question.mockResolvedValue('n');

    await abandonCurrentQuest([]);

    expect(saveQuest).not.toHaveBeenCalled();
    expect(moveQuestToAbandoned).not.toHaveBeenCalled();
  });

  it('should abandon specific quest by number', async () => {
    (getQuestSummaries as jest.Mock).mockResolvedValue([
      { folder: '01-first', title: 'First' },
      { folder: '02-second', title: 'Second' },
    ]);
    (loadQuest as jest.Mock).mockResolvedValue({
      folder: '02-second',
      title: 'Second',
      tasks: [],
      createdAt: new Date().toISOString(),
    });
    rlMock.question.mockResolvedValue('y');

    await abandonCurrentQuest(['2']);

    expect(loadQuest).toHaveBeenCalledWith('02-second');
    expect(moveQuestToAbandoned).toHaveBeenCalledWith('02-second');
  });
});
```

## Validation Criteria

1. **List Command**
   - [ ] Shows all active quests
   - [ ] Groups by status (in-progress, blocked)
   - [ ] Shows quest age and progress
   - [ ] Handles empty quest list

2. **Abandon Command**
   - [ ] Abandons current quest
   - [ ] Abandons by quest number
   - [ ] Confirms before abandoning
   - [ ] Moves to abandoned directory
   - [ ] Clears current quest if needed

3. **Reorder Command**
   - [ ] Shows current order
   - [ ] Accepts new order input
   - [ ] Validates order input
   - [ ] Updates quest priorities

4. **Start Command**
   - [ ] Starts by quest number
   - [ ] Starts by quest name
   - [ ] Sets as current quest
   - [ ] Handles invalid input

5. **Quest Handler**
   - [ ] Finds existing quests
   - [ ] Creates new quests
   - [ ] Respects quest limit
   - [ ] Sets current quest

## Next Steps

After completing this task:
1. Run `npm test` to verify all tests pass
2. Test each command with the CLI
3. Verify quest state changes
4. Test edge cases (no quests, invalid input)
5. Proceed to [06-quest-execution.md](06-quest-execution.md)