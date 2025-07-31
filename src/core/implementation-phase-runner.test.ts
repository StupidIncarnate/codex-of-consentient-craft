import type { QuestManager } from './quest-manager';
import type { FileSystem } from './file-system';
import type { AgentSpawner } from '../agents/agent-spawner';
import type { WardValidator } from './ward-validator';
import { ImplementationPhaseRunner } from './implementation-phase-runner';
import { QuestStub } from '../../tests/stubs/quest.stub';
import { AgentReportStub } from '../../tests/stubs/agent-report.stub';
import {
  createMockQuestManager,
  createMockFileSystem,
  createMockAgentSpawner,
  createMockWardValidator,
  createMockLogger,
} from '../../tests/mocks/create-mocks';
import { EscapeHatchError } from './escape-hatch-error';

describe('ImplementationPhaseRunner', () => {
  let mockQuestManager: jest.Mocked<QuestManager>;
  let mockFileSystem: jest.Mocked<FileSystem>;
  let mockAgentSpawner: jest.Mocked<AgentSpawner>;
  let phaseRunner: ImplementationPhaseRunner;

  beforeEach(() => {
    mockQuestManager = createMockQuestManager();
    mockFileSystem = createMockFileSystem();
    mockAgentSpawner = createMockAgentSpawner();
    phaseRunner = new ImplementationPhaseRunner(
      mockQuestManager,
      mockFileSystem,
      createMockLogger(),
    );
  });

  describe('getAgentType()', () => {
    it('returns "codeweaver"', () => {
      expect(phaseRunner.getAgentType()).toBe('codeweaver');
    });
  });

  describe('getPhaseType()', () => {
    it('returns "implementation"', () => {
      expect(phaseRunner.getPhaseType()).toBe('implementation');
    });
  });

  describe('canRun()', () => {
    describe('when phase is pending and has incomplete implementation tasks', () => {
      it('returns true', () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'pending' },
            testing: { status: 'pending' },
            review: { status: 'pending' },
          },
          tasks: [
            {
              id: 'task-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'pending',
            },
          ],
        });

        expect(phaseRunner.canRun(quest)).toBe(true);
      });
    });

    describe('when phase is pending but no incomplete implementation tasks', () => {
      it('returns false', () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'pending' },
            testing: { status: 'pending' },
            review: { status: 'pending' },
          },
          tasks: [
            {
              id: 'test-1',
              name: 'Write tests',
              type: 'testing',
              description: 'Write unit tests',
              dependencies: [],
              filesToCreate: ['test.spec.ts'],
              filesToEdit: [],
              status: 'pending',
            },
          ],
        });

        expect(phaseRunner.canRun(quest)).toBe(false);
      });
    });

    describe('when phase is pending and all implementation tasks are complete', () => {
      it('returns false', () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'pending' },
            testing: { status: 'pending' },
            review: { status: 'pending' },
          },
          tasks: [
            {
              id: 'impl-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'complete',
            },
          ],
        });

        expect(phaseRunner.canRun(quest)).toBe(false);
      });
    });

    describe('when phase is not pending', () => {
      it('returns false', () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'complete' },
            testing: { status: 'pending' },
            review: { status: 'pending' },
          },
          tasks: [
            {
              id: 'impl-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'pending',
            },
          ],
        });

        expect(phaseRunner.canRun(quest)).toBe(false);
      });
    });
  });

  describe('run()', () => {
    describe('when no incomplete implementation tasks exist', () => {
      it('returns early without marking phase', async () => {
        const quest = QuestStub({
          tasks: [
            {
              id: 'test-1',
              name: 'Write tests',
              type: 'testing',
              description: 'Write unit tests',
              dependencies: [],
              filesToCreate: ['test.spec.ts'],
              filesToEdit: [],
              status: 'pending',
            },
          ],
        });

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(quest.phases.implementation.status).toBe('pending');
        expect(mockQuestManager.saveQuest).not.toHaveBeenCalled();
      });
    });

    describe('when all implementation tasks are complete', () => {
      it('returns early without marking phase', async () => {
        const quest = QuestStub({
          tasks: [
            {
              id: 'impl-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'complete',
            },
          ],
        });

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(quest.phases.implementation.status).toBe('pending');
        expect(mockQuestManager.saveQuest).not.toHaveBeenCalled();
        expect(mockAgentSpawner.spawnAndWait).not.toHaveBeenCalled();
      });
    });

    describe('when running multiple implementation tasks', () => {
      it('marks phase as in_progress and then complete', async () => {
        const quest = QuestStub({
          tasks: [
            {
              id: 'impl-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'pending',
            },
          ],
        });
        const report = AgentReportStub({ agentType: 'codeweaver' });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(quest.phases.implementation.status).toBe('complete');
        // First save after marking in_progress, then after each task, then after marking complete
        expect(mockQuestManager.saveQuest).toHaveBeenCalledTimes(3);
      });

      it('spawns codeweaver for each incomplete task', async () => {
        const quest = QuestStub({
          tasks: [
            {
              id: 'impl-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'pending',
            },
            {
              id: 'impl-2',
              name: 'Create UI',
              type: 'implementation',
              description: 'Build UI components',
              dependencies: ['impl-1'],
              filesToCreate: ['ui.tsx'],
              filesToEdit: [],
              status: 'pending',
            },
          ],
        });
        const report = AgentReportStub({ agentType: 'codeweaver' });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);
        mockQuestManager.getNextReportNumber.mockReturnValue('42');

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(mockAgentSpawner.spawnAndWait).toHaveBeenCalledTimes(2);

        // Since tasks are modified in-place during execution, we check that the spawner
        // was called with correct basic parameters
        expect(mockAgentSpawner.spawnAndWait).toHaveBeenCalledWith('codeweaver', {
          questFolder: '001-test-quest',
          reportNumber: '42',
          workingDirectory: process.cwd(),
          additionalContext: {
            questTitle: 'Test Quest',
            task: quest.tasks[0], // Task object is passed by reference
          },
        });

        expect(mockAgentSpawner.spawnAndWait).toHaveBeenCalledWith('codeweaver', {
          questFolder: '001-test-quest',
          reportNumber: '42',
          workingDirectory: process.cwd(),
          additionalContext: {
            questTitle: 'Test Quest',
            task: quest.tasks[1], // Task object is passed by reference
          },
        });
      });

      it('updates task status to complete after each agent run', async () => {
        const quest = QuestStub({
          tasks: [
            {
              id: 'impl-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'pending',
            },
            {
              id: 'impl-2',
              name: 'Create UI',
              type: 'implementation',
              description: 'Build UI components',
              dependencies: ['impl-1'],
              filesToCreate: ['ui.tsx'],
              filesToEdit: [],
              status: 'pending',
            },
          ],
        });
        const report = AgentReportStub({ agentType: 'codeweaver' });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(quest.tasks[0].status).toBe('complete');
        expect(quest.tasks[1].status).toBe('complete');
      });

      it('updates task completedBy field with padded report number', async () => {
        const quest = QuestStub({
          tasks: [
            {
              id: 'impl-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'pending',
            },
          ],
        });
        const report = AgentReportStub({ agentType: 'codeweaver' });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);
        mockQuestManager.getNextReportNumber.mockReturnValue('42');

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(quest.tasks[0].completedBy).toBe('042-codeweaver-report.json');
      });

      it('saves quest after each task completion', async () => {
        const quest = QuestStub({
          tasks: [
            {
              id: 'impl-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'pending',
            },
            {
              id: 'impl-2',
              name: 'Create UI',
              type: 'implementation',
              description: 'Build UI components',
              dependencies: ['impl-1'],
              filesToCreate: ['ui.tsx'],
              filesToEdit: [],
              status: 'pending',
            },
          ],
        });
        const report = AgentReportStub({ agentType: 'codeweaver' });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await phaseRunner.run(quest, mockAgentSpawner);

        // Once for in_progress, once after each task (2), once for complete = 4 total
        expect(mockQuestManager.saveQuest).toHaveBeenCalledTimes(4);
      });
    });

    describe('when task implements observable actions', () => {
      it('updates observable action status when all implementing tasks complete', async () => {
        const quest = QuestStub({
          tasks: [
            {
              id: 'impl-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'pending',
              implementsActions: ['action-1'],
            },
          ],
          observableActions: [
            {
              id: 'action-1',
              description: 'User can create items',
              successCriteria: 'Item appears in list',
              implementedByTasks: ['impl-1'],
              status: 'pending',
            },
          ],
        });
        const report = AgentReportStub({ agentType: 'codeweaver' });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(quest.observableActions).toStrictEqual([
          {
            id: 'action-1',
            description: 'User can create items',
            successCriteria: 'Item appears in list',
            implementedByTasks: ['impl-1'],
            status: 'demonstrated',
          },
        ]);
      });

      it('considers skipped tasks as complete for action status', async () => {
        const quest = QuestStub({
          tasks: [
            {
              id: 'impl-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'pending',
              implementsActions: ['action-1'],
            },
            {
              id: 'impl-2',
              name: 'Create fallback',
              type: 'implementation',
              description: 'Build fallback',
              dependencies: [],
              filesToCreate: ['fallback.ts'],
              filesToEdit: [],
              status: 'skipped',
              implementsActions: ['action-1'],
            },
          ],
          observableActions: [
            {
              id: 'action-1',
              description: 'User can create items',
              successCriteria: 'Item appears in list',
              implementedByTasks: ['impl-1', 'impl-2'],
              status: 'pending',
            },
          ],
        });
        const report = AgentReportStub({ agentType: 'codeweaver' });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(quest.observableActions?.[0].status).toBe('demonstrated');
      });

      it('leaves action status as pending if some tasks incomplete', async () => {
        const quest = QuestStub({
          tasks: [
            {
              id: 'impl-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'pending',
              implementsActions: ['action-1'],
            },
            {
              id: 'impl-2',
              name: 'Create UI',
              type: 'implementation',
              description: 'Build UI',
              dependencies: [],
              filesToCreate: ['ui.tsx'],
              filesToEdit: [],
              status: 'pending',
              implementsActions: ['action-1'],
            },
          ],
          observableActions: [
            {
              id: 'action-1',
              description: 'User can create items',
              successCriteria: 'Item appears in list',
              implementedByTasks: ['impl-1', 'impl-2'],
              status: 'pending',
            },
          ],
        });
        const report = AgentReportStub({ agentType: 'codeweaver' });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        // Only run the first task
        quest.tasks[1].type = 'testing'; // Change type so it's not processed

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(quest.observableActions).toStrictEqual([
          {
            id: 'action-1',
            description: 'User can create items',
            successCriteria: 'Item appears in list',
            implementedByTasks: ['impl-1', 'impl-2'],
            status: 'pending',
          },
        ]);
      });

      it('handles missing observable action gracefully', async () => {
        const quest = QuestStub({
          tasks: [
            {
              id: 'impl-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'pending',
              implementsActions: ['action-1'],
            },
          ],
          observableActions: [
            {
              id: 'action-2', // Different ID
              description: 'User can delete items',
              successCriteria: 'Item removed from list',
              implementedByTasks: [],
              status: 'pending',
            },
          ],
        });
        const report = AgentReportStub({ agentType: 'codeweaver' });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        // Should not throw
        await phaseRunner.run(quest, mockAgentSpawner);

        expect(quest.observableActions?.[0].status).toBe('pending');
      });

      it('handles undefined observableActions gracefully', async () => {
        const quest = QuestStub({
          tasks: [
            {
              id: 'impl-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'pending',
              implementsActions: ['action-1'],
            },
          ],
          observableActions: undefined,
        });
        const report = AgentReportStub({ agentType: 'codeweaver' });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        // Should not throw
        await phaseRunner.run(quest, mockAgentSpawner);

        expect(quest.tasks[0].status).toBe('complete');
      });
    });

    describe('when agent triggers escape hatch', () => {
      it('throws EscapeHatchError with escape data', async () => {
        const quest = QuestStub({
          tasks: [
            {
              id: 'impl-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'pending',
            },
          ],
        });
        const escapeData = {
          reason: 'task_too_complex' as const,
          analysis: 'Task is too complex',
          recommendation: 'Break down the task',
          retro: 'Task complexity exceeded',
        };
        const report = AgentReportStub({
          agentType: 'codeweaver',
          escape: escapeData,
        });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await expect(phaseRunner.run(quest, mockAgentSpawner)).rejects.toThrow(EscapeHatchError);

        // Test the escape data by catching the error
        let caughtError: EscapeHatchError | undefined;
        try {
          await phaseRunner.run(quest, mockAgentSpawner);
        } catch (error) {
          caughtError = error as EscapeHatchError;
        }

        expect(caughtError).toBeInstanceOf(EscapeHatchError);
        expect(caughtError?.escape).toStrictEqual(escapeData);
      });

      it('does not update task status when escape hatch triggered', async () => {
        const quest = QuestStub({
          tasks: [
            {
              id: 'impl-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'pending',
            },
          ],
        });
        const report = AgentReportStub({
          agentType: 'codeweaver',
          escape: {
            reason: 'context_exhaustion' as const,
            analysis: 'Context limit reached',
            recommendation: 'Reduce context size',
            retro: 'Too much context',
          },
        });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await expect(phaseRunner.run(quest, mockAgentSpawner)).rejects.toThrow();

        expect(quest.tasks[0].status).toBe('pending');
      });
    });
  });

  describe('getAdditionalContext()', () => {
    it('returns empty object', () => {
      const quest = QuestStub();
      expect(phaseRunner.getAdditionalContext(quest)).toStrictEqual({});
    });
  });

  describe('processAgentReport()', () => {
    it('does nothing', () => {
      const quest = QuestStub();
      const report = AgentReportStub();

      // Should not throw
      phaseRunner.processAgentReport(quest, report);

      // Quest should remain unchanged
      expect(quest).toStrictEqual(QuestStub());
    });
  });

  describe('ward validation integration', () => {
    let mockWardValidator: jest.Mocked<WardValidator>;

    beforeEach(() => {
      mockWardValidator = createMockWardValidator();
    });

    describe('when wardValidator is provided', () => {
      beforeEach(() => {
        phaseRunner = new ImplementationPhaseRunner(
          mockQuestManager,
          mockFileSystem,
          createMockLogger(),
          mockWardValidator,
        );
      });

      describe('when ward validation passes', () => {
        it('continues without spawning Spiritmender', async () => {
          const quest = QuestStub({
            tasks: [
              {
                id: 'impl-1',
                name: 'Create API',
                type: 'implementation',
                description: 'Build REST API',
                dependencies: [],
                filesToCreate: ['api.ts'],
                filesToEdit: [],
                status: 'pending',
              },
            ],
          });
          const report = AgentReportStub({ agentType: 'codeweaver' });
          mockAgentSpawner.spawnAndWait.mockResolvedValue(report);
          mockWardValidator.validate.mockReturnValue({ success: true });

          await phaseRunner.run(quest, mockAgentSpawner);

          expect(mockWardValidator.validate).toHaveBeenCalledTimes(1);
          expect(mockWardValidator.handleFailure).not.toHaveBeenCalled();
        });
      });

      describe('when ward validation fails', () => {
        it('calls wardValidator.handleFailure with correct parameters', async () => {
          const quest = QuestStub({
            tasks: [
              {
                id: 'impl-1',
                name: 'Create API',
                type: 'implementation',
                description: 'Build REST API',
                dependencies: [],
                filesToCreate: ['api.ts'],
                filesToEdit: [],
                status: 'pending',
              },
            ],
          });
          const report = AgentReportStub({ agentType: 'codeweaver' });
          mockAgentSpawner.spawnAndWait.mockResolvedValue(report);
          const validationErrors = 'Linting failed\nType errors found';
          mockWardValidator.validate.mockReturnValue({
            success: false,
            errors: validationErrors,
          });

          await phaseRunner.run(quest, mockAgentSpawner);

          expect(mockWardValidator.handleFailure).toHaveBeenCalledWith(
            quest,
            validationErrors,
            mockAgentSpawner,
            mockQuestManager,
            'impl-1',
          );
        });

        it('passes task ID for each task', async () => {
          const quest = QuestStub({
            tasks: [
              {
                id: 'impl-1',
                name: 'Create API',
                type: 'implementation',
                description: 'Build REST API',
                dependencies: [],
                filesToCreate: ['api.ts'],
                filesToEdit: [],
                status: 'pending',
              },
              {
                id: 'impl-2',
                name: 'Create UI',
                type: 'implementation',
                description: 'Build UI',
                dependencies: [],
                filesToCreate: ['ui.tsx'],
                filesToEdit: [],
                status: 'pending',
              },
            ],
          });
          const report = AgentReportStub({ agentType: 'codeweaver' });
          mockAgentSpawner.spawnAndWait.mockResolvedValue(report);
          mockWardValidator.validate.mockReturnValue({
            success: false,
            errors: 'Validation failed',
          });

          await phaseRunner.run(quest, mockAgentSpawner);

          expect(mockWardValidator.handleFailure).toHaveBeenCalledTimes(2);
          expect(mockWardValidator.handleFailure).toHaveBeenNthCalledWith(
            1,
            quest,
            'Validation failed',
            mockAgentSpawner,
            mockQuestManager,
            'impl-1',
          );
          expect(mockWardValidator.handleFailure).toHaveBeenNthCalledWith(
            2,
            quest,
            'Validation failed',
            mockAgentSpawner,
            mockQuestManager,
            'impl-2',
          );
        });

        it('handles empty errors gracefully', async () => {
          const quest = QuestStub({
            tasks: [
              {
                id: 'impl-1',
                name: 'Create API',
                type: 'implementation',
                description: 'Build REST API',
                dependencies: [],
                filesToCreate: ['api.ts'],
                filesToEdit: [],
                status: 'pending',
              },
            ],
          });
          const report = AgentReportStub({ agentType: 'codeweaver' });
          mockAgentSpawner.spawnAndWait.mockResolvedValue(report);
          mockWardValidator.validate.mockReturnValue({
            success: false,
            // errors field is optional and not provided
          });

          await phaseRunner.run(quest, mockAgentSpawner);

          expect(mockWardValidator.handleFailure).toHaveBeenCalledWith(
            quest,
            '',
            mockAgentSpawner,
            mockQuestManager,
            'impl-1',
          );
        });
      });

      describe('when maximum Spiritmender attempts are reached', () => {
        it('propagates the error from wardValidator.handleFailure', async () => {
          const quest = QuestStub({
            tasks: [
              {
                id: 'impl-1',
                name: 'Create API',
                type: 'implementation',
                description: 'Build REST API',
                dependencies: [],
                filesToCreate: ['api.ts'],
                filesToEdit: [],
                status: 'pending',
              },
            ],
          });
          const report = AgentReportStub({ agentType: 'codeweaver' });
          mockAgentSpawner.spawnAndWait.mockResolvedValue(report);
          mockWardValidator.validate.mockReturnValue({
            success: false,
            errors: 'Validation failed',
          });
          const maxAttemptsError = new Error(
            'Quest blocked: Max Spiritmender attempts reached for task impl-1',
          );
          mockWardValidator.handleFailure.mockRejectedValue(maxAttemptsError);

          await expect(phaseRunner.run(quest, mockAgentSpawner)).rejects.toThrow(
            'Quest blocked: Max Spiritmender attempts reached for task impl-1',
          );
        });
      });
    });

    describe('when wardValidator is not provided', () => {
      it('continues without validation', async () => {
        // phaseRunner already created without wardValidator in main beforeEach
        const quest = QuestStub({
          tasks: [
            {
              id: 'impl-1',
              name: 'Create API',
              type: 'implementation',
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
              status: 'pending',
            },
          ],
        });
        const report = AgentReportStub({ agentType: 'codeweaver' });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await phaseRunner.run(quest, mockAgentSpawner);

        // Should complete successfully without calling ward validation
        expect(quest.phases.implementation.status).toBe('complete');
        expect(quest.tasks[0].status).toBe('complete');
      });
    });
  });
});
