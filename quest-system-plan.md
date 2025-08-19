# Quest System Architecture Plan

## Overview

Complete rebuild of the quest system with a simple state machine and true parallel execution. Eliminates the complex layered architecture and stale data issues of the current system.

## Core State Machine

### States
- **PLANNING**: Pathseeker creates/updates task execution plan
- **EXECUTING**: Tasks run through 8-step pipeline in parallel
- **FINAL_VALIDATION**: Ward:all integration check after all tasks complete
- **AWAITING_REPLAN**: Collect escapes and transition back to planning
- **COMPLETE**: Quest finished successfully
- **BLOCKED**: Unrecoverable error state

### State Transitions
```
PLANNING → EXECUTING → FINAL_VALIDATION → COMPLETE
    ↑           ↓              ↓
    └── AWAITING_REPLAN ←──────┘
```

## Task Pipeline (8 Steps Per Task)

Each task runs through this exact pipeline independently:

1. **Codeweaver** (implement code + unit tests) → Ward → [Spiritmender if needed]
2. **Lawbringer #1** (review and simplify code) → Ward → [Spiritmender if needed]  
3. **Siegemaster** (find edge cases, add defensive code) → Ward → [Spiritmender if needed]
4. **Lawbringer #2** (review edge case additions) → Ward → [Spiritmender if needed]

**After ALL tasks complete (respecting dependencies):**
5. **Ward:all** (integration validation) → [Spiritmender if needed]

Note: Integration/e2e tests wait for their implementation dependencies before starting their pipeline.

## Agent Roles Redefined

### Pathseeker
- **Input**: User request + current escape contexts + full task plans from all previous rounds + completed work
- **Output**: Complete implementation plan with task dependencies and reconciliation strategy
- **Responsibility**: Creates ALL tasks (including test tasks as first-class citizens), handles task reconciliation during replanning, ensures non-overlapping file assignments to prevent conflicts
- **File Conflict Prevention**: Plans tasks with distinct file sets so parallel agents don't modify same files
- **Modes**: Initial planning vs refinement mode with pivot capability
- **When runs**: Planning phase only

### Codeweaver  
- **Input**: Single implementation task
- **Output**: Code + unit tests together (or int / e2e tests if code is already written)
- **Responsibility**: TDD-style implementation (test structure → code → complete tests)
- **Can escape**: When can't figure out mocks, dependencies, implementation approach or if the task ended up too complicated or tests need some sort of infrastructure addition (mocks or services)

### Lawbringer
- **Runs twice per task**:
  - **Pass #1**: Review Codeweaver output (standards, complexity, clarity)
  - **Pass #2**: Review Siegemaster additions (over-engineering, unnecessary complexity)
- **Responsibility**: Maintain code quality and pragmatic balance
- **Can escape**: When architectural conflicts discovered

