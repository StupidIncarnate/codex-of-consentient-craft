# CLI.ts Refactoring Plan

## Current Problems
1. Single 975-line file handling too many responsibilities
2. Repetitive phase runner functions with similar patterns
3. Mixed concerns (CLI, orchestration, validation, error handling)
4. Complex Spiritmender/Ward validation logic embedded in main flow
5. Inconsistent phase completion logic

## Alignment with Project Standards
After reviewing the project's testing standards and existing test patterns, this refactoring will follow:
- **DAMP principle** for tests - readable, self-contained test cases
- **Behavior-focused testing** - test what the code does, not how
- **Test isolation** - no shared state between tests
- **Strict assertions** - use `toStrictEqual` for objects to prevent property bleedthrough
- **Co-located tests** - unit tests next to source files

## Proposed Structure

### 1. Extract Phase Management
**File: `src/core/phase-runner.ts`**
```typescript
interface PhaseRunner {
  canRun(quest: Quest): boolean;
  run(quest: Quest, agentSpawner: AgentSpawner): Promise<void>;
  getAgentType(): string;
  getPhaseType(): PhaseType;
}

abstract class BasePhaseRunner implements PhaseRunner {
  constructor(
    protected questManager: QuestManager,
    protected fileSystem: FileSystem,
    protected logger: Logger = new Logger()
  ) {}
  
  abstract getAgentType(): string;
  abstract getPhaseType(): PhaseType;
  abstract processAgentReport(quest: Quest, report: AgentReport): Promise<void>;
  abstract getAdditionalContext(quest: Quest): Record<string, any>;
  
  async run(quest: Quest, agentSpawner: AgentSpawner): Promise<void> {
    // Mark phase as in_progress
    quest.phases[this.getPhaseType()].status = 'in_progress';
    await this.questManager.saveQuest(quest);
    
    // Spawn agent
    const report = await agentSpawner.spawnAndWait(this.getAgentType(), {
      questFolder: quest.folder,
      reportNumber: this.questManager.getNextReportNumber(quest.folder),
      workingDirectory: process.cwd(),
      additionalContext: this.getAdditionalContext(quest)
    });
    
    // Handle escape hatch
    if (report.escape) {
      throw new EscapeHatchError(report.escape);
    }
    
    // Process report
    await this.processAgentReport(quest, report);
    
    // Mark phase complete
    quest.phases[this.getPhaseType()].status = 'complete';
    await this.questManager.saveQuest(quest);
  }
  
  canRun(quest: Quest): boolean {
    return quest.phases[this.getPhaseType()].status === 'pending';
  }
}

// Specific runners extend BasePhaseRunner
class DiscoveryPhaseRunner extends BasePhaseRunner { }
class ImplementationPhaseRunner extends BasePhaseRunner { }
class TestingPhaseRunner extends BasePhaseRunner { }
class ReviewPhaseRunner extends BasePhaseRunner { }
```

### 2. Extract Ward/Spiritmender Logic
**File: `src/core/ward-validator.ts`**
```typescript
class WardValidator {
  async validate(): Promise<ValidationResult>;
  async handleFailure(quest: Quest, errors: string): Promise<void>;
  private runSpiritmender(attempt: number): Promise<void>;
  private getAttemptStrategy(attempt: number): string;
}
```

### 3. Simplify Quest Orchestrator
**File: `src/core/quest-orchestrator.ts`**
```typescript
class QuestOrchestrator {
  private phaseRunners: Map<PhaseType, PhaseRunner>;
  
  async runQuest(quest: Quest): Promise<void> {
    while (!this.isComplete(quest)) {
      const phase = this.getCurrentPhase(quest);
      const runner = this.phaseRunners.get(phase);
      
      if (runner && runner.canRun(quest)) {
        await runner.run(quest, this.agentSpawner);
      }
      
      quest = await this.reloadQuest(quest);
    }
    
    await this.completeQuest(quest);
  }
}
```

### 4. Clean CLI Entry Point
**File: `src/cli.ts` (simplified)**
```typescript
// Just CLI parsing and command routing
async function main() {
  const command = parseCommand(process.argv);
  const handler = getCommandHandler(command);
  await handler.execute(command.args);
}

// Command handlers delegate to appropriate services
class QuestCommandHandler {
  async execute(args: string[]): Promise<void> {
    const orchestrator = new QuestOrchestrator();
    await orchestrator.runQuest(quest);
  }
}
```

### 5. Extract Constants and Config
**File: `src/config/constants.ts`**
```typescript
export const MAX_SPIRITMENDER_ATTEMPTS = 3;
export const PHASE_ORDER: PhaseType[] = ['discovery', 'implementation', 'testing', 'review'];
export const DEFAULT_TEST_FRAMEWORK = 'jest';
```

