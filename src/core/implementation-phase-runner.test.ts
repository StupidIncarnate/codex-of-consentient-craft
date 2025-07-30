import type { QuestManager } from './quest-manager';
import type { FileSystem } from './file-system';
import type { AgentSpawner } from '../agents/agent-spawner';
import { ImplementationPhaseRunner } from './implementation-phase-runner';
import { QuestStub } from '../../tests/stubs/quest.stub';
import { AgentReportStub } from '../../tests/stubs/agent-report.stub';
import {
  createMockQuestManager,
  createMockFileSystem,
  createMockAgentSpawner,
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
    phaseRunner = new ImplementationPhaseRunner(mockQuestManager, mockFileSystem);
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
    describe('when phase is pending and has implementation tasks', () => {
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

    describe('when phase is pending but no implementation tasks', () => {
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
  });

  describe('run()', () => {
    describe('when no implementation tasks exist', () => {
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

      it('does not spawn any agents', async () => {
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

        expect(mockAgentSpawner.spawnAndWait).not.toHaveBeenCalled();
      });
    });

    describe('when running multiple implementation tasks', () => {
      it('spawns codeweaver for each task sequentially', async () => {
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
        expect(mockAgentSpawner.spawnAndWait).toHaveBeenNthCalledWith(1, 'codeweaver', {
          questFolder: quest.folder,
          reportNumber: '42',
          workingDirectory: process.cwd(),
          additionalContext: {
            questTitle: quest.title,
            task: quest.tasks[0],
          },
        });
        expect(mockAgentSpawner.spawnAndWait).toHaveBeenNthCalledWith(2, 'codeweaver', {
          questFolder: quest.folder,
          reportNumber: '42',
          workingDirectory: process.cwd(),
          additionalContext: {
            questTitle: quest.title,
            task: quest.tasks[1],
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

      it('updates task completedBy field', async () => {
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

      it('runs ward validation after each task', async () => {
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

        // Spy on private method
        const runWardValidationSpy = jest.spyOn(
          phaseRunner,
          'runWardValidation' as keyof ImplementationPhaseRunner,
        );

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(runWardValidationSpy).toHaveBeenCalledWith(quest, mockAgentSpawner);
        runWardValidationSpy.mockRestore();
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

        expect(quest.observableActions?.[0].status).toBe('pending');
      });
    });

    describe('when agent triggers escape hatch', () => {
      it('throws EscapeHatchError', async () => {
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
      });
    });
  });
});
