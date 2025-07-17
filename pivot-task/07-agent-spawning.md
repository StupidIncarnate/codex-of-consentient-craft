# Task 07: Agent Spawning

## Objective
Implement agent spawning and monitoring system that launches Claude CLI processes and monitors for report file creation.

## Dependencies
- Task 06: Quest Execution (for integration)
- Task 04: Quest Model (for types)

## Implementation

### 1. Agent Types

**File: src/cli/types/agent.ts**
```typescript
export type AgentType = 'voidpoker' | 'pathseeker' | 'codeweaver' | 'siegemaster' | 'lawbringer' | 'spiritmender';

export interface AgentContext {
  questFolder: string;
  reportNumber?: string;
  questMode?: 'creation' | 'validation' | 'dependency_repair' | 'recovery_assessment';
  questTitle?: string;
  userRequest?: string;
  existingTasks?: any[];
  task?: any;
  errors?: string;
  filesCreated?: string[];
  changedFiles?: string[];
  testFramework?: string;
  wardCommands?: any;
  dependencyIssues?: string[];
  attemptNumber?: number;
  previousAttempts?: any[];
  recoveryMode?: boolean;
  userGuidance?: string;
  previousReportNumber?: string;
  instruction?: string;
}

export interface AgentResult {
  status: 'complete' | 'blocked' | 'error';
  agentType: string;
  reportFilename: string;
  report: any;
  blockReason?: string;
}

export interface AgentReport {
  status: 'complete' | 'blocked' | 'error';
  blockReason?: string;
  agentType: AgentType;
  taskId?: string;
  report: any;
  retrospectiveNotes?: RetrospectiveNote[];
}

export interface RetrospectiveNote {
  category: string;
  note: string;
}
```

### 2. Agent Spawner Implementation

