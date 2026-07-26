import type { QuestId } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { processSyncEventLayerBrokerProxy } from './process-sync-event-layer-broker.proxy';

export const createSyncHandlerLayerBrokerProxy = (): {
  reset: () => void;
  setupProcessSucceeds: () => void;
  setupProcessRejects: (params: { error: Error }) => void;
  getProcessCallArgs: () => readonly unknown[][];
  silenceStderrAndCaptureLogs: (params: { questId: QuestId; error: Error }) => {
    wroteRejectionLog: () => boolean;
  };
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
    silenceStderrAndCaptureLogs: ({
      questId,
      error,
    }: {
      questId: QuestId;
      error: Error;
    }): { wroteRejectionLog: () => boolean } => {
      const handle = registerSpyOn({ object: process.stderr, method: 'write' });
      const rejectionLog = `[questQueueSyncListenerBroker] handler failed for quest ${questId}: ${String(error)}\n`;
      handle.calledWith([rejectionLog]).returns(true);
      return {
        wroteRejectionLog: (): boolean => handle.callsMatching([rejectionLog]).length > 0,
      };
    },
  };
};
