import type { QuestManager } from './quest-manager';
import type { FileSystem } from './file-system';
import type { AgentReport } from '../models/agent';
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
      it('returns creation mode context with all expected properties', () => {
        const quest = QuestStub({
          tasks: [],
          userRequest: 'Build a todo app',
        });
        const context = phaseRunner.getAdditionalContext(quest);

        expect(context).toStrictEqual({
          mode: 'creation',
          userRequest: 'Build a todo app',
          quest: quest,
        });
      });
    });

    describe('when quest has existing tasks', () => {
      it('returns validation mode context with all expected properties', () => {
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

        expect(context).toStrictEqual({
          mode: 'validation',
          existingTasks: tasks,
          quest: quest,
        });
      });
    });
  });

  describe('processAgentReport()', () => {
    describe('when report agentType is not "pathseeker"', () => {
      it('does nothing and returns early', () => {
        const quest = QuestStub({ tasks: [] });
        const report = {
          status: 'complete',
          agentType: 'voidpoker',
          report: {
            projectStructure: {
              type: 'node',
              mainTechnologies: ['typescript'],
            },
            discovery: {
              entryPoints: ['src/index.ts'],
              keyDirectories: ['src'],
              configFiles: ['package.json'],
              conventions: {},
            },
            recommendations: {},
          },
        } as AgentReport;

        phaseRunner.processAgentReport(quest, report);

        expect(mockQuestManager.addTasks).not.toHaveBeenCalled();
        expect(mockQuestManager.applyReconciliation).not.toHaveBeenCalled();
        expect(quest.observableActions).toBeUndefined();
      });
    });

    describe('when report.report is undefined', () => {
      it('does nothing and returns early', () => {
        const quest = QuestStub({ tasks: [] });
        const report = {
          status: 'complete',
          agentType: 'pathseeker',
          report: undefined,
        } as unknown as AgentReport;

        phaseRunner.processAgentReport(quest, report);

        expect(mockQuestManager.addTasks).not.toHaveBeenCalled();
        expect(mockQuestManager.applyReconciliation).not.toHaveBeenCalled();
        expect(quest.observableActions).toBeUndefined();
      });
    });

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

        it('handles when tasks is not an array', () => {
          const quest = QuestStub({ tasks: [] });
          const report = AgentReportStub({
            agentType: 'pathseeker',
            report: { tasks: 'not-an-array' as unknown as [] },
          });

          phaseRunner.processAgentReport(quest, report);

          expect(mockQuestManager.addTasks).not.toHaveBeenCalled();
        });
      });

      describe('when report contains observableActions', () => {
        it('adds observableActions to quest with status "pending"', () => {
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
              failureBehavior: 'Show error message',
              implementedByTasks: ['task-2'],
            },
          ];
          const report = AgentReportStub({
            agentType: 'pathseeker',
            report: { tasks: [], observableActions },
          });

          phaseRunner.processAgentReport(quest, report);

          expect(quest.observableActions).toStrictEqual([
            {
              id: 'action-1',
              description: 'User can create todos',
              successCriteria: 'Todo appears in list',
              implementedByTasks: ['task-1'],
              status: 'pending',
            },
            {
              id: 'action-2',
              description: 'User can delete todos',
              successCriteria: 'Todo removed from list',
              failureBehavior: 'Show error message',
              implementedByTasks: ['task-2'],
              status: 'pending',
            },
          ]);
        });

        it('handles when observableActions is not an array', () => {
          const quest = QuestStub({ tasks: [] });
          const report = AgentReportStub({
            agentType: 'pathseeker',
            report: {
              tasks: [],
              observableActions: 'not-an-array' as unknown as [],
            },
          });

          phaseRunner.processAgentReport(quest, report);

          expect(quest.observableActions).toBeUndefined();
        });
      });

      describe('when report contains empty tasks array', () => {
        it('calls addTasks with empty array', () => {
          const quest = QuestStub({ tasks: [] });
          const report = AgentReportStub({
            agentType: 'pathseeker',
            report: { tasks: [] },
          });

          phaseRunner.processAgentReport(quest, report);

          expect(mockQuestManager.addTasks).toHaveBeenCalledWith(quest.folder, []);
        });
      });

      describe('when report.tasks is undefined', () => {
        it('does not call addTasks', () => {
          const quest = QuestStub({ tasks: [] });
          const report = {
            status: 'complete',
            agentType: 'pathseeker',
            report: {
              tasks: undefined as unknown as [],
            },
          } as AgentReport;

          phaseRunner.processAgentReport(quest, report);

          expect(mockQuestManager.addTasks).not.toHaveBeenCalled();
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
          expect(mockQuestManager.addTasks).not.toHaveBeenCalled();
        });
      });

      describe('when report contains regular tasks without reconciliationPlan', () => {
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
          expect(mockQuestManager.applyReconciliation).not.toHaveBeenCalled();
        });

        it('handles when tasks is not an array', () => {
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
          const report = AgentReportStub({
            agentType: 'pathseeker',
            report: { tasks: 'not-an-array' as unknown as [] },
          });

          phaseRunner.processAgentReport(quest, report);

          expect(mockQuestManager.addTasks).not.toHaveBeenCalled();
          expect(mockQuestManager.applyReconciliation).not.toHaveBeenCalled();
        });
      });

      describe('when report contains both reconciliationPlan and tasks', () => {
        it('prioritizes reconciliationPlan over tasks', () => {
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
            obsoleteTasks: [],
          };
          const newTasks = [
            {
              id: 'new-task',
              name: 'New Task',
              type: 'implementation' as const,
              description: 'Should not be added',
              dependencies: [],
              filesToCreate: ['new.ts'],
              filesToEdit: [],
            },
          ];
          const report = AgentReportStub({
            agentType: 'pathseeker',
            report: { reconciliationPlan, tasks: newTasks },
          });

          phaseRunner.processAgentReport(quest, report);

          expect(mockQuestManager.applyReconciliation).toHaveBeenCalledWith(
            'quest-123',
            reconciliationPlan,
          );
          expect(mockQuestManager.addTasks).not.toHaveBeenCalled();
        });
      });
    });
  });
});