**File: src/cli/agent-spawner.ts**
```typescript
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AgentType, AgentContext, AgentResult, AgentReport } from './types/agent';
import { getQuestPath } from './directory-manager';
import { loadQuest, saveQuest, getNextReportNumber } from './quest-storage';
import { addExecutionLog } from './quest-factory';
import chalk from 'chalk';

const AGENT_CHECK_INTERVAL = 200; // ms
const AGENT_TIMEOUT = 30 * 60 * 1000; // 30 minutes

/**
 * Spawns an agent and waits for completion
 */
export async function spawnAndWait(
  agentType: AgentType,
  context: AgentContext
): Promise<AgentResult> {
  // Generate report filename
  const quest = await loadQuest(context.questFolder);
  const reportNumber = context.reportNumber || await getNextReportNumber(quest);
  const reportFilename = `${reportNumber.toString().padStart(3, '0')}-${agentType}-report.json`;
  const reportPath = path.join(getQuestPath(context.questFolder), reportFilename);
  
  // Update quest to track agent start
  if (context.task) {
    const task = quest.tasks.find(t => t.id === context.task.id);
    if (task) {
      task.status = 'in_progress';
      task.currentAgent = reportFilename;
    }
  }
  
  // Add to execution log
  addExecutionLog(quest, reportFilename, context.task?.id, agentType, 'started');
  await saveQuest(quest);
  
  console.log(chalk.cyan(`\n🤖 Spawning ${agentType} agent...`));
  console.log(chalk.gray(`Report: ${reportFilename}`));
  
  // Read agent markdown file
  const agentPrompt = await readAgentFile(agentType);
  
  // Replace $ARGUMENTS with context
  const fullPrompt = agentPrompt.replace('$ARGUMENTS', formatContext(agentType, context));
  
  // Write prompt to temp file (Claude CLI reads from file)
  const tempPromptFile = path.join('/tmp', `questmaestro-${Date.now()}.md`);
  await fs.writeFile(tempPromptFile, fullPrompt);
  
  // Spawn Claude CLI process
  const proc = spawn('claude', [tempPromptFile], {
    stdio: 'inherit', // Show agent output in terminal
    env: { ...process.env },
  });
  
  // Monitor for report file
  const result = await monitorAgent(proc, reportPath, agentType, context);
  
  // Clean up temp file
  try {
    await fs.unlink(tempPromptFile);
  } catch {
    // Ignore cleanup errors
  }
  
  // Update quest with completion
  const updatedQuest = await loadQuest(context.questFolder);
  addExecutionLog(updatedQuest, reportFilename, context.task?.id, agentType, 
    result.status === 'complete' ? 'completed' : result.status === 'blocked' ? 'blocked' : 'failed'
  );
  await saveQuest(updatedQuest);
  
  return { ...result, reportFilename };
}

/**
 * Monitors agent execution and waits for report
 */
async function monitorAgent(
  proc: ChildProcess,
  reportPath: string,
  agentType: AgentType,
  context: AgentContext
): Promise<AgentResult> {
  return new Promise((resolve, reject) => {
    let checkInterval: NodeJS.Timeout;
    let timeoutHandle: NodeJS.Timeout;
    let processExited = false;
    
    // Set up timeout
    timeoutHandle = setTimeout(() => {
      clearInterval(checkInterval);
      proc.kill();
      reject(new Error(`Agent ${agentType} timed out after 30 minutes`));
    }, AGENT_TIMEOUT);
    
    // Check for report file periodically
    checkInterval = setInterval(async () => {
      try {
        // Check if report file exists
        await fs.access(reportPath);
        
        // Report found - parse it
        clearInterval(checkInterval);
        clearTimeout(timeoutHandle);
        
        const reportContent = await fs.readFile(reportPath, 'utf-8');
        const report: AgentReport = JSON.parse(reportContent);
        
        // Kill the process (agent should exit after writing report)
        if (!processExited) {
          proc.kill();
        }
        
        if (report.status === 'blocked') {
          // Handle blocked agent
          const result = await handleBlockedAgent(agentType, context, report.blockReason || '');
          resolve(result);
        } else {
          resolve({
            status: report.status,
            agentType,
            reportFilename: path.basename(reportPath),
            report: report.report,
          });
        }
      } catch {
        // Report not found yet, continue checking
      }
    }, AGENT_CHECK_INTERVAL);
    
    // Handle process exit without report
    proc.on('exit', async (code, signal) => {
      processExited = true;
      clearInterval(checkInterval);
      clearTimeout(timeoutHandle);
      
      // Check one more time for report
      try {
        await fs.access(reportPath);
        // Report exists, process it
        const reportContent = await fs.readFile(reportPath, 'utf-8');
        const report: AgentReport = JSON.parse(reportContent);
        resolve({
          status: report.status,
          agentType,
          reportFilename: path.basename(reportPath),
          report: report.report,
        });
      } catch {
        // No report - handle recovery
        console.log(chalk.yellow(`\n⚠️  ${agentType} exited without report (code: ${code})`));
        
        try {
          const result = await handleAgentRecovery(agentType, context);
          resolve(result);
        } catch (error) {
          reject(new Error(`Agent ${agentType} failed: ${error.message}`));
        }
      }
    });
    
    // Handle process errors
    proc.on('error', (error) => {
      clearInterval(checkInterval);
      clearTimeout(timeoutHandle);
      reject(new Error(`Failed to spawn ${agentType}: ${error.message}`));
    });
  });
}

/**
 * Handles blocked agent continuation
 */
async function handleBlockedAgent(
  agentType: AgentType,
  originalContext: AgentContext,
  blockReason: string
): Promise<AgentResult> {
  console.log(chalk.yellow(`\n⚠️  Agent blocked: ${blockReason}`));
  
  // Get user input
  const readline = await import('readline/promises');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  try {
    const userResponse = await rl.question('\nHow to proceed? ');
    
    // Spawn new instance with continuation context
    const quest = await loadQuest(originalContext.questFolder);
    const continuationContext: AgentContext = {
      ...originalContext,
      reportNumber: await getNextReportNumber(quest),
      previousReportNumber: originalContext.reportNumber,
      userGuidance: userResponse,
    };
    
    return spawnAndWait(agentType, continuationContext);
  } finally {
    rl.close();
  }
}

/**
 * Handles agent recovery when it exits without a report
 */
async function handleAgentRecovery(
  agentType: AgentType,
  originalContext: AgentContext
): Promise<AgentResult> {
  console.log(chalk.yellow('🔧 Attempting agent recovery...'));
  
  // For implementation agents, check what files were created/modified
  if (agentType === 'codeweaver' && originalContext.task) {
    // Spawn Pathseeker to assess current state
    const quest = await loadQuest(originalContext.questFolder);
    const assessmentContext: AgentContext = {
      questFolder: originalContext.questFolder,
      reportNumber: await getNextReportNumber(quest),
      questMode: 'recovery_assessment',
      task: originalContext.task,
      instruction: `The previous Codeweaver exited unexpectedly while working on task ${originalContext.task.name}. Analyze what was completed and what remains.`,
    };
    
    const assessment = await spawnAndWait('pathseeker', assessmentContext);
    
    // Based on assessment, either mark task complete or respawn Codeweaver
    if (assessment.report.taskAssessment?.status === 'mostly_complete') {
      // Generate synthetic report for the original agent
      return {
        status: 'complete',
        agentType: agentType,
        reportFilename: `${originalContext.reportNumber}-${agentType}-report.json`,
        report: {
          recoveryNote: 'Agent exited but work was mostly complete',
          filesCreated: assessment.report.taskAssessment.filesFound,
          completedBy: 'recovery_assessment',
        },
      };
    } else {
      // Respawn Codeweaver to finish the task
      const recoveryContext: AgentContext = {
        ...originalContext,
        reportNumber: await getNextReportNumber(quest),
        recoveryMode: true,
        instruction: "Continue the incomplete task based on existing work.",
      };
      
      return spawnAndWait(agentType, recoveryContext);
    }
  } else {
    // For non-implementation agents, just respawn
    const quest = await loadQuest(originalContext.questFolder);
    const recoveryContext: AgentContext = {
      ...originalContext,
      reportNumber: await getNextReportNumber(quest),
      recoveryMode: true,
      instruction: "The previous agent exited unexpectedly. Start fresh and complete the analysis.",
    };
    
    return spawnAndWait(agentType, recoveryContext);
  }
}

/**
 * Reads agent markdown file
 */
async function readAgentFile(agentType: AgentType): Promise<string> {
  // Try multiple possible locations
  const possiblePaths = [
    path.join(process.cwd(), 'agents', `${agentType}.md`),
    path.join(process.cwd(), 'src', 'agents', `${agentType}.md`),
    path.join(__dirname, '..', '..', 'agents', `${agentType}.md`),
  ];
  
  for (const agentPath of possiblePaths) {
    try {
      const content = await fs.readFile(agentPath, 'utf-8');
      return content;
    } catch {
      // Try next path
    }
  }
  
  throw new Error(`Agent file not found for ${agentType}. Tried: ${possiblePaths.join(', ')}`);
}

/**
 * Formats context for agent prompt
 */
function formatContext(agentType: AgentType, context: AgentContext): string {
  const lines: string[] = [];
  
  // Common context
  lines.push(`Working directory: ${process.cwd()}`);
  
  if (context.questFolder) {
    lines.push(`Quest folder: ${context.questFolder}`);
  }
  
  if (context.reportNumber) {
    lines.push(`Report number: ${context.reportNumber}`);
  }
  
  // Agent-specific context
  switch (agentType) {
    case 'pathseeker':
      if (context.userRequest) lines.push(`User request: ${context.userRequest}`);
      if (context.questMode) lines.push(`Quest mode: ${context.questMode}`);
      if (context.existingTasks) {
        lines.push(`Existing tasks: ${JSON.stringify(context.existingTasks, null, 2)}`);
      }
      if (context.dependencyIssues) {
        lines.push(`Dependency issues: ${context.dependencyIssues.join(', ')}`);
      }
      break;
      
    case 'codeweaver':
      if (context.questTitle) lines.push(`Quest: ${context.questTitle}`);
      if (context.task) {
        lines.push(`Task: ${JSON.stringify(context.task, null, 2)}`);
      }
      break;
      
    case 'siegemaster':
      if (context.questTitle) lines.push(`Quest: ${context.questTitle}`);
      if (context.filesCreated) {
        lines.push(`Files created: ${context.filesCreated.join(', ')}`);
      }
      if (context.testFramework) {
        lines.push(`Test framework: ${context.testFramework}`);
      }
      break;
      
    case 'lawbringer':
      if (context.questTitle) lines.push(`Quest: ${context.questTitle}`);
      if (context.changedFiles) {
        lines.push(`Changed files: ${context.changedFiles.join(', ')}`);
      }
      if (context.wardCommands) {
        lines.push(`Ward commands: ${JSON.stringify(context.wardCommands, null, 2)}`);
      }
      break;
      
    case 'spiritmender':
      if (context.questTitle) lines.push(`Quest: ${context.questTitle}`);
      if (context.errors) {
        lines.push(`Ward errors:\n${context.errors}`);
      }
      if (context.attemptNumber) {
        lines.push(`Attempt number: ${context.attemptNumber}`);
      }
      break;
  }
  
  // Recovery mode
  if (context.recoveryMode) {
    lines.push(`Recovery mode: true`);
    if (context.previousReportNumber) {
      lines.push(`Previous report number: ${context.previousReportNumber}`);
    }
  }
  
  // User guidance
  if (context.userGuidance) {
    lines.push(`User guidance: ${context.userGuidance}`);
  }
  
  // Special instructions
  if (context.instruction) {
    lines.push(`Instruction: ${context.instruction}`);
  }
  
  return lines.join('\n');
}
```

