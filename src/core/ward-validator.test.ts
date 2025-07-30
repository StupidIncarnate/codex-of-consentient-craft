import { WardValidator } from './ward-validator';
import type { Quest } from '../models/quest';
import type { AgentSpawner } from '../agents/agent-spawner';
import type { FileSystem } from './file-system';
import type { Logger } from '../utils/logger';
import type { QuestManager } from './quest-manager';
import { QuestStub } from '../../tests/stubs/quest.stub';
import { AgentReportStub } from '../../tests/stubs/agent-report.stub';
import {
  createMockAgentSpawner,
  createMockFileSystem,
  createMockLogger,
  createMockQuestManager,
} from '../../tests/mocks/create-mocks';
import { execSync } from 'child_process';

describe('WardValidator', () => {
  let wardValidator: WardValidator;
  let mockFileSystem: jest.Mocked<FileSystem>;
  let mockLogger: jest.Mocked<Logger>;
  let mockExecCommand: jest.Mock<typeof execSync>;

  beforeEach(() => {
    mockFileSystem = createMockFileSystem();
    mockLogger = createMockLogger();
    mockExecCommand = jest.fn() as unknown as jest.Mock<typeof execSync>;

    wardValidator = new WardValidator(
      mockFileSystem,
      mockLogger,
      mockExecCommand as unknown as typeof execSync,
    );
  });

  describe('validate()', () => {
    describe('when ward command succeeds', () => {
      it('returns success with no errors', () => {
        mockExecCommand.mockReturnValue(Buffer.from('') as never);

        const result = wardValidator.validate();

        expect(result).toStrictEqual({ success: true });
      });

      it('executes npm run ward:all with pipe stdio', () => {
        mockExecCommand.mockReturnValue(Buffer.from('') as never);

        wardValidator.validate();

        expect(mockExecCommand).toHaveBeenCalledWith('npm run ward:all', { stdio: 'pipe' });
      });

      it('logs validation start message', () => {
        mockExecCommand.mockReturnValue(Buffer.from('') as never);

        wardValidator.validate();

        expect(mockLogger.info).toHaveBeenCalledWith('[🎲] 🛡️ Running ward validation...');
      });
    });

    describe('when ward command fails', () => {
      it('returns failure with error message', () => {
        const error = new Error('Command failed');
        Object.assign(error, { stderr: Buffer.from('Lint errors found') });
        mockExecCommand.mockImplementation(() => {
          throw error;
        });

        const result = wardValidator.validate();

        expect(result).toStrictEqual({ success: false, errors: 'Lint errors found' });
      });

      it('logs error message', () => {
        const error = new Error('Command failed');
        Object.assign(error, { stderr: Buffer.from('Type errors') });
        mockExecCommand.mockImplementation(() => {
          throw error;
        });

        wardValidator.validate();

        expect(mockLogger.error).toHaveBeenCalledWith('Ward failed: Type errors');
      });

      describe('when error has stderr', () => {
        it('includes stderr in error message', () => {
          const error = new Error('Command failed');
          Object.assign(error, { stderr: Buffer.from('ESLint errors') });
          mockExecCommand.mockImplementation(() => {
            throw error;
          });

          const result = wardValidator.validate();

          expect(result.errors).toBe('ESLint errors');
        });
      });

      describe('when error has no stderr', () => {
        it('uses error message as fallback', () => {
          const error = new Error('Command not found');
          mockExecCommand.mockImplementation(() => {
            throw error;
          });

          const result = wardValidator.validate();

          expect(result.errors).toBe('Command not found');
        });
      });
    });

    describe('when ward command throws', () => {
      it('returns failure with thrown error message', () => {
        mockExecCommand.mockImplementation(() => {
          throw new Error('Unexpected error');
        });

        const result = wardValidator.validate();

        expect(result).toStrictEqual({ success: false, errors: 'Unexpected error' });
      });
    });
  });

  describe('handleFailure()', () => {
    let mockAgentSpawner: jest.Mocked<AgentSpawner>;
    let mockQuestManager: jest.Mocked<QuestManager>;
    let quest: Quest;

    beforeEach(() => {
      mockAgentSpawner = createMockAgentSpawner();
      mockQuestManager = createMockQuestManager();
      quest = QuestStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        folder: '001-test-quest',
      });

      // Mock successful validation after spiritmender by default
      mockExecCommand
        .mockImplementationOnce(() => {
          throw new Error('Ward failed');
        }) // Initial failure
        .mockReturnValue(Buffer.from('') as never); // Success after spiritmender
    });

    describe('when no previous attempts exist', () => {
      beforeEach(() => {
        // Override mock setup for tests that call handleFailure() directly
        // These tests expect spiritmender to fix the issue, so validate() should succeed
        mockExecCommand.mockReset();
        mockExecCommand.mockReturnValue(Buffer.from('') as never);
      });

      it('initializes spiritmender tracking objects', async () => {
        quest.spiritmenderAttempts = undefined;
        quest.spiritmenderErrors = undefined;

        await wardValidator.handleFailure(
          quest,
          'error details',
          mockAgentSpawner,
          mockQuestManager,
        );

        expect(quest.spiritmenderAttempts).toBeDefined();
        expect(quest.spiritmenderErrors).toBeDefined();
      });

      it('spawns spiritmender with attempt 1 strategy', async () => {
        mockQuestManager.getNextReportNumber.mockReturnValue('5');

        await wardValidator.handleFailure(
          quest,
          'error details',
          mockAgentSpawner,
          mockQuestManager,
        );

        expect(mockAgentSpawner.spawnAndWait).toHaveBeenCalledWith('spiritmender', {
          questFolder: '001-test-quest',
          reportNumber: '5',
          workingDirectory: process.cwd(),
          additionalContext: {
            errors: 'error details',
            attemptNumber: 1,
            previousErrors: [],
            attemptStrategy: 'basic_fixes: Focus on imports, syntax errors, and basic type issues',
            taskId: 'global',
          },
        });
      });

      it('saves ward errors to file with correct metadata', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-01-01T12:00:00.000Z'));

        await wardValidator.handleFailure(
          quest,
          'error details',
          mockAgentSpawner,
          mockQuestManager,
        );

        expect(mockFileSystem.appendFile).toHaveBeenCalledWith(
          'questmaestro/active/001-test-quest/ward-errors-unresolved.txt',
          `[2023-01-01T12:00:00.000Z] [attempt-1] [task-global] error details\n${'='.repeat(80)}\n`,
        );
      });

      it('updates quest spiritmender attempts to 1', async () => {
        await wardValidator.handleFailure(
          quest,
          'error details',
          mockAgentSpawner,
          mockQuestManager,
        );

        expect(quest.spiritmenderAttempts!['global']).toBe(1);
      });

      it('adds errors to quest spiritmender errors', async () => {
        await wardValidator.handleFailure(
          quest,
          'error details',
          mockAgentSpawner,
          mockQuestManager,
        );

        expect(quest.spiritmenderErrors!['global']).toStrictEqual(['error details']);
      });

      describe('when spiritmender fixes errors', () => {
        it('cleans resolved errors from tracking file', async () => {
          mockFileSystem.readFile.mockReturnValue({
            success: true,
            data:
              '[2023-01-01T12:00:00.000Z] [attempt-1] [task-global] error\n' +
              '================================================================================\n' +
              '[2023-01-01T12:01:00.000Z] [attempt-1] [task-other] other error\n' +
              '================================================================================\n',
          });

          await wardValidator.handleFailure(
            quest,
            'error details',
            mockAgentSpawner,
            mockQuestManager,
          );

          expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
            'questmaestro/active/001-test-quest/ward-errors-unresolved.txt',
            '[2023-01-01T12:01:00.000Z] [attempt-1] [task-other] other error\n' +
              '================================================================================\n',
          );
        });

        it('logs success message', async () => {
          await wardValidator.handleFailure(
            quest,
            'error details',
            mockAgentSpawner,
            mockQuestManager,
          );

          expect(mockLogger.success).toHaveBeenCalledWith(
            '[🎁] ✅ Ward validation passed after Spiritmender attempt 1!',
          );
        });
      });

      describe('when spiritmender cannot fix errors', () => {
        it('recursively calls handleFailure for retry', async () => {
          // Mock continued failures
          mockExecCommand.mockImplementation(() => {
            throw new Error('Still failing');
          });
          const handleFailureSpy = jest.spyOn(wardValidator, 'handleFailure');

          await expect(
            wardValidator.handleFailure(quest, 'error details', mockAgentSpawner, mockQuestManager),
          ).rejects.toThrow();

          // Should be called 3 times (initial + 2 retries) before blocking
          expect(handleFailureSpy).toHaveBeenCalledTimes(3);
        });
      });
    });

    describe('when 1 previous attempt exists', () => {
      beforeEach(() => {
        quest.spiritmenderAttempts = { global: 1 };
        quest.spiritmenderErrors = { global: ['first error'] };
        // Override mock setup for tests that call handleFailure() directly
        mockExecCommand.mockReset();
        mockExecCommand.mockReturnValue(Buffer.from('') as never);
      });

      it('spawns spiritmender with attempt 2 strategy', async () => {
        mockQuestManager.getNextReportNumber.mockReturnValue('6');

        await wardValidator.handleFailure(
          quest,
          'second error',
          mockAgentSpawner,
          mockQuestManager,
        );

        expect(mockAgentSpawner.spawnAndWait).toHaveBeenCalledWith('spiritmender', {
          questFolder: '001-test-quest',
          reportNumber: '6',
          workingDirectory: process.cwd(),
          additionalContext: {
            errors: 'second error',
            attemptNumber: 2,
            previousErrors: ['first error'],
            attemptStrategy:
              'deeper_analysis: Analyze logic errors, test expectations, and component interactions',
            taskId: 'global',
          },
        });
      });

      it('includes previous errors in context', async () => {
        await wardValidator.handleFailure(
          quest,
          'second error',
          mockAgentSpawner,
          mockQuestManager,
        );

        const spawnCall = mockAgentSpawner.spawnAndWait.mock.calls[0];
        const context = spawnCall[1] as { additionalContext: { previousErrors: string[] } };
        expect(context.additionalContext.previousErrors).toStrictEqual(['first error']);
      });

      it('updates quest spiritmender attempts to 2', async () => {
        await wardValidator.handleFailure(
          quest,
          'second error',
          mockAgentSpawner,
          mockQuestManager,
        );

        expect(quest.spiritmenderAttempts!['global']).toBe(2);
      });
    });

    describe('when 2 previous attempts exist', () => {
      beforeEach(() => {
        quest.spiritmenderAttempts = { global: 2 };
        quest.spiritmenderErrors = { global: ['first error', 'second error'] };
        // Override mock setup for tests that call handleFailure() directly
        mockExecCommand.mockReset();
        mockExecCommand.mockReturnValue(Buffer.from('') as never);
      });

      it('spawns spiritmender with attempt 3 strategy', async () => {
        await wardValidator.handleFailure(quest, 'third error', mockAgentSpawner, mockQuestManager);

        expect(mockAgentSpawner.spawnAndWait).toHaveBeenCalledWith(
          'spiritmender',
          expect.objectContaining({
            additionalContext: expect.objectContaining({
              attemptNumber: 3,
              attemptStrategy:
                'last_resort: Consider refactoring approach and questioning assumptions',
            }),
          }),
        );
      });

      describe('when spiritmender still cannot fix', () => {
        beforeEach(() => {
          // Mock continued failures for all attempts
          mockExecCommand.mockImplementation(() => {
            throw new Error('Still failing');
          });
        });

        it('blocks quest after 3rd failure', async () => {
          await expect(
            wardValidator.handleFailure(quest, 'third error', mockAgentSpawner, mockQuestManager),
          ).rejects.toThrow('Quest blocked: Spiritmender failed after 3 attempts');

          expect(quest.status).toBe('blocked');
        });

        it('throws error with max attempts message', async () => {
          await expect(
            wardValidator.handleFailure(quest, 'third error', mockAgentSpawner, mockQuestManager),
          ).rejects.toThrow('Quest blocked: Spiritmender failed after 3 attempts');
        });

        it('saves quest with blocked status', async () => {
          try {
            await wardValidator.handleFailure(
              quest,
              'third error',
              mockAgentSpawner,
              mockQuestManager,
            );
          } catch {}

          expect(mockQuestManager.saveQuest).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'blocked' }),
          );
        });
      });
    });

    describe('when max attempts already reached', () => {
      beforeEach(() => {
        quest.spiritmenderAttempts = { global: 3 };
      });

      it('blocks quest immediately without spawning spiritmender', async () => {
        await expect(
          wardValidator.handleFailure(quest, 'another error', mockAgentSpawner, mockQuestManager),
        ).rejects.toThrow();

        expect(mockAgentSpawner.spawnAndWait).not.toHaveBeenCalled();
        expect(quest.status).toBe('blocked');
      });

      it('throws error indicating max attempts reached', async () => {
        await expect(
          wardValidator.handleFailure(quest, 'another error', mockAgentSpawner, mockQuestManager),
        ).rejects.toThrow('Quest blocked: Max Spiritmender attempts reached for task global');
      });
    });

    describe('when taskId is provided', () => {
      beforeEach(() => {
        // Override mock setup for tests that call handleFailure() directly
        mockExecCommand.mockReset();
        mockExecCommand.mockReturnValue(Buffer.from('') as never);
      });

      it('tracks attempts per task', async () => {
        await wardValidator.handleFailure(
          quest,
          'task error',
          mockAgentSpawner,
          mockQuestManager,
          'task-123',
        );

        expect(quest.spiritmenderAttempts!['task-123']).toBe(1);
        expect(quest.spiritmenderAttempts!['global']).toBeUndefined();
      });

      it('saves errors with task-specific metadata', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-01-01T12:00:00.000Z'));

        await wardValidator.handleFailure(
          quest,
          'task error',
          mockAgentSpawner,
          mockQuestManager,
          'task-123',
        );

        expect(mockFileSystem.appendFile).toHaveBeenCalledWith(
          'questmaestro/active/001-test-quest/ward-errors-unresolved.txt',
          '[2023-01-01T12:00:00.000Z] [attempt-1] [task-task-123] task error\n' +
            '================================================================================\n',
        );
      });
    });

    describe('when taskId is not provided', () => {
      beforeEach(() => {
        // Override mock setup for tests that call handleFailure() directly
        mockExecCommand.mockReset();
        mockExecCommand.mockReturnValue(Buffer.from('') as never);
      });

      it('uses "global" as default taskId', async () => {
        await wardValidator.handleFailure(quest, 'error', mockAgentSpawner, mockQuestManager);

        expect(quest.spiritmenderAttempts!['global']).toBe(1);
        expect(mockAgentSpawner.spawnAndWait).toHaveBeenCalledWith(
          'spiritmender',
          expect.objectContaining({
            additionalContext: expect.objectContaining({
              taskId: 'global',
            }),
          }),
        );
      });
    });
  });

  describe('saveWardErrors()', () => {
    describe('when error file does not exist', () => {
      it('creates new file with error entry', () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-01-01T12:00:00.000Z'));
        mockFileSystem.appendFile.mockReturnValue({ success: true });

        // Access private method through prototype
        const saveWardErrors = WardValidator.prototype['saveWardErrors'];
        saveWardErrors.call(
          { fileSystem: mockFileSystem, logger: mockLogger },
          'questmaestro/active/001',
          'error msg',
          'task-1',
          1,
        );

        expect(mockFileSystem.appendFile).toHaveBeenCalledWith(
          'questmaestro/active/001/ward-errors-unresolved.txt',
          '[2023-01-01T12:00:00.000Z] [attempt-1] [task-task-1] error msg\n' +
            '================================================================================\n',
        );
      });
    });

    describe('when error file exists', () => {
      it('appends error entry to existing file', () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-01-01T13:00:00.000Z'));
        mockFileSystem.appendFile.mockReturnValue({ success: true });

        const saveWardErrors = WardValidator.prototype['saveWardErrors'];
        saveWardErrors.call(
          { fileSystem: mockFileSystem, logger: mockLogger },
          'questmaestro/active/002',
          'new error',
          'global',
          2,
        );

        expect(mockFileSystem.appendFile).toHaveBeenCalledWith(
          'questmaestro/active/002/ward-errors-unresolved.txt',
          '[2023-01-01T13:00:00.000Z] [attempt-2] [task-global] new error\n' +
            '================================================================================\n',
        );
      });
    });

    describe('error entry format', () => {
      beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-12-25T10:30:45.123Z'));
        mockFileSystem.appendFile.mockReturnValue({ success: true });
      });

      it('includes ISO timestamp', () => {
        const saveWardErrors = WardValidator.prototype['saveWardErrors'];
        saveWardErrors.call(
          { fileSystem: mockFileSystem, logger: mockLogger },
          'path',
          'error',
          'task',
          1,
        );

        const call = mockFileSystem.appendFile.mock.calls[0];
        expect(call[1]).toContain('[2023-12-25T10:30:45.123Z]');
      });

      it('includes attempt number', () => {
        const saveWardErrors = WardValidator.prototype['saveWardErrors'];
        saveWardErrors.call(
          { fileSystem: mockFileSystem, logger: mockLogger },
          'path',
          'error',
          'task',
          3,
        );

        const call = mockFileSystem.appendFile.mock.calls[0];
        expect(call[1]).toContain('[attempt-3]');
      });

      it('includes task ID', () => {
        const saveWardErrors = WardValidator.prototype['saveWardErrors'];
        saveWardErrors.call(
          { fileSystem: mockFileSystem, logger: mockLogger },
          'path',
          'error',
          'my-task-id',
          1,
        );

        const call = mockFileSystem.appendFile.mock.calls[0];
        expect(call[1]).toContain('[task-my-task-id]');
      });

      it('includes error message', () => {
        const saveWardErrors = WardValidator.prototype['saveWardErrors'];
        saveWardErrors.call(
          { fileSystem: mockFileSystem, logger: mockLogger },
          'path',
          'Custom error message',
          'task',
          1,
        );

        const call = mockFileSystem.appendFile.mock.calls[0];
        expect(call[1]).toContain('Custom error message');
      });

      it('adds separator line', () => {
        const saveWardErrors = WardValidator.prototype['saveWardErrors'];
        saveWardErrors.call(
          { fileSystem: mockFileSystem, logger: mockLogger },
          'path',
          'error',
          'task',
          1,
        );

        const call = mockFileSystem.appendFile.mock.calls[0];
        expect(call[1]).toContain('='.repeat(80));
      });
    });

    describe('when file write fails', () => {
      it('logs error but does not throw', () => {
        mockFileSystem.appendFile.mockReturnValue({ success: false, error: 'Write failed' });

        const saveWardErrors = WardValidator.prototype['saveWardErrors'];

        expect(() => {
          saveWardErrors.call(
            { fileSystem: mockFileSystem, logger: mockLogger },
            'path',
            'error',
            'task',
            1,
          );
        }).not.toThrow();

        expect(mockLogger.error).toHaveBeenCalledWith('Failed to save ward errors: Write failed');
      });
    });
  });

  describe('cleanResolvedWardErrors()', () => {
    describe('when error file exists', () => {
      describe('with errors for specified task', () => {
        const fileContent =
          '[2023-01-01T12:00:00.000Z] [attempt-1] [task-task-123] error one\n' +
          '================================================================================\n' +
          '[2023-01-01T12:01:00.000Z] [attempt-1] [task-other] other error\n' +
          '================================================================================\n' +
          '[2023-01-01T12:02:00.000Z] [attempt-2] [task-task-123] error two\n' +
          '================================================================================\n';

        beforeEach(() => {
          mockFileSystem.readFile.mockReturnValue({ success: true, data: fileContent });
          mockFileSystem.writeFile.mockReturnValue({ success: true });
        });

        it('removes lines containing task ID', () => {
          const cleanResolvedWardErrors = WardValidator.prototype['cleanResolvedWardErrors'];
          cleanResolvedWardErrors.call(
            { fileSystem: mockFileSystem },
            'questmaestro/active/001',
            'task-123',
          );

          const writtenContent = mockFileSystem.writeFile.mock.calls[0][1];
          expect(writtenContent).not.toContain('[task-task-123]');
        });

        it('removes associated separator lines', () => {
          const cleanResolvedWardErrors = WardValidator.prototype['cleanResolvedWardErrors'];
          cleanResolvedWardErrors.call(
            { fileSystem: mockFileSystem },
            'questmaestro/active/001',
            'task-123',
          );

          const writtenContent = mockFileSystem.writeFile.mock.calls[0][1];
          const lines = writtenContent.split('\n');
          // Should only have 2 separator lines (for 'other' task)
          const separatorCount = lines.filter((line) => line.startsWith('='.repeat(80))).length;
          expect(separatorCount).toBe(1);
        });

        it('preserves errors for other tasks', () => {
          const cleanResolvedWardErrors = WardValidator.prototype['cleanResolvedWardErrors'];
          cleanResolvedWardErrors.call(
            { fileSystem: mockFileSystem },
            'questmaestro/active/001',
            'task-123',
          );

          const writtenContent = mockFileSystem.writeFile.mock.calls[0][1];
          expect(writtenContent).toContain('[task-other] other error');
        });
      });

      describe('with no errors for specified task', () => {
        it('leaves file unchanged', () => {
          const fileContent =
            '[2023-01-01T12:00:00.000Z] [attempt-1] [task-other] other error\n' +
            '================================================================================\n';

          mockFileSystem.readFile.mockReturnValue({ success: true, data: fileContent });

          const cleanResolvedWardErrors = WardValidator.prototype['cleanResolvedWardErrors'];
          cleanResolvedWardErrors.call(
            { fileSystem: mockFileSystem },
            'questmaestro/active/001',
            'non-existent-task',
          );

          expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
            'questmaestro/active/001/ward-errors-unresolved.txt',
            fileContent,
          );
        });
      });
    });

    describe('when error file does not exist', () => {
      it('does not throw error', () => {
        mockFileSystem.readFile.mockReturnValue({ success: false, error: 'File not found' });

        const cleanResolvedWardErrors = WardValidator.prototype['cleanResolvedWardErrors'];

        expect(() => {
          cleanResolvedWardErrors.call(
            { fileSystem: mockFileSystem },
            'questmaestro/active/001',
            'task-123',
          );
        }).not.toThrow();

        expect(mockFileSystem.writeFile).not.toHaveBeenCalled();
      });
    });

    describe('when file read fails', () => {
      it('does not throw error', () => {
        mockFileSystem.readFile.mockImplementation(() => {
          throw new Error('Read permission denied');
        });

        const cleanResolvedWardErrors = WardValidator.prototype['cleanResolvedWardErrors'];

        expect(() => {
          cleanResolvedWardErrors.call(
            { fileSystem: mockFileSystem },
            'questmaestro/active/001',
            'task-123',
          );
        }).not.toThrow();
      });
    });
  });

  describe('getAttemptStrategy()', () => {
    it('attempt 1 → returns basic_fixes strategy', () => {
      const getAttemptStrategy = WardValidator.prototype['getAttemptStrategy'];
      const result = getAttemptStrategy.call({}, 1);

      expect(result).toBe('basic_fixes: Focus on imports, syntax errors, and basic type issues');
    });

    it('attempt 2 → returns deeper_analysis strategy', () => {
      const getAttemptStrategy = WardValidator.prototype['getAttemptStrategy'];
      const result = getAttemptStrategy.call({}, 2);

      expect(result).toBe(
        'deeper_analysis: Analyze logic errors, test expectations, and component interactions',
      );
    });

    it('attempt 3 → returns last_resort strategy', () => {
      const getAttemptStrategy = WardValidator.prototype['getAttemptStrategy'];
      const result = getAttemptStrategy.call({}, 3);

      expect(result).toBe('last_resort: Consider refactoring approach and questioning assumptions');
    });

    it('attempt > 3 → returns basic_fixes as fallback', () => {
      const getAttemptStrategy = WardValidator.prototype['getAttemptStrategy'];
      const result = getAttemptStrategy.call({}, 5);

      expect(result).toBe('basic_fixes: Focus on fundamental issues');
    });
  });

  describe('spawnAgentWithProgress()', () => {
    describe('when agent spawn succeeds', () => {
      it('logs description message', async () => {
        const localMockAgentSpawner = createMockAgentSpawner();
        localMockAgentSpawner.spawnAndWait.mockResolvedValue(
          AgentReportStub({
            status: 'complete',
            agentType: 'spiritmender',
          }),
        );

        const spawnAgentWithProgress = WardValidator.prototype['spawnAgentWithProgress'];
        await spawnAgentWithProgress.call(
          { logger: mockLogger },
          localMockAgentSpawner,
          'spiritmender',
          { questFolder: 'test', workingDirectory: '/test', reportNumber: '1' },
          'Running test agent',
        );

        expect(mockLogger.info).toHaveBeenCalledWith('[🎲] Running test agent');
      });

      it('returns agent report', async () => {
        const localMockAgentSpawner = createMockAgentSpawner();
        const mockReport = AgentReportStub({
          status: 'complete',
          agentType: 'spiritmender',
        });
        localMockAgentSpawner.spawnAndWait.mockResolvedValue(mockReport);

        const spawnAgentWithProgress = WardValidator.prototype['spawnAgentWithProgress'];
        const result = await spawnAgentWithProgress.call(
          { logger: mockLogger },
          localMockAgentSpawner,
          'spiritmender',
          { questFolder: 'test', workingDirectory: '/test', reportNumber: '1' },
          'Running test agent',
        );

        expect(result).toStrictEqual(mockReport);
      });
    });

    describe('when agent spawn fails', () => {
      it('logs error message', async () => {
        const localMockAgentSpawner = createMockAgentSpawner();
        localMockAgentSpawner.spawnAndWait.mockRejectedValue(new Error('Spawn failed'));

        const spawnAgentWithProgress = WardValidator.prototype['spawnAgentWithProgress'];

        try {
          await spawnAgentWithProgress.call(
            { logger: mockLogger },
            localMockAgentSpawner,
            'spiritmender',
            { questFolder: 'test', workingDirectory: '/test', reportNumber: '1' },
            'Running test agent',
          );
        } catch {}

        expect(mockLogger.error).toHaveBeenCalledWith('Agent spawn failed: Spawn failed');
      });

      it('re-throws the error', async () => {
        const localMockAgentSpawner = createMockAgentSpawner();
        const error = new Error('Spawn failed');
        localMockAgentSpawner.spawnAndWait.mockRejectedValue(error);

        const spawnAgentWithProgress = WardValidator.prototype['spawnAgentWithProgress'];

        await expect(
          spawnAgentWithProgress.call(
            { logger: mockLogger },
            localMockAgentSpawner,
            'spiritmender',
            { questFolder: 'test', workingDirectory: '/test', reportNumber: '1' },
            'Running test agent',
          ),
        ).rejects.toThrow('Spawn failed');
      });
    });
  });

  describe('questManager interactions', () => {
    it('calls getNextReportNumber with quest folder', async () => {
      const mockAgentSpawner = createMockAgentSpawner();
      const mockQuestManager = createMockQuestManager();
      const quest = QuestStub({ folder: '001-test-quest' });
      mockQuestManager.getNextReportNumber.mockReturnValue('42');
      mockExecCommand.mockReset();
      mockExecCommand.mockReturnValue(Buffer.from('') as never);

      await wardValidator.handleFailure(quest, 'error', mockAgentSpawner, mockQuestManager);

      expect(mockQuestManager.getNextReportNumber).toHaveBeenCalledWith('001-test-quest');
    });

    it('saves quest after updating spiritmender attempts', async () => {
      const mockAgentSpawner = createMockAgentSpawner();
      const mockQuestManager = createMockQuestManager();
      const quest = QuestStub({ folder: '001-test-quest' });
      mockExecCommand.mockReset();
      mockExecCommand.mockReturnValue(Buffer.from('') as never);

      await wardValidator.handleFailure(quest, 'error', mockAgentSpawner, mockQuestManager);

      // Should be called once: after updating attempts (no additional save on success)
      expect(mockQuestManager.saveQuest).toHaveBeenCalledTimes(1);
      expect(mockQuestManager.saveQuest).toHaveBeenCalledWith(
        expect.objectContaining({
          spiritmenderAttempts: { global: 1 },
        }),
      );
    });

    it('saves quest when blocking due to max attempts', async () => {
      const mockAgentSpawner = createMockAgentSpawner();
      const mockQuestManager = createMockQuestManager();
      const quest = QuestStub({ spiritmenderAttempts: { global: 3 } });

      try {
        await wardValidator.handleFailure(quest, 'error', mockAgentSpawner, mockQuestManager);
      } catch {}

      expect(mockQuestManager.saveQuest).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'blocked' }),
      );
    });
  });

  describe('edge cases', () => {
    it('handles exception thrown in saveWardErrors', () => {
      mockFileSystem.appendFile.mockImplementation(() => {
        throw new Error('Unexpected IO error');
      });

      const saveWardErrors = WardValidator.prototype['saveWardErrors'];

      expect(() => {
        saveWardErrors.call(
          { fileSystem: mockFileSystem, logger: mockLogger },
          'path',
          'error',
          'task',
          1,
        );
      }).not.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save ward errors: Error: Unexpected IO error',
      );
    });

    it('handles missing stderr in error object', () => {
      const error = new Error('Command not found');
      Object.assign(error, { code: 'ENOENT' });
      mockExecCommand.mockImplementation(() => {
        throw error;
      });

      const result = wardValidator.validate();

      expect(result).toStrictEqual({ success: false, errors: 'Command not found' });
    });
  });
});
