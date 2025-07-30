import type { QuestManager } from './quest-manager';
import type { FileSystem } from './file-system';
import { ReviewPhaseRunner } from './review-phase-runner';
import { QuestStub } from '../../tests/stubs/quest.stub';
import { createMockQuestManager, createMockFileSystem } from '../../tests/mocks/create-mocks';

describe('ReviewPhaseRunner', () => {
  let mockQuestManager: jest.Mocked<QuestManager>;
  let mockFileSystem: jest.Mocked<FileSystem>;
  let phaseRunner: ReviewPhaseRunner;

  beforeEach(() => {
    mockQuestManager = createMockQuestManager();
    mockFileSystem = createMockFileSystem();
    phaseRunner = new ReviewPhaseRunner(mockQuestManager, mockFileSystem);
  });

  describe('getAgentType()', () => {
    it('returns "lawbringer"', () => {
      expect(phaseRunner.getAgentType()).toBe('lawbringer');
    });
  });

  describe('getPhaseType()', () => {
    it('returns "review"', () => {
      expect(phaseRunner.getPhaseType()).toBe('review');
    });
  });

  describe('canRun()', () => {
    describe('when phase is pending and has changed files', () => {
      it('returns true', () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'complete' },
            testing: { status: 'complete' },
            review: { status: 'pending' },
          },
        });
        mockQuestManager.getChangedFiles.mockReturnValue(['src/api.ts', 'src/ui.tsx']);

        expect(phaseRunner.canRun(quest)).toBe(true);
      });
    });

    describe('when phase is pending but no changed files', () => {
      it('returns false', () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'complete' },
            testing: { status: 'complete' },
            review: { status: 'pending' },
          },
        });
        mockQuestManager.getChangedFiles.mockReturnValue([]);

        expect(phaseRunner.canRun(quest)).toBe(false);
      });
    });

    describe('when phase is not pending', () => {
      it('returns false even with changed files', () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'complete' },
            testing: { status: 'complete' },
            review: { status: 'complete' },
          },
        });
        mockQuestManager.getChangedFiles.mockReturnValue(['src/api.ts', 'src/ui.tsx']);

        expect(phaseRunner.canRun(quest)).toBe(false);
      });
    });
  });

  describe('getAdditionalContext()', () => {
    it('includes questTitle', () => {
      const quest = QuestStub({ title: 'Implement Auth System' });
      mockQuestManager.getChangedFiles.mockReturnValue([]);

      const context = phaseRunner.getAdditionalContext(quest);

      expect(context.questTitle).toBe('Implement Auth System');
    });

    it('includes changedFiles from questManager', () => {
      const quest = QuestStub();
      const changedFiles = ['src/auth.ts', 'src/login.tsx', 'src/logout.tsx'];
      mockQuestManager.getChangedFiles.mockReturnValue(changedFiles);

      const context = phaseRunner.getAdditionalContext(quest);

      expect(context.changedFiles).toBe(changedFiles);
      expect(mockQuestManager.getChangedFiles).toHaveBeenCalledWith(quest.folder);
    });
  });
});
