# CLI Pivot Implementation - Actionable Tasks

## Overview

This document breaks down the remaining CLI pivot functionality into smallest achievable chunks, focusing only on functionality (tests excluded).

## Current State Summary

### ✅ What's Working
- Core quest lifecycle management
- All agent types spawn and write JSON reports
- Basic CLI commands (list, abandon, start, clean)
- File-based communication with report monitoring
- Project discovery with Voidpoker
- Ward validation with Spiritmender spawning
- Basic recovery attempt tracking

### 🚧 What Needs Implementation

## Priority 1: Critical Path Features

### 1.1 Complete File Tracking Implementation
**File:** `src/core/quest-manager.ts`
```typescript
// Replace TODO comments with actual implementation
getCreatedFiles(questId: string): string[] {
  // Parse all codeweaver reports
  // Extract filesCreated arrays
  // Return deduplicated list
}

getChangedFiles(questId: string): string[] {
  // Parse all codeweaver reports  
  // Extract filesModified arrays
  // Return deduplicated list
}
```

### 1.2 Add Quest Freshness Validation
**File:** `src/core/quest-manager.ts`
```typescript
validateQuestFreshness(quest: Quest): { isStale: boolean, reason?: string } {
  // Check if quest.createdAt > 30 days old
  // Return { isStale: true, reason: "Quest older than 30 days" }
  // Later: Add git history check for major changes
}
```

### 1.3 Fix Ward Error Persistence
**File:** `src/cli.ts` - In ward validation section
```typescript
// After ward failure, append to ward-errors-unresolved.txt
const errorLogPath = path.join(questFolder, 'ward-errors-unresolved.txt');
const errorEntry = `[${new Date().toISOString()}] [attempt-${attempts}] [${currentTask.id}] ${errorMessage}\n`;
await fs.appendFile(errorLogPath, errorEntry);
```

## Priority 2: Robustness Features

### 2.1 Task Reconciliation System
**File:** `src/core/quest-manager.ts`
```typescript
interface ReconciliationPlan {
  mode: 'EXTEND' | 'CONTINUE' | 'REPLAN';
  newTasks?: Task[];
  taskUpdates?: Array<{ taskId: string; newDependencies: string[] }>;
  obsoleteTasks?: Array<{ taskId: string; reason: string }>;
}

async applyReconciliation(questId: string, plan: ReconciliationPlan) {
  // Load quest
  // Apply based on mode:
  //   EXTEND: append newTasks
  //   CONTINUE: no changes
  //   REPLAN: replace all tasks
  // Apply taskUpdates to existing tasks
  // Mark obsoleteTasks in state
  // Save quest
}
```

### 2.2 Pathseeker Validation Mode Handler
**File:** `src/agents/agent-spawner.ts` - In spawnAgent pathseeker case
```typescript
// Add validation mode to context when resuming
if (mode === 'validation') {
  context.validationMode = true;
  context.existingTasks = quest.phases[0].tasks;
}
```

**File:** `src/core/quest-manager.ts` - After pathseeker returns
```typescript
// Check if pathseeker returned reconciliation plan
if (report.reconciliationPlan) {
  await this.applyReconciliation(questId, report.reconciliationPlan);
}
```

### 2.3 Handle runBefore Task Insertion
**File:** `src/core/quest-manager.ts` - In task validation
```typescript
// When adding tasks with runBefore property
reorderTasksWithRunBefore(tasks: Task[]): Task[] {
  // Build dependency graph including runBefore
  // Topological sort respecting both dependencies and runBefore
  // Return reordered task list
}
```

## Priority 3: User Experience Features

### 3.1 Progress Indicator System
**File:** `src/utils/progress.ts` (new file)
```typescript
class ProgressIndicator {
  private spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private current = 0;
  
  start(message: string) {
    // Start interval updating spinner
    // Track start time
  }
  
  update(status: string) {
    // Update status message
    // Keep spinner and elapsed time
  }
  
  complete(message: string) {
    // Clear interval
    // Show checkmark with total time
  }
}
```

**File:** `src/cli.ts` - During agent execution
```typescript
const progress = new ProgressIndicator();
progress.start(`Spawning ${agentType}...`);
// ... spawn agent
progress.update(`${agentType} analyzing codebase...`);
// ... wait for report
progress.complete(`${agentType} complete - ${taskCount} tasks created`);
```