### Siegemaster
- **Input**: Code files from Codeweaver (after first Lawbringer review)
- **Output**: Edge case handling, defensive programming, boundary checks
- **Responsibility**: Make code robust (writes more tests if need be and fixes implementation if code wasn't stable enough)
- **Can escape**: When discovers fundamental design issues that it cant reconcile or tests need some sort of infrastructure addition (mocks or services)

### Spiritmender
- **Trigger**: Ward failures (automatic, not manual)
- **Attempts**: Up to 3 per ward failure
- **Responsibility**: Fix tests, lint, typecheck, build issues
- **Can escape**: When realizes architectural change needed

## Commands Run by QuestMaestro CLI

### Ward (CLI Command, Not Agent)
- **ward <files>**: CLI runs this after each agent completes, validates specific files
- **ward:all**: CLI runs this for final integration validation across entire system  
- **Automatic execution**: QuestMaestro automatically runs ward after agent completion
- **Spiritmender spawning**: If ward fails, QuestMaestro spawns Spiritmender agent to fix issues
- **Quality gates**: Prevents progression until validation passes

## Parallel Execution Model

### Task Independence
- Each task runs its 8-step pipeline completely independently
- No cross-task blocking (except dependency ordering)
- Escapes from one task don't affect other running tasks

### Dependency Management
- Tasks only start when ALL dependencies are complete
- Ready tasks launched up to resource limits
- Priority-based ordering when multiple tasks ready

### Resource Management
- **Task Slots**: QuestMaestro CLI manages configurable number of "task slots" (default 3)
- **Slot Ownership**: Each slot runs one complete task pipeline at a time
- **Sequential Pipeline**: Within a slot: Codeweaver → Ward → Lawbringer #1 → Ward → Siegemaster → Ward → Lawbringer #2 → Ward
- **Slot Recycling**: When task completes, QuestMaestro assigns next ready task to that slot
- **Dependency Ordering**: Next task selected based on dependency resolution from Pathseeker plan
- **No Cross-Slot Blocking**: Each slot operates independently, no coordination needed between slots

### Escape Collection
- All escapes collected throughout the round
- No immediate cancellation of other work
- Batch replanning with full context

## Data Model

### Core Types
```typescript
type QuestStatus = 'PLANNING' | 'EXECUTING' | 'FINAL_VALIDATION' | 'AWAITING_REPLAN' | 'COMPLETE' | 'BLOCKED';

type PipelineStage = 'codeweaver' | 'lawbringer-1' | 'siegemaster' | 'lawbringer-2' | 'ward' | 'spiritmender';

interface CompletedTask {
  id: string;
  description: string;
  files: string[];
  completedInRound: number;
  duration: number;
}

interface TaskResult {
  status: 'complete' | 'escaped';
  taskId: string;
  escape?: EscapeRequest;
}

interface WardResult {
  status: 'success' | 'escaped';
  escaped?: boolean;
  errors?: string[];
}

interface ValidationResult {
  status: 'success' | 'escaped';
}

interface SpiritmenderInput {
  taskId?: string;
  scope?: 'task' | 'integration';
  errors: string[];
  attempt: number;
  context?: string;
}

interface SpiritmenderOutput {
  status: 'complete' | 'escape';
  escape?: {
    reason: string;
    analysis: string;
    partialWork?: string;
  };
}
```

### QuestState
```typescript
{
  id: string
  title: string
  originalRequest: string
  status: QuestStatus
  version?: number
  
  // All tasks across all planning rounds
  allTasks: Map<taskId, {
    task: PathseekerTask
    status: 'pending' | 'running' | 'complete' | 'failed' | 'obsolete'
    createdInRound: number
    completedInRound?: number
    assignedTo?: string
  }>
  
  // Current execution context
  execution: {
    round: number
    activeJobs: Map<taskId, {
      taskId: string
      stage: PipelineStage
      startedAt: Date
      attempt?: number  // For spiritmender
    }>
    escapeRequests: EscapeRequest[]
    completedThisRound: string[]
    maxParallel: number
  }
  
  // History for debugging and Pathseeker context
  history: Array<{
    round: number
    trigger: 'initial' | 'escape' | 'manual'
    escapeContext?: EscapeRequest[]
    taskPlan: PathseekerTask[]  // Full plan from this round
    tasksCompleted: string[]
    tasksAbandoned: string[]
    reconciliation?: 'preserve' | 'modify' | 'obsolete' | 'restart'
    timestamp: Date
  }>
}
```

### PathseekerTask
```typescript
{
  id: string
  type: 'implementation' | 'integration-test' | 'e2e-test'
  description: string
  dependencies: string[]  // Task IDs that must complete first
  filesToCreate: string[]  // Files this task will create
  filesToEdit: string[]    // Files this task will modify
  priority: number        // For ordering when multiple ready
}
```

### EscapeRequest
```typescript
{
  taskId: string
  fromAgent: 'codeweaver' | 'lawbringer' | 'siegemaster' | 'spiritmender'
  reason: string
  analysis?: string
  partialWork?: string    // What was completed before escape
  timestamp: Date
  context?: any          // Agent-specific context
}
```

## Example Flow Scenarios

### Scenario 1: Simple Success
```
Round 1: Pathseeker creates [auth-service]
├─ auth-service: Code → Ward ✓ → Law1 → Ward ✓ → Siege → Ward ✓ → Law2 → Ward ✓
└─ Ward:all ✓
Result: COMPLETE
```

### Scenario 2: Parallel Tasks
```
Round 1: Pathseeker creates [auth-service, user-service, payment-service]

Time | auth-service    | user-service    | payment-service
-----|-----------------|-----------------|----------------
0    | Codeweaver      | Codeweaver      | Codeweaver
1    | Ward ✓          | Ward ✓          | Ward ✓
2    | Lawbringer #1   | Lawbringer #1   | Lawbringer #1
3    | Ward ✓          | Ward ✓          | Ward ✓
4    | Siegemaster     | Siegemaster     | Siegemaster
5    | Ward ✓          | Ward ✓          | Ward ✓
6    | Lawbringer #2   | Lawbringer #2   | Lawbringer #2
7    | Ward ✓          | Ward ✓          | Ward ✓
8    | Complete ✓      | Complete ✓      | Complete ✓
9    | Ward:all integration check ✓
10   | COMPLETE
```

### Scenario 3: Escape and Replan
```
Round 1: Pathseeker creates [auth-service, user-service, payment-service]
├─ auth-service: Complete ✓
├─ user-service: Complete ✓
└─ payment-service: Codeweaver ESCAPES ("can't mock payment API")

Round 2: Pathseeker replans with context:
├─ Preserves: auth-service ✓, user-service ✓ 
├─ Creates: mock-payment-provider (new), payment-service-v2 (revised)
├─ Dependencies: payment-service-v2 depends on mock-payment-provider
└─ Execution: mock-payment-provider → Complete, payment-service-v2 → Complete
Final: Ward:all ✓ → COMPLETE
```

### Scenario 4: Integration Failure
```
Round 1: All individual tasks complete ✓
Ward:all FAILS: "auth-service and user-service incompatible interfaces"
Spiritmender (attempt 1): Can't fix - ESCAPES
Round 2: Pathseeker creates interface-adapter task
Ward:all ✓ → COMPLETE
```

## Key Architectural Decisions

### Why This Design

1. **Simple State Machine**: Only 6 states vs complex nested states
2. **True Parallelism**: Tasks don't block each other unnecessarily  
3. **Quality Gates**: Every code change validated
4. **Escape Safety**: Any agent can request help without breaking system
5. **Progress Preservation**: Completed work survives replanning
6. **Batch Efficiency**: Multiple issues handled in one replanning cycle

### What This Eliminates

1. **Stale Data Issues**: Single state source, no complex reloading
2. **Complex Return Paths**: No stack management or return tracking
3. **Phase Interdependencies**: No "implementation phase" - just tasks
4. **Race Conditions**: Clear ownership and atomic state updates
5. **Blocking Failures**: Escapes collected, not immediately blocking

### Edge Cases Handled

1. **Multiple Escapes**: All collected for batch replanning
2. **Dependency Loops**: Pathseeker responsible for valid dependencies  
3. **Resource Exhaustion**: Configurable parallel limits
4. **Integration Conflicts**: Final ward:all catches system-level issues
5. **Spiritmender Limits**: Max 3 attempts before escalating to escape
6. **BLOCKED State**: Quest transitions to BLOCKED when unrecoverable errors occur (e.g., Redis failure, system crash, manual intervention needed)

## Implementation Details

### MCP Redis Server Specification

#### Agent MCP Tools
```typescript
// Tools available to agents via MCP server
// CRITICAL: Agents use MCP tools to write to THEIR OWN Redis keys only
// Agents never modify shared quest state - that's QuestMaestro's job
interface AgentMCPTools {
  // Initialize agent session with clean context (READ ONLY)
  startSession(questId: string, taskId: string, agentType: string): AgentSessionPayload;
  
  // Write agent completion state to agent:questId:taskId:completion key
  writeCompletionState(data: unknown): void;
  
  // Write escape request to agent:questId:taskId:escape key
  requestEscape(escape: EscapeRequest): void;
  
  // Write progress update to agent:questId:taskId:progress key
  updateTaskProgress(taskId: string, stage: PipelineStage, status: string): void;
}

interface AgentSessionPayload {
  // Agent-specific task data
  task: PathseekerTask;
  
  // Quest context (filtered for this agent)
  questContext: {
    questId: string;
    title: string;
    originalRequest: string;
    workingDirectory: string;
    currentRound: number;
  };
  
  // Agent-specific context
  agentContext: {
    agentType: 'codeweaver' | 'lawbringer' | 'siegemaster' | 'spiritmender';
    pass?: number; // For lawbringer (1 or 2)
    previousWork?: string[]; // Files from previous agents in pipeline
  };
  
  // Relevant completed tasks for context
  completedTasks: CompletedTask[];
}

interface QuestContextForAgent {
  questId: string;
  title: string;
  originalRequest: string;
  workingDirectory: string;
  currentRound: number;
  completedTasks: CompletedTask[];
  // Filtered view - no sensitive orchestration data
}
```

#### Zod Validation Schemas
```typescript
// Validation schemas for all agent communications
const StartSessionInputSchema = z.object({
  questId: z.string(),
  taskId: z.string(),
  agentType: z.enum(['codeweaver', 'lawbringer', 'siegemaster', 'spiritmender'])
});

const AgentSessionPayloadSchema = z.object({
  task: z.object({
    id: z.string(),
    type: z.enum(['implementation', 'integration-test', 'e2e-test']),
    description: z.string(),
    dependencies: z.array(z.string()),
    filesToCreate: z.array(z.string()),
    filesToEdit: z.array(z.string()),
    priority: z.number()
  }),
  questContext: z.object({
    questId: z.string(),
    title: z.string(),
    originalRequest: z.string(),
    workingDirectory: z.string(),
    currentRound: z.number()
  }),
  agentContext: z.object({
    agentType: z.enum(['codeweaver', 'lawbringer', 'siegemaster', 'spiritmender']),
    pass: z.number().optional(),
    previousWork: z.array(z.string()).optional()
  }),
  completedTasks: z.array(z.object({
    id: z.string(),
    description: z.string(),
    files: z.array(z.string()),
    completedInRound: z.number(),
    duration: z.number()
  }))
});

const PathseekerTaskSchema = z.object({
  id: z.string(),
  type: z.enum(['implementation', 'integration-test', 'e2e-test']),
  description: z.string(),
  dependencies: z.array(z.string()),
  filesToCreate: z.array(z.string()),
  filesToEdit: z.array(z.string()),
  priority: z.number()
});

const CodeweaverOutputSchema = z.object({
  status: z.enum(['complete', 'escape']),
  filesCreated: z.array(z.string()).optional(),
  filesModified: z.array(z.string()).optional(),
  testsImplemented: z.array(z.string()).optional(),
  escape: z.object({
    reason: z.string(),
    analysis: z.string(),
    partialWork: z.string().optional(),
    suggestion: z.string()
  }).optional()
});

const EscapeRequestSchema = z.object({
  taskId: z.string(),
  fromAgent: z.enum(['codeweaver', 'lawbringer', 'siegemaster', 'spiritmender']),
  reason: z.string(),
  analysis: z.string().optional(),
  partialWork: z.string().optional(),
  timestamp: z.date(),
  context: z.unknown().optional()
});

// MCP server validates all payloads against these schemas
```

#### MCP Server Implementation Pattern
```typescript
class QuestMCPServer {
  async handleAgentRequest(tool: string, params: any): Promise<any> {
    try {
      // Validate input against appropriate Zod schema
      const validatedParams = this.validateInput(tool, params);
      
      // Execute Redis operation with validated data
      const result = await this.executeRedisOperation(tool, validatedParams);
      
      // Validate output before returning
      return this.validateOutput(tool, result);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid payload structure: ${error.message}`);
      }
      throw error;
    }
  }
  
  private validateInput(tool: string, params: any): any {
    switch (tool) {
      case 'startSession':
        return StartSessionInputSchema.parse(params);
      case 'writeCompletionState':
        return CodeweaverOutputSchema.parse(params);
      case 'requestEscape':
        return EscapeRequestSchema.parse(params);
      // ... other validations
    }
  }
  
  private validateOutput(tool: string, result: any): any {
    switch (tool) {
      case 'startSession':
        return AgentSessionPayloadSchema.parse(result);
      // ... other output validations
      default:
        return result;
    }
  }
}
```

### Agent Interface Specifications

#### Pathseeker Interface
```typescript
interface PathseekerInput {
  mode: 'initial' | 'refinement';
  originalRequest: string;
  round: number;
  
