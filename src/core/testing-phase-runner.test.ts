import type { QuestManager } from './quest-manager';
import type { FileSystem } from './file-system';
import type { Quest } from '../models/quest';
import { TestingPhaseRunner } from './testing-phase-runner';
import { QuestStub } from '../../tests/stubs/quest.stub';
import { AgentReportStub } from '../../tests/stubs/agent-report.stub';
import { createMockQuestManager, createMockFileSystem } from '../../tests/mocks/create-mocks';

describe('TestingPhaseRunner', () => {
  let mockQuestManager: jest.Mocked<QuestManager>;
  let mockFileSystem: jest.Mocked<FileSystem>;
  let phaseRunner: TestingPhaseRunner;

  beforeEach(() => {
    mockQuestManager = createMockQuestManager();
    mockFileSystem = createMockFileSystem();
    phaseRunner = new TestingPhaseRunner(mockQuestManager, mockFileSystem);
  });

  describe('getAgentType()', () => {
    it('returns "siegemaster"', () => {
      expect(phaseRunner.getAgentType()).toBe('siegemaster');
    });
  });

  describe('getPhaseType()', () => {
    it('returns "testing"', () => {
      expect(phaseRunner.getPhaseType()).toBe('testing');
    });
  });

  describe('canRun()', () => {
    describe('when phase is pending and has completed implementation tasks', () => {
      it('returns true', () => {
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
              status: 'complete',
            },
            {
              id: 'test-1',
              name: 'Test API',
              type: 'testing',
              description: 'Write API tests',
              dependencies: ['impl-1'],
              filesToCreate: ['api.test.ts'],
              filesToEdit: [],
              status: 'pending',
            },
          ],
        });

        expect(phaseRunner.canRun(quest)).toBe(true);
      });
    });

    describe('when phase is pending but no completed implementation tasks', () => {
      it('returns false', () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'in_progress' },
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

    describe('when phase is not pending', () => {
      it('returns false even with completed implementation tasks', () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'complete' },
            testing: { status: 'in_progress' },
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

    describe('when phase is pending but has only non-implementation completed tasks', () => {
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
              name: 'Test requirements',
              type: 'testing',
              description: 'Test user requirements',
              dependencies: [],
              filesToCreate: [],
              filesToEdit: [],
              status: 'complete',
            },
          ],
        });

        expect(phaseRunner.canRun(quest)).toBe(false);
      });
    });

    describe('when phase is pending and has no tasks', () => {
      it('returns false', () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'complete' },
            testing: { status: 'pending' },
            review: { status: 'pending' },
          },
          tasks: [],
        });

        expect(phaseRunner.canRun(quest)).toBe(false);
      });
    });
  });

  describe('getAdditionalContext()', () => {
    it('returns complete context object with all properties', () => {
      const quest = QuestStub({
        title: 'Build TODO App',
        folder: '001-todo-app',
        observableActions: [
          {
            id: 'action-1',
            description: 'User can create items',
            successCriteria: 'Item appears in list',
            implementedByTasks: ['impl-1'],
            status: 'demonstrated',
          },
        ],
      });
      const createdFiles = ['src/api.ts', 'src/ui.tsx'];
      mockQuestManager.getCreatedFiles.mockReturnValue(createdFiles);

      const context = phaseRunner.getAdditionalContext(quest);

      expect(context).toStrictEqual({
        questTitle: 'Build TODO App',
        filesCreated: ['src/api.ts', 'src/ui.tsx'],
        testFramework: 'jest',
        observableActions: [
          {
            id: 'action-1',
            description: 'User can create items',
            successCriteria: 'Item appears in list',
            implementedByTasks: ['impl-1'],
            status: 'demonstrated',
          },
        ],
      });
      expect(mockQuestManager.getCreatedFiles).toHaveBeenCalledWith('001-todo-app');
    });

    it('returns context with empty filesCreated when no files created', () => {
      const quest = QuestStub({
        title: 'Simple Task',
        folder: '002-simple',
        observableActions: undefined,
      });
      mockQuestManager.getCreatedFiles.mockReturnValue([]);

      const context = phaseRunner.getAdditionalContext(quest);

      expect(context).toStrictEqual({
        questTitle: 'Simple Task',
        filesCreated: [],
        testFramework: 'jest',
        observableActions: undefined,
      });
      expect(mockQuestManager.getCreatedFiles).toHaveBeenCalledWith('002-simple');
    });

    it('returns context with undefined observableActions when quest has none', () => {
      const quest = QuestStub({
        title: 'No Actions Quest',
        folder: '003-no-actions',
      });
      // Create a new quest object without observableActions
      const questWithoutActions: Quest = {
        ...quest,
      };
      // Remove the property properly
      if ('observableActions' in questWithoutActions) {
        delete questWithoutActions.observableActions;
      }
      mockQuestManager.getCreatedFiles.mockReturnValue(['index.ts']);

      const context = phaseRunner.getAdditionalContext(questWithoutActions);

      expect(context).toStrictEqual({
        questTitle: 'No Actions Quest',
        filesCreated: ['index.ts'],
        testFramework: 'jest',
        observableActions: undefined,
      });
    });

    it('returns context with empty observableActions array when provided', () => {
      const quest = QuestStub({
        title: 'Empty Actions Quest',
        folder: '004-empty-actions',
        observableActions: [],
      });
      mockQuestManager.getCreatedFiles.mockReturnValue([]);

      const context = phaseRunner.getAdditionalContext(quest);

      expect(context).toStrictEqual({
        questTitle: 'Empty Actions Quest',
        filesCreated: [],
        testFramework: 'jest',
        observableActions: [],
      });
    });
  });

  describe('processAgentReport()', () => {
    it('does nothing with the report', () => {
      const quest = QuestStub();
      const report = AgentReportStub({
        status: 'complete',
        agentType: 'siegemaster',
        report: {
          testGapsFound: [
            {
              file: 'src/api.ts',
              description: 'Missing error handling tests',
              priority: 'high',
            },
          ],
          testsCreated: ['api.test.ts'],
          coverageImprovement: {
            before: 60,
            after: 85,
          },
        },
      });

      // Should not throw
      expect(() => phaseRunner.processAgentReport(quest, report)).not.toThrow();
    });

    it('does nothing even with different report types', () => {
      const quest = QuestStub();
      const report = AgentReportStub({
        status: 'error',
        agentType: 'siegemaster',
        blockReason: 'Some error occurred',
      });

      // Should not throw
      expect(() => phaseRunner.processAgentReport(quest, report)).not.toThrow();
    });
  });
});
