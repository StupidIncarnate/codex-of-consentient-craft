# Task 09: Agent Recovery

## Objective
Handle agent failures and implement recovery mechanisms for different failure scenarios.

## Dependencies
- Task 07: Agent Spawning (for agent management)
- Task 08: Report Parsing (for assessment)

## Implementation

### 1. Recovery Manager

**File: src/cli/agent-recovery.ts**
```typescript
import { AgentType, AgentContext, AgentResult } from './types/agent';
import { Quest, Task } from './types/quest';
import { loadQuest, saveQuest, getNextReportNumber } from './quest-storage';
import { spawnAndWait } from './agent-spawner';
import { parseReportFile } from './report-parser';
import { checkFileExists, getFileModificationTime } from './file-utils';
import chalk from 'chalk';

export interface RecoveryContext {
  agentType: AgentType;
  originalContext: AgentContext;
  failureReason: string;
  questFolder: string;
  previousReportNumber?: string;
}

export interface RecoveryStrategy {
  type: 'retry' | 'assess' | 'continue' | 'fail';
  reason: string;
  instructions?: string;
}

/**
 * Main recovery handler for failed agents
 */
export async function handleAgentRecovery(
  recovery: RecoveryContext
): Promise<AgentResult> {
  console.log(chalk.yellow(`\n🔧 Recovery: ${recovery.agentType} agent failed`));
  console.log(chalk.gray(`Reason: ${recovery.failureReason}`));
  
  // Determine recovery strategy
  const strategy = await determineRecoveryStrategy(recovery);
  
  console.log(chalk.blue(`Recovery strategy: ${strategy.type}`));
  console.log(chalk.gray(strategy.reason));
  
  switch (strategy.type) {
    case 'retry':
      return retryAgent(recovery, strategy.instructions);
      
    case 'assess':
      return assessAndRecover(recovery);
      
    case 'continue':
      return continueFromPartialWork(recovery);
      
    case 'fail':
    default:
      throw new Error(`Recovery failed: ${strategy.reason}`);
  }
}

/**
 * Determines the best recovery strategy
 */
async function determineRecoveryStrategy(
  recovery: RecoveryContext
): Promise<RecoveryStrategy> {
  const { agentType, failureReason } = recovery;
  
  // Check if this is a repeated failure
  const failureCount = await countAgentFailures(recovery.questFolder, agentType);
  if (failureCount >= 3) {
    return {
      type: 'fail',
      reason: `Agent ${agentType} has failed ${failureCount} times`,
    };
  }
  
  // Agent-specific strategies
  switch (agentType) {
    case 'codeweaver':
      // For implementation agents, check if work was partially done
      if (recovery.originalContext.task) {
        const hasPartialWork = await checkPartialImplementation(
          recovery.originalContext.task
        );
        
        if (hasPartialWork) {
          return {
            type: 'assess',
            reason: 'Partial implementation detected, assessing progress',
          };
        }
      }
      return {
        type: 'retry',
        reason: 'No partial work found, retrying task',
        instructions: 'Start fresh with the task implementation',
      };
      
    case 'pathseeker':
      // For discovery agents, check if we have partial task lists
      const hasPartialDiscovery = await checkPartialDiscovery(recovery.questFolder);
      
      if (hasPartialDiscovery) {
        return {
          type: 'continue',
          reason: 'Partial discovery found, continuing from last state',
        };
      }
      return {
        type: 'retry',
        reason: 'Starting discovery fresh',
      };
      
    case 'spiritmender':
      // For fix agents, always retry with context
      return {
        type: 'retry',
        reason: 'Retrying fixes with updated context',
        instructions: 'Analyze the current errors and apply fixes',
      };
      
    case 'siegemaster':
    case 'lawbringer':
      // For review agents, simple retry usually works
      return {
        type: 'retry',
        reason: 'Retrying analysis',
      };
      
    default:
      return {
        type: 'retry',
        reason: 'Default retry strategy',
      };
  }
}

/**
 * Simple retry of the agent
 */
async function retryAgent(
  recovery: RecoveryContext,
  instructions?: string
): Promise<AgentResult> {
  console.log(chalk.cyan('♻️  Retrying agent...'));
  
  const quest = await loadQuest(recovery.questFolder);
  const retryContext: AgentContext = {
    ...recovery.originalContext,
    reportNumber: await getNextReportNumber(quest),
    recoveryMode: true,
    instruction: instructions || 'Previous attempt failed. Please try again.',
    previousReportNumber: recovery.previousReportNumber,
  };
  
  return spawnAndWait(recovery.agentType, retryContext);
}

/**
 * Assess work and recover for implementation agents
 */
async function assessAndRecover(
  recovery: RecoveryContext
): Promise<AgentResult> {
  console.log(chalk.cyan('🔍 Assessing partial work...'));
  
  const quest = await loadQuest(recovery.questFolder);
  
  // Spawn Pathseeker to assess what was done
  const assessmentContext: AgentContext = {
    questFolder: recovery.questFolder,
    reportNumber: await getNextReportNumber(quest),
    questMode: 'recovery_assessment',
    task: recovery.originalContext.task,
    instruction: `The previous ${recovery.agentType} exited unexpectedly while working on task "${recovery.originalContext.task?.name}". Please analyze:
1. What files were created or modified
2. What work was completed
3. What work remains to be done
4. Whether the task can be marked as complete or needs more work`,
  };
  
  const assessment = await spawnAndWait('pathseeker', assessmentContext);
  
  // Parse assessment results
  const assessmentReport = assessment.report;
  
  if (assessmentReport.taskAssessment?.status === 'complete') {
    // Work is done, create synthetic completion report
    console.log(chalk.green('✅ Task completed during recovery'));
    
    return {
      status: 'complete',
      agentType: recovery.agentType,
      reportFilename: `${recovery.originalContext.reportNumber}-${recovery.agentType}-report.json`,
      report: {
        recoveryNote: 'Task completed before agent failure',
        filesCreated: assessmentReport.taskAssessment.filesCreated || [],
        filesModified: assessmentReport.taskAssessment.filesModified || [],
        completedBy: 'recovery_assessment',
      },
    };
  } else if (assessmentReport.taskAssessment?.status === 'partial') {
    // Need to continue work
    console.log(chalk.yellow('⚡ Continuing partial work...'));
    
    const continueContext: AgentContext = {
      ...recovery.originalContext,
      reportNumber: await getNextReportNumber(quest),
      recoveryMode: true,
      existingWork: assessmentReport.taskAssessment,
      instruction: `Continue the incomplete task. Previous work summary:
${assessmentReport.taskAssessment.summary}

Files already created: ${assessmentReport.taskAssessment.filesCreated?.join(', ')}
Files already modified: ${assessmentReport.taskAssessment.filesModified?.join(', ')}

Please complete the remaining work.`,
    };
    
    return spawnAndWait(recovery.agentType, continueContext);
  } else {
    // No significant work done, retry fresh
    console.log(chalk.blue('🔄 No significant work found, retrying fresh...'));
    
    return retryAgent(recovery, 'Start fresh with the task implementation');
  }
}

/**
 * Continue from partial work (for Pathseeker)
 */
async function continueFromPartialWork(
  recovery: RecoveryContext
): Promise<AgentResult> {
  console.log(chalk.cyan('📋 Continuing from partial discovery...'));
  
  const quest = await loadQuest(recovery.questFolder);
  
  // Find any existing tasks in quest
  const existingTasks = quest.tasks.length > 0 ? quest.tasks : undefined;
  
  const continueContext: AgentContext = {
    ...recovery.originalContext,
    reportNumber: await getNextReportNumber(quest),
    recoveryMode: true,
    existingTasks: existingTasks,
    instruction: existingTasks 
      ? 'Continue discovery. Current tasks are shown above. Add any missing tasks.'
      : 'Previous discovery was interrupted. Please complete the discovery process.',
  };
  
  return spawnAndWait(recovery.agentType, continueContext);
}

/**
 * Checks if implementation task has partial work
 */
async function checkPartialImplementation(task: Task): Promise<boolean> {
  // Check if any of the expected files exist
  for (const file of task.filesToCreate) {
    if (await checkFileExists(file)) {
      return true;
    }
  }
  
  // Check if any files to edit were modified recently
  const recentTime = Date.now() - 5 * 60 * 1000; // 5 minutes
  for (const file of task.filesToEdit) {
    const modTime = await getFileModificationTime(file);
    if (modTime && modTime > recentTime) {
      return true;
    }
  }
  
  return false;
}

/**
 * Checks if quest has partial discovery
 */
async function checkPartialDiscovery(questFolder: string): Promise<boolean> {
  const quest = await loadQuest(questFolder);
  return quest.tasks.length > 0;
}

/**
 * Counts how many times an agent has failed
 */
async function countAgentFailures(
  questFolder: string,
  agentType: AgentType
): Promise<number> {
  const quest = await loadQuest(questFolder);
  
  return quest.executionLog.filter(
    entry => entry.agentType === agentType && entry.status === 'failed'
  ).length;
}

/**
 * Handles catastrophic failures
 */
export async function handleCatastrophicFailure(
  questFolder: string,
  error: Error
): Promise<void> {
  console.error(chalk.red('\n💥 Catastrophic failure!'));
  console.error(chalk.red(error.message));
  
  const quest = await loadQuest(questFolder);
  
  // Block the quest
  quest.status = 'blocked';
  quest.blockReason = `Catastrophic failure: ${error.message}`;
  await saveQuest(quest);
  
  // Write error details to file
  const errorFile = `${questFolder}/catastrophic-error-${Date.now()}.txt`;
  const errorDetails = `