  // For refinement mode
  escapeRequests?: EscapeRequest[];
  completedTasks?: CompletedTask[];
  previousPlans?: PathseekerTask[][];
  
  // Context
  workingDirectory: string;
  reportNumber: string;
}

interface PathseekerOutput {
  tasks: PathseekerTask[];
  reconciliation: {
    strategy: 'preserve' | 'modify' | 'restart';
    obsoleteTasks?: string[];
    modifiedTasks?: { id: string, changes: Partial<PathseekerTask> }[];
  };
  reasoning: string;
}
```

#### Codeweaver Interface
```typescript
interface CodeweaverInput {
  task: PathseekerTask;
  workingDirectory: string;
  reportNumber: string;
}

interface CodeweaverOutput {
  status: 'complete' | 'escape';
  filesCreated?: string[];
  filesModified?: string[];
  testsImplemented?: string[];
  escape?: {
    reason: string;
    analysis: string;
    partialWork?: string;
    suggestion: string;
  };
}
```

#### Lawbringer Interface
```typescript
interface LawbringerInput {
  taskId: string;
  pass: 1 | 2;  // First pass (review code) or second pass (review edge cases)
  scope: 'codeweaver-output' | 'siegemaster-additions';
  workingDirectory: string;
  reportNumber: string;
}

