import {
  FilePathStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

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
        steps: [
          {
            id: 'create-login-broker',
            name: 'Create login broker',
            assertions: [
              { prefix: 'VALID', input: '{valid credentials}', expected: 'returns auth token' },
            ],
            observablesSatisfied: ['redirects-to-dashboard'],
            dependsOn: [],
            focusFile: {
              path: 'packages/api/src/guards/has-auth/has-auth-guard.ts',
              action: 'create',
            },
            accompanyingFiles: [
              { path: 'packages/api/src/guards/has-auth/has-auth-guard.test.ts', action: 'create' },
            ],
            exportName: 'hasAuthGuard',
            inputContracts: ['Void'],
            outputContracts: ['Void'],
          },
        ],
        flows: [
          {
            id: 'login-flow',
            name: 'Login Flow',
            entryPoint: '/login',
            exitPoints: ['/dashboard'],
            nodes: [
              {
                id: 'login-page',
                label: 'Login Page',
                type: 'state',
                observables: [
                  {
                    id: 'redirects-to-dashboard',
                    type: 'ui-state',
                    description: 'redirects to dashboard',
                  },
                ],
              },
              {
                id: 'dashboard',
                label: 'Dashboard',
                type: 'state',
                observables: [],
              },
            ],
            edges: [{ id: 'login-to-dashboard', from: 'login-page', to: 'dashboard' }],
          },
        ],
      });

      proxy.setupVerifySuccess({ quest });

      await pathseekerPipelineBroker({
        processId,
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
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
    it('VALID: {attempt >= maxAttempts} => returns immediately without running', async () => {
      const proxy = pathseekerPipelineBrokerProxy();

      const processId = ProcessIdStub({ value: 'proc-12345' });
      const questId = QuestIdStub();
      const killableProcess = KillableProcessStub();

      await pathseekerPipelineBroker({
        processId,
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
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
        startPath: FilePathStub({ value: '/project/src' }),
        killableProcess,
        attempt: 2,
        onVerifySuccess: proxy.onVerifySuccess,
        onProcessUpdate: proxy.onProcessUpdate,
      });

      expect(proxy.onProcessUpdate).toHaveBeenCalledTimes(1);
    });

    it('VALID: {all 3 attempts fail from attempt 0} => spawns 3 retries then stops', async () => {
      const proxy = pathseekerPipelineBrokerProxy();

      const processId = ProcessIdStub({ value: 'proc-12345' });
      const questId = QuestIdStub();
      const killableProcess = KillableProcessStub();

      proxy.setupVerifyFailure();
      proxy.setupSpawnSuccess();
      proxy.setupVerifyFailure();
      proxy.setupSpawnSuccess();
      proxy.setupVerifyFailure();
      proxy.setupSpawnSuccess();

      await pathseekerPipelineBroker({
        processId,
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        killableProcess,
        attempt: 0,
        onVerifySuccess: proxy.onVerifySuccess,
        onProcessUpdate: proxy.onProcessUpdate,
      });

      expect(proxy.onVerifySuccess).not.toHaveBeenCalled();
      expect(proxy.onProcessUpdate).toHaveBeenCalledTimes(3);
    });
  });
});
