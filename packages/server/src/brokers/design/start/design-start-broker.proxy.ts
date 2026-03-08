import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { childProcessSpawnLongLivedAdapterProxy } from '../../../adapters/child-process/spawn-long-lived/child-process-spawn-long-lived-adapter.proxy';

export const designStartBrokerProxy = (): {
  setupInstallError: (params: { error: Error }) => void;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  childProcessSpawnLongLivedAdapterProxy();

  return {
    setupInstallError: ({ error }: { error: Error }): void => {
      captureProxy.setupError({ error });
    },
  };
};
