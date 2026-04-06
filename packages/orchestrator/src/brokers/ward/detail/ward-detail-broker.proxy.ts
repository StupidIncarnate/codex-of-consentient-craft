import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

export const wardDetailBrokerProxy = (): {
  setupSuccess: (params: { output: string }) => void;
  setupFailure: () => void;
  getSpawnedArgs: () => unknown;
  getSpawnedCommand: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });

  return {
    setupSuccess: ({ output }: { output: string }): void => {
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: output }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    setupFailure: (): void => {
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs(),

    getSpawnedCommand: (): unknown => captureProxy.getSpawnedCommand(),
  };
};