Catastrophic Error Report
========================
Time: ${new Date().toISOString()}
Quest: ${quest.title}
Error: ${error.message}
Stack: ${error.stack}

Quest State:
${JSON.stringify(quest, null, 2)}
`;
  
  const { writeFile } = await import('fs/promises');
  await writeFile(errorFile, errorDetails);
  
  console.log(chalk.red(`\nQuest blocked. Error details saved to: ${errorFile}`));
  console.log(chalk.yellow('Manual intervention required.'));
}
```

### 2. File Utilities

**File: src/cli/file-utils.ts**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Checks if a file exists
 */
export async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets file modification time
 */
export async function getFileModificationTime(filePath: string): Promise<number | null> {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtime.getTime();
  } catch {
    return null;
  }
}

/**
 * Lists files modified after a certain time
 */
export async function getRecentlyModifiedFiles(
  directory: string,
  sinceTime: number
): Promise<string[]> {
  const modifiedFiles: string[] = [];
  
  async function scan(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await scan(fullPath);
        } else if (entry.isFile()) {
          const modTime = await getFileModificationTime(fullPath);
          if (modTime && modTime > sinceTime) {
            modifiedFiles.push(fullPath);
          }
        }
      }
    } catch {
      // Ignore permission errors
    }
  }
  
  await scan(directory);
  return modifiedFiles;
}

/**
 * Creates a backup of a file
 */
export async function backupFile(filePath: string): Promise<string> {
  const backupPath = `${filePath}.backup-${Date.now()}`;
  
  try {
    await fs.copyFile(filePath, backupPath);
    return backupPath;
  } catch (error) {
    throw new Error(`Failed to backup ${filePath}: ${error.message}`);
  }
}

/**
 * Restores a file from backup
 */
export async function restoreFromBackup(
  originalPath: string,
  backupPath: string
): Promise<void> {
  try {
    await fs.copyFile(backupPath, originalPath);
    await fs.unlink(backupPath); // Remove backup after restore
  } catch (error) {
    throw new Error(`Failed to restore ${originalPath}: ${error.message}`);
  }
}
```

### 3. Recovery Utilities

**File: src/cli/recovery-utils.ts**
```typescript
import { Quest } from './types/quest';
import { loadQuest, saveQuest } from './quest-storage';
import { getQuestReports } from './directory-manager';
import { parseReportFile } from './report-parser';
import { AgentType } from './types/agent';

/**
 * Creates a recovery checkpoint
 */
export async function createRecoveryCheckpoint(
  questFolder: string,
  agentType: AgentType,
  context: any
): Promise<void> {
  const checkpoint = {
    timestamp: new Date().toISOString(),
    agentType,
    context,
    questState: await loadQuest(questFolder),
  };
  
  const checkpointPath = `${questFolder}/.recovery-${Date.now()}.json`;
  const { writeFile } = await import('fs/promises');
  await writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
}

/**
 * Finds the last successful report for an agent type
 */
export async function findLastSuccessfulReport(
  questFolder: string,
  agentType: AgentType
): Promise<string | null> {
  const reports = await getQuestReports(questFolder);
  
  // Filter and sort reports
  const agentReports = reports
    .filter(r => r.includes(`-${agentType}-report.json`))
    .sort((a, b) => b.localeCompare(a)); // Latest first
  
  // Find first successful report
  for (const reportFile of agentReports) {
    try {
      const report = await parseReportFile(questFolder, reportFile);
      if (report.status === 'complete') {
        return reportFile;
      }
    } catch {
      // Skip corrupt reports
    }
  }
  
  return null;
}

