# CLI Pivot Implementation Guide - Accurate & Actionable

## Implementation Checklist

- [x] Task 1: Complete File Tracking Implementation (30 min)
- [x] Task 2: Add Quest Freshness Validation (45 min)
- [x] Task 3: Enhance Ward Error Persistence (30 min)
- [x] Task 4: Implement Task Reconciliation System (2 hours)
- [x] Task 5: Create Progress Indicator System (1.5 hours)
- [x] Task 6: Implement Quest Retrospective System (2 hours)

## Project Overview

QuestMaestro is a CLI tool that orchestrates AI agents (Claude instances) to complete software development tasks. The system breaks down user requests into "quests" with phases, spawns specialized agents sequentially, and tracks progress through file-based communication.

## Current System State

### What Already Exists
- ✅ Core quest management with phase tracking
- ✅ Agent spawning and JSON report monitoring
- ✅ Ward validation with Spiritmender retry logic (MAX_SPIRITMENDER_ATTEMPTS = 3)
- ✅ Recovery system with attempt tracking
- ✅ Basic CLI commands (list, abandon, start, clean)
- ✅ Quest folder structure (001-quest-name format)

### What Needs Implementation
- ❌ File tracking (stubs exist but no implementation)
- ❌ Quest freshness validation
- ❌ Task reconciliation system
- ❌ Progress indicators
- ❌ Quest retrospectives
- ❌ Enhanced recovery context

## Implementation Tasks

---

## Task 1: Complete File Tracking Implementation (30 min)

### Intent
Enable the system to track which files were created/modified by Codeweaver agents so other agents (like Siegemaster) know what to test.

### Current State
- Methods `getCreatedFiles()` and `getChangedFiles()` exist in `src/core/quest-manager.ts` but only contain TODO comments
- Codeweaver agents already write reports with `filesCreated` and `filesModified` arrays

### Success Criteria
- Both methods return accurate arrays of file paths
- Methods handle missing reports gracefully
- Deduplication works across multiple Codeweaver reports
- Empty arrays returned when no files found

### Implementation
**File**: `src/core/quest-manager.ts`

Replace the existing TODO methods with:
```typescript
async getCreatedFiles(questId: string): Promise<string[]> {
  // Get quest folder path using existing method
  const questJsonPath = this.getQuestJsonPath(questId);
  const questFolder = path.dirname(questJsonPath);
  const createdFiles = new Set<string>();
  
  try {
    // Read all files in quest folder
    const result = await this.fileSystem.listFiles(questFolder);
    if (!result.success || !result.data) {
      return [];
    }
    
    // Filter for codeweaver reports
    const codeweaverReports = result.data.filter(f => 
      f.includes('codeweaver-report.json')
    );
    
    // Extract filesCreated from each report
    for (const reportFile of codeweaverReports) {
      const reportPath = path.join(questFolder, reportFile);
      const reportResult = await this.fileSystem.readJson<AgentReport>(reportPath);
      
      if (reportResult.success && reportResult.data?.report?.filesCreated) {
        reportResult.data.report.filesCreated.forEach((file: string) => {
          createdFiles.add(file);
        });
      }
    }
  } catch (error) {
    this.logger.error(`Error reading created files for quest ${questId}:`, error);
  }
  
  return Array.from(createdFiles);
}

async getChangedFiles(questId: string): Promise<string[]> {
  const questJsonPath = this.getQuestJsonPath(questId);
  const questFolder = path.dirname(questJsonPath);
  const modifiedFiles = new Set<string>();
  
  try {
    const result = await this.fileSystem.listFiles(questFolder);
    if (!result.success || !result.data) {
      return [];
    }
    
    const codeweaverReports = result.data.filter(f => 
      f.includes('codeweaver-report.json')
    );
    
    for (const reportFile of codeweaverReports) {
      const reportPath = path.join(questFolder, reportFile);
      const reportResult = await this.fileSystem.readJson<AgentReport>(reportPath);
      
      if (reportResult.success && reportResult.data?.report?.filesModified) {
        reportResult.data.report.filesModified.forEach((file: string) => {
          modifiedFiles.add(file);
        });
      }
    }
  } catch (error) {
    this.logger.error(`Error reading modified files for quest ${questId}:`, error);
  }
  
  return Array.from(modifiedFiles);
}
```