### 3.2 Quest Completion Retrospective
**File:** `src/core/quest-manager.ts`
```typescript
async generateRetrospective(questId: string): Promise<string> {
  // Load all reports from quest folder
  // Extract retrospective field from each
  // Build markdown with structure:
  //   - Quest summary (dates, tasks, agents)
  //   - Agent insights sections
  //   - Key learnings
  // Return markdown string
}

async saveRetrospective(questId: string, content: string) {
  // Create questmaestro/retros/ if not exists
  // Save as [quest-folder]-retrospective.md
  // Update retros/index.json
}
```

**File:** `src/cli.ts` - After quest completion
```typescript
// Generate and save retrospective
const retrospective = await questManager.generateRetrospective(questId);
await questManager.saveRetrospective(questId, retrospective);
console.log('Quest retrospective saved to questmaestro/retros/');
```

## Priority 4: Advanced Recovery Features

### 4.1 Enhanced Recovery Context
**File:** `src/agents/agent-spawner.ts`
```typescript
// In recovery mode, include more context
if (isRecovery) {
  context.recoveryMode = true;
  context.previousReportNumbers = previousReports.map(r => r.number);
  context.previousFailures = previousReports
    .filter(r => r.status === 'failed')
    .map(r => ({ agent: r.agentType, reason: r.error }));
  context.partialWork = await this.assessPartialWork(questFolder);
}
```

### 4.2 Partial Work Assessment
**File:** `src/agents/agent-spawner.ts`
```typescript
async assessPartialWork(questFolder: string): Promise<PartialWorkAssessment> {
  // Check for created files that exist
  // Check for modified files and their state
  // Return assessment with:
  //   - filesCompleted: fully implemented files
  //   - filesPartial: started but incomplete
  //   - filesMissing: planned but not created
}
```

## Priority 5: Nice-to-Have Features

### 5.1 Interactive Mode Menu
**File:** `src/cli.ts`
```typescript
// When --interactive flag is set
async runInteractiveMode() {
  console.log('Welcome to QuestMaestro Interactive Mode!\n');
  console.log('What would you like to do?');
  console.log('1. Resume current quest');
  console.log('2. Start a new quest');
  console.log('3. List all quests');
  console.log('4. Clean up old quests\n');
  
  const choice = await this.promptUser('Choice: ');
  // Route to appropriate command
}
```

### 5.2 Execution Plan Display
**File:** `src/core/quest-manager.ts`
```typescript
generateExecutionPlan(tasks: Task[]): string {
  // Sort tasks by dependencies
  // For each task:
  //   - Show what files it will create/modify
  //   - Show dependencies
  //   - Estimate time (based on complexity)
  // Return formatted plan string
}
```

**File:** `src/cli.ts` - Before execution
```typescript
// Show execution plan
const plan = questManager.generateExecutionPlan(tasks);
console.log('\nExecution Plan:\n' + plan);
const proceed = await this.promptUser('\nProceed? (y/n): ');
```

## Implementation Order

### Week 1: Critical Path (Priority 1)
1. File tracking implementation (1.1) - 30 min
2. Quest freshness validation (1.2) - 45 min
3. Ward error persistence (1.3) - 30 min

### Week 2: Robustness (Priority 2)
1. Task reconciliation system (2.1) - 2 hours
2. Pathseeker validation mode (2.2) - 1 hour
3. runBefore task insertion (2.3) - 1.5 hours

### Week 3: User Experience (Priority 3)
1. Progress indicators (3.1) - 1.5 hours
2. Quest retrospectives (3.2) - 2 hours

### Week 4: Recovery & Polish (Priority 4-5)
1. Enhanced recovery context (4.1) - 1 hour
2. Partial work assessment (4.2) - 1.5 hours
3. Interactive mode menu (5.1) - 1 hour
4. Execution plan display (5.2) - 1 hour

## Notes

- Each task is independent and can be implemented without breaking existing functionality
- Focus on functionality only - tests can be added later
- Start with Priority 1 items as they fix immediate issues
- Priority 2 items add robustness for complex quests
- Priority 3+ items enhance user experience but aren't critical

## Success Metrics

- All Priority 1 items complete = Basic stability achieved
- Priority 1-2 complete = Production-ready for most use cases
- Priority 1-3 complete = Excellent user experience
- All priorities complete = Full feature parity with original spec