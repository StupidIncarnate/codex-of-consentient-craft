# Task 18: Quest Completion

## Objective
Implement quest completion flow that moves quests to completed/abandoned directories and generates retrospectives.

## Dependencies
- Task 06: Quest Execution (for completion trigger)
- Task 04: Quest Model (for quest structure)
- Task 08: Report Parsing (for retrospective collection)

## Implementation

### 1. Quest Completion Handler

**File: src/cli/quest-completion.ts**
```typescript
import * as path from 'path';
import { Quest } from './types/quest';
import { moveQuestToCompleted, moveQuestToAbandoned, DIRECTORIES } from './directory-manager';
import { collectRetrospectiveNotes } from './report-aggregator';
import { generateRetrospective } from './retrospective-generator';
import { updateConfig, setCurrentQuest } from './config-manager';
import { saveQuest } from './quest-storage';
import chalk from 'chalk';

export interface CompletionResult {
  success: boolean;
  retrospectivePath?: string;
  summary: string;
  stats: QuestStats;
}

export interface QuestStats {
  duration: string;
  tasksCompleted: number;
  totalTasks: number;
  agentsSpawned: number;
  wardFailures: number;
  filesCreated: number;
  filesModified: number;
}

/**
 * Completes a quest successfully
 */
export async function completeQuest(quest: Quest): Promise<CompletionResult> {
  console.log(chalk.cyan('\n🎉 Completing quest...\n'));
  
  try {
    // Update quest status
    quest.status = 'complete';
    quest.completedAt = new Date().toISOString();
    await saveQuest(quest);
    
    // Calculate statistics
    const stats = await calculateQuestStats(quest);
    
    // Generate retrospective
    const retrospectivePath = await generateQuestRetrospective(quest, stats);
    
    // Display completion summary
    displayCompletionSummary(quest, stats);
    
    // Move quest folder to completed
    await moveQuestToCompleted(quest.folder);
    
    // Clear current quest if it matches
    const currentQuest = await import('./config-manager').then(m => m.getCurrentQuest());
    if (currentQuest === quest.folder) {
      await setCurrentQuest(undefined);
    }
    
    // Log completion
    console.log(chalk.green(`\n✅ Quest complete: ${quest.title}`));
    console.log(chalk.gray(`Quest folder moved to: questmaestro/completed/${quest.folder}`));
    
    if (retrospectivePath) {
      console.log(chalk.gray(`Retrospective saved to: ${retrospectivePath}`));
    }
    
    return {
      success: true,
      retrospectivePath,
      summary: `Quest "${quest.title}" completed successfully`,
      stats,
    };
    
  } catch (error) {
    console.error(chalk.red('Failed to complete quest:'), error);
    
    return {
      success: false,
      summary: `Failed to complete quest: ${error.message}`,
      stats: await calculateQuestStats(quest),
    };
  }
}

/**
 * Abandons a quest
 */
export async function abandonQuest(
  quest: Quest,
  reason?: string
): Promise<CompletionResult> {
  console.log(chalk.yellow('\n🚮 Abandoning quest...\n'));
  
  try {
    // Update quest status
    quest.status = 'abandoned';
    quest.abandonedAt = new Date().toISOString();
    quest.abandonReason = reason || 'User abandoned';
    await saveQuest(quest);
    
    // Calculate statistics
    const stats = await calculateQuestStats(quest);
    
    // Generate abandonment report
    const reportPath = await generateAbandonmentReport(quest, stats, reason);
    
    // Display abandonment summary
    displayAbandonmentSummary(quest, stats, reason);
    
    // Move quest folder to abandoned
    await moveQuestToAbandoned(quest.folder);
    
    // Clear current quest if it matches
    const currentQuest = await import('./config-manager').then(m => m.getCurrentQuest());
    if (currentQuest === quest.folder) {
      await setCurrentQuest(undefined);
    }
    
    console.log(chalk.yellow(`\n⚠️  Quest abandoned: ${quest.title}`));
    console.log(chalk.gray(`Quest folder moved to: questmaestro/abandoned/${quest.folder}`));
    
    return {
      success: true,
      retrospectivePath: reportPath,
      summary: `Quest "${quest.title}" abandoned`,
      stats,
    };
    
  } catch (error) {
    console.error(chalk.red('Failed to abandon quest:'), error);
    
    return {
      success: false,
      summary: `Failed to abandon quest: ${error.message}`,
      stats: await calculateQuestStats(quest),
    };
  }
}

/**
 * Calculates quest statistics
 */
async function calculateQuestStats(quest: Quest): Promise<QuestStats> {
  const startTime = new Date(quest.createdAt).getTime();
  const endTime = quest.completedAt 
    ? new Date(quest.completedAt).getTime()
    : Date.now();
  
  const duration = formatDuration(endTime - startTime);
  
  // Count completed tasks
  const tasksCompleted = quest.tasks.filter(t => t.status === 'complete').length;
  
  // Count agents spawned
  const agentsSpawned = quest.executionLog.filter(e => e.status === 'started').length;
  
  // Count ward failures
  const wardFailures = quest.executionLog.filter(e => 
    e.agentType === 'ward' && e.status === 'failed'
  ).length;
  
  // Count file operations
  const fileOps = await countFileOperations(quest);
  
  return {
    duration,
    tasksCompleted,
    totalTasks: quest.tasks.length,
    agentsSpawned,
    wardFailures,
    filesCreated: fileOps.created,
    filesModified: fileOps.modified,
  };
}

/**
 * Counts file operations from quest
 */
async function countFileOperations(quest: Quest): Promise<{
  created: number;
  modified: number;
}> {
  const created = new Set<string>();
  const modified = new Set<string>();
  
  // Collect from tasks
  for (const task of quest.tasks) {
    if (task.status === 'complete') {
      task.filesToCreate.forEach(f => created.add(f));
      task.filesToEdit.forEach(f => modified.add(f));
    }
  }
  
  // Could also parse agent reports for more accurate counts
  // but this gives a good estimate
  
  return {
    created: created.size,
    modified: modified.size,
  };
}

/**
 * Generates quest retrospective
 */
async function generateQuestRetrospective(
  quest: Quest,
  stats: QuestStats
): Promise<string | undefined> {
  try {
    // Collect retrospective notes from all reports
    const retrospectives = await collectRetrospectiveNotes(quest.folder);
    
    // Generate retrospective content
    const content = await generateRetrospective(quest, stats, retrospectives);
    
    // Save retrospective
    const filename = `${new Date().toISOString().split('T')[0]}-${quest.id}.md`;
    const retrospectivePath = path.join(DIRECTORIES.retros, filename);
    
    const { writeFile } = await import('fs/promises');
    await writeFile(retrospectivePath, content);
    
    return retrospectivePath;
  } catch (error) {
    console.error(chalk.yellow('Failed to generate retrospective:'), error);
    return undefined;
  }
}

/**
 * Generates abandonment report
 */
async function generateAbandonmentReport(
  quest: Quest,
  stats: QuestStats,
  reason?: string
): Promise<string | undefined> {
  try {
    const content = `# Quest Abandonment Report