### Testing
```bash
# Create a quest that modifies files
questmaestro "add a hello world function to utils"
# Wait for Codeweaver to complete
# In a test script:
const createdFiles = await questManager.getCreatedFiles('add-hello-world-function-to-utils');
console.log('Created:', createdFiles); // Should show new files
```

### Failure Scenarios
- No reports exist → Return empty array
- Invalid JSON in report → Skip that report, continue with others  
- Quest doesn't exist → Return empty array
- File system errors → Log error, return empty array

---

## Task 2: Add Quest Freshness Validation (45 min)

### Intent
Prevent users from resuming old quests that may have outdated assumptions about the codebase, reducing errors from stale context.

### Current State
- No freshness checking exists
- Quests can be resumed indefinitely regardless of age

### Success Criteria
- Method accurately calculates quest age
- User prompted when quest is stale (>30 days)
- User can choose to continue or abandon
- Integration works in resume flow

### Implementation
**File**: `src/core/quest-manager.ts`

Add this method to the QuestManager class:
```typescript
validateQuestFreshness(quest: Quest): { isStale: boolean; reason?: string } {
  const MAX_QUEST_AGE_DAYS = 30;
  
  // Parse quest creation date
  const createdAt = new Date(quest.createdAt);
  const now = new Date();
  
  // Calculate age in days
  const ageMs = now.getTime() - createdAt.getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  
  if (ageDays > MAX_QUEST_AGE_DAYS) {
    return {
      isStale: true,
      reason: `Quest is ${ageDays} days old (maximum recommended: ${MAX_QUEST_AGE_DAYS} days)`
    };
  }
  
  // Future enhancement: Check git log for major changes
  // Would need to spawn git process and analyze commit history
  
  return { isStale: false };
}
```

**File**: `src/cli.ts`

Add freshness check in the `runQuest` method (around line 249):
```typescript
// Add after loading quest, before execution
private async checkAndWarnStaleness(quest: Quest): Promise<boolean> {
  const freshness = this.questManager.validateQuestFreshness(quest);
  
  if (freshness.isStale) {
    this.logger.warn(`⚠️  ${freshness.reason}`);
    console.log('The codebase may have changed significantly since this quest was created.');
    console.log('Continuing may lead to conflicts or errors.\n');
    
    const answer = await this.getUserInput('Continue anyway? (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('\nQuest cancelled. Create a fresh quest with: questmaestro "your request"');
      return false;
    }
  }
  
  return true;
}

// In runQuest method, add before phase execution:
if (!await this.checkAndWarnStaleness(quest)) {
  return;
}
```

### Testing
```bash
# Manually edit questmaestro/active/[quest]/quest.json
# Change createdAt to: "2024-01-01T00:00:00.000Z"
# Run: questmaestro
# Should see staleness warning
```

### Failure Scenarios
- Invalid date in quest.createdAt → Treat as not stale
- User types invalid response → Re-prompt or default to 'n'

---

## Task 3: Enhance Ward Error Persistence (30 min)

### Intent
Track ward validation errors across attempts to identify patterns and help Spiritmender learn from previous failures.

### Current State
- `saveWardErrors()` method exists but saves to a single file
- Errors are overwritten, not appended
- No task-specific error tracking

### Success Criteria
- Errors appended with timestamp and attempt number
- Errors associated with specific task IDs
- Successfully resolved errors removed from log
- File persists across quest execution

### Implementation
**File**: `src/cli.ts`

