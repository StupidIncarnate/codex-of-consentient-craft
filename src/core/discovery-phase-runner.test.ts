import type { QuestManager } from './quest-manager';
import type { FileSystem } from './file-system';
import { DiscoveryPhaseRunner } from './discovery-phase-runner';
import { QuestStub } from '../../tests/stubs/quest.stub';
import { AgentReportStub } from '../../tests/stubs/agent-report.stub';
import { createMockQuestManager, createMockFileSystem } from '../../tests/mocks/create-mocks';

describe('DiscoveryPhaseRunner', () => {
  let mockQuestManager: jest.Mocked<QuestManager>;
  let mockFileSystem: jest.Mocked<FileSystem>;
  let phaseRunner: DiscoveryPhaseRunner;

  beforeEach(() => {
    mockQuestManager = createMockQuestManager();
    mockFileSystem = createMockFileSystem();
    phaseRunner = new DiscoveryPhaseRunner(mockQuestManager, mockFileSystem);
  });

  describe('getAgentType()', () => {
    it('returns "pathseeker"', () => {
      expect(phaseRunner.getAgentType()).toBe('pathseeker');
    });
  });

  describe('getPhaseType()', () => {
    it('returns "discovery"', () => {
      expect(phaseRunner.getPhaseType()).toBe('discovery');
    });
  });

  describe('getAdditionalContext()', () => {
    describe('when quest has no tasks', () => {
      it('returns creation mode context', () => {
        const quest = QuestStub({ tasks: [] });
        const context = phaseRunner.getAdditionalContext(quest);

        expect(context.mode).toBe('creation');
      });

      it('includes userRequest', () => {
        const quest = QuestStub({
          tasks: [],
          userRequest: 'Build a todo app',
        });
        const context = phaseRunner.getAdditionalContext(quest);

        expect(context.userRequest).toBe('Build a todo app');
      });

      it('includes quest object', () => {
        const quest = QuestStub({ tasks: [] });
        const context = phaseRunner.getAdditionalContext(quest);

        expect(context.quest).toBe(quest);
      });
    });

    describe('when quest has existing tasks', () => {
      it('returns validation mode context', () => {
        const quest = QuestStub({
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
        const context = phaseRunner.getAdditionalContext(quest);

        expect(context.mode).toBe('validation');
      });

      it('includes existingTasks', () => {
        const tasks = [
          {
            id: 'task-1',
            name: 'Create API',
            type: 'implementation' as const,
            description: 'Build REST API',
            dependencies: [],
            filesToCreate: ['api.ts'],
            filesToEdit: [],
            status: 'pending' as const,
          },
        ];
        const quest = QuestStub({ tasks });
        const context = phaseRunner.getAdditionalContext(quest);

        expect(context.existingTasks).toBe(tasks);
      });

      it('includes quest object', () => {
        const quest = QuestStub({
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
        const context = phaseRunner.getAdditionalContext(quest);

        expect(context.quest).toBe(quest);
      });
    });
  });

  describe('processAgentReport()', () => {
    describe('when in creation mode', () => {
      describe('when report contains tasks', () => {
        it('adds tasks to quest via questManager', () => {
          const quest = QuestStub({ tasks: [] });
          const tasks = [
            {
              id: 'task-1',
              name: 'Create API',
              type: 'implementation' as const,
              description: 'Build REST API',
              dependencies: [],
              filesToCreate: ['api.ts'],
              filesToEdit: [],
            },
          ];
          const report = AgentReportStub({
            agentType: 'pathseeker',
            report: { tasks },
          });

          phaseRunner.processAgentReport(quest, report);

          expect(mockQuestManager.addTasks).toHaveBeenCalledWith(quest.folder, tasks);
        });
      });

      describe('when report contains observableActions', () => {
        it('adds observableActions to quest', () => {
          const quest = QuestStub({ tasks: [] });
          const observableActions = [
            {
              id: 'action-1',
              description: 'User can create todos',
              successCriteria: 'Todo appears in list',
              implementedByTasks: ['task-1'],
            },
          ];
          const report = AgentReportStub({
            agentType: 'pathseeker',
            report: { tasks: [], observableActions },
          });

          phaseRunner.processAgentReport(quest, report);

          expect(quest.observableActions).toHaveLength(1);
          expect(quest.observableActions?.[0]).toMatchObject({
            id: 'action-1',
            description: 'User can create todos',
            successCriteria: 'Todo appears in list',
            implementedByTasks: ['task-1'],
          });
        });

        it('sets status to pending for each action', () => {
          const quest = QuestStub({ tasks: [] });
          const observableActions = [
            {
              id: 'action-1',
              description: 'User can create todos',
              successCriteria: 'Todo appears in list',
              implementedByTasks: ['task-1'],
            },
            {
              id: 'action-2',
              description: 'User can delete todos',
              successCriteria: 'Todo removed from list',
              implementedByTasks: ['task-2'],
            },
          ];
          const report = AgentReportStub({
            agentType: 'pathseeker',
            report: { tasks: [], observableActions },
          });

          phaseRunner.processAgentReport(quest, report);

          expect(quest.observableActions).toHaveLength(2);
          expect(quest.observableActions?.[0].status).toBe('pending');
          expect(quest.observableActions?.[1].status).toBe('pending');
        });
      });

      describe('when report contains no tasks', () => {
        it('does not call addTasks', () => {
          const quest = QuestStub({ tasks: [] });
          const report = AgentReportStub({
            agentType: 'pathseeker',
            report: { tasks: [] },
          });

          phaseRunner.processAgentReport(quest, report);

          expect(mockQuestManager.addTasks).toHaveBeenCalledWith(quest.folder, []);
        });
      });
    });

    describe('when in validation mode', () => {
      describe('when report contains reconciliationPlan', () => {
        it('applies reconciliation via questManager', () => {
          const quest = QuestStub({
            id: 'quest-123',
            tasks: [
              {
                id: 'existing-task',
                name: 'Existing Task',
                type: 'implementation',
                description: 'Already exists',
                dependencies: [],
                filesToCreate: [],
                filesToEdit: [],
                status: 'pending',
              },
            ],
          });
          const reconciliationPlan = {
            mode: 'EXTEND' as const,
            obsoleteTasks: [
              {
                taskId: 'task-to-remove',
                reason: 'No longer needed',
              },
            ],
          };
          const report = AgentReportStub({
            agentType: 'pathseeker',
            report: { tasks: [], reconciliationPlan },
          });

          phaseRunner.processAgentReport(quest, report);

          expect(mockQuestManager.applyReconciliation).toHaveBeenCalledWith(
            'quest-123',
            reconciliationPlan,
          );
        });
      });

      describe('when report contains regular tasks', () => {
        it('adds tasks to quest via questManager', () => {
          const quest = QuestStub({
            tasks: [
              {
                id: 'existing-task',
                name: 'Existing Task',
                type: 'implementation',
                description: 'Already exists',
                dependencies: [],
                filesToCreate: [],
                filesToEdit: [],
                status: 'pending',
              },
            ],
          });
          const newTasks = [
            {
              id: 'new-task',
              name: 'New Task',
              type: 'implementation' as const,
              description: 'New task to add',
              dependencies: [],
              filesToCreate: ['new.ts'],
              filesToEdit: [],
            },
          ];
          const report = AgentReportStub({
            agentType: 'pathseeker',
            report: { tasks: newTasks },
          });

          phaseRunner.processAgentReport(quest, report);

          expect(mockQuestManager.addTasks).toHaveBeenCalledWith(quest.folder, newTasks);
        });
      });
    });
  });
});