interface LawbringerOutput {
  status: 'complete' | 'escape';
  changesApplied?: string[];
  reasoning?: string;
  escape?: {
    reason: string;
    analysis: string;
    architecturalConcern: string;
  };
}
```

#### Ward Interface
```typescript
interface WardInput {
  mode: 'single-task' | 'integration';
  files?: string[];  // For single-task mode: specific files to check
  // integration mode uses ward:all (no files specified)
}

interface WardOutput {
  success: boolean;
  errors?: string[];
  testsRun?: number;
  testsPassed?: number;
  lintErrors?: string[];
  typeErrors?: string[];
  command: string;  // Actual ward command executed
}
```

### Pipeline Implementation Details

#### Task Pipeline Executor
```typescript
class TaskPipelineExecutor {
  async executeTask(task: PathseekerTask, state: QuestState): Promise<TaskResult> {
    const stages = [
      { agent: 'codeweaver', wardAfter: true },
      { agent: 'lawbringer', pass: 1, wardAfter: true },
      { agent: 'siegemaster', wardAfter: true },
      { agent: 'lawbringer', pass: 2, wardAfter: true }
    ];
    
    for (const stage of stages) {
      // Update job state
      this.updateJobState(task.id, stage.agent, state);
      
      // Run agent
      const result = await this.runAgent(stage.agent, task, stage);
      
      if (result.escape) {
        return this.recordEscape(task.id, stage.agent, result.escape, state);
      }
      
      // Run ward after agent
      if (stage.wardAfter) {
        const wardResult = await this.runWardCycle(task.id, state);
        if (wardResult.escaped) {
          return wardResult;
        }
      }
    }
    
    return { status: 'complete', taskId: task.id };
  }
  