**Quest**: ${quest.title}
**ID**: ${quest.id}
**Date**: ${new Date().toISOString()}
**Reason**: ${reason || 'User decision'}

## Statistics

- Duration: ${stats.duration}
- Tasks Completed: ${stats.tasksCompleted}/${stats.totalTasks}
- Agents Spawned: ${stats.agentsSpawned}
- Ward Failures: ${stats.wardFailures}
- Files Created: ${stats.filesCreated}
- Files Modified: ${stats.filesModified}

## Progress at Abandonment

### Phases
- Discovery: ${quest.phases.discovery.status}
- Implementation: ${quest.phases.implementation.status} ${quest.phases.implementation.progress || ''}
- Testing: ${quest.phases.testing.status}
- Review: ${quest.phases.review.status}

### Incomplete Tasks
${quest.tasks
  .filter(t => t.status !== 'complete')
  .map(t => `- ${t.name} (${t.status})`)
  .join('\n')}

## Lessons Learned

Consider why this quest was abandoned:
- Was the scope too large?
- Were there technical blockers?
- Did requirements change?
- Were there dependency issues?

## Next Steps

If resuming this work:
1. Review the incomplete tasks
2. Check for any blocking issues in the logs
3. Consider breaking into smaller quests
4. Update dependencies if needed
`;
    
    const filename = `abandonment-${quest.id}.md`;
    const reportPath = path.join(DIRECTORIES.abandoned, quest.folder, filename);
    
    const { writeFile } = await import('fs/promises');
    await writeFile(reportPath, content);
    
    return reportPath;
  } catch (error) {
    console.error(chalk.yellow('Failed to generate abandonment report:'), error);
    return undefined;
  }
}

/**
 * Displays completion summary
 */
function displayCompletionSummary(quest: Quest, stats: QuestStats): void {
  console.log(chalk.bold('Quest Completion Summary\n'));
  
  console.log(`${chalk.gray('Quest:')} ${quest.title}`);
  console.log(`${chalk.gray('Duration:')} ${stats.duration}`);
  console.log(`${chalk.gray('Tasks:')} ${stats.tasksCompleted}/${stats.totalTasks} completed`);
  
  console.log(chalk.gray('\nActivity:'));
  console.log(`  • Agents spawned: ${stats.agentsSpawned}`);
  console.log(`  • Ward validations: ${stats.wardFailures > 0 ? `${stats.wardFailures} failures` : 'All passed'}`);
  console.log(`  • Files created: ${stats.filesCreated}`);
  console.log(`  • Files modified: ${stats.filesModified}`);
  
  // Success metrics
  const successRate = stats.totalTasks > 0 
    ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100)
    : 100;
  
  console.log(chalk.gray('\nSuccess Metrics:'));
  console.log(`  • Task completion: ${successRate}%`);
  console.log(`  • All phases: ${chalk.green('✓ Complete')}`);
}

/**
 * Displays abandonment summary
 */
function displayAbandonmentSummary(
  quest: Quest,
  stats: QuestStats,
  reason?: string
): void {
  console.log(chalk.bold('Quest Abandonment Summary\n'));
  
  console.log(`${chalk.gray('Quest:')} ${quest.title}`);
  console.log(`${chalk.gray('Reason:')} ${reason || 'User decision'}`);
  console.log(`${chalk.gray('Duration:')} ${stats.duration}`);
  console.log(`${chalk.gray('Progress:')} ${stats.tasksCompleted}/${stats.totalTasks} tasks`);
  
  if (stats.tasksCompleted > 0) {
    console.log(chalk.gray('\nCompleted Work:'));
    console.log(`  • Tasks finished: ${stats.tasksCompleted}`);
    console.log(`  • Files created: ${stats.filesCreated}`);
    console.log(`  • Files modified: ${stats.filesModified}`);
  }
  
  const incompleteTasks = quest.tasks.filter(t => t.status !== 'complete');
  if (incompleteTasks.length > 0) {
    console.log(chalk.gray('\nIncomplete Tasks:'));
    incompleteTasks.slice(0, 5).forEach(t => 
      console.log(`  • ${t.name} (${t.status})`)
    );
    if (incompleteTasks.length > 5) {
      console.log(`  • ... and ${incompleteTasks.length - 5} more`);
    }
  }
}

/**
 * Formats duration in human-readable format
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
```