/**
 * Analyzes failure patterns
 */
export async function analyzeFailurePattern(
  questFolder: string
): Promise<FailureAnalysis> {
  const quest = await loadQuest(questFolder);
  const analysis: FailureAnalysis = {
    totalFailures: 0,
    failuresByAgent: {},
    commonFailureReasons: [],
    recommendations: [],
  };
  
  // Count failures from execution log
  for (const entry of quest.executionLog) {
    if (entry.status === 'failed') {
      analysis.totalFailures++;
      
      if (entry.agentType) {
        analysis.failuresByAgent[entry.agentType] = 
          (analysis.failuresByAgent[entry.agentType] || 0) + 1;
      }
    }
  }
  
  // Generate recommendations
  if (analysis.totalFailures > 5) {
    analysis.recommendations.push(
      'High failure rate detected. Consider abandoning quest and starting fresh.'
    );
  }
  
  for (const [agent, count] of Object.entries(analysis.failuresByAgent)) {
    if (count >= 3) {
      analysis.recommendations.push(
        `${agent} has failed ${count} times. Check agent configuration and environment.`
      );
    }
  }
  
  return analysis;
}

export interface FailureAnalysis {
  totalFailures: number;
  failuresByAgent: Record<string, number>;
  commonFailureReasons: string[];
  recommendations: string[];
}
```

## Unit Tests

**File: src/cli/agent-recovery.test.ts**
```typescript
import { 
  handleAgentRecovery, 
  determineRecoveryStrategy,
  handleCatastrophicFailure 
} from './agent-recovery';
import { spawnAndWait } from './agent-spawner';
import { loadQuest, saveQuest } from './quest-storage';
import * as fileUtils from './file-utils';

jest.mock('./agent-spawner');
jest.mock('./quest-storage');
jest.mock('./file-utils');

describe('AgentRecovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (loadQuest as jest.Mock).mockResolvedValue({
      id: 'test-123',
      folder: '01-test',
      tasks: [],
      executionLog: [],
    });
    
    (saveQuest as jest.Mock).mockResolvedValue(undefined);
  });

  describe('handleAgentRecovery', () => {
    it('should retry simple agents', async () => {
      const recovery = {
        agentType: 'siegemaster' as const,
        originalContext: { questFolder: '01-test' },
        failureReason: 'Process exited',
        questFolder: '01-test',
      };

      (spawnAndWait as jest.Mock).mockResolvedValue({
        status: 'complete',
        agentType: 'siegemaster',
        report: {},
      });

      const result = await handleAgentRecovery(recovery);

      expect(result.status).toBe('complete');
      expect(spawnAndWait).toHaveBeenCalledWith(
        'siegemaster',
        expect.objectContaining({ recoveryMode: true })
      );
    });

    it('should assess partial work for codeweaver', async () => {
      const recovery = {
        agentType: 'codeweaver' as const,
        originalContext: {
          questFolder: '01-test',
          task: {
            id: 'task-1',
            name: 'CreateAuth',
            filesToCreate: ['auth.ts'],
            filesToEdit: [],
          },
        },
        failureReason: 'Process killed',
        questFolder: '01-test',
      };

      (fileUtils.checkFileExists as jest.Mock).mockResolvedValue(true);
      
      (spawnAndWait as jest.Mock)
        .mockResolvedValueOnce({ // Assessment
          status: 'complete',
          report: {
            taskAssessment: {
              status: 'partial',
              summary: 'Auth file created but incomplete',
              filesCreated: ['auth.ts'],
            },
          },
        })
        .mockResolvedValueOnce({ // Continue
          status: 'complete',
          report: { filesCreated: ['auth.ts'] },
        });

      const result = await handleAgentRecovery(recovery);

      expect(spawnAndWait).toHaveBeenCalledTimes(2);
      expect(result.status).toBe('complete');
    });

    it('should fail after too many attempts', async () => {
      const recovery = {
        agentType: 'codeweaver' as const,
        originalContext: { questFolder: '01-test' },
        failureReason: 'Repeated failure',
        questFolder: '01-test',
      };

      (loadQuest as jest.Mock).mockResolvedValue({
        executionLog: [
          { agentType: 'codeweaver', status: 'failed' },
          { agentType: 'codeweaver', status: 'failed' },
          { agentType: 'codeweaver', status: 'failed' },
        ],
      });

      await expect(handleAgentRecovery(recovery))
        .rejects.toThrow('has failed 3 times');
    });
  });

  describe('handleCatastrophicFailure', () => {
    it('should block quest and save error details', async () => {
      const mockWriteFile = jest.fn().mockResolvedValue(undefined);
      jest.doMock('fs/promises', () => ({
        writeFile: mockWriteFile,
      }));

      const error = new Error('Catastrophic error');
      await handleCatastrophicFailure('01-test', error);

      expect(saveQuest).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'blocked',
          blockReason: expect.stringContaining('Catastrophic'),
        })
      );

      expect(mockWriteFile).toHaveBeenCalled();
    });
  });
});
```

**File: src/cli/recovery-utils.test.ts**
```typescript
import { 
  findLastSuccessfulReport,
  analyzeFailurePattern 
} from './recovery-utils';
import { loadQuest } from './quest-storage';
import { getQuestReports } from './directory-manager';
import { parseReportFile } from './report-parser';