  private async runWardCycle(taskId: string, state: QuestState): Promise<WardResult> {
    let attempts = 0;
    const MAX_ATTEMPTS = 3;
    
    // Get files modified by this task from agent output
    const taskFiles = this.getTaskFiles(taskId, state);
    
    while (attempts < MAX_ATTEMPTS) {
      const wardResult = await this.runWard({ 
        mode: 'single-task', 
        files: taskFiles 
      });
      
      if (wardResult.success) {
        return { status: 'success' };
      }
      
      attempts++;
      const spiritResult = await this.runSpiritmender({
        taskId,
        errors: wardResult.errors,
        attempt: attempts
      });
      
      if (spiritResult.escape) {
        this.recordEscape(taskId, 'spiritmender', spiritResult.escape, state);
        return { status: 'escaped' };
      }
    }
    
    // Max attempts reached
    this.recordEscape(taskId, 'spiritmender', {
      reason: `Failed to fix ward errors after ${MAX_ATTEMPTS} attempts`
    }, state);
    return { status: 'escaped' };
  }
  
  private getTaskFiles(taskId: string, state: QuestState): string[] {
    const taskState = state.allTasks.get(taskId);
    if (!taskState) return [];
    
    // Return all files this task is supposed to modify
    return [
      ...taskState.task.filesToCreate,
      ...taskState.task.filesToEdit
    ];
  }
  
  private updateJobState(taskId: string, stage: string, state: QuestState): void {
    state.execution.activeJobs.set(taskId, {
      taskId,
      stage: stage as PipelineStage,
      startedAt: new Date()
    });
  }
  
  private recordEscape(
    taskId: string, 
    agentType: string, 
    escape: any, 
    state: QuestState
  ): TaskResult {
    const escapeRequest: EscapeRequest = {
      taskId,
      fromAgent: agentType as any,
      reason: escape.reason,
      analysis: escape.analysis,
      partialWork: escape.partialWork,
      timestamp: new Date(),
      context: escape
    };
    
    state.execution.escapeRequests.push(escapeRequest);
    state.execution.activeJobs.delete(taskId);
    
    return { status: 'escaped', taskId, escape: escapeRequest };
  }
  
  // Abstract methods - need implementation with agent spawner integration
  private async runAgent(agentType: string, task: PathseekerTask, stage: any): Promise<any> {
    // TODO: Integrate with existing agent spawner to create Claude instance
    // Should spawn agent with structured input and wait for structured output
    throw new Error('runAgent method needs implementation');
  }
  
  private async runWard(input: WardInput): Promise<WardOutput> {
    // TODO: Execute ward command based on input mode and files
    // For single-task: ward with file list
    // For integration: ward:all
    throw new Error('runWard method needs implementation');
  }
  
  private async runSpiritmender(input: SpiritmenderInput): Promise<SpiritmenderOutput> {
    // TODO: Spawn Spiritmender agent to fix ward errors
    throw new Error('runSpiritmender method needs implementation');
  }
}
```

### State Management Implementation

#### State Persistence with Redis
```typescript
class QuestStateManager {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }
  
  async saveState(state: QuestState): Promise<void> {
    const key = `quest:${state.id}`;
    const version = state.version || 0;
    
    // IMPORTANT: Only QuestMaestro calls this method
    // Agents NEVER modify quest state directly - they write to their own session keys
    // This Lua script provides atomic quest state updates when QuestMaestro 
    // processes multiple agent completions in a single transaction
    const script = `
      local current = redis.call('GET', KEYS[1])
      if current then
        local currentState = cjson.decode(current)
        if currentState.version ~= tonumber(ARGV[2]) then
          return {err = 'Version conflict'}
        end
      end
      
      local newState = cjson.decode(ARGV[1])
      newState.version = tonumber(ARGV[2]) + 1
      newState.updatedAt = ARGV[3]
      
      redis.call('SET', KEYS[1], cjson.encode(newState))
      redis.call('ZADD', 'quests:by_status:' .. newState.status, newState.updatedAt, KEYS[1])
      redis.call('LPUSH', 'quest:' .. newState.id .. ':events', ARGV[4])
      
      return newState.version
    `;
    
    const eventLog = JSON.stringify({
      type: 'state_updated',
      timestamp: new Date().toISOString(),
      round: state.execution.round
    });
    
    await this.redis.eval(script, 1, key, 
      JSON.stringify(state), 
      version.toString(),
      new Date().toISOString(),
      eventLog
    );
  }
  
  async loadState(questId: string): Promise<QuestState | null> {
    const key = `quest:${questId}`;
    const content = await this.redis.get(key);
    
    if (!content) return null;
    
    const state = JSON.parse(content) as QuestState;
    
    // Reconstruct Maps from serialized objects
    state.allTasks = new Map(Object.entries(state.allTasks as any));
    state.execution.activeJobs = new Map(Object.entries(state.execution.activeJobs as any));
    
    return state;
  }
  
  // CRITICAL ARCHITECTURE: Agent Isolation Pattern
  // - Agents write ONLY to their own session keys: agent:questId:taskId:completion
  // - Agents NEVER modify main quest state directly
  // - QuestMaestro is the ONLY component that updates quest state
  // - This eliminates race conditions and ensures data consistency
  async pollAgentCompletions(questId: string): Promise<AgentCompletion[]> {
    const pattern = `agent:${questId}:*:completion`;
    const keys = await this.redis.keys(pattern);
    const completions = [];
    
    for (const key of keys) {
      const completion = await this.redis.get(key);
      if (completion) {
        completions.push(JSON.parse(completion));
        await this.redis.del(key); // Remove after reading
      }
    }
    
    return completions;
  }
  
  // Event sourcing for debugging
  async getQuestEvents(questId: string): Promise<any[]> {
    const events = await this.redis.lrange(`quest:${questId}:events`, 0, -1);
    return events.map(e => JSON.parse(e));
  }
  
  // Query capabilities
  async getQuestsByStatus(status: QuestStatus): Promise<string[]> {
    return this.redis.zrange(`quests:by_status:${status}`, 0, -1);
  }
  
  async getActiveJobs(): Promise<Array<{questId: string, taskId: string, stage: string}>> {
    const quests = await this.getQuestsByStatus('EXECUTING');
    const activeJobs = [];
    
    for (const questKey of quests) {
      const questId = questKey.replace('quest:', '');
      const state = await this.loadState(questId);
      
      if (state) {
        for (const [taskId, job] of state.execution.activeJobs) {
          activeJobs.push({
            questId,
            taskId,
            stage: job.stage
          });
        }
      }
    }
    
    return activeJobs;
  }
}
```

#### Dependency Resolution
```typescript
class DependencyResolver {
  private allTasks: Map<string, PathseekerTask> = new Map();
  
