import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { processSyncEventLayerBrokerProxy } from './process-sync-event-layer-broker.proxy';

export const createSyncHandlerLayerBrokerProxy = (): {
  reset: () => void;
  setupProcessSucceeds: () => void;
  setupProcessRejects: (params: { error: Error }) => void;
  getProcessCallArgs: () => readonly unknown[][];
  silenceStderrAndCaptureLogs: () => { wroteRejectionLog: () => boolean };
} => {
  const processProxy = processSyncEventLayerBrokerProxy();

  return {
    reset: (): void => {
      // jest.clearAllMocks (from @dungeonmaster/testing setup) resets call history per test.
    },
    setupProcessSucceeds: (): void => {
      processProxy.setupSucceeds();
    },
    setupProcessRejects: ({ error }: { error: Error }): void => {
      processProxy.setupRejects({ error });
    },
    getProcessCallArgs: (): readonly unknown[][] => processProxy.getCallArgs(),
    silenceStderrAndCaptureLogs: (): { wroteRejectionLog: () => boolean } => {
      const handle = registerSpyOn({ object: process.stderr, method: 'write' });
      handle.mockImplementation(() => true);
      return {
        wroteRejectionLog: (): boolean =>
          handle.mock.calls.some((c) => String(c[0]).includes('handler failed for quest')),
      };
    },
  };
};