Modify the `saveWardErrors` method (around line 526):
```typescript
private async saveWardErrors(
  questFolder: string, 
  errors: string, 
  taskId: string,
  attemptNumber: number
): Promise<void> {
  const errorFile = path.join(questFolder, 'ward-errors-unresolved.txt');
  const timestamp = new Date().toISOString();
  
  // Format error entry with metadata
  const errorEntry = `[${timestamp}] [attempt-${attemptNumber}] [task-${taskId}] ${errors}\n${'='.repeat(80)}\n`;
  
  try {
    // Append to existing file (create if doesn't exist)
    await this.fileSystem.appendFile(errorFile, errorEntry);
  } catch (error) {
    this.logger.error('Failed to save ward errors:', error);
  }
}

// Add method to clean resolved errors
private async cleanResolvedWardErrors(questFolder: string, taskId: string): Promise<void> {
  const errorFile = path.join(questFolder, 'ward-errors-unresolved.txt');
  
  try {
    const result = await this.fileSystem.readFile(errorFile);
    if (!result.success || !result.data) return;
    
    // Filter out lines for this task
    const lines = result.data.split('\n');
    const filteredLines: string[] = [];
    let skipNext = false;
    
    for (const line of lines) {
      if (line.includes(`[task-${taskId}]`)) {
        skipNext = true; // Skip this line and separator
        continue;
      }
      if (skipNext && line.startsWith('='.repeat(80))) {
        skipNext = false;
        continue;
      }
      filteredLines.push(line);
    }
    
    await this.fileSystem.writeFile(errorFile, filteredLines.join('\n'));
  } catch (error) {
    // File might not exist, that's OK
  }
}
```

Update ward validation section (in `runImplementationPhase`):
```typescript
// When ward fails
if (!wardSuccess) {
  const attemptNumber = quest.spiritmenderAttempts?.[task.id] || 0;
  await this.saveWardErrors(questFolder, wardOutput.error || 'Ward validation failed', task.id, attemptNumber + 1);
  // ... continue with Spiritmender
}

// When ward succeeds
if (wardSuccess) {
  await this.cleanResolvedWardErrors(questFolder, task.id);
  // ... continue
}
```

### Testing
```bash
# Introduce a TypeScript error
# Run a quest that triggers ward validation
# Check questmaestro/active/[quest]/ward-errors-unresolved.txt
# Fix the error and re-run
# Verify error entry was removed
```

### Failure Scenarios
- File system permissions → Log error, continue execution
- Malformed file content → Overwrite with new content
- Very large error files → Consider rotation (future enhancement)

---

## Task 4: Implement Task Reconciliation System (2 hours)

### Intent
Allow Pathseeker to modify existing task lists when resuming quests, adapting to code changes that occurred while the quest was paused.

### Current State
- No reconciliation system exists
- Tasks are immutable once created
- No way to mark tasks obsolete or update dependencies

### Success Criteria
- Pathseeker can return reconciliation plans in validation mode
- System correctly applies EXTEND/CONTINUE/REPLAN modes
- Task dependencies can be updated
- Obsolete tasks marked appropriately
- Quest state remains consistent after reconciliation

### Implementation
**File**: `src/models/agent.ts`

Add reconciliation types:
```typescript
export interface ReconciliationPlan {
  mode: 'EXTEND' | 'CONTINUE' | 'REPLAN';
  newTasks?: PathseekerTask[];
  taskUpdates?: Array<{
    taskId: string;
    newDependencies: string[];
  }>;
  obsoleteTasks?: Array<{
    taskId: string;
    reason: string;
  }>;
}

// Update PathseekerReport to include reconciliation
export interface PathseekerReport extends BaseAgentReport {
  // ... existing fields
  reconciliationPlan?: ReconciliationPlan;
}
```

**File**: `src/core/quest-manager.ts`