## Benefits
1. **Separation of Concerns** - Each module has a single responsibility
2. **Reusability** - Phase runner pattern eliminates duplication
3. **Testability** - Smaller, focused modules are easier to test
4. **Maintainability** - Changes to phase logic don't affect CLI parsing
5. **Extensibility** - Easy to add new phases or modify existing ones

## Testability Details

### 1. Phase Runners - Highly Testable (Following Project Standards)
```typescript
// File: src/core/phase-runner.test.ts (co-located with source)
import { QuestStub } from '../../tests/stubs/quest.stub';
import { AgentReportStub } from '../../tests/stubs/agent-report.stub';

describe('DiscoveryPhaseRunner', () => {
  let runner: DiscoveryPhaseRunner;
  let mockAgentSpawner: jest.Mocked<AgentSpawner>;
  let mockQuestManager: jest.Mocked<QuestManager>;
  
  beforeEach(() => {
    mockAgentSpawner = createMockAgentSpawner();
    mockQuestManager = createMockQuestManager();
    runner = new DiscoveryPhaseRunner(mockQuestManager);
  });
  
  describe('run()', () => {
    describe('when quest has no existing tasks', () => {
      describe('when phase is pending', () => {
        it('marks phase as in_progress', async () => {
          const quest = QuestStub({ 
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            phases: {
              discovery: { status: 'pending' },
              implementation: { status: 'pending' },
              testing: { status: 'pending' },
              review: { status: 'pending' }
            }
          });
          
          await runner.run(quest, mockAgentSpawner);
          
          expect(quest.phases.discovery.status).toBe('in_progress');
        });
        
        it('saves quest after marking phase', async () => {
          const quest = QuestStub({ 
            phases: { 
              discovery: { status: 'pending' },
              implementation: { status: 'pending' },
              testing: { status: 'pending' },
              review: { status: 'pending' }
            } 
          });
          
          await runner.run(quest, mockAgentSpawner);
          
          expect(mockQuestManager.saveQuest).toHaveBeenCalledWith(quest);
        });
      });
      
      describe('when pathseeker completes', () => {
        describe('when report contains tasks', () => {
          it('adds all tasks to quest', async () => {
            const quest = QuestStub({ folder: '001-test-quest' });
            const mockReport = AgentReportStub({
              agentType: 'pathseeker',
              status: 'complete',
              report: {
                tasks: [
                  { id: 'task-1', name: 'Create auth service' },
                  { id: 'task-2', name: 'Add JWT validation' }
                ]
              }
            });
            mockAgentSpawner.spawnAndWait.mockResolvedValue(mockReport);
            
            await runner.run(quest, mockAgentSpawner);
            
            expect(mockQuestManager.addTasks).toHaveBeenCalledWith(
              '001-test-quest', 
              [
                { id: 'task-1', name: 'Create auth service' },
                { id: 'task-2', name: 'Add JWT validation' }
              ]
            );
          });
          
          it('marks phase as complete', async () => {
            const quest = QuestStub();
            const mockReport = AgentReportStub({ report: { tasks: [] } });
            mockAgentSpawner.spawnAndWait.mockResolvedValue(mockReport);
            
            await runner.run(quest, mockAgentSpawner);
            
            expect(quest.phases.discovery.status).toBe('complete');
          });
        });
        
        describe('when report contains no tasks', () => {
          it('marks phase as complete without adding tasks', async () => {
            const quest = QuestStub();
            const mockReport = AgentReportStub({ report: {} });
            mockAgentSpawner.spawnAndWait.mockResolvedValue(mockReport);
            
            await runner.run(quest, mockAgentSpawner);
            
            expect(mockQuestManager.addTasks).not.toHaveBeenCalled();
            expect(quest.phases.discovery.status).toBe('complete');
          });
        });
      });
      
      describe('when pathseeker triggers escape hatch', () => {
        it('throws EscapeHatchError', async () => {
          const quest = QuestStub();
          const mockReport = AgentReportStub({
            status: 'blocked',
            escape: {
              reason: 'task_too_complex',
              analysis: 'Quest requires domain expertise beyond current capabilities',
              recommendation: 'Break down into smaller technical tasks'
            }
          });
          mockAgentSpawner.spawnAndWait.mockResolvedValue(mockReport);
          
          await expect(runner.run(quest, mockAgentSpawner))
            .rejects.toThrow(EscapeHatchError);
        });
      });
    });
  });
});
```

