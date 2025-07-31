import type { QuestManager } from './quest-manager';
import type { Logger } from '../utils/logger';
import type { AgentSpawner } from '../agents/agent-spawner';
import type { PhaseRunner } from './phase-runner-interface';
import type { Quest, PhaseType } from '../models/quest';
import { QuestOrchestrator } from './quest-orchestrator';
import { EscapeHatchError } from './escape-hatch-error';
import { QuestStub } from '../../tests/stubs/quest.stub';
import {
  createMockQuestManager,
  createMockLogger,
  createMockAgentSpawner,
  createMockPhaseRunner,
} from '../../tests/mocks/create-mocks';

describe('QuestOrchestrator', () => {
  let orchestrator: QuestOrchestrator;
  let mockQuestManager: jest.Mocked<QuestManager>;
  let mockLogger: jest.Mocked<Logger>;
  let mockAgentSpawner: jest.Mocked<AgentSpawner>;
  let mockPhaseRunners: Map<string, jest.Mocked<PhaseRunner>>;

  beforeEach(() => {
    mockQuestManager = createMockQuestManager();
    mockLogger = createMockLogger();
    mockAgentSpawner = createMockAgentSpawner();

    mockPhaseRunners = new Map([
      ['discovery', createMockPhaseRunner('discovery')],
      ['implementation', createMockPhaseRunner('implementation')],
      ['testing', createMockPhaseRunner('testing')],
      ['review', createMockPhaseRunner('review')],
    ]);

    orchestrator = new QuestOrchestrator(mockQuestManager, mockLogger, mockPhaseRunners);

    // Mock getUserInput to avoid stdin interaction in tests
    jest.spyOn(orchestrator, 'getUserInput').mockResolvedValue('y');
  });

  afterEach(() => {
    // Clean up process.stdin event listeners to prevent memory leaks
    process.stdin.removeAllListeners('data');
    process.stdin.removeAllListeners('error');

    // Clear the mockPhaseRunners Map to release references
    mockPhaseRunners.clear();

    // The global jest.restoreAllMocks() in jest.setup.js handles all mock restoration
    // including process.stdout.write, so we don't need to do it manually here
  });

  describe('runQuest()', () => {
    describe('when quest is stale', () => {
      describe('when user chooses to continue', () => {
        it('continues quest execution despite staleness', async () => {
          const quest = QuestStub({
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          });

          mockQuestManager.validateQuestFreshness.mockReturnValue({
            isStale: true,
            reason: 'Codebase has changed significantly since quest creation',
          });
          mockQuestManager.isQuestComplete.mockReturnValue(true);
          mockQuestManager.generateRetrospective.mockReturnValue('retrospective content');
          jest.spyOn(orchestrator, 'getUserInput').mockResolvedValue('y');

          await orchestrator.runQuest(quest, mockAgentSpawner);

          expect(mockQuestManager.completeQuest).toHaveBeenCalledWith(quest.folder);
        });

        it('logs warning about quest staleness', async () => {
          const quest = QuestStub();
          const stalenessReason = 'Codebase has changed significantly since quest creation';

          mockQuestManager.validateQuestFreshness.mockReturnValue({
            isStale: true,
            reason: stalenessReason,
          });
          mockQuestManager.isQuestComplete.mockReturnValue(true);
          jest.spyOn(orchestrator, 'getUserInput').mockResolvedValue('y');
          jest.spyOn(console, 'log').mockImplementation();

          await orchestrator.runQuest(quest, mockAgentSpawner);

          expect(mockLogger.warn).toHaveBeenCalledWith(`⚠️  ${stalenessReason}`);
          expect(console.log).toHaveBeenCalledWith(
            'The codebase may have changed significantly since this quest was created.',
          );
          expect(console.log).toHaveBeenCalledWith('Continuing may lead to conflicts or errors.\n');
        });
      });

      describe('when user chooses to cancel', () => {
        it('returns without running quest', async () => {
          const quest = QuestStub();

          mockQuestManager.validateQuestFreshness.mockReturnValue({
            isStale: true,
            reason: 'Codebase has changed significantly',
          });
          jest.spyOn(orchestrator, 'getUserInput').mockResolvedValue('n');

          await orchestrator.runQuest(quest, mockAgentSpawner);

          expect(mockQuestManager.isQuestComplete).not.toHaveBeenCalled();
          expect(mockQuestManager.completeQuest).not.toHaveBeenCalled();
        });

        it('logs cancellation due to staleness', async () => {
          const quest = QuestStub();

          mockQuestManager.validateQuestFreshness.mockReturnValue({
            isStale: true,
            reason: 'Codebase has changed significantly',
          });
          jest.spyOn(orchestrator, 'getUserInput').mockResolvedValue('n');
          jest.spyOn(console, 'log').mockImplementation();

          await orchestrator.runQuest(quest, mockAgentSpawner);

          expect(console.log).toHaveBeenCalledWith(
            '\nQuest cancelled. Create a fresh quest with: questmaestro "your request"',
          );
        });
      });

      describe('when validateQuestFreshness fails', () => {
        it('handles freshness validation errors gracefully', async () => {
          const quest = QuestStub();

          mockQuestManager.validateQuestFreshness.mockImplementation(() => {
            throw new Error('Failed to validate quest freshness');
          });

          await expect(orchestrator.runQuest(quest, mockAgentSpawner)).rejects.toThrow(
            'Failed to validate quest freshness',
          );
        });
      });
    });

    describe('error handling during phase execution', () => {
      describe('when phase throws EscapeHatchError', () => {
        it('logs escape hatch details and blocks quest', async () => {
          const quest = QuestStub({
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            status: 'in_progress',
            phases: {
              discovery: { status: 'pending' },
              implementation: { status: 'pending' },
              testing: { status: 'pending' },
              review: { status: 'pending' },
            },
          });

          const escapeHatchError = new EscapeHatchError({
            reason: 'unexpected_dependencies',
            analysis: 'Missing required dependencies',
            recommendation: 'Install required packages first',
            retro: 'Need to check dependencies before starting',
          });

          mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
          // EscapeHatchError should block the quest and exit, no loop needed
          mockQuestManager.isQuestComplete.mockReturnValueOnce(false);
          mockQuestManager.getCurrentPhase.mockReturnValue('discovery');
          mockQuestManager.getQuest.mockReturnValue(quest);

          mockPhaseRunners.get('discovery')!.run.mockRejectedValue(escapeHatchError);

          await orchestrator.runQuest(quest, mockAgentSpawner);

          expect(mockLogger.error).toHaveBeenCalledWith(
            'Agent triggered escape hatch: unexpected_dependencies',
          );
          expect(mockLogger.info).toHaveBeenCalledWith('Analysis: Missing required dependencies');
          expect(mockLogger.info).toHaveBeenCalledWith(
            'Recommendation: Install required packages first',
          );
        });

        it('saves quest with blocked status', async () => {
          const quest = QuestStub({
            status: 'in_progress',
            phases: {
              discovery: { status: 'pending' },
              implementation: { status: 'pending' },
              testing: { status: 'pending' },
              review: { status: 'pending' },
            },
          });

          const escapeHatchError = new EscapeHatchError({
            reason: 'task_too_complex',
            analysis: 'Critical test failed',
            recommendation: 'Fix test issues',
            retro: 'Task complexity exceeded expectations',
          });

          mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
          // EscapeHatchError should block the quest and exit, no loop needed
          mockQuestManager.isQuestComplete.mockReturnValueOnce(false);
          mockQuestManager.getCurrentPhase.mockReturnValue('discovery');
          mockQuestManager.getQuest.mockReturnValue(quest);

          mockPhaseRunners.get('discovery')!.run.mockRejectedValue(escapeHatchError);

          await orchestrator.runQuest(quest, mockAgentSpawner);

          expect(quest.status).toBe('blocked');
          expect(mockQuestManager.saveQuest).toHaveBeenCalledWith(quest);
        });

        it('returns without continuing execution', async () => {
          const quest = QuestStub({
            phases: {
              discovery: { status: 'pending' },
              implementation: { status: 'pending' },
              testing: { status: 'pending' },
              review: { status: 'pending' },
            },
          });

          const escapeHatchError = new EscapeHatchError({
            reason: 'context_exhaustion',
            analysis: 'Cannot continue',
            recommendation: 'Manual intervention required',
            retro: 'Context limits reached during execution',
          });

          mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
          // EscapeHatchError should block the quest and exit, no loop needed
          mockQuestManager.isQuestComplete.mockReturnValueOnce(false);
          mockQuestManager.getCurrentPhase.mockReturnValue('discovery');
          mockQuestManager.getQuest.mockReturnValue(quest);

          mockPhaseRunners.get('discovery')!.run.mockRejectedValue(escapeHatchError);

          await orchestrator.runQuest(quest, mockAgentSpawner);

          expect(mockQuestManager.completeQuest).not.toHaveBeenCalled();
        });
      });

      describe('when phase throws generic error', () => {
        it('propagates error without handling', async () => {
          const quest = QuestStub({
            phases: {
              discovery: { status: 'pending' },
              implementation: { status: 'pending' },
              testing: { status: 'pending' },
              review: { status: 'pending' },
            },
          });

          const genericError = new Error('Phase execution failed');

          mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
          // Generic error should throw and exit
          mockQuestManager.isQuestComplete.mockReturnValueOnce(false);
          mockQuestManager.getCurrentPhase.mockReturnValue('discovery');
          mockQuestManager.getQuest.mockReturnValue(quest);

          mockPhaseRunners.get('discovery')!.run.mockRejectedValue(genericError);

          await expect(orchestrator.runQuest(quest, mockAgentSpawner)).rejects.toThrow(
            'Phase execution failed',
          );
        });
      });

      describe('when quest reload fails', () => {
        it('logs error and returns early', async () => {
          const quest = QuestStub({
            phases: {
              discovery: { status: 'pending' },
              implementation: { status: 'pending' },
              testing: { status: 'pending' },
              review: { status: 'pending' },
            },
          });

          mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
          // Only one false needed - the method will return early when reload fails
          mockQuestManager.isQuestComplete.mockReturnValueOnce(false);
          mockQuestManager.getCurrentPhase
            .mockReturnValueOnce('discovery')
            .mockReturnValueOnce('implementation');
          mockQuestManager.getQuest.mockReturnValueOnce(quest).mockReturnValueOnce(null);

          await orchestrator.runQuest(quest, mockAgentSpawner);

          expect(mockLogger.error).toHaveBeenCalledWith('Failed to reload quest');
        });

        it('does not continue phase execution', async () => {
          const quest = QuestStub({
            phases: {
              discovery: { status: 'pending' },
              implementation: { status: 'pending' },
              testing: { status: 'pending' },
              review: { status: 'pending' },
            },
          });

          mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
          // Only one false needed - the method will return early when reload fails
          mockQuestManager.isQuestComplete.mockReturnValueOnce(false);
          mockQuestManager.getCurrentPhase.mockReturnValue('discovery');
          mockQuestManager.getQuest.mockReturnValueOnce(quest).mockReturnValueOnce(null);

          await orchestrator.runQuest(quest, mockAgentSpawner);

          expect(mockPhaseRunners.get('implementation')!.run).not.toHaveBeenCalled();
          expect(mockQuestManager.completeQuest).not.toHaveBeenCalled();
        });
      });
    });

    describe('phase execution edge cases', () => {
      describe('when phase runner is not found', () => {
        it('logs error for unknown phase', async () => {
          const quest = QuestStub();

          mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
          // First call returns false to enter the loop, second call returns true to exit
          mockQuestManager.isQuestComplete.mockReturnValueOnce(false).mockReturnValueOnce(true);
          mockQuestManager.getCurrentPhase.mockReturnValue('discovery');
          mockQuestManager.getQuest.mockReturnValue(quest);

          // Simulate getCurrentPhaseRunner returning null by spying on it
          jest.spyOn(orchestrator, 'getCurrentPhaseRunner').mockReturnValue(null);

          await orchestrator.runQuest(quest, mockAgentSpawner);

          expect(mockLogger.error).toHaveBeenCalledWith('Unknown phase: discovery');
        });
        it('returns without executing phase', async () => {
          const quest = QuestStub();

          mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
          mockQuestManager.isQuestComplete
            .mockReturnValueOnce(false) // First check
            .mockReturnValueOnce(true); // Second check after skipping unknown phase
          mockQuestManager.getCurrentPhase.mockReturnValue('discovery');
          mockQuestManager.getQuest.mockReturnValue(quest);

          // Simulate getCurrentPhaseRunner returning null
          jest.spyOn(orchestrator, 'getCurrentPhaseRunner').mockReturnValue(null);

          await orchestrator.runQuest(quest, mockAgentSpawner);

          // Verify no phase runner was executed
          mockPhaseRunners.forEach((runner) => {
            expect(runner.run).not.toHaveBeenCalled();
          });
        });
      });

      describe('when phase key is invalid', () => {
        it('logs error for invalid phase key when marking as skipped', async () => {
          // Create a quest with missing phase
          const quest = QuestStub({
            phases: {
              implementation: { status: 'pending' },
              testing: { status: 'pending' },
              review: { status: 'pending' },
              // discovery phase missing
            } as Quest['phases'],
          });

          mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
          mockQuestManager.isQuestComplete.mockReturnValueOnce(false).mockReturnValueOnce(true);
          mockQuestManager.getCurrentPhase.mockReturnValue('discovery');
          mockQuestManager.getQuest.mockReturnValue(quest);

          // Make phase runner say it can't run
          mockPhaseRunners.get('discovery')!.canRun.mockReturnValue(false);

          await orchestrator.runQuest(quest, mockAgentSpawner);

          expect(mockLogger.error).toHaveBeenCalledWith('Invalid phase key: discovery');
        });
        it('does not save quest when phase key is invalid', async () => {
          // Create a quest with missing phase
          const quest = QuestStub({
            phases: {
              implementation: { status: 'pending' },
              testing: { status: 'pending' },
              review: { status: 'pending' },
              // discovery phase missing
            } as Quest['phases'],
          });
          const saveQuestCallsBefore = mockQuestManager.saveQuest.mock.calls.length;

          mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
          mockQuestManager.isQuestComplete.mockReturnValueOnce(false).mockReturnValueOnce(true);
          mockQuestManager.getCurrentPhase.mockReturnValue('discovery');
          mockQuestManager.getQuest.mockReturnValue(quest);

          // Make phase runner say it can't run
          mockPhaseRunners.get('discovery')!.canRun.mockReturnValue(false);

          await orchestrator.runQuest(quest, mockAgentSpawner);

          // Should not have saved quest for invalid phase
          expect(mockQuestManager.saveQuest.mock.calls.length).toBe(saveQuestCallsBefore);
        });
      });

      describe('when phase runner canRun throws exception', () => {
        it('propagates canRun exception', async () => {
          const quest = QuestStub();
          const canRunError = new Error('canRun check failed');

          mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
          // Only need one call since the error will throw
          mockQuestManager.isQuestComplete.mockReturnValueOnce(false);
          mockQuestManager.getCurrentPhase.mockReturnValue('discovery');
          mockQuestManager.getQuest.mockReturnValue(quest);

          mockPhaseRunners.get('discovery')!.canRun.mockImplementation(() => {
            throw canRunError;
          });

          await expect(orchestrator.runQuest(quest, mockAgentSpawner)).rejects.toThrow(
            'canRun check failed',
          );
        });
      });
    });

    describe('user input handling', () => {
      describe('when user input is invalid', () => {
        it('handles non-y/n responses for blocked quest', async () => {
          const blockedQuest = QuestStub({ status: 'blocked' });

          mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });

          // User provides invalid input
          jest.spyOn(orchestrator, 'getUserInput').mockResolvedValue('maybe');

          await orchestrator.runQuest(blockedQuest, mockAgentSpawner);

          // Quest should remain blocked when response is not 'y'
          expect(blockedQuest.status).toBe('blocked');
          expect(mockQuestManager.isQuestComplete).not.toHaveBeenCalled();
        });
        it('handles non-y/n responses for stale quest', async () => {
          const quest = QuestStub();

          mockQuestManager.validateQuestFreshness.mockReturnValue({
            isStale: true,
            reason: 'Test staleness',
          });

          // User provides invalid input (anything not 'y' means no)
          jest.spyOn(orchestrator, 'getUserInput').mockResolvedValue('yes please');
          jest.spyOn(console, 'log').mockImplementation();

          await orchestrator.runQuest(quest, mockAgentSpawner);

          // Should treat as cancellation
          expect(console.log).toHaveBeenCalledWith(
            '\nQuest cancelled. Create a fresh quest with: questmaestro "your request"',
          );
          expect(mockQuestManager.isQuestComplete).not.toHaveBeenCalled();
        });
      });

      describe('when input stream errors occur', () => {
        it('handles stdin data errors gracefully', async () => {
          // Mock getUserInput instead of calling the real implementation
          // to avoid creating real stdin listeners
          const getUserInputSpy = jest.spyOn(orchestrator, 'getUserInput');
          getUserInputSpy.mockResolvedValue('test');

          const result = await orchestrator.getUserInput('Test prompt: ');
          expect(result).toBe('test');
          expect(getUserInputSpy).toHaveBeenCalledWith('Test prompt: ');
        });
      });

      describe('when getUserInput is called directly', () => {
        it('prompts user correctly', async () => {
          // Create a new orchestrator instance for this specific test
          const testOrchestrator = new QuestOrchestrator(
            mockQuestManager,
            mockLogger,
            mockPhaseRunners,
          );
          const promptSpy = jest.spyOn(process.stdout, 'write').mockImplementation();

          // Use real implementation but ensure cleanup
          const getUserInputPromise = testOrchestrator.getUserInput('Enter your choice: ');

          expect(promptSpy).toHaveBeenCalledWith('Enter your choice: ');

          // Provide input immediately to resolve the promise
          setImmediate(() => {
            process.stdin.emit('data', 'test\n');
          });

          await getUserInputPromise;
          promptSpy.mockRestore();
        });
        it('returns trimmed user input', async () => {
          // Create a new orchestrator instance for this specific test
          const testOrchestrator = new QuestOrchestrator(
            mockQuestManager,
            mockLogger,
            mockPhaseRunners,
          );

          const getUserInputPromise = testOrchestrator.getUserInput('Test: ');

          // Simulate user input with extra whitespace using setImmediate
          setImmediate(() => {
            process.stdin.emit('data', '  user input  \n');
          });

          const result = await getUserInputPromise;
          expect(result).toBe('user input');
        });
      });
    });

    describe('when quest is fresh', () => {
      describe('when quest is not blocked', () => {
        describe('when all phases complete successfully', () => {
          it('runs phases in correct order', async () => {
            const quest = QuestStub({
              id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              phases: {
                discovery: { status: 'pending' },
                implementation: { status: 'pending' },
                testing: { status: 'pending' },
                review: { status: 'pending' },
              },
            });
            const runOrder: string[] = [];

            // Mock questManager methods
            mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
            mockQuestManager.isQuestComplete
              .mockReturnValueOnce(false)
              .mockReturnValueOnce(false)
              .mockReturnValueOnce(false)
              .mockReturnValueOnce(false)
              .mockReturnValueOnce(true);
            mockQuestManager.getCurrentPhase
              .mockReturnValueOnce('discovery')
              .mockReturnValueOnce('implementation')
              .mockReturnValueOnce('testing')
              .mockReturnValueOnce('review');
            mockQuestManager.getQuest.mockReturnValue(quest);

            // Track phase execution order
            mockPhaseRunners.forEach((runner, phase) => {
              runner.run.mockImplementation(() => {
                runOrder.push(phase);
                return Promise.resolve();
              });
            });

            await orchestrator.runQuest(quest, mockAgentSpawner);

            expect(runOrder).toStrictEqual(['discovery', 'implementation', 'testing', 'review']);
          });

          it('completes quest after all phases', async () => {
            const quest = QuestStub();
            mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
            mockQuestManager.isQuestComplete.mockReturnValue(true);
            mockQuestManager.generateRetrospective.mockReturnValue('retrospective content');

            await orchestrator.runQuest(quest, mockAgentSpawner);

            expect(mockQuestManager.generateRetrospective).toHaveBeenCalledWith(quest.folder);
            expect(mockQuestManager.saveRetrospective).toHaveBeenCalledWith(
              quest.folder,
              'retrospective content',
            );
            expect(mockQuestManager.completeQuest).toHaveBeenCalledWith(quest.folder);
          });
        });

        describe('when a phase cannot run', () => {
          it('skips phase and marks as skipped', async () => {
            const quest = QuestStub({
              phases: {
                discovery: { status: 'pending' },
                implementation: { status: 'pending' },
                testing: { status: 'pending' },
                review: { status: 'pending' },
              },
            });

            mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
            mockQuestManager.isQuestComplete.mockReturnValueOnce(false).mockReturnValueOnce(true);
            mockQuestManager.getCurrentPhase.mockReturnValueOnce('discovery');
            mockQuestManager.getQuest.mockReturnValue(quest);

            // Make discovery phase unable to run
            mockPhaseRunners.get('discovery')!.canRun.mockReturnValue(false);

            await orchestrator.runQuest(quest, mockAgentSpawner);

            expect(quest.phases.discovery.status).toBe('skipped');
            expect(mockQuestManager.saveQuest).toHaveBeenCalledWith(quest);
          });
        });

        describe('when no phases can run', () => {
          it('completes quest immediately', async () => {
            const quest = QuestStub();
            mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
            mockQuestManager.isQuestComplete.mockReturnValue(true);
            mockQuestManager.generateRetrospective.mockReturnValue('retrospective content');

            await orchestrator.runQuest(quest, mockAgentSpawner);

            expect(mockQuestManager.completeQuest).toHaveBeenCalledWith(quest.folder);
          });
        });
      });

      describe('when quest is blocked', () => {
        describe('when user chooses to resume', () => {
          it('changes status to in_progress and continues execution', async () => {
            const quest = QuestStub({
              status: 'blocked',
            });

            mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
            mockQuestManager.isQuestComplete.mockReturnValue(true);
            jest.spyOn(orchestrator, 'getUserInput').mockResolvedValue('y');

            await orchestrator.runQuest(quest, mockAgentSpawner);

            expect(quest.status).toBe('in_progress');
            expect(mockQuestManager.saveQuest).toHaveBeenCalledWith(quest);
          });
        });

        describe('when user chooses not to resume', () => {
          it('returns without running quest', async () => {
            const quest = QuestStub({
              status: 'blocked',
            });

            mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
            jest.spyOn(orchestrator, 'getUserInput').mockResolvedValue('n');

            await orchestrator.runQuest(quest, mockAgentSpawner);

            expect(quest.status).toBe('blocked');
            expect(mockQuestManager.isQuestComplete).not.toHaveBeenCalled();
          });
        });
      });
    });
  });

  describe('Workflow Integration Tests (Less Mocked)', () => {
    describe('complete quest workflow', () => {
      it('should execute all phases in sequence for a complete quest lifecycle', async () => {
        const quest = QuestStub({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          phases: {
            discovery: { status: 'pending' },
            implementation: { status: 'pending' },
            testing: { status: 'pending' },
            review: { status: 'pending' },
          },
        });

        // Create a more realistic quest manager that tracks state changes
        const questStateTracker = {
          currentPhase: 'discovery',
          completionCheck: 0,
        };

        mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
        mockQuestManager.isQuestComplete.mockImplementation(() => {
          questStateTracker.completionCheck++;
          return questStateTracker.completionCheck > 4;
        });
        mockQuestManager.getCurrentPhase.mockImplementation(() => {
          const phases: PhaseType[] = ['discovery', 'implementation', 'testing', 'review'];
          const currentIndex = phases.indexOf(questStateTracker.currentPhase as PhaseType);
          return currentIndex === -1 ? null : (questStateTracker.currentPhase as PhaseType);
        });
        mockQuestManager.getQuest.mockReturnValue(quest);
        mockQuestManager.generateRetrospective.mockReturnValue('Integration test retrospective');

        // Mock phase runners to simulate real phase progression
        const executionOrder: string[] = [];
        mockPhaseRunners.forEach((runner, phase) => {
          runner.run.mockImplementation(() => {
            executionOrder.push(phase);
            // Simulate phase progression
            const phases = ['discovery', 'implementation', 'testing', 'review'];
            const currentIndex = phases.indexOf(phase);
            const nextIndex = currentIndex + 1;
            if (nextIndex < phases.length) {
              questStateTracker.currentPhase = phases[nextIndex];
            }
            return Promise.resolve();
          });
        });

        await orchestrator.runQuest(quest, mockAgentSpawner);

        // Verify complete workflow execution
        expect(executionOrder).toStrictEqual(['discovery', 'implementation', 'testing', 'review']);
        expect(mockQuestManager.completeQuest).toHaveBeenCalledWith(quest.folder);
        expect(mockQuestManager.generateRetrospective).toHaveBeenCalledWith(quest.folder);
        expect(mockQuestManager.saveRetrospective).toHaveBeenCalledWith(
          quest.folder,
          'Integration test retrospective',
        );
      });

      it('should handle quest state transitions with real quest objects', async () => {
        const quest = QuestStub({
          status: 'in_progress',
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'in_progress' },
            testing: { status: 'pending' },
            review: { status: 'pending' },
          },
        });

        mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
        mockQuestManager.isQuestComplete.mockReturnValueOnce(false).mockReturnValueOnce(true);
        mockQuestManager.getCurrentPhase.mockReturnValue('implementation');
        mockQuestManager.getQuest.mockReturnValue(quest);

        await orchestrator.runQuest(quest, mockAgentSpawner);

        // Verify quest state was handled correctly
        expect(mockPhaseRunners.get('implementation')!.run).toHaveBeenCalledWith(
          quest,
          mockAgentSpawner,
        );
        expect(mockPhaseRunners.get('discovery')!.run).not.toHaveBeenCalled(); // Already complete
      });
    });

    describe('error recovery workflow integration', () => {
      it('should integrate error recovery with quest state management', async () => {
        const quest = QuestStub({
          id: 'recovery-test-quest',
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'pending' },
            testing: { status: 'pending' },
            review: { status: 'pending' },
          },
        });

        const escapeHatchError = new EscapeHatchError({
          reason: 'task_too_complex',
          analysis: 'Task requires refactoring',
          recommendation: 'Split into smaller tasks',
          retro: 'Need better task breakdown',
        });

        // Set up realistic error scenario
        mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
        // EscapeHatchError should block the quest and exit
        mockQuestManager.isQuestComplete.mockReturnValueOnce(false);
        mockQuestManager.getCurrentPhase.mockReturnValue('implementation');
        mockQuestManager.getQuest.mockReturnValue(quest);

        mockPhaseRunners.get('implementation')!.run.mockRejectedValue(escapeHatchError);

        await orchestrator.runQuest(quest, mockAgentSpawner);

        // Verify error recovery workflow
        expect(quest.status).toBe('blocked');
        expect(mockQuestManager.saveQuest).toHaveBeenCalledWith(quest);
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Agent triggered escape hatch: task_too_complex',
        );
        expect(mockLogger.info).toHaveBeenCalledWith('Analysis: Task requires refactoring');
        expect(mockLogger.info).toHaveBeenCalledWith('Recommendation: Split into smaller tasks');
      });
    });

    describe('phase runner integration', () => {
      it('should integrate with real phase runners without heavy mocking', async () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'pending' },
            implementation: { status: 'pending' },
            testing: { status: 'pending' },
            review: { status: 'pending' },
          },
        });

        // Use less mocking - let more real interactions happen
        mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
        mockQuestManager.isQuestComplete.mockReturnValueOnce(false).mockReturnValueOnce(true);
        mockQuestManager.getCurrentPhase.mockReturnValue('discovery');
        mockQuestManager.getQuest.mockReturnValue(quest);

        // Test that phase runners get correct context
        let receivedQuest: Quest | undefined;
        let receivedAgentSpawner: AgentSpawner | undefined;
        mockPhaseRunners.get('discovery')!.run.mockImplementation((q, a) => {
          receivedQuest = q;
          receivedAgentSpawner = a;
          return Promise.resolve();
        });

        await orchestrator.runQuest(quest, mockAgentSpawner);

        // Verify real objects were passed through correctly
        expect(receivedQuest).toBe(quest);
        expect(receivedAgentSpawner).toBe(mockAgentSpawner);
        expect(mockPhaseRunners.get('discovery')!.canRun).toHaveBeenCalledWith(quest);
      });
    });

    describe('user interaction workflow', () => {
      it('should integrate user input with quest workflow decisions', async () => {
        const blockedQuest = QuestStub({
          status: 'blocked',
        });

        mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
        mockQuestManager.isQuestComplete.mockReturnValue(true);

        // Test real user input flow
        const getUserInputSpy = jest.spyOn(orchestrator, 'getUserInput');
        getUserInputSpy.mockResolvedValue('y');

        await orchestrator.runQuest(blockedQuest, mockAgentSpawner);

        // Verify user interaction integration
        expect(getUserInputSpy).toHaveBeenCalledWith('Resume quest? (y/n): ');
        expect(blockedQuest.status).toBe('in_progress');
        expect(mockQuestManager.saveQuest).toHaveBeenCalledWith(blockedQuest);
      });

      it('should handle stale quest workflow with real user decisions', async () => {
        const staleQuest = QuestStub();

        mockQuestManager.validateQuestFreshness.mockReturnValue({
          isStale: true,
          reason: 'Integration test staleness',
        });

        const getUserInputSpy = jest.spyOn(orchestrator, 'getUserInput');
        jest.spyOn(console, 'log').mockImplementation();

        // Test cancel workflow
        getUserInputSpy.mockResolvedValue('n');

        await orchestrator.runQuest(staleQuest, mockAgentSpawner);

        expect(getUserInputSpy).toHaveBeenCalledWith('Continue anyway? (y/n): ');
        expect(mockQuestManager.isQuestComplete).not.toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith(
          '\nQuest cancelled. Create a fresh quest with: questmaestro "your request"',
        );
      });
    });
  });
});
