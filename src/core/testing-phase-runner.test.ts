import type { QuestManager } from './quest-manager';
import type { FileSystem } from './file-system';
import { TestingPhaseRunner } from './testing-phase-runner';
import { QuestStub } from '../../tests/stubs/quest.stub';
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
  });

  describe('getAdditionalContext()', () => {
    it('includes questTitle', () => {
      const quest = QuestStub({ title: 'Build TODO App' });
      const context = phaseRunner.getAdditionalContext(quest);

      expect(context.questTitle).toBe('Build TODO App');
    });

    it('includes filesCreated from questManager', () => {
      const quest = QuestStub();
      const createdFiles = ['src/api.ts', 'src/ui.tsx'];
      mockQuestManager.getCreatedFiles.mockReturnValue(createdFiles);

      const context = phaseRunner.getAdditionalContext(quest);

      expect(context.filesCreated).toBe(createdFiles);
      expect(mockQuestManager.getCreatedFiles).toHaveBeenCalledWith(quest.folder);
    });

    it('includes detected testFramework', () => {
      const quest = QuestStub();
      const context = phaseRunner.getAdditionalContext(quest);

      expect(context.testFramework).toBe('jest');
    });

    it('includes observableActions if any', () => {
      const observableActions = [
        {
          id: 'action-1',
          description: 'User can create items',
          successCriteria: 'Item appears in list',
          implementedByTasks: ['impl-1'],
          status: 'demonstrated' as const,
        },
      ];
      const quest = QuestStub({ observableActions });
      const context = phaseRunner.getAdditionalContext(quest);

      expect(context.observableActions).toBe(observableActions);
    });
  });

  describe('detectTestFramework()', () => {
    it('returns "jest" as default', () => {
      // Since detectTestFramework is private, we test it indirectly through getAdditionalContext
      const quest = QuestStub();
      const context = phaseRunner.getAdditionalContext(quest);
      expect(context.testFramework).toBe('jest');
    });

    it('detects test framework from package.json', () => {
      // This is currently hardcoded to return 'jest'
      // When implemented, it should check package.json
      const quest = QuestStub();
      const context = phaseRunner.getAdditionalContext(quest);
      expect(context.testFramework).toBe('jest');
    });
  });
});
