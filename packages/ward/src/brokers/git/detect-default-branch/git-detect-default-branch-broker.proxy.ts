import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

export const gitDetectDefaultBranchBrokerProxy = (): {
  setupMainExists: () => void;
  setupMasterExists: () => void;
  setupNeitherExists: () => void;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });
  const emptyMessage = ErrorMessageStub({ value: '' });
  const fatalMessage = ErrorMessageStub({ value: 'fatal: not a valid ref' });

  return {
    setupMainExists: (): void => {
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: emptyMessage,
        stderr: emptyMessage,
      });
    },

    setupMasterExists: (): void => {
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: emptyMessage,
        stderr: fatalMessage,
      });
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: emptyMessage,
        stderr: emptyMessage,
      });
    },

    setupNeitherExists: (): void => {
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: emptyMessage,
        stderr: fatalMessage,
      });
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: emptyMessage,
        stderr: fatalMessage,
      });
    },
  };
};
