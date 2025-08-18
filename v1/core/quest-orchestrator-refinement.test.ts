import type { QuestManager } from './quest-manager';
import type { Logger } from '../utils/logger';
import type { FileSystem } from './file-system';
import { QuestOrchestrator } from './quest-orchestrator';
import { EscapeHatchError } from './escape-hatch-error';
import { QuestStub } from '../../tests/stubs/quest.stub';
import {
  createMockQuestManager,
  createMockLogger,
  createMockFileSystem,
} from '../../tests/mocks/create-mocks';

describe('QuestOrchestrator - Refinement Flow', () => {
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
    process.stdin.removeAllListeners('data');
    process.stdin.removeAllListeners('error');
  });

  describe('escape to discovery refinement', () => {
    it('handles escape hatch by requesting refinement instead of blocking', async () => {
      const quest = QuestStub({
        phases: {
          discovery: { status: 'complete' },
          implementation: { status: 'in_progress' },
          testing: { status: 'pending' },
          review: { status: 'pending' },
        },
      });

      const escapeError = new EscapeHatchError({
        reason: 'task_too_complex',
        analysis: 'Task needs to be split into smaller parts',
        recommendation: 'Break down into 3 subtasks',
        retro: 'Underestimated complexity',
      });

      // Mock the phase execution to throw escape hatch on first call, succeed on second
      mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
      mockQuestManager.isQuestComplete
        .mockReturnValueOnce(false) // First check - not complete
        .mockReturnValueOnce(false) // After escape - still not complete
        .mockReturnValueOnce(true); // After refinement - complete

      mockQuestManager.getCurrentPhase
        .mockReturnValueOnce('implementation') // First call - in implementation
        .mockReturnValueOnce('discovery'); // After escape - back to discovery

      mockQuestManager.getQuest.mockReturnValue(quest);
      mockQuestManager.getNextReportNumber.mockReturnValue('1');

      // Spy on executePhase to simulate escape
      const executePhase = jest.spyOn(orchestrator, 'executePhase');
      executePhase
        .mockRejectedValueOnce(escapeError) // Implementation throws escape
        .mockResolvedValueOnce(undefined); // Discovery succeeds

      await orchestrator.runQuest(quest);

      // Verify refinement was added
      expect(quest.refinementRequests).toBeDefined();
      expect(quest.refinementRequests).toHaveLength(1);
      expect(quest.refinementRequests![0]).toMatchObject({
        fromAgent: 'codeweaver',
        finding: 'Task needs to be split into smaller parts',
        suggestion: 'Break down into 3 subtasks',
      });

      // Verify discovery was marked for re-run
      expect(quest.phases.discovery.status).toBe('pending');
      expect(quest.needsRefinement).toBe(true);

      // Verify quest was saved with refinement
      expect(mockQuestManager.saveQuest).toHaveBeenCalledWith(
        expect.objectContaining({
          needsRefinement: true,
          refinementRequests: expect.arrayContaining([
            expect.objectContaining({
              finding: 'Task needs to be split into smaller parts',
            }),
          ]),
        }),
      );

      // Verify logs show refinement instead of blocking
      expect(mockLogger.warn).toHaveBeenCalledWith('Agent requesting refinement: task_too_complex');
      expect(mockLogger.info).toHaveBeenCalledWith('Returning to discovery for refinement...');
    });

    it('continues execution after refinement instead of stopping', async () => {
      const quest = QuestStub({
        phases: {
          discovery: { status: 'complete' },
          implementation: { status: 'in_progress' },
          testing: { status: 'pending' },
          review: { status: 'pending' },
        },
      });

      const escapeError = new EscapeHatchError({
        reason: 'unexpected_dependencies',
        analysis: 'Missing required dependency',
        recommendation: 'Add dependency task',
        retro: 'Dependency not discovered initially',
      });

      mockQuestManager.validateQuestFreshness.mockReturnValue({ isStale: false });
      mockQuestManager.isQuestComplete
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      mockQuestManager.getCurrentPhase
        .mockReturnValueOnce('implementation')
        .mockReturnValueOnce('discovery')
        .mockReturnValueOnce('implementation');

      mockQuestManager.getQuest.mockReturnValue(quest);

      const executePhase = jest.spyOn(orchestrator, 'executePhase');
      executePhase.mockRejectedValueOnce(escapeError).mockResolvedValue(undefined);

      await orchestrator.runQuest(quest);

      // Verify quest completed instead of being blocked
      expect(mockQuestManager.completeQuest).toHaveBeenCalledWith(quest.folder);
      expect(quest.status).not.toBe('blocked');
    });
  });
});
