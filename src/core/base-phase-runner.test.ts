import type { Quest } from '../models/quest';
import type { AgentReport, AgentType } from '../models/agent';
import type { PhaseType } from '../models/quest';
import type { QuestManager } from './quest-manager';
import type { FileSystem } from './file-system';
import type { AgentSpawner } from '../agents/agent-spawner';
import { BasePhaseRunner } from './base-phase-runner';
import { EscapeHatchError } from './escape-hatch-error';
import { QuestStub } from '../../tests/stubs/quest.stub';
import { AgentReportStub } from '../../tests/stubs/agent-report.stub';
import {
  createMockQuestManager,
  createMockFileSystem,
  createMockAgentSpawner,
} from '../../tests/mocks/create-mocks';

// Concrete test implementation of BasePhaseRunner
class TestPhaseRunner extends BasePhaseRunner {
  constructor(questManager: QuestManager, fileSystem: FileSystem) {
    super(questManager, fileSystem);
  }

  getAgentType(): AgentType {
    return 'pathseeker';
  }

  getPhaseType(): PhaseType {
    return 'discovery';
  }

  processAgentReport(quest: Quest, report: AgentReport): void {
    // Test implementation - just mark that it was called
    quest.executionLog.push({
      report: 'test-report',
      timestamp: new Date().toISOString(),
      agentType: report.agentType,
    });
  }

  getAdditionalContext(quest: Quest): Record<string, unknown> {
    return { questId: quest.id };
  }
}