### 2. Retrospective Generator

**File: src/cli/retrospective-generator.ts**
```typescript
import { Quest, Task } from './types/quest';
import { QuestStats } from './quest-completion';
import { GroupedRetrospectives } from './report-aggregator';

/**
 * Generates a comprehensive quest retrospective
 */
export async function generateRetrospective(
  quest: Quest,
  stats: QuestStats,
  retrospectives: GroupedRetrospectives
): Promise<string> {
  const sections: string[] = [];
  
  // Header
  sections.push(`# Quest Retrospective: ${quest.title}

**Date**: ${new Date().toISOString().split('T')[0]}
**Duration**: ${stats.duration}
**Success**: ${quest.status === 'complete' ? '✅ Complete' : '❌ Incomplete'}

## Overview

${quest.userRequest || quest.title}

### Key Metrics
- Tasks Completed: ${stats.tasksCompleted}/${stats.totalTasks}
- Agents Spawned: ${stats.agentsSpawned}
- Ward Failures: ${stats.wardFailures}
- Files Created: ${stats.filesCreated}
- Files Modified: ${stats.filesModified}
`);

  // Task Summary
  sections.push(generateTaskSummary(quest));
  
  // Key Decisions (from Pathseeker)
  sections.push(generateKeyDecisions(quest, retrospectives));
  
  // Technical Implementation
  sections.push(generateTechnicalSummary(quest, retrospectives));
  
  // Challenges and Solutions
  sections.push(generateChallengesSummary(retrospectives));
  
  // Lessons Learned
  sections.push(generateLessonsLearned(retrospectives));
  
  // Future Improvements
  sections.push(generateFutureImprovements(retrospectives));
  
  return sections.join('\n\n');
}

/**
 * Generates task summary section
 */
function generateTaskSummary(quest: Quest): string {
  const lines = ['## Task Summary'];
  
  // Group tasks by status
  const completed = quest.tasks.filter(t => t.status === 'complete');
  const incomplete = quest.tasks.filter(t => t.status !== 'complete');
  
  if (completed.length > 0) {
    lines.push('\n### Completed Tasks');
    completed.forEach(task => {
      lines.push(`- ✅ **${task.name}**: ${task.description}`);
      if (task.filesToCreate.length > 0) {
        lines.push(`  - Created: ${task.filesToCreate.join(', ')}`);
      }
    });
  }
  
  if (incomplete.length > 0) {
    lines.push('\n### Incomplete Tasks');
    incomplete.forEach(task => {
      const icon = task.status === 'failed' ? '❌' : '⏸️';
      lines.push(`- ${icon} **${task.name}** (${task.status}): ${task.description}`);
    });
  }
  
  return lines.join('\n');
}

/**
 * Generates key decisions section
 */
function generateKeyDecisions(
  quest: Quest,
  retrospectives: GroupedRetrospectives
): string {
  const lines = ['## Key Decisions'];
  
  // Look for pathseeker decisions
  const pathseekerNotes = retrospectives.byAgent['pathseeker'] || [];
  const decisions = pathseekerNotes.filter(n => 
    n.category.includes('decision') || 
    n.category.includes('architecture') ||
    n.category.includes('approach')
  );
  
  if (decisions.length > 0) {
    decisions.forEach(decision => {
      lines.push(`- **${formatCategory(decision.category)}**: ${decision.note}`);
    });
  } else {
    lines.push('- No key decisions recorded');
  }
  
  return lines.join('\n');
}

/**
 * Generates technical implementation summary
 */
function generateTechnicalSummary(
  quest: Quest,
  retrospectives: GroupedRetrospectives
): string {
  const lines = ['## Technical Implementation'];
  
  // Collect from Codeweaver notes
  const codeweaverNotes = retrospectives.byAgent['codeweaver'] || [];
  const technicalNotes = codeweaverNotes.filter(n => 
    n.category.includes('technical') ||
    n.category.includes('implementation') ||
    n.category.includes('integration')
  );
  
  if (technicalNotes.length > 0) {
    lines.push('\n### Implementation Details');
    technicalNotes.forEach(note => {
      lines.push(`- ${note.note}`);
    });
  }
  
  // Add file summary
  const allFiles = new Set<string>();
  quest.tasks.forEach(t => {
    t.filesToCreate.forEach(f => allFiles.add(f));
    t.filesToEdit.forEach(f => allFiles.add(f));
  });
  
  if (allFiles.size > 0) {
    lines.push('\n### Files Touched');
    Array.from(allFiles).sort().forEach(file => {
      lines.push(`- ${file}`);
    });
  }
  
  return lines.join('\n');
}

/**
 * Generates challenges and solutions summary
 */
function generateChallengesSummary(retrospectives: GroupedRetrospectives): string {
  const lines = ['## Challenges and Solutions'];
  
  const challenges = retrospectives.byCategory['challenges_encountered'] || [];
  const solutions = retrospectives.byCategory['solution_applied'] || [];
  
  if (challenges.length > 0) {
    lines.push('\n### Challenges Encountered');
    challenges.forEach(challenge => {
      lines.push(`- **${challenge.agent}**: ${challenge.note}`);
    });
  }
  
  if (solutions.length > 0) {
    lines.push('\n### Solutions Applied');
    solutions.forEach(solution => {
      lines.push(`- **${solution.agent}**: ${solution.note}`);
    });
  }
  
  if (challenges.length === 0 && solutions.length === 0) {
    lines.push('- No significant challenges recorded');
  }
  
  return lines.join('\n');
}

/**
 * Generates lessons learned section
 */
function generateLessonsLearned(retrospectives: GroupedRetrospectives): string {
  const lines = ['## Lessons Learned'];
  
  const lessons = retrospectives.byCategory['lessons_for_future'] || [];
  const worked = retrospectives.byCategory['what_worked_well'] || [];
  
  if (worked.length > 0) {
    lines.push('\n### What Worked Well');
    worked.forEach(item => {
      lines.push(`- ${item.note}`);
    });
  }
  
  if (lessons.length > 0) {
    lines.push('\n### Key Learnings');
    lessons.forEach(lesson => {
      lines.push(`- ${lesson.note}`);
    });
  }
  
  // Add general observations
  const allNotes = retrospectives.all;
  if (allNotes.length > 10) {
    lines.push('\n### General Observations');
    lines.push(`- High agent activity (${allNotes.length} retrospective notes)`);
    
    // Most active agent
    const agentCounts = Object.entries(retrospectives.byAgent)
      .map(([agent, notes]) => ({ agent, count: notes.length }))
      .sort((a, b) => b.count - a.count);
    
    if (agentCounts.length > 0) {
      lines.push(`- Most active agent: ${agentCounts[0].agent} (${agentCounts[0].count} notes)`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Generates future improvements section
 */
function generateFutureImprovements(retrospectives: GroupedRetrospectives): string {
  const lines = ['## Future Improvements'];
  
  const improvements = retrospectives.byCategory['future_enhancement'] || [];
  const recommendations = retrospectives.byCategory['recommendation'] || [];
  
  const allSuggestions = [...improvements, ...recommendations];
  
  if (allSuggestions.length > 0) {
    allSuggestions.forEach(item => {
      lines.push(`- ${item.note}`);
    });
  } else {
    lines.push('- No specific improvements suggested');
  }
  
  return lines.join('\n');
}

/**
 * Formats category name for display
 */
function formatCategory(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
```