### 2. WardValidator - Isolated Testing
```typescript
// File: src/core/ward-validator.test.ts
describe('WardValidator', () => {
  let validator: WardValidator;
  let mockFileSystem: jest.Mocked<FileSystem>;
  let mockExecSync: jest.SpyInstance;
  
  beforeEach(() => {
    mockFileSystem = createMockFileSystem();
    validator = new WardValidator(mockFileSystem);
    mockExecSync = jest.spyOn(child_process, 'execSync');
  });
  
  describe('validate()', () => {
    describe('when ward command succeeds', () => {
      it('returns success', async () => {
        mockExecSync.mockReturnValue('');
        
        const result = await validator.validate();
        
        expect(result).toStrictEqual({ success: true });
      });
      
      it('executes npm run ward:all', async () => {
        mockExecSync.mockReturnValue('');
        
        await validator.validate();
        
        expect(mockExecSync).toHaveBeenCalledWith('npm run ward:all', { stdio: 'pipe' });
      });
    });
    
    describe('when ward command fails', () => {
      it('returns failure with error message', async () => {
        mockExecSync.mockImplementation(() => { 
          throw new Error('Lint errors found'); 
        });
        
        const result = await validator.validate();
        
        expect(result).toStrictEqual({ 
          success: false, 
          error: 'Lint errors found' 
        });
      });
    });
  });
  
  describe('handleFailure()', () => {
    describe('when no previous attempts exist', () => {
      it('spawns spiritmender with attempt 1 strategy', async () => {
        const quest = QuestStub({ 
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          spiritmenderAttempts: {}
        });
        const mockSpawner = createMockAgentSpawner();
        
        await validator.handleFailure(quest, 'error details', mockSpawner);
        
        expect(mockSpawner.spawnAndWait).toHaveBeenCalledWith('spiritmender', {
          questFolder: quest.folder,
          reportNumber: expect.any(Number),
          workingDirectory: process.cwd(),
          additionalContext: {
            errors: 'error details',
            attemptNumber: 1,
            previousErrors: [],
            attemptStrategy: 'basic_fixes: Focus on imports, syntax errors, and basic type issues',
            taskId: 'global'
          }
        });
      });
      
      it('saves ward errors to file', async () => {
        const quest = QuestStub({ folder: '001-test-quest' });
        const mockSpawner = createMockAgentSpawner();
        
        await validator.handleFailure(quest, 'error details', mockSpawner);
        
        expect(mockFileSystem.appendFile).toHaveBeenCalledWith(
          'questmaestro/active/001-test-quest/ward-errors-unresolved.txt',
          expect.stringContaining('[attempt-1] [task-global] error details')
        );
      });
    });
    
    describe('when 2 previous attempts exist', () => {
      it('blocks quest after 3rd failure', async () => {
        const quest = QuestStub({ 
          spiritmenderAttempts: { 'global': 2 }
        });
        mockExecSync.mockImplementation(() => { 
          throw new Error('Ward still failing'); 
        });
        
        await expect(validator.handleFailure(quest, 'error', createMockAgentSpawner()))
          .rejects.toThrow('Quest blocked: Max Spiritmender attempts reached');
        
        expect(quest.status).toBe('blocked');
      });
    });
  });
});
```

### 3. QuestOrchestrator - Integration Testing
```typescript
// File: src/core/quest-orchestrator.test.ts
describe('QuestOrchestrator', () => {
  let orchestrator: QuestOrchestrator;
  let mockPhaseRunners: Map<PhaseType, jest.Mocked<PhaseRunner>>;
  
  beforeEach(() => {
    mockPhaseRunners = new Map([
      ['discovery', createMockPhaseRunner('discovery')],
      ['implementation', createMockPhaseRunner('implementation')],
      ['testing', createMockPhaseRunner('testing')],
      ['review', createMockPhaseRunner('review')]
    ]);
    
    orchestrator = new QuestOrchestrator(mockPhaseRunners);
  });
  
  describe('runQuest()', () => {
    describe('when all phases complete successfully', () => {
      it('runs phases in correct order', async () => {
        const quest = QuestStub();
        const runOrder: string[] = [];
        
        mockPhaseRunners.forEach((runner, phase) => {
          runner.run.mockImplementation(async () => {
            runOrder.push(phase);
            quest.phases[phase].status = 'complete';
          });
        });
        
        await orchestrator.runQuest(quest);
        
        expect(runOrder).toStrictEqual(['discovery', 'implementation', 'testing', 'review']);
      });
      
      it('completes quest after all phases', async () => {
        const quest = QuestStub();
        jest.spyOn(orchestrator, 'completeQuest');
        
        // Mark all phases complete
        mockPhaseRunners.forEach((runner, phase) => {
          runner.run.mockImplementation(async () => {
            quest.phases[phase].status = 'complete';
          });
        });
        
        await orchestrator.runQuest(quest);
        
        expect(orchestrator.completeQuest).toHaveBeenCalledWith(quest);
      });
    });
    
    describe('when phase triggers escape hatch', () => {
      it('re-runs discovery phase for task decomposition', async () => {
        const quest = QuestStub();
        const escapeError = new EscapeHatchError({
          reason: 'task_too_complex',
          analysis: 'Implementation requires breaking down',
          recommendation: 'Split into smaller tasks'
        });
        
        let callCount = 0;
        mockPhaseRunners.get('implementation')!.run.mockImplementation(async () => {
          if (callCount++ === 0) {
            throw escapeError;
          }
          quest.phases.implementation.status = 'complete';
        });
        
        await orchestrator.runQuest(quest);
        
        expect(mockPhaseRunners.get('discovery')!.run).toHaveBeenCalledTimes(2);
      });
    });
    
    describe('when quest has no tasks after discovery', () => {
      it('skips implementation and testing phases', async () => {
        const quest = QuestStub({ tasks: [] });
        
        await orchestrator.runQuest(quest);
        
        expect(mockPhaseRunners.get('implementation')!.run).not.toHaveBeenCalled();
        expect(mockPhaseRunners.get('testing')!.run).not.toHaveBeenCalled();
      });
    });
  });
});
```