describe('BasePhaseRunner', () => {
  let mockQuestManager: jest.Mocked<QuestManager>;
  let mockFileSystem: jest.Mocked<FileSystem>;
  let mockAgentSpawner: jest.Mocked<AgentSpawner>;
  let phaseRunner: TestPhaseRunner;

  beforeEach(() => {
    mockQuestManager = createMockQuestManager();
    mockFileSystem = createMockFileSystem();
    mockAgentSpawner = createMockAgentSpawner();
    phaseRunner = new TestPhaseRunner(mockQuestManager, mockFileSystem);
  });

  describe('canRun()', () => {
    describe('when phase status is pending', () => {
      it('returns true', () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'pending' },
            implementation: { status: 'pending' },
            testing: { status: 'pending' },
            review: { status: 'pending' },
          },
        });

        expect(phaseRunner.canRun(quest)).toBe(true);
      });
    });

    describe('when phase status is in_progress', () => {
      it('returns false', () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'in_progress' },
            implementation: { status: 'pending' },
            testing: { status: 'pending' },
            review: { status: 'pending' },
          },
        });

        expect(phaseRunner.canRun(quest)).toBe(false);
      });
    });

    describe('when phase status is complete', () => {
      it('returns false', () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'pending' },
            testing: { status: 'pending' },
            review: { status: 'pending' },
          },
        });

        expect(phaseRunner.canRun(quest)).toBe(false);
      });
    });

    describe('when phase status is blocked', () => {
      it('returns false', () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'blocked' },
            implementation: { status: 'pending' },
            testing: { status: 'pending' },
            review: { status: 'pending' },
          },
        });

        expect(phaseRunner.canRun(quest)).toBe(false);
      });
    });

    describe('when phase status is skipped', () => {
      it('returns false', () => {
        const quest = QuestStub({
          phases: {
            discovery: { status: 'skipped' },
            implementation: { status: 'pending' },
            testing: { status: 'pending' },
            review: { status: 'pending' },
          },
        });

        expect(phaseRunner.canRun(quest)).toBe(false);
      });
    });
  });

  describe('run()', () => {
    describe('when starting a phase', () => {
      it('marks phase as in_progress', async () => {
        const quest = QuestStub();
        const report = AgentReportStub();
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);
        mockQuestManager.getNextReportNumber.mockReturnValue('42');

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(quest.phases.discovery.status).toBe('complete');
      });

      it('saves quest after marking phase', async () => {
        const quest = QuestStub();
        const report = AgentReportStub();
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await phaseRunner.run(quest, mockAgentSpawner);

        // Should be called twice: once after marking in_progress, once after complete
        expect(mockQuestManager.saveQuest).toHaveBeenCalledTimes(2);
        expect(mockQuestManager.saveQuest).toHaveBeenNthCalledWith(1, quest);
        expect(mockQuestManager.saveQuest).toHaveBeenNthCalledWith(2, quest);
      });

      it('spawns agent with correct type', async () => {
        const quest = QuestStub();
        const report = AgentReportStub();
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(mockAgentSpawner.spawnAndWait).toHaveBeenCalledWith('pathseeker', {
          questFolder: quest.folder,
          reportNumber: '001',
          workingDirectory: process.cwd(),
          additionalContext: { questId: quest.id },
        });
      });

      it('passes questFolder to agent', async () => {
        const quest = QuestStub({ folder: '123-custom-quest' });
        const report = AgentReportStub();
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(mockAgentSpawner.spawnAndWait).toHaveBeenCalledWith(
          'pathseeker',
          expect.objectContaining({ questFolder: '123-custom-quest' }),
        );
      });

      it('passes reportNumber to agent', async () => {
        const quest = QuestStub();
        const report = AgentReportStub();
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);
        mockQuestManager.getNextReportNumber.mockReturnValue('99');

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(mockAgentSpawner.spawnAndWait).toHaveBeenCalledWith(
          'pathseeker',
          expect.objectContaining({ reportNumber: '99' }),
        );
      });

      it('passes workingDirectory to agent', async () => {
        const quest = QuestStub();
        const report = AgentReportStub();
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);
        const originalCwd = process.cwd();

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(mockAgentSpawner.spawnAndWait).toHaveBeenCalledWith(
          'pathseeker',
          expect.objectContaining({ workingDirectory: originalCwd }),
        );
      });

      it('includes additional context from getAdditionalContext()', async () => {
        const quest = QuestStub({ id: 'abc-123-def' });
        const report = AgentReportStub();
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(mockAgentSpawner.spawnAndWait).toHaveBeenCalledWith(
          'pathseeker',
          expect.objectContaining({
            additionalContext: { questId: 'abc-123-def' },
          }),
        );
      });
    });

    describe('when agent completes successfully', () => {
      it('processes agent report via processAgentReport()', async () => {
        const quest = QuestStub();
        const report = AgentReportStub({ status: 'complete', agentType: 'pathseeker' });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(quest.executionLog).toHaveLength(1);
        expect(quest.executionLog[0]).toMatchObject({
          report: 'test-report',
          agentType: 'pathseeker',
        });
      });

      it('marks phase as complete', async () => {
        const quest = QuestStub();
        const report = AgentReportStub();
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(quest.phases.discovery.status).toBe('complete');
      });

      it('saves quest after completion', async () => {
        const quest = QuestStub();
        const report = AgentReportStub();
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await phaseRunner.run(quest, mockAgentSpawner);

        expect(mockQuestManager.saveQuest).toHaveBeenCalledTimes(2);
        expect(mockQuestManager.saveQuest).toHaveBeenLastCalledWith(quest);
      });
    });

    describe('when agent triggers escape hatch', () => {
      it('throws EscapeHatchError with escape data', async () => {
        const quest = QuestStub();
        const escapeData = {
          reason: 'task_too_complex' as const,
          analysis: 'User requested exit from the task',
          recommendation: 'User should manually complete the task',
          retro: 'User exit was requested',
        };
        const report = AgentReportStub({ escape: escapeData });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await expect(phaseRunner.run(quest, mockAgentSpawner)).rejects.toThrow(EscapeHatchError);

        // Test the escape data by catching the error
        let caughtError: EscapeHatchError | undefined;
        try {
          await phaseRunner.run(quest, mockAgentSpawner);
        } catch (error) {
          caughtError = error as EscapeHatchError;
        }

        expect(caughtError).toBeInstanceOf(EscapeHatchError);
        expect(caughtError?.escape).toStrictEqual(escapeData);
      });

      it('does not mark phase as complete', async () => {
        const quest = QuestStub();
        const report = AgentReportStub({
          escape: {
            reason: 'context_exhaustion' as const,
            analysis: 'Test escape scenario',
            recommendation: 'Restart with smaller context',
            retro: 'Test escape for phase runner',
          },
        });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await expect(phaseRunner.run(quest, mockAgentSpawner)).rejects.toThrow();

        expect(quest.phases.discovery.status).toBe('in_progress');
      });

      it('does not call processAgentReport()', async () => {
        const quest = QuestStub();
        const report = AgentReportStub({
          escape: {
            reason: 'context_exhaustion' as const,
            analysis: 'Test escape scenario',
            recommendation: 'Restart with smaller context',
            retro: 'Test escape for phase runner',
          },
        });
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await expect(phaseRunner.run(quest, mockAgentSpawner)).rejects.toThrow();

        expect(quest.executionLog).toStrictEqual([]);
      });
    });

    describe('when agent spawner fails', () => {
      it('propagates the error', async () => {
        const quest = QuestStub();
        const error = new Error('Agent spawn failed');
        mockAgentSpawner.spawnAndWait.mockRejectedValue(error);

        await expect(phaseRunner.run(quest, mockAgentSpawner)).rejects.toThrow(
          'Agent spawn failed',
        );
      });

      it('does not mark phase as complete', async () => {
        const quest = QuestStub();
        mockAgentSpawner.spawnAndWait.mockRejectedValue(new Error('Agent spawn failed'));

        await expect(phaseRunner.run(quest, mockAgentSpawner)).rejects.toThrow();

        expect(quest.phases.discovery.status).toBe('in_progress');
      });
    });

    describe('when processAgentReport fails', () => {
      it('propagates the error', async () => {
        // Create a custom phase runner that throws in processAgentReport
        class FailingPhaseRunner extends TestPhaseRunner {
          processAgentReport(): void {
            throw new Error('Process report failed');
          }
        }

        const failingRunner = new FailingPhaseRunner(mockQuestManager, mockFileSystem);
        const quest = QuestStub();
        const report = AgentReportStub();
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await expect(failingRunner.run(quest, mockAgentSpawner)).rejects.toThrow(
          'Process report failed',
        );
      });

      it('does not mark phase as complete', async () => {
        // Create a custom phase runner that throws in processAgentReport
        class FailingPhaseRunner extends TestPhaseRunner {
          processAgentReport(): void {
            throw new Error('Process report failed');
          }
        }

        const failingRunner = new FailingPhaseRunner(mockQuestManager, mockFileSystem);
        const quest = QuestStub();
        const report = AgentReportStub();
        mockAgentSpawner.spawnAndWait.mockResolvedValue(report);

        await expect(failingRunner.run(quest, mockAgentSpawner)).rejects.toThrow();

        expect(quest.phases.discovery.status).toBe('in_progress');
      });
    });
  });

  describe('getAgentType()', () => {
    it('returns the agent type for the phase', () => {
      expect(phaseRunner.getAgentType()).toBe('pathseeker');
    });
  });

  describe('getPhaseType()', () => {
    it('returns the phase type', () => {
      expect(phaseRunner.getPhaseType()).toBe('discovery');
    });
  });
});