Add reconciliation method:
```typescript
async applyReconciliation(questId: string, plan: ReconciliationPlan): Promise<void> {
  const questResult = await this.loadQuest(questId);
  if (!questResult.success || !questResult.data) {
    throw new Error(`Failed to load quest ${questId}`);
  }
  
  const quest = questResult.data;
  this.logger.info(`Applying ${plan.mode} reconciliation to quest ${questId}`);
  
  switch (plan.mode) {
    case 'EXTEND':
      // Add new tasks to the end of task list
      if (plan.newTasks && plan.newTasks.length > 0) {
        this.logger.info(`Adding ${plan.newTasks.length} new tasks`);
        
        // Convert PathseekerTask to QuestTask
        const newQuestTasks: QuestTask[] = plan.newTasks.map(task => ({
          ...task,
          status: 'pending' as TaskStatus,
          startedAt: undefined,
          completedAt: undefined,
          completedBy: undefined,
          errorMessage: undefined
        }));
        
        quest.tasks.push(...newQuestTasks);
      }
      break;
      
    case 'REPLAN':
      // Keep completed/failed tasks, replace pending ones
      if (plan.newTasks) {
        const nonPendingTasks = quest.tasks.filter(
          t => t.status !== 'pending'
        );
        
        const newQuestTasks: QuestTask[] = plan.newTasks.map(task => ({
          ...task,
          status: 'pending' as TaskStatus,
          startedAt: undefined,
          completedAt: undefined,
          completedBy: undefined,
          errorMessage: undefined
        }));
        
        this.logger.info(`Keeping ${nonPendingTasks.length} executed tasks, replacing with ${newQuestTasks.length} new tasks`);
        quest.tasks = [...nonPendingTasks, ...newQuestTasks];
      }
      break;
      
    case 'CONTINUE':
      // No changes to task list
      this.logger.info('Continuing with existing task list');
      break;
  }
  
  // Apply dependency updates
  if (plan.taskUpdates) {
    for (const update of plan.taskUpdates) {
      const task = quest.tasks.find(t => t.id === update.taskId);
      if (task) {
        this.logger.info(`Updating dependencies for task ${update.taskId}`);
        task.dependencies = update.newDependencies;
      } else {
        this.logger.warn(`Task ${update.taskId} not found for dependency update`);
      }
    }
  }
  
  // Mark obsolete tasks
  if (plan.obsoleteTasks) {
    for (const obsolete of plan.obsoleteTasks) {
      const task = quest.tasks.find(t => t.id === obsolete.taskId);
      if (task && task.status === 'pending') {
        this.logger.info(`Marking task ${obsolete.taskId} as skipped: ${obsolete.reason}`);
        task.status = 'skipped';
        task.errorMessage = `Obsolete: ${obsolete.reason}`;
      }
    }
  }
  
  // Validate all dependencies still exist
  const validTaskIds = new Set(quest.tasks.map(t => t.id));
  for (const task of quest.tasks) {
    const invalidDeps = task.dependencies.filter(dep => !validTaskIds.has(dep));
    if (invalidDeps.length > 0) {
      this.logger.warn(`Removing invalid dependencies from task ${task.id}: ${invalidDeps.join(', ')}`);
      task.dependencies = task.dependencies.filter(dep => validTaskIds.has(dep));
    }
  }
  
  // Update quest
  quest.updatedAt = new Date().toISOString();
  
  // Save quest
  const saveResult = await this.saveQuest(quest);
  if (!saveResult.success) {
    throw new Error(`Failed to save quest after reconciliation: ${saveResult.error}`);
  }
}
```

**File**: `src/agents/agent-spawner.ts`

Update Pathseeker context for validation mode (in `formatContext` method, around line 377):
```typescript
case 'pathseeker':
  if (context.mode === 'validation') {
    // Add current task state for reconciliation
    return {
      ...baseContext,
      mode: 'validation',
      currentTasks: quest.tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        dependencies: t.dependencies,
        type: t.type
      })),
      questAge: this.calculateQuestAge(quest),
      instructions: 'Analyze the current task list and codebase. Return a reconciliation plan if tasks need updating.'
    };
  }
  return baseContext;
```

**File**: `src/cli.ts`

Handle reconciliation after Pathseeker returns (in `runDiscoveryPhase`, around line 308):
```typescript
// After receiving Pathseeker report in validation mode
if (report.agentType === 'pathseeker' && report.report?.reconciliationPlan) {
  console.log(`\n📋 Applying task reconciliation: ${report.report.reconciliationPlan.mode}`);
  
  try {
    await this.questManager.applyReconciliation(quest.id, report.report.reconciliationPlan);
    
    // Reload quest to get updated tasks
    const updatedQuest = await this.questManager.loadQuest(quest.id);
    if (updatedQuest.success && updatedQuest.data) {
      quest = updatedQuest.data;
      console.log('✅ Task list updated successfully\n');
    }
  } catch (error) {
    this.logger.error('Failed to apply reconciliation:', error);
    console.log('⚠️  Failed to update task list, continuing with existing tasks\n');
  }
}
```