### 3. Agent Process Manager

**File: src/cli/agent-process-manager.ts**
```typescript
import { ChildProcess } from 'child_process';

interface ActiveAgent {
  agentType: string;
  process: ChildProcess;
  startTime: Date;
  questFolder: string;
}

class AgentProcessManager {
  private activeAgents: Map<string, ActiveAgent> = new Map();
  
  /**
   * Registers an active agent process
   */
  register(agentId: string, agent: ActiveAgent): void {
    this.activeAgents.set(agentId, agent);
  }
  
  /**
   * Unregisters an agent process
   */
  unregister(agentId: string): void {
    this.activeAgents.delete(agentId);
  }
  
  /**
   * Gets all active agents
   */
  getActiveAgents(): ActiveAgent[] {
    return Array.from(this.activeAgents.values());
  }
  
  /**
   * Kills all active agents
   */
  killAll(): void {
    for (const [id, agent] of this.activeAgents) {
      console.log(`Killing agent ${agent.agentType} (${id})`);
      agent.process.kill();
    }
    this.activeAgents.clear();
  }
  
  /**
   * Checks if any agents are running
   */
  hasActiveAgents(): boolean {
    return this.activeAgents.size > 0;
  }
}

export const agentProcessManager = new AgentProcessManager();

// Handle process termination
process.on('SIGINT', () => {
  if (agentProcessManager.hasActiveAgents()) {
    console.log('\nTerminating active agents...');
    agentProcessManager.killAll();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (agentProcessManager.hasActiveAgents()) {
    agentProcessManager.killAll();
  }
  process.exit(0);
});
```

