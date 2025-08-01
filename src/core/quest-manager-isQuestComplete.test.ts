import { createQuest } from '../models/quest';
import { QuestManager } from './quest-manager';
import { createMockFileSystem, createMockConfigManager } from '../../tests/mocks/create-mocks';

describe('QuestManager - isQuestComplete', () => {
  let questManager: QuestManager;
  let mockFileSystem: ReturnType<typeof createMockFileSystem>;
  let mockConfigManager: ReturnType<typeof createMockConfigManager>;

  beforeEach(() => {
    mockFileSystem = createMockFileSystem();
    mockConfigManager = createMockConfigManager();
    questManager = new QuestManager(mockFileSystem, mockConfigManager);
  });

  describe('when quest has no tasks', () => {
    it('should return true when all phases are complete', () => {
      const quest = createQuest('test-id', 'test-folder', 'Test Quest');
      quest.phases.discovery.status = 'complete';
      quest.phases.implementation.status = 'complete';
      quest.phases.testing.status = 'complete';
      quest.phases.review.status = 'complete';

      expect(questManager.isQuestComplete(quest)).toBe(true);
    });

    it('should return true when some phases are skipped', () => {
      const quest = createQuest('test-id', 'test-folder', 'Test Quest');
      quest.phases.discovery.status = 'complete';
      quest.phases.implementation.status = 'skipped';
      quest.phases.testing.status = 'skipped';
      quest.phases.review.status = 'skipped';

      expect(questManager.isQuestComplete(quest)).toBe(true);
    });

    it('should return true when phases are mix of complete and skipped', () => {
      const quest = createQuest('test-id', 'test-folder', 'Test Quest');
      quest.phases.discovery.status = 'complete';
      quest.phases.implementation.status = 'skipped';
      quest.phases.testing.status = 'complete';
      quest.phases.review.status = 'skipped';

      expect(questManager.isQuestComplete(quest)).toBe(true);
    });

    it('should return false when any phase is pending', () => {
      const quest = createQuest('test-id', 'test-folder', 'Test Quest');
      quest.phases.discovery.status = 'complete';
      quest.phases.implementation.status = 'pending';
      quest.phases.testing.status = 'skipped';
      quest.phases.review.status = 'skipped';

      expect(questManager.isQuestComplete(quest)).toBe(false);
    });

    it('should return false when any phase is in_progress', () => {
      const quest = createQuest('test-id', 'test-folder', 'Test Quest');
      quest.phases.discovery.status = 'complete';
      quest.phases.implementation.status = 'in_progress';
      quest.phases.testing.status = 'skipped';
      quest.phases.review.status = 'skipped';

      expect(questManager.isQuestComplete(quest)).toBe(false);
    });
  });

  describe('when quest has tasks', () => {
    it('should return false when tasks are pending even if all phases are complete/skipped', () => {
      const quest = createQuest('test-id', 'test-folder', 'Test Quest');
      quest.tasks = [
        {
          id: 'task-1',
          name: 'Test Task',
          type: 'implementation',
          description: 'Test',
          dependencies: [],
          filesToCreate: [],
          filesToEdit: [],
          status: 'pending',
        },
      ];
      quest.phases.discovery.status = 'complete';
      quest.phases.implementation.status = 'complete';
      quest.phases.testing.status = 'skipped';
      quest.phases.review.status = 'skipped';

      expect(questManager.isQuestComplete(quest)).toBe(false);
    });

    it('should return true when all tasks are complete/skipped and all phases are complete/skipped', () => {
      const quest = createQuest('test-id', 'test-folder', 'Test Quest');
      quest.tasks = [
        {
          id: 'task-1',
          name: 'Test Task 1',
          type: 'implementation',
          description: 'Test',
          dependencies: [],
          filesToCreate: [],
          filesToEdit: [],
          status: 'complete',
        },
        {
          id: 'task-2',
          name: 'Test Task 2',
          type: 'implementation',
          description: 'Test',
          dependencies: [],
          filesToCreate: [],
          filesToEdit: [],
          status: 'skipped',
        },
      ];
      quest.phases.discovery.status = 'complete';
      quest.phases.implementation.status = 'complete';
      quest.phases.testing.status = 'skipped';
      quest.phases.review.status = 'skipped';

      expect(questManager.isQuestComplete(quest)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should return true when quest status is already complete', () => {
      const quest = createQuest('test-id', 'test-folder', 'Test Quest');
      quest.status = 'complete';
      // Even with pending phases/tasks, if quest is marked complete, it's complete
      quest.phases.discovery.status = 'pending';

      expect(questManager.isQuestComplete(quest)).toBe(true);
    });

    it('should return false when quest status is blocked', () => {
      const quest = createQuest('test-id', 'test-folder', 'Test Quest');
      quest.status = 'blocked';

      expect(questManager.isQuestComplete(quest)).toBe(false);
    });

    it('should return false when quest status is abandoned', () => {
      const quest = createQuest('test-id', 'test-folder', 'Test Quest');
      quest.status = 'abandoned';

      expect(questManager.isQuestComplete(quest)).toBe(false);
    });
  });
});