  getReadyTasks(state: QuestState): PathseekerTask[] {
    // Build task map for dependency calculations
    this.allTasks.clear();
    for (const [taskId, taskState] of state.allTasks) {
      this.allTasks.set(taskId, taskState.task);
    }
    const ready: PathseekerTask[] = [];
    const completedIds = new Set(
      Array.from(state.allTasks.values())
        .filter(t => t.status === 'complete')
        .map(t => t.task.id)
    );
    
    for (const [taskId, taskState] of state.allTasks) {
      if (taskState.status !== 'pending') continue;
      
      // Check dependencies
      const allDepsComplete = taskState.task.dependencies.every(
        depId => completedIds.has(depId)
      );
      
      if (allDepsComplete) {
        ready.push(taskState.task);
      }
    }
    
    // Sort by priority, then by dependency depth
    return ready.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return this.getDependencyDepth(a) - this.getDependencyDepth(b);
    });
  }
  
  private getDependencyDepth(task: PathseekerTask): number {
    // Calculate how deep in dependency chain this task is
    if (task.dependencies.length === 0) return 0;
    return 1 + Math.max(...task.dependencies.map(depId => 
      this.getTaskDepth(depId)
    ));
  }
  
  validateDependencies(tasks: PathseekerTask[]): string[] {
    const errors: string[] = [];
    const taskIds = new Set(tasks.map(t => t.id));
    
    for (const task of tasks) {
      // Check for missing dependencies
      for (const depId of task.dependencies) {
        if (!taskIds.has(depId)) {
          errors.push(`Task ${task.id} depends on non-existent task ${depId}`);
        }
      }
      
      // Check for circular dependencies
      if (this.hasCircularDependency(task, tasks)) {
        errors.push(`Task ${task.id} has circular dependency`);
      }
    }
    
    return errors;
  }
  
  private hasCircularDependency(task: PathseekerTask, allTasks: PathseekerTask[]): boolean {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const taskMap = new Map(allTasks.map(t => [t.id, t]));
    
    const visit = (taskId: string): boolean => {
      if (visiting.has(taskId)) return true; // Cycle detected
      if (visited.has(taskId)) return false;
      
      visiting.add(taskId);
      const currentTask = taskMap.get(taskId);
      
      if (currentTask) {
        for (const depId of currentTask.dependencies) {
          if (visit(depId)) return true;
        }
      }
      
      visiting.delete(taskId);
      visited.add(taskId);
      return false;
    };
    
    return visit(task.id);
  }
  
  private getTaskDepth(taskId: string): number {
    const task = this.allTasks.get(taskId);
    if (!task || task.dependencies.length === 0) return 0;
    
    return 1 + Math.max(...task.dependencies.map(depId => 
      this.getTaskDepth(depId)
    ));
  }
}
```

### Pathseeker Context Building

#### Context Construction
```typescript
class PathseekerContextBuilder {
  buildContext(state: QuestState): PathseekerInput {
    const mode = state.execution.round === 0 ? 'initial' : 'refinement';
    
    if (mode === 'initial') {
      return {
        mode: 'initial',
        originalRequest: state.originalRequest,
        round: 0,
        workingDirectory: process.cwd(),
        reportNumber: '001'
      };
    }
    
    // Refinement mode
    return {
      mode: 'refinement',
      originalRequest: state.originalRequest,
      round: state.execution.round,
      escapeRequests: state.execution.escapeRequests,
      completedTasks: this.getCompletedTasks(state),
      previousPlans: this.getPreviousPlans(state),
      workingDirectory: process.cwd(),
      reportNumber: this.getNextReportNumber(state)
    };
  }
  
