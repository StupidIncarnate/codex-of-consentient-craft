import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import type { Quest } from '@dungeonmaster/shared/contracts';

import { processSyncEventLayerBrokerProxy } from './process-sync-event-layer-broker.proxy';

export const createSyncHandlerLayerBrokerProxy = (): {
  reset: () => void;
  setupProcessSucceeds: () => void;
  setupProcessRejects: (params: { error: Error }) => void;
  getProcessCallArgs: () => readonly unknown[][];
  silenceStderrAndCaptureLogs: (params: { questId: Quest['id']; error: Error }) => {
    wroteRejectionLog: () => boolean;
  };
} => {
  const processProxy = processSyncEventLayerBrokerProxy();
  const stderrChild = stderrProxy();

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
    silenceStderrAndCaptureLogs: ({
      questId,
      error,
    }: {
      questId: Quest['id'];
      error: Error;
    }): { wroteRejectionLog: () => boolean } => {
      const rejectionLog = `[questQueueSyncListenerBroker] handler failed for quest ${questId}: ${String(error)}\n`;
      return {
        wroteRejectionLog: (): boolean =>
          stderrChild.getWrites().filter((chunk) => chunk === rejectionLog).length > 0,
      };
    },
  };
};
