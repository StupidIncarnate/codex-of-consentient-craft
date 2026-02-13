import { ProcessIdStub, QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { KillableProcessStub } from '../../../contracts/killable-process/killable-process.stub';
import { pathseekerPipelineBroker } from './pathseeker-pipeline-broker';
import { pathseekerPipelineBrokerProxy } from './pathseeker-pipeline-broker.proxy';

describe('pathseekerPipelineBroker', () => {
  describe('verify succeeds', () => {
    it('VALID: {verify succeeds} => calls onVerifySuccess', async () => {
      const proxy = pathseekerPipelineBrokerProxy();

      const processId = ProcessIdStub({ value: 'proc-12345' });
      const questId = QuestIdStub();
      const killableProcess = KillableProcessStub();

      const quest = QuestStub({
        id: questId,
        requirements: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Auth',
            description: 'User auth',
            scope: 'packages/api',
            status: 'approved',
          },
        ],
        contexts: [
          {
            id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'LoginPage',
            description: 'Login page',
            locator: { page: '/login', section: 'main' },
          },
        ],
        observables: [
          {
            id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
            contextId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            requirementId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            trigger: 'User submits login form',
            dependsOn: [],
            outcomes: [],
          },
        ],
        steps: [
          {
            id: 'c47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Create login broker',
            description: 'Create login broker',
            observablesSatisfied: ['b47ac10b-58cc-4372-a567-0e02b2c3d479'],
            dependsOn: [],
            filesToCreate: [
              'packages/api/src/guards/has-auth/has-auth-guard.ts',
              'packages/api/src/guards/has-auth/has-auth-guard.test.ts',
            ],
            filesToModify: [],
            status: 'pending',
            exportName: 'hasAuthGuard',
          },
        ],
      });

      proxy.setupVerifySuccess({ quest });

      await pathseekerPipelineBroker({
        processId,
        questId,
        killableProcess,
        attempt: 0,
        onVerifySuccess: proxy.onVerifySuccess,
        onProcessUpdate: proxy.onProcessUpdate,
      });

      expect(proxy.onVerifySuccess).toHaveBeenCalledTimes(1);
      expect(proxy.onProcessUpdate).not.toHaveBeenCalled();
    });
  });

  describe('verify fails at max attempts', () => {
    it('VALID: {verify fails, attempt >= maxAttempts} => stops without spawning', async () => {
      const proxy = pathseekerPipelineBrokerProxy();

      const processId = ProcessIdStub({ value: 'proc-12345' });
      const questId = QuestIdStub();
      const killableProcess = KillableProcessStub();

      proxy.setupVerifyFailure();

      await pathseekerPipelineBroker({
        processId,
        questId,
        killableProcess,
        attempt: 3,
        onVerifySuccess: proxy.onVerifySuccess,
        onProcessUpdate: proxy.onProcessUpdate,
      });

      expect(proxy.onVerifySuccess).not.toHaveBeenCalled();
      expect(proxy.onProcessUpdate).not.toHaveBeenCalled();
    });
  });

  describe('verify fails with retry', () => {
    it('VALID: {verify fails, attempt < maxAttempts} => spawns new process and retries', async () => {
      const proxy = pathseekerPipelineBrokerProxy();

      const processId = ProcessIdStub({ value: 'proc-12345' });
      const questId = QuestIdStub();
      const killableProcess = KillableProcessStub();

      proxy.setupVerifyFailure();
      proxy.setupSpawnSuccess();
      proxy.setupVerifyFailure();

      await pathseekerPipelineBroker({
        processId,
        questId,
        killableProcess,
        attempt: 2,
        onVerifySuccess: proxy.onVerifySuccess,
        onProcessUpdate: proxy.onProcessUpdate,
      });

      expect(proxy.onProcessUpdate).toHaveBeenCalledTimes(1);
    });
  });
});
