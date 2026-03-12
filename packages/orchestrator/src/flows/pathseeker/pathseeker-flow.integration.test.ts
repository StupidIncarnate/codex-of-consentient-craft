import { FilePathStub, ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { KillableProcessStub } from '../../contracts/killable-process/killable-process.stub';
import { PathseekerFlow } from './pathseeker-flow';

describe('PathseekerFlow', () => {
  describe('export', () => {
    it('VALID: exported function => is an async function', () => {
      expect(typeof PathseekerFlow).toBe('function');
    });
  });

  describe('delegation to PathseekerPipelineResponder', () => {
    it('VALID: {nonexistent questId, attempt at maxAttempts} => resolves to undefined', async () => {
      const processId = ProcessIdStub({ value: 'proc-integration-test' });
      const questId = QuestIdStub({ value: 'nonexistent-quest-integration' });
      const killableProcess = KillableProcessStub();

      await expect(
        PathseekerFlow({
          processId,
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          killableProcess,
          attempt: 3,
          onVerifySuccess: () => {
            /* no-op */
          },
          onProcessUpdate: () => {
            /* no-op */
          },
        }),
      ).resolves.toBeUndefined();
    });

    it('VALID: {nonexistent questId, attempt at maxAttempts} => resolves without throwing', async () => {
      const processId = ProcessIdStub({ value: 'proc-integration-test-2' });
      const questId = QuestIdStub({ value: 'nonexistent-quest-no-throw' });
      const killableProcess = KillableProcessStub();

      await expect(
        PathseekerFlow({
          processId,
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          killableProcess,
          attempt: 3,
          onVerifySuccess: () => {
            /* no-op */
          },
          onProcessUpdate: () => {
            /* no-op */
          },
        }),
      ).resolves.toBeUndefined();
    });
  });
});