## Unit Tests

**File: src/cli/agent-spawner.test.ts**
```typescript
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import { spawnAndWait } from './agent-spawner';
import { loadQuest, saveQuest, getNextReportNumber } from './quest-storage';
import { EventEmitter } from 'events';

jest.mock('child_process');
jest.mock('fs/promises');
jest.mock('./quest-storage');

describe('AgentSpawner', () => {
  let mockProcess: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock process
    mockProcess = new EventEmitter();
    mockProcess.kill = jest.fn();
    mockProcess.stdio = 'inherit';
    
    (spawn as jest.Mock).mockReturnValue(mockProcess);
    
    // Mock quest operations
    (loadQuest as jest.Mock).mockResolvedValue({
      id: 'test-123',
      folder: '01-test',
      tasks: [],
      executionLog: [],
    });
    (saveQuest as jest.Mock).mockResolvedValue(undefined);
    (getNextReportNumber as jest.Mock).mockResolvedValue('001');
    
    // Mock file operations
    (fs.readFile as jest.Mock).mockResolvedValue('Agent markdown content with $ARGUMENTS');
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
  });

  it('should spawn agent and wait for report', async () => {
    // Mock report file creation
    let reportCheckCount = 0;
    (fs.access as jest.Mock).mockImplementation(async (path) => {
      reportCheckCount++;
      if (reportCheckCount > 2) {
        // Report exists after a few checks
        return Promise.resolve();
      }
      throw new Error('Not found');
    });
    
    (fs.readFile as jest.Mock)
      .mockResolvedValueOnce('Agent markdown') // Agent file
      .mockResolvedValueOnce(JSON.stringify({ // Report file
        status: 'complete',
        agentType: 'pathseeker',
        report: { tasks: [] },
      }));

    const resultPromise = spawnAndWait('pathseeker', {
      questFolder: '01-test',
      userRequest: 'Test quest',
    });

    // Wait a bit for the monitoring to start
    await new Promise(resolve => setTimeout(resolve, 300));

    const result = await resultPromise;

    expect(result.status).toBe('complete');
    expect(result.agentType).toBe('pathseeker');
    expect(spawn).toHaveBeenCalledWith('claude', expect.any(Array), expect.any(Object));
  });

  it('should handle blocked agent', async () => {
    // Mock report with blocked status
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    (fs.readFile as jest.Mock)
      .mockResolvedValueOnce('Agent markdown') // Agent file
      .mockResolvedValueOnce(JSON.stringify({ // Report file
        status: 'blocked',
        blockReason: 'Need user input',
        agentType: 'pathseeker',
        report: {},
      }));

    // Mock readline
    jest.doMock('readline/promises', () => ({
      createInterface: () => ({
        question: jest.fn().mockResolvedValue('Continue with this approach'),
        close: jest.fn(),
      }),
    }));

    const result = await spawnAndWait('pathseeker', {
      questFolder: '01-test',
    });

    // Should spawn twice (original + continuation)
    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it('should handle agent exit without report', async () => {
    // Report never exists
    (fs.access as jest.Mock).mockRejectedValue(new Error('Not found'));
    
    const resultPromise = spawnAndWait('codeweaver', {
      questFolder: '01-test',
      task: { id: 'task-1', name: 'TestTask' },
    });

    // Wait for monitoring to start
    await new Promise(resolve => setTimeout(resolve, 100));

    // Emit exit event
    mockProcess.emit('exit', 1);

    // Should attempt recovery
    await expect(resultPromise).resolves.toBeTruthy();
    
    // Should spawn recovery agent
    expect(spawn).toHaveBeenCalledTimes(2); // Original + recovery
  });

  it('should handle spawn errors', async () => {
    const resultPromise = spawnAndWait('pathseeker', {
      questFolder: '01-test',
    });

    // Emit error event
    mockProcess.emit('error', new Error('Command not found'));

    await expect(resultPromise).rejects.toThrow('Failed to spawn pathseeker');
  });

  it('should format context correctly', async () => {
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    (fs.readFile as jest.Mock)
      .mockResolvedValueOnce('Agent content with $ARGUMENTS')
      .mockResolvedValueOnce(JSON.stringify({
        status: 'complete',
        agentType: 'codeweaver',
        report: {},
      }));

    await spawnAndWait('codeweaver', {
      questFolder: '01-test',
      questTitle: 'Test Quest',
      task: {
        id: 'task-1',
        name: 'CreateAuth',
        description: 'Create auth system',
      },
    });

    // Check that context was properly formatted
    const writeCall = (fs.writeFile as jest.Mock).mock.calls[0];
    const writtenContent = writeCall[1];
    
    expect(writtenContent).toContain('Quest: Test Quest');
    expect(writtenContent).toContain('Task:');
    expect(writtenContent).toContain('CreateAuth');
  });
});
```

## Validation Criteria

1. **Agent Spawning**
   - [ ] Spawns Claude CLI process
   - [ ] Passes context correctly
   - [ ] Shows agent output in terminal
   - [ ] Cleans up temp files

2. **Report Monitoring**
   - [ ] Detects report file creation
   - [ ] Parses JSON reports
   - [ ] Handles blocked status
   - [ ] Handles completion status

3. **Error Handling**
   - [ ] Handles agent timeout
   - [ ] Handles exit without report
   - [ ] Attempts recovery for failed agents
   - [ ] Provides clear error messages

4. **Blocked Agent Flow**
   - [ ] Prompts user for guidance
   - [ ] Spawns continuation with context
   - [ ] Preserves quest state

5. **Process Management**
   - [ ] Tracks active agents
   - [ ] Kills agents on exit
   - [ ] Prevents orphaned processes

## Next Steps

After completing this task:
1. Run `npm test` to verify all tests pass
2. Test agent spawning with a mock agent
3. Verify report detection works
4. Test blocked agent handling
5. Proceed to [08-report-parsing.md](08-report-parsing.md)