  private getCompletedTasks(state: QuestState): CompletedTask[] {
    return Array.from(state.allTasks.values())
      .filter(t => t.status === 'complete')
      .map(t => ({
        id: t.task.id,
        description: t.task.description,
        files: [...t.task.filesToCreate, ...t.task.filesToEdit],
        completedInRound: t.completedInRound!,
        duration: this.calculateDuration(t)
      }));
  }
  
  private getPreviousPlans(state: QuestState): PathseekerTask[][] {
    return state.history.map(h => h.taskPlan);
  }
  
  private calculateDuration(taskState: any): number {
    // Calculate time from creation to completion
    if (!taskState.completedInRound) return 0;
    // This would need timestamps - simplified for now
    return 0; // Placeholder
  }
  
  private getNextReportNumber(state: QuestState): string {
    const nextNum = state.execution.round + 1;
    return nextNum.toString().padStart(3, '0');
  }
}
```

### Error Handling and Recovery

#### Crash Recovery
```typescript
class QuestRecoveryManager {
  async recoverFromCrash(questId: string): Promise<QuestState> {
    const state = await this.stateManager.loadState(questId);
    if (!state) {
      throw new Error(`Cannot recover quest ${questId}: no state found`);
    }
    
    // Check for abandoned jobs
    const now = new Date();
    const timeoutMs = 30 * 60 * 1000; // 30 minutes
    
    for (const [taskId, job] of state.execution.activeJobs) {
      const elapsed = now.getTime() - job.startedAt.getTime();
      
      if (elapsed > timeoutMs) {
        // Job timed out, reset to pending
        const taskState = state.allTasks.get(taskId);
        if (taskState) {
          taskState.status = 'pending';
          taskState.assignedTo = undefined;
        }
        state.execution.activeJobs.delete(taskId);
      }
    }
    
    return state;
  }
  
  async handleAgentTimeout(taskId: string, agentType: string, state: QuestState): Promise<void> {
    // Record timeout as escape
    const escapeRequest: EscapeRequest = {
      taskId,
      fromAgent: agentType,
      reason: `Agent timeout after 30 minutes`,
      timestamp: new Date(),
      context: { type: 'timeout' }
    };
    
    state.execution.escapeRequests.push(escapeRequest);
    state.execution.activeJobs.delete(taskId);
    
    // Reset task to pending
    const taskState = state.allTasks.get(taskId);
    if (taskState) {
      taskState.status = 'pending';
      taskState.assignedTo = undefined;
    }
  }
}
```

### Final Integration Validation

#### Ward:all Implementation
```typescript
class IntegrationValidator {
  async runFinalValidation(state: QuestState): Promise<ValidationResult> {
    // Run comprehensive system check
    const wardResult = await this.runWard({
      mode: 'integration'
      // No files specified - uses ward:all
    });
    
    if (wardResult.success) {
      return { status: 'success' };
    }
    
    // Try Spiritmender for integration issues
    let attempts = 0;
    const MAX_ATTEMPTS = 3;
    
    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      
      const spiritResult = await this.runSpiritmender({
        scope: 'integration',
        errors: wardResult.errors,
        attempt: attempts,
        context: 'final-validation'
      });
      
      if (spiritResult.escape) {
        // Integration failure that can't be auto-fixed
        state.execution.escapeRequests.push({
          taskId: 'INTEGRATION',
          fromAgent: 'spiritmender',
          reason: 'Integration validation failed',
          analysis: spiritResult.escape.analysis,
          timestamp: new Date()
        });
        
        return { status: 'escaped' };
      }
      
      // Try ward again after spiritmender fixes
      const retryResult = await this.runWard({
        mode: 'integration'
      });
      
      if (retryResult.success) {
        return { status: 'success' };
      }
      
      wardResult.errors = retryResult.errors;
    }
    
    // Max attempts reached
    state.execution.escapeRequests.push({
      taskId: 'INTEGRATION',
      fromAgent: 'spiritmender',
      reason: `Integration validation failed after ${MAX_ATTEMPTS} attempts`,
      timestamp: new Date()
    });
    
