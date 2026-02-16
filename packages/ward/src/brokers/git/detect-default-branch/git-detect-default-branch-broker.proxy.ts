import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

export const gitDetectDefaultBranchBrokerProxy = (): {
  setupMainExists: () => void;
  setupMasterExists: () => void;
  setupNeitherExists: () => void;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });

  return {
    setupMainExists: (): void => {
      captureProxy.setupSuccess({ exitCode: successCode, stdout: '', stderr: '' });
    },

    setupMasterExists: (): void => {
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: '',
        stderr: 'fatal: not a valid ref',
      });
      captureProxy.setupSuccess({ exitCode: successCode, stdout: '', stderr: '' });
    },

    setupNeitherExists: (): void => {
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: '',
        stderr: 'fatal: not a valid ref',
      });
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: '',
        stderr: 'fatal: not a valid ref',
      });
    },
  };
};
