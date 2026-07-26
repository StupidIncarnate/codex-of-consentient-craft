import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { childProcessSpawnLongLivedAdapterProxy } from '../../../adapters/child-process/spawn-long-lived/child-process-spawn-long-lived-adapter.proxy';

// designStartBroker always spawns `npm install` via childProcessSpawnCaptureAdapter — see
// design-start-broker.ts. The command never varies for this broker, so it is the address every
// staged call keys on, and a default success is staged here so callers who never touch the
// install step (the happy-path tests) still get a real, addressed resolution instead of a
// silent catch-all.
const INSTALL_COMMAND = 'npm';

export const designStartBrokerProxy = (): {
  setupInstallError: (params: { error: Error }) => void;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  captureProxy.setupSuccess({
    command: INSTALL_COMMAND,
    exitCode: ExitCodeStub({ value: 0 }),
    stdout: ErrorMessageStub({ value: '' }),
    stderr: ErrorMessageStub({ value: '' }),
  });
  childProcessSpawnLongLivedAdapterProxy();

  return {
    setupInstallError: ({ error }: { error: Error }): void => {
      captureProxy.setupError({ command: INSTALL_COMMAND, error });
    },
  };
};