### Testing
```bash
# Start a quest and let it create tasks
questmaestro "add user authentication"
# Stop after discovery phase
# Modify some code files
# Resume quest - Pathseeker should run in validation mode
# Check if reconciliation plan is applied
```

### Failure Scenarios
- Invalid task IDs in updates → Log warning, skip update
- Circular dependencies after update → Detect and break cycles
- Save failure after reconciliation → Throw error, quest remains unchanged
- Missing reconciliation plan → Continue with existing tasks

---

## Task 5: Create Progress Indicator System (1.5 hours)

### Intent
Provide visual feedback during long-running operations (agent execution, file operations) to improve user experience.

### Current State
- No progress indicators exist
- Users see "Waiting for report..." with no updates
- No indication of elapsed time

### Success Criteria
- Animated spinner during operations
- Elapsed time display
- Clean terminal output (no artifacts)
- Success/failure indication
- Works on different terminal types

### Implementation
**File**: `src/utils/progress.ts` (create new file)

```typescript
export class ProgressIndicator {
  private spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private currentFrame = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private currentMessage: string = '';
  private isRunning = false;
  
  start(message: string): void {
    if (this.isRunning) {
      this.stop(false);
    }
    
    this.isRunning = true;
    this.startTime = Date.now();
    this.currentMessage = message;
    this.currentFrame = 0;
    
    // Hide cursor for cleaner display
    process.stdout.write('\x1B[?25l');
    
    // Initial render
    this.render();
    
    // Start animation
    this.intervalId = setInterval(() => {
      this.currentFrame = (this.currentFrame + 1) % this.spinnerFrames.length;
      this.render();
    }, 100);
  }
  
  update(message: string): void {
    if (!this.isRunning) return;
    this.currentMessage = message;
    this.render();
  }
  
  private render(): void {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const spinner = this.spinnerFrames[this.currentFrame];
    
    // Clear line and render
    process.stdout.write(`\r\x1b[K${spinner} ${this.currentMessage} (${elapsed}s)`);
  }
  
  stop(success: boolean, finalMessage?: string): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const icon = success ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    const message = finalMessage || this.currentMessage;
    
    // Clear line, show result, restore cursor
    process.stdout.write(`\r\x1b[K${icon} ${message} (${elapsed}s)\n`);
    process.stdout.write('\x1B[?25h');
  }
  
  succeed(message?: string): void {
    this.stop(true, message);
  }
  
  fail(message?: string): void {
    this.stop(false, message);
  }
  
  // Clean up on process exit
  cleanup(): void {
    if (this.isRunning) {
      this.stop(false, 'Interrupted');
    }
  }
}

// Singleton instance
export const progress = new ProgressIndicator();

// Handle cleanup on exit
process.on('exit', () => progress.cleanup());
process.on('SIGINT', () => {
  progress.cleanup();
  process.exit(1);
});
```

**File**: `src/cli.ts`

Import and use progress indicators:
```typescript
import { progress } from './utils/progress';

// In spawnAgent calls (e.g., in handleWardFailure around line 439):
private async spawnAgentWithProgress(
  agentType: AgentType,
  quest: Quest,
  context: unknown,
  description: string
): Promise<AgentReport | null> {
  progress.start(`${description}`);
  
  try {
    const report = await this.agentSpawner.spawnAgent(agentType, quest, context);
    
    if (report) {
      if (report.status === 'completed') {
        progress.succeed(`${agentType} completed`);
      } else if (report.status === 'blocked') {
        progress.succeed(`${agentType} blocked (user input needed)`);
      } else {
        progress.fail(`${agentType} failed: ${report.report?.error || 'Unknown error'}`);
      }
      return report;
    } else {
      progress.fail(`${agentType} failed to generate report`);
      return null;
    }
  } catch (error) {
    progress.fail(`${agentType} crashed: ${error}`);
    throw error;
  }
}

// Update agent spawning calls throughout the file to use this method
```

### Testing
```typescript
// Create test-progress.ts
import { ProgressIndicator } from './src/utils/progress';

async function test() {
  const progress = new ProgressIndicator();
  
  // Test basic flow
  progress.start('Loading data');
  await new Promise(r => setTimeout(r, 2000));
  
  progress.update('Processing files');
  await new Promise(r => setTimeout(r, 2000));
  
  progress.succeed('All files processed');
  
  // Test failure
  progress.start('Connecting to server');
  await new Promise(r => setTimeout(r, 1500));
  progress.fail('Connection timeout');
}

test();
```

### Failure Scenarios
- Non-TTY environment → Fallback to simple console.log
- Interrupted during animation → Cleanup and restore cursor
- Concurrent progress indicators → Use instance per operation

---

## Task 6: Implement Quest Retrospective System (2 hours)

### Intent
Generate comprehensive retrospective documents when quests complete, capturing learnings and insights from all agents for future reference.

### Current State
- `retros` folder exists in file structure
- RetrospectiveNote interface exists
- No implementation for generating or saving retrospectives

### Success Criteria
- Retrospectives generated automatically on quest completion
- All agent reports aggregated
- Markdown format with clear sections
- Index maintained for all retrospectives
- Insights preserved from agent reports

### Implementation
**File**: `src/core/quest-manager.ts`

Add retrospective types and methods:
```typescript
interface RetroIndexEntry {
  questId: string;
  questTitle: string;
  filename: string;
  completedAt: string;
  tasksTotal: number;
  tasksCompleted: number;
  duration: string;
}

async generateRetrospective(questId: string): Promise<string> {
  const questResult = await this.loadQuest(questId);
  if (!questResult.success || !questResult.data) {
    throw new Error(`Cannot generate retrospective: quest ${questId} not found`);
  }
  
  const quest = questResult.data;
  const questJsonPath = this.getQuestJsonPath(questId);
  const questFolder = path.dirname(questJsonPath);
  
  // Collect all reports
  const reports: Array<{
    number: string;
    agentType: string;
    timestamp: string;
    status: string;
    report: unknown;
  }> = [];
  
  try {
    const filesResult = await this.fileSystem.listFiles(questFolder);
    if (filesResult.success && filesResult.data) {
      const reportFiles = filesResult.data
        .filter(f => f.endsWith('-report.json'))
        .sort(); // Chronological order
      
      for (const file of reportFiles) {
        const reportPath = path.join(questFolder, file);
        const reportResult = await this.fileSystem.readJson<AgentReport>(reportPath);
        
        if (reportResult.success && reportResult.data) {
          const reportNumber = file.match(/^(\d{3})-/)?.[1] || '???';
          reports.push({
            number: reportNumber,
            agentType: reportResult.data.agentType,
            timestamp: reportResult.data.timestamp,
            status: reportResult.data.status,
            report: reportResult.data.report
          });
        }
      }
    }
  } catch (error) {
    this.logger.error('Error collecting reports:', error);
  }
  
  // Build retrospective content
  const lines: string[] = [];
  
  // Header
  lines.push(`# Quest Retrospective: ${quest.title}`);
  lines.push('');
  lines.push(`**Quest ID**: ${quest.id}`);
  lines.push(`**Folder**: ${quest.folder}`);
  lines.push(`**Status**: ${quest.status}`);
  lines.push('');
  
  // Summary
  lines.push('## Summary');
  const startDate = new Date(quest.createdAt);
  const endDate = quest.completedAt ? new Date(quest.completedAt) : new Date();
  const duration = this.formatDuration(endDate.getTime() - startDate.getTime());
  
  lines.push(`- **Started**: ${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()}`);
  lines.push(`- **Completed**: ${endDate.toLocaleDateString()} ${endDate.toLocaleTimeString()}`);
  lines.push(`- **Duration**: ${duration}`);
  lines.push(`- **Total Tasks**: ${quest.tasks.length}`);
  
  // Task breakdown
  const completedTasks = quest.tasks.filter(t => t.status === 'complete').length;
  const failedTasks = quest.tasks.filter(t => t.status === 'failed').length;
  const skippedTasks = quest.tasks.filter(t => t.status === 'skipped').length;
  
  lines.push(`- **Task Results**: ${completedTasks} completed, ${failedTasks} failed, ${skippedTasks} skipped`);
  lines.push(`- **Reports Generated**: ${reports.length}`);
  lines.push('');
  
  // Phase Summary
  lines.push('## Phase Progression');
  lines.push('');
  const phases: Array<keyof typeof quest.phases> = ['discovery', 'implementation', 'testing', 'review'];
  for (const phase of phases) {
    const phaseData = quest.phases[phase];
    const icon = phaseData.status === 'complete' ? '✅' : 
                 phaseData.status === 'skipped' ? '⏭️' : 
                 phaseData.status === 'in_progress' ? '🔄' : '⏸️';
    lines.push(`- ${icon} **${phase.charAt(0).toUpperCase() + phase.slice(1)}**: ${phaseData.status}`);
    if (phaseData.progress) {
      lines.push(`  - Progress: ${phaseData.progress}`);
    }
  }
  lines.push('');
  
  // Agent Reports Section
  lines.push('## Agent Reports');
  lines.push('');
  
  // Group by agent type
  const agentGroups = new Map<string, typeof reports>();
  for (const report of reports) {
    const group = agentGroups.get(report.agentType) || [];
    group.push(report);
    agentGroups.set(report.agentType, group);
  }
  
  // Process each agent type
  for (const [agentType, agentReports] of agentGroups) {
    lines.push(`### ${agentType.charAt(0).toUpperCase() + agentType.slice(1)}`);
    lines.push('');
    
    for (const report of agentReports) {
      const time = new Date(report.timestamp).toLocaleTimeString();
      lines.push(`#### Report ${report.number} - ${time} (${report.status})`);
      lines.push('');
      
      // Extract agent-specific insights
      const r = report.report as Record<string, unknown>;
      
      if (agentType === 'pathseeker' && r.tasks) {
        const tasks = r.tasks as unknown[];
        lines.push(`- Generated ${tasks.length} tasks`);
        if (r.retrospectiveNote) {
          lines.push(`- Insights: ${r.retrospectiveNote}`);
        }
      } else if (agentType === 'codeweaver') {
        if (r.filesCreated) {
          const created = r.filesCreated as string[];
          lines.push(`- Created ${created.length} files`);
        }
        if (r.filesModified) {
          const modified = r.filesModified as string[];
          lines.push(`- Modified ${modified.length} files`);
        }
        if (r.retrospectiveNote) {
          lines.push(`- Insights: ${r.retrospectiveNote}`);
        }
      } else if (agentType === 'siegemaster' && r.testsCreated) {
        const tests = r.testsCreated as unknown[];
        lines.push(`- Created ${tests.length} test files`);
      }
      
      lines.push('');
    }
  }
  
  // Execution Timeline
  lines.push('## Execution Timeline');
  lines.push('');
  
  if (quest.executionLog.length > 0) {
    for (const entry of quest.executionLog) {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const taskInfo = entry.taskId ? ` [Task: ${entry.taskId}]` : '';
      const agent = entry.agentType || 'system';
      lines.push(`- ${time} - **${agent}** - ${entry.report}${taskInfo}`);
    }
  } else {
    lines.push('*No execution log available*');
  }
  lines.push('');
  
  // Recovery Attempts
  if (quest.recoveryHistory && quest.recoveryHistory.length > 0) {
    lines.push('## Recovery Attempts');
    lines.push('');
    for (const recovery of quest.recoveryHistory) {
      lines.push(`- ${recovery.agentType} (attempt ${recovery.attemptNumber}): ${recovery.failureReason}`);
    }
    lines.push('');
  }
  
  // Lessons Learned (template)
  lines.push('## Lessons Learned');
  lines.push('');
  lines.push('_This section can be manually updated with insights gained from this quest._');
  lines.push('');
  lines.push('### What Went Well');
  lines.push('- ');
  lines.push('');
  lines.push('### Challenges Encountered');  
  lines.push('- ');
  lines.push('');
  lines.push('### Recommendations for Future Quests');
  lines.push('- ');
  
  return lines.join('\n');
}

async saveRetrospective(questId: string, content: string): Promise<void> {
  const retrosPath = path.join(this.fileSystem.getProjectRoot(), 'questmaestro', 'retros');
  
  // Ensure directory exists
  await this.fileSystem.ensureDirectory(retrosPath);
  
  // Load quest for metadata
  const questResult = await this.loadQuest(questId);
  if (!questResult.success || !questResult.data) {
    throw new Error('Cannot save retrospective: quest not found');
  }
  
  const quest = questResult.data;
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `${quest.folder}-retrospective-${timestamp}.md`;
  const filepath = path.join(retrosPath, filename);
  
  // Save retrospective
  const saveResult = await this.fileSystem.writeFile(filepath, content);
  if (!saveResult.success) {
    throw new Error(`Failed to save retrospective: ${saveResult.error}`);
  }
  
  // Update index
  const indexPath = path.join(retrosPath, 'index.json');
  let index: RetroIndexEntry[] = [];
  
  // Load existing index
  const indexResult = await this.fileSystem.readJson<RetroIndexEntry[]>(indexPath);
  if (indexResult.success && indexResult.data) {
    index = indexResult.data;
  }
  
  // Calculate duration
  const startTime = new Date(quest.createdAt).getTime();
  const endTime = quest.completedAt ? new Date(quest.completedAt).getTime() : Date.now();
  const duration = this.formatDuration(endTime - startTime);
  
  // Add new entry
  index.push({
    questId: quest.id,
    questTitle: quest.title,
    filename,
    completedAt: new Date().toISOString(),
    tasksTotal: quest.tasks.length,
    tasksCompleted: quest.tasks.filter(t => t.status === 'complete').length,
    duration
  });
  
  // Save updated index
  await this.fileSystem.writeJson(indexPath, index);
  
  this.logger.info(`Retrospective saved to ${filename}`);
}

// Helper method
private formatDuration(ms: number): string {
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

**File**: `src/cli.ts`

Add retrospective generation to quest completion (in `completeQuest` method, around line 731):
```typescript
async completeQuest(
  quest: Quest,
  folder: string,
  completionReason: string = 'All phases completed'
): Promise<void> {
  console.log(`\n✅ Completing quest: ${quest.title}`);
  
  // Generate retrospective before moving quest
  try {
    console.log('📝 Generating quest retrospective...');
    const retrospective = await this.questManager.generateRetrospective(quest.id);
    await this.questManager.saveRetrospective(quest.id, retrospective);
    console.log('✅ Retrospective saved to questmaestro/retros/');
  } catch (error) {
    this.logger.error('Failed to generate retrospective:', error);
    console.log('⚠️  Could not generate retrospective (quest will still be completed)');
  }
  
  // Update quest status
  quest.status = 'complete';
  quest.completedAt = new Date().toISOString();
  
  // Save and move quest
  const result = await this.questManager.completeQuest(quest.id);
  if (result.success) {
    console.log(`✅ Quest completed and moved to questmaestro/completed/`);
    console.log(`\n🎉 Quest "${quest.title}" completed successfully!`);
    console.log(`   Duration: ${this.calculateQuestDuration(quest)}`);
    console.log(`   Tasks: ${quest.tasks.filter(t => t.status === 'complete').length}/${quest.tasks.length} completed`);
  } else {
    console.log(`⚠️  Failed to move quest: ${result.error}`);
  }
}
```

### Testing
```bash
# Complete a quest normally
questmaestro "add a simple hello world function"
# Let it run to completion
# Check questmaestro/retros/ for retrospective file
# Check questmaestro/retros/index.json for entry
```

### Failure Scenarios
- Missing reports → Continue with available data
- Corrupted report files → Skip and log warning
- File system errors → Log error but don't fail quest completion
- Very large retrospectives → Consider chunking (future enhancement)

---

## General Testing Strategy

1. **Unit Testing**: Each method can be tested in isolation
2. **Integration Testing**: Run full quests to test the complete flow
3. **Error Testing**: Intentionally corrupt files/data to test error handling
4. **Performance Testing**: Create quests with many tasks/reports

## Common Implementation Notes

- Always use the existing FileSystem class for file operations
- Use the Logger class for consistent logging
- Handle FileOperationResult properly (check .success before using .data)
- Maintain backwards compatibility with existing quests
- Test with both active and resumed quests

Each task is independent and can be implemented/tested separately. Start with Task 1 (file tracking) as other features may depend on it.