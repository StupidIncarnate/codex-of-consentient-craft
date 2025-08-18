import type { QuestManager } from './quest-manager';
import type { Logger } from '../utils/logger';
import type { FileSystem } from './file-system';
import { QuestOrchestrator } from './quest-orchestrator';
import { QuestStub } from '../../tests/stubs/quest.stub';
import {
  createMockQuestManager,
  createMockLogger,
  createMockFileSystem,
} from '../../tests/mocks/create-mocks';

describe('QuestOrchestrator', () => {
  let orchestrator: QuestOrchestrator;
  let mockQuestManager: jest.Mocked<QuestManager>;
  let mockLogger: jest.Mocked<Logger>;
  let mockFileSystem: jest.Mocked<FileSystem>;

  beforeEach(() => {
    mockQuestManager = createMockQuestManager();
    mockLogger = createMockLogger();
    mockFileSystem = createMockFileSystem();

    orchestrator = new QuestOrchestrator(mockQuestManager, mockFileSystem, mockLogger);

    // Mock getUserInput to avoid stdin interaction in tests
    jest.spyOn(orchestrator, 'getUserInput').mockResolvedValue('y');
  });

  afterEach(() => {
    // Clean up process.stdin event listeners to prevent memory leaks
    process.stdin.removeAllListeners('data');
    process.stdin.removeAllListeners('error');

    // The global jest.restoreAllMocks() in jest.setup.js handles all mock restoration
    // including process.stdout.write, so we don't need to do it manually here
  });

  describe('runQuest', () => {
    describe('when quest is stale', () => {
      describe('when user chooses to continue', () => {
        it('continues with quest execution', async () => {
          const quest = QuestStub();

          mockQuestManager.validateQuestFreshness.mockReturnValue({
            isStale: true,
            reason: 'Codebase has changed significantly since quest creation',
          });
          mockQuestManager.getQuest.mockReturnValue(quest);
          mockQuestManager.isQuestComplete.mockReturnValue(true);
          mockQuestManager.generateRetrospective.mockReturnValue('retrospective content');
          jest.spyOn(orchestrator, 'getUserInput').mockResolvedValue('y');

          await orchestrator.runQuest(quest);

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

          await orchestrator.runQuest(quest);

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

          await orchestrator.runQuest(quest);

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

          await orchestrator.runQuest(quest);

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

          await expect(orchestrator.runQuest(quest)).rejects.toThrow(
            'Failed to validate quest freshness',
          );
        });
      });
    });

    describe('basic quest completion flow', () => {
      it('completes quest when isQuestComplete returns true', async () => {
        const quest = QuestStub();

        mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
        mockQuestManager.getQuest.mockReturnValue(quest);
        mockQuestManager.isQuestComplete.mockReturnValue(true);
        mockQuestManager.generateRetrospective.mockReturnValue('retrospective content');

        await orchestrator.runQuest(quest);

        expect(mockQuestManager.completeQuest).toHaveBeenCalledWith(quest.folder);
      });
    });

    describe('blocked quest handling', () => {
      it('prompts to resume blocked quest', async () => {
        const blockedQuest = QuestStub({ status: 'blocked' });

        mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
        jest.spyOn(orchestrator, 'getUserInput').mockResolvedValue('y');
        mockQuestManager.isQuestComplete.mockReturnValue(true);

        await orchestrator.runQuest(blockedQuest);

        expect(mockLogger.yellow).toHaveBeenCalledWith('Quest is blocked');
        expect(blockedQuest.status).toBe('in_progress');
      });

      it('returns without running if user declines to resume', async () => {
        const blockedQuest = QuestStub({ status: 'blocked' });

        mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
        jest.spyOn(orchestrator, 'getUserInput').mockResolvedValue('n');

        await orchestrator.runQuest(blockedQuest);

        expect(mockQuestManager.isQuestComplete).not.toHaveBeenCalled();
      });
    });
  });
});