## Unit Tests

**File: src/cli/quest-completion.test.ts**
```typescript
import { completeQuest, abandonQuest, calculateQuestStats } from './quest-completion';
import { Quest } from './types/quest';
import { moveQuestToCompleted, moveQuestToAbandoned } from './directory-manager';
import { collectRetrospectiveNotes } from './report-aggregator';
import * as fs from 'fs/promises';

jest.mock('./directory-manager');
jest.mock('./report-aggregator');
jest.mock('./config-manager');
jest.mock('fs/promises');

describe('QuestCompletion', () => {
  const mockQuest: Quest = {
    id: 'test-123',
    folder: '01-test',
    title: 'Test Quest',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    lastUpdated: new Date().toISOString(),
    phases: {
      discovery: { status: 'complete' },
      implementation: { status: 'complete' },
      testing: { status: 'complete' },
      review: { status: 'complete' },
    },
    tasks: [
      {
        id: 'task-1',
        name: 'Task1',
        type: 'implementation',
        status: 'complete',
        description: 'First task',
        dependencies: [],
        filesToCreate: ['file1.ts'],
        filesToEdit: ['index.ts'],
        addedBy: 'pathseeker',
      },
      {
        id: 'task-2',
        name: 'Task2',
        type: 'implementation',
        status: 'complete',
        description: 'Second task',
        dependencies: ['task-1'],
        filesToCreate: ['file2.ts'],
        filesToEdit: [],
        addedBy: 'pathseeker',
      },
    ],
    executionPlan: ['task-1', 'task-2'],
    executionLog: [
      { report: '001', timestamp: new Date().toISOString(), status: 'started' },
      { report: '002', timestamp: new Date().toISOString(), status: 'completed' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (collectRetrospectiveNotes as jest.Mock).mockResolvedValue({
      byAgent: {},
      byCategory: {},
      all: [],
    });
  });

  describe('completeQuest', () => {
    it('should complete quest successfully', async () => {
      (moveQuestToCompleted as jest.Mock).mockResolvedValue(undefined);

      const result = await completeQuest(mockQuest);

      expect(result.success).toBe(true);
      expect(mockQuest.status).toBe('complete');
      expect(mockQuest.completedAt).toBeDefined();
      expect(moveQuestToCompleted).toHaveBeenCalledWith('01-test');
    });

    it('should generate retrospective', async () => {
      (moveQuestToCompleted as jest.Mock).mockResolvedValue(undefined);

      const result = await completeQuest(mockQuest);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('retros'),
        expect.stringContaining('Test Quest')
      );
      expect(result.retrospectivePath).toBeDefined();
    });

    it('should calculate correct stats', async () => {
      const result = await completeQuest(mockQuest);

      expect(result.stats.tasksCompleted).toBe(2);
      expect(result.stats.totalTasks).toBe(2);
      expect(result.stats.filesCreated).toBe(2);
      expect(result.stats.filesModified).toBe(1);
      expect(result.stats.duration).toMatch(/\d+[hms]/);
    });

    it('should handle completion failure', async () => {
      (moveQuestToCompleted as jest.Mock).mockRejectedValue(new Error('Move failed'));

      const result = await completeQuest(mockQuest);

      expect(result.success).toBe(false);
      expect(result.summary).toContain('Move failed');
    });
  });

  describe('abandonQuest', () => {
    it('should abandon quest with reason', async () => {
      (moveQuestToAbandoned as jest.Mock).mockResolvedValue(undefined);

      const result = await abandonQuest(mockQuest, 'Technical blockers');

      expect(result.success).toBe(true);
      expect(mockQuest.status).toBe('abandoned');
      expect(mockQuest.abandonReason).toBe('Technical blockers');
      expect(moveQuestToAbandoned).toHaveBeenCalledWith('01-test');
    });

    it('should generate abandonment report', async () => {
      (moveQuestToAbandoned as jest.Mock).mockResolvedValue(undefined);

      await abandonQuest(mockQuest, 'Scope too large');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('abandonment'),
        expect.stringContaining('Scope too large')
      );
    });

    it('should include incomplete tasks in report', async () => {
      const questWithIncomplete = {
        ...mockQuest,
        tasks: [
          ...mockQuest.tasks,
          {
            id: 'task-3',
            name: 'Task3',
            type: 'implementation' as const,
            status: 'queued' as const,
            description: 'Incomplete task',
            dependencies: [],
            filesToCreate: [],
            filesToEdit: [],
            addedBy: 'pathseeker',
          },
        ],
      };

      (moveQuestToAbandoned as jest.Mock).mockResolvedValue(undefined);

      await abandonQuest(questWithIncomplete);

      const writeCall = (fs.writeFile as jest.Mock).mock.calls[0];
      const content = writeCall[1];

      expect(content).toContain('Task3 (queued)');
      expect(content).toContain('Incomplete Tasks');
    });
  });

  describe('calculateQuestStats', () => {
    it('should format duration correctly', async () => {
      const testCases = [
        { ms: 30000, expected: /30s/ },
        { ms: 90000, expected: /1m 30s/ },
        { ms: 3600000, expected: /1h 0m/ },
        { ms: 90000000, expected: /1d 1h/ },
      ];

      for (const { ms, expected } of testCases) {
        const quest = {
          ...mockQuest,
          createdAt: new Date(Date.now() - ms).toISOString(),
        };

        const stats = await calculateQuestStats(quest);
        expect(stats.duration).toMatch(expected);
      }
    });

    it('should count ward failures', async () => {
      const questWithWardFailures = {
        ...mockQuest,
        executionLog: [
          ...mockQuest.executionLog,
          { report: 'ward-1', timestamp: new Date().toISOString(), agentType: 'ward', status: 'failed' as const },
          { report: 'ward-2', timestamp: new Date().toISOString(), agentType: 'ward', status: 'failed' as const },
        ],
      };

      const stats = await calculateQuestStats(questWithWardFailures);

      expect(stats.wardFailures).toBe(2);
    });
  });
});
```

## Validation Criteria

1. **Quest Completion**
   - [ ] Updates quest status
   - [ ] Moves to completed directory
   - [ ] Generates retrospective
   - [ ] Clears current quest

2. **Quest Abandonment**
   - [ ] Updates quest status
   - [ ] Records abandon reason
   - [ ] Moves to abandoned directory
   - [ ] Generates report

3. **Statistics**
   - [ ] Calculates duration correctly
   - [ ] Counts tasks accurately
   - [ ] Tracks file operations
   - [ ] Records agent activity

4. **Retrospectives**
   - [ ] Collects all agent notes
   - [ ] Groups by category
   - [ ] Generates readable format
   - [ ] Includes key metrics

5. **User Experience**
   - [ ] Clear completion message
   - [ ] Shows summary stats
   - [ ] Indicates file locations
   - [ ] Handles errors gracefully

## Next Steps

After completing this task:
1. Test quest completion flow
2. Verify retrospective generation
3. Test abandonment process
4. Check file movements
5. Proceed to [19-retrospectives.md](19-retrospectives.md)