    return { status: 'escaped' };
  }
  
  // Abstract methods - need implementation
  private async runWard(input: WardInput): Promise<WardOutput> {
    // TODO: Execute ward command (same implementation as TaskPipelineExecutor)
    throw new Error('runWard method needs implementation');
  }
  
  private async runSpiritmender(input: SpiritmenderInput): Promise<SpiritmenderOutput> {
    // TODO: Spawn Spiritmender agent (same implementation as TaskPipelineExecutor)
    throw new Error('runSpiritmender method needs implementation');
  }
}
```

## System Integration Context

### Current System Overview
This is a complete ground-up rebuild replacing the entire V1 quest system. No backward compatibility - surgical rebuild of each component with clean architecture. The current V1 system has stale data issues and complex nested state management that this design eliminates.

### Agent Execution Model
- **Agents are Claude instances**: Each agent spawns as a separate Claude Code session in child terminal
- **MCP Redis Integration**: Agents use MCP tools to access quest data instead of file system
- **Interactive CLI interface**: Like current Claude Code terminal - user can chat back and forth with active agent
- **Single agent view**: User interface shows one agent conversation at a time (current model)
- **Agent switching**: Hotkey listener (e.g., Ctrl+Tab) exits to "select task agent" view, then launches chosen agent's terminal
- **Parallel agent monitoring**: User can switch between multiple running agents using hotkey navigation
- **Supervised execution**: User can provide guidance and nudges within each agent's conversation
- **Structured communication**: All agent input/output validated through Zod schemas via MCP server
- **Escape handling**: When agents escape, user sees notification in current view, no approval needed
- **Graceful waiting**: If user goes offline, agents pause gracefully until user returns to conversation

### Components to Rebuild vs Reuse
- **Rebuild**: Complete new quest orchestration, state management, pipeline execution
- **Reuse**: Agent role definitions from `/v1/commands/quest/` (may need interface updates)
- **Reuse**: Quest folder structure in `/result/active/` (working directory pattern)
- **Reuse**: Ward command integration (npm scripts)
- **Replace**: All core logic, phase runners, quest manager, orchestrator

### Key Integration Points
- **Quest initialization**: Leverage existing CLI flow in `/v1/cli.ts`:
  - `questManager.createNewQuest(input, input)` creates quest folder and metadata
  - System creates initial QuestState in Redis instead of running orchestrator
  - Quest ID/folder structure remains same (`/result/active/001-task-name/`)
- **CLI command flow unchanged**: `questmaestro "task"` → detect/create quest → runQuest()
- **Agent communication**: Agents write their own completion state, QuestMaestro pulls and integrates into quest state  
- **Progress monitoring**: Hotkey interface consumes Redis state to show agent selection menu, individual agent terminals for interaction
- **File conflict prevention**: Pathseeker plans tasks with non-overlapping file sets to avoid simultaneous modification conflicts

### Redis Requirements
- **Version**: Redis 6.0+ for Lua script support and JSON operations
- **Modules**: Consider RedisJSON for cleaner object storage
- **Clustering**: Plan for horizontal scaling if needed
- **Backup**: Quest state is critical - implement backup strategy

### MCP Redis Integration
- **Purpose**: Provide structured data access for agents, eliminate file reading/writing
- **MCP Server**: Exposes Redis operations as MCP tools for Claude agents
- **Payload Validation**: All agent inputs/outputs validated with Zod schemas before Redis operations
- **Agent Communication**: Agents write completion state to Redis, QuestMaestro polls for updates
- **Data Integrity**: Enforces correct structure through validation, prevents malformed data
- **Recovery Logic**: If agent doesn't write completion state, QuestMaestro spawns Pathseeker to determine work status

### Ward Command Integration
Ward is an npm script installed by this CLI package:
- **ward <files>**: Runs TypeScript compilation, linting, and tests for specific files
- **ward:all**: System-wide lint/TypeScript/test checks across entire codebase (backend + frontend)
- **File tracking**: Each agent's work is tracked so ward knows which files to validate
- **Task-specific validation**: `ward` called with files modified during that agent's work
- **Integration validation**: `ward:all` called after all tasks complete for full system check

## Implementation Strategy

### Phase 1: Data Layer Foundation (Zod & MCP First)
1. Implement Zod validation schemas for all agent communications (PathseekerTask, CodeweaverOutput, EscapeRequest, etc.)
2. Create MCP Redis server with validated tool interfaces for agents
3. Implement QuestState types and interfaces exactly as specified above
4. Create QuestStateManager with atomic Redis operations and distributed locking
5. Build DependencyResolver with cycle detection

### Phase 2: Pipeline Execution
1. Implement basic TaskPipelineExecutor with MCP agent communication
2. Build ward integration with spiritmender retry logic
3. Create IntegrationValidator for final validation
4. Implement PathseekerContextBuilder for proper context construction

### Phase 3: Orchestration & Control
1. Build quest orchestrator with state machine implementation
2. Implement agent spawning with MCP server integration
3. Create hotkey interface for agent switching
4. Add timeout handling and crash recovery

### Phase 4: Testing and Deployment
1. Test MCP server with single agent communication
2. Test parallel execution with independent tasks
3. Test escape and recovery scenarios
4. Complete replacement of V1 system (no migration needed)

## Success Metrics

1. **Reliability**: Zero stale data corruption issues
2. **Performance**: 3x faster execution via parallelism
3. **Maintainability**: Single file to understand quest flow
4. **Debuggability**: Clear history of all state transitions
5. **Quality**: No regressions in code quality gates

## Risks and Mitigations

### Risk: Resource Contention
- **Mitigation**: Configurable limits, priority ordering

### Risk: Complex Dependencies  
- **Mitigation**: Pathseeker validates dependency graphs

### Risk: Integration Failures
- **Mitigation**: ward:all catches system-level issues

### Risk: Escape Loops
- **Mitigation**: History tracking, round limits if needed

### Risk: Migration Complexity
- **Mitigation**: Parallel deployment, gradual feature migration