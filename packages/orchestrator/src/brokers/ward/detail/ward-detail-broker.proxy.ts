import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

// Matches wardDetailBroker's own WARD_COMMAND — the real command childProcessSpawnCaptureAdapter
// is invoked with, so the underlying spawn mock's command-addressed staging matches.
const WARD_COMMAND = 'dungeonmaster-ward';

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
        command: WARD_COMMAND,
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: output }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    setupFailure: (): void => {
      captureProxy.setupSuccess({
        command: WARD_COMMAND,
        exitCode: failCode,
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs({ command: WARD_COMMAND }),

    getSpawnedCommand: (): unknown => captureProxy.getSpawnedCommand({ command: WARD_COMMAND }),
  };
};