### 4. Dependency Injection for Testing
```typescript
// Make components testable through constructor injection
class BasePhaseRunner {
  constructor(
    protected questManager: QuestManager,
    protected fileSystem: FileSystem,
    protected logger: Logger = new Logger()
  ) {}
  
  // Now we can inject mocks for testing
}

class WardValidator {
  constructor(
    private fileSystem: FileSystem,
    private execCommand: (cmd: string) => string = execSync,
    private logger: Logger = new Logger()
  ) {}
  
  // Exec command is now mockable
}
```

### 5. Test Stubs Following Project Standards
```typescript
// tests/stubs/quest.stub.ts
import type { Quest } from '../../src/models/quest';

export const QuestStub = (overrides: Partial<Quest> = {}): Quest => ({
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  folder: '001-test-quest',
  title: 'Test Quest',
  status: 'in_progress',
  createdAt: '2023-01-01T00:00:00.000Z',
  userRequest: 'Add authentication to the app',
  phases: {
    discovery: { status: 'pending' },
    implementation: { status: 'pending' },
    testing: { status: 'pending' },
    review: { status: 'pending' }
  },
  tasks: [],
  executionLog: [],
  ...overrides
});

// tests/stubs/agent-report.stub.ts
import type { AgentReport } from '../../src/models/agent';

export const AgentReportStub = (overrides: Partial<AgentReport> = {}): AgentReport => ({
  status: 'complete',
  agentType: 'pathseeker',
  report: {},
  ...overrides
});

// Usage in tests follows DAMP principle
it('marks quest as blocked when spiritmender fails 3 times', async () => {
  const quest = QuestStub({ 
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    spiritmenderAttempts: { 'global': 2 }
  });
  
  mockExecSync.mockImplementation(() => { 
    throw new Error('Ward validation failed'); 
  });
  
  await validator.handleFailure(quest, 'error details', mockSpawner);
  
  expect(quest.status).toBe('blocked');
  expect(questManager.saveQuest).toHaveBeenCalledWith(quest);
});
```

### Test Coverage Goals
- **Unit Tests**: 100% branch coverage for individual components
- **Integration Tests**: Cover main flows (quest creation, phase transitions, error recovery)
- **Edge Cases**: Escape hatches, ward failures, missing dependencies
- **Error Scenarios**: Network failures, file system errors, agent crashes

## Migration Strategy (Following STUB-TESTS → CODE Workflow)
1. **Phase 1: Extract Phase Runners**
   - Write empty test cases for BasePhaseRunner behavior
   - Implement BasePhaseRunner and specific runners
   - Fill in test assertions
   - Refactor cli.ts to use new runners

2. **Phase 2: Extract Ward Validator**
   - Write empty test cases for WardValidator behavior
   - Extract ward/spiritmender logic into WardValidator
   - Fill in test assertions
   - Update cli.ts to use WardValidator

3. **Phase 3: Create Quest Orchestrator**
   - Write empty test cases for orchestration flow
   - Implement QuestOrchestrator
   - Fill in test assertions
   - Replace main loop in cli.ts

4. **Phase 4: Simplify CLI**
   - Write tests for command parsing
   - Extract business logic to appropriate modules
   - Keep only CLI concerns in cli.ts

## Estimated Impact
- Reduce cli.ts from 975 lines to ~200 lines
- Eliminate ~300 lines of duplicate phase runner code
- Improve testability with focused modules
- Make phase logic reusable across different contexts
- Enable 90%+ test coverage with fast, isolated tests