jest.mock('./quest-storage');
jest.mock('./directory-manager');
jest.mock('./report-parser');

describe('RecoveryUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findLastSuccessfulReport', () => {
    it('should find last successful report', async () => {
      (getQuestReports as jest.Mock).mockResolvedValue([
        '001-codeweaver-report.json',
        '002-codeweaver-report.json',
        '003-codeweaver-report.json',
      ]);

      (parseReportFile as jest.Mock)
        .mockResolvedValueOnce({ status: 'failed' })
        .mockResolvedValueOnce({ status: 'complete' })
        .mockResolvedValueOnce({ status: 'complete' });

      const result = await findLastSuccessfulReport('01-test', 'codeweaver');

      expect(result).toBe('003-codeweaver-report.json');
    });

    it('should return null if no successful reports', async () => {
      (getQuestReports as jest.Mock).mockResolvedValue([
        '001-codeweaver-report.json',
      ]);

      (parseReportFile as jest.Mock).mockResolvedValue({ status: 'failed' });

      const result = await findLastSuccessfulReport('01-test', 'codeweaver');

      expect(result).toBeNull();
    });
  });

  describe('analyzeFailurePattern', () => {
    it('should analyze failure patterns', async () => {
      (loadQuest as jest.Mock).mockResolvedValue({
        executionLog: [
          { agentType: 'codeweaver', status: 'failed' },
          { agentType: 'codeweaver', status: 'failed' },
          { agentType: 'codeweaver', status: 'failed' },
          { agentType: 'siegemaster', status: 'failed' },
          { agentType: 'pathseeker', status: 'complete' },
        ],
      });

      const analysis = await analyzeFailurePattern('01-test');

      expect(analysis.totalFailures).toBe(4);
      expect(analysis.failuresByAgent.codeweaver).toBe(3);
      expect(analysis.failuresByAgent.siegemaster).toBe(1);
      expect(analysis.recommendations).toContain(
        expect.stringContaining('codeweaver has failed 3 times')
      );
    });
  });
});
```

## Validation Criteria

1. **Recovery Strategies**
   - [ ] Determines appropriate strategy per agent
   - [ ] Retries simple failures
   - [ ] Assesses partial work
   - [ ] Limits retry attempts

2. **Partial Work Assessment**
   - [ ] Detects created files
   - [ ] Detects modified files
   - [ ] Spawns assessment agent
   - [ ] Continues or retries based on assessment

3. **Failure Tracking**
   - [ ] Counts agent failures
   - [ ] Blocks after repeated failures
   - [ ] Logs failure patterns
   - [ ] Provides recommendations

4. **Catastrophic Handling**
   - [ ] Blocks quest on catastrophic failure
   - [ ] Saves error details to file
   - [ ] Preserves quest state
   - [ ] Clear error messaging

5. **Recovery Context**
   - [ ] Preserves original context
   - [ ] Adds recovery instructions
   - [ ] Tracks previous attempts
   - [ ] Maintains report numbering

## Next Steps

After completing this task:
1. Run `npm test` to verify all tests pass
2. Test recovery scenarios
3. Verify partial work detection
4. Test failure limits
5. Proceed to [10-agent-prompts.md](10-agent-prompts.md)