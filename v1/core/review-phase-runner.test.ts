import type { QuestManager } from './quest-manager';
import type { FileSystem } from './file-system';
import type { Logger } from '../utils/logger';
import { ReviewPhaseRunner } from './review-phase-runner';
import { QuestStub } from '../../tests/stubs/quest.stub';
import { AgentReportStub } from '../../tests/stubs/agent-report.stub';
import {
  createMockQuestManager,
  createMockFileSystem,
  createMockLogger,
} from '../../tests/mocks/create-mocks';

describe('ReviewPhaseRunner', () => {
  let mockQuestManager: jest.Mocked<QuestManager>;
  let mockFileSystem: jest.Mocked<FileSystem>;
  let mockLogger: jest.Mocked<Logger>;
  let phaseRunner: ReviewPhaseRunner;

  beforeEach(() => {
    mockQuestManager = createMockQuestManager();
    mockFileSystem = createMockFileSystem();
    mockLogger = createMockLogger();
    phaseRunner = new ReviewPhaseRunner(mockQuestManager, mockFileSystem, mockLogger);
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
        expect(mockQuestManager.getChangedFiles).toHaveBeenCalledWith(quest.folder);
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
        expect(mockQuestManager.getChangedFiles).toHaveBeenCalledWith(quest.folder);
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
        expect(mockQuestManager.getChangedFiles).toHaveBeenCalledWith(quest.folder);
      });
    });

    describe('when phase is in_progress', () => {
      it('returns false even with changed files', () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'complete' },
            testing: { status: 'complete' },
            review: { status: 'in_progress' },
          },
        });
        mockQuestManager.getChangedFiles.mockReturnValue(['src/api.ts', 'src/ui.tsx']);

        expect(phaseRunner.canRun(quest)).toBe(false);
        expect(mockQuestManager.getChangedFiles).toHaveBeenCalledWith(quest.folder);
      });
    });
  });

  describe('getAdditionalContext()', () => {
    it('returns object with questTitle and changedFiles', () => {
      const quest = QuestStub({
        title: 'Implement Auth System',
        folder: 'quests/2024-01-01-auth-system',
      });
      const changedFiles = ['src/auth.ts', 'src/login.tsx', 'src/logout.tsx'];
      mockQuestManager.getChangedFiles.mockReturnValue(changedFiles);

      const context = phaseRunner.getAdditionalContext(quest);

      expect(context).toStrictEqual({
        questTitle: 'Implement Auth System',
        changedFiles: ['src/auth.ts', 'src/login.tsx', 'src/logout.tsx'],
      });
      expect(mockQuestManager.getChangedFiles).toHaveBeenCalledWith(
        'quests/2024-01-01-auth-system',
      );
    });

    it('returns object with empty changedFiles array when no files changed', () => {
      const quest = QuestStub({
        title: 'Update Documentation',
        folder: 'quests/2024-01-02-update-docs',
      });
      mockQuestManager.getChangedFiles.mockReturnValue([]);

      const context = phaseRunner.getAdditionalContext(quest);

      expect(context).toStrictEqual({
        questTitle: 'Update Documentation',
        changedFiles: [],
      });
      expect(mockQuestManager.getChangedFiles).toHaveBeenCalledWith(
        'quests/2024-01-02-update-docs',
      );
    });
  });

  describe('processAgentReport()', () => {
    it('does nothing with the report', () => {
      const quest = QuestStub();
      const report = AgentReportStub({
        agentType: 'lawbringer',
        status: 'complete',
      });

      // Should not throw and does nothing
      expect(() => phaseRunner.processAgentReport(quest, report)).not.toThrow();
    });
  });
});
