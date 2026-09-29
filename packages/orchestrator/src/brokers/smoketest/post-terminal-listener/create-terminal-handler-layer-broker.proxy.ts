import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { processTerminalEventLayerBrokerProxy } from './process-terminal-event-layer-broker.proxy';

export const createTerminalHandlerLayerBrokerProxy = (): {
  reset: () => void;
  setupProcessSucceeds: () => void;
  setupProcessRejects: (params: { error: Error }) => void;
  getProcessCallArgs: () => RecordedCalls;
  silenceStderrAndCaptureLogs: () => { wroteRejectionLog: () => boolean };
} => {
  const processProxy = processTerminalEventLayerBrokerProxy();
  const stderrChild = stderrProxy();

  return {
    reset: (): void => {
      // Child proxies self-reset via jest.clearAllMocks between tests.
    },
    setupProcessSucceeds: (): void => {
      processProxy.setupSucceeds();
    },
    setupProcessRejects: ({ error }: { error: Error }): void => {
      processProxy.setupRejects({ error });
    },
    getProcessCallArgs: (): RecordedCalls => processProxy.getCallArgs(),
    silenceStderrAndCaptureLogs: (): { wroteRejectionLog: () => boolean } => ({
      wroteRejectionLog: (): boolean =>
        stderrChild
          .getWrites()
          .filter(
            (chunk) => typeof chunk === 'string' && chunk.includes('handler failed for quest'),
          ).length > 0,
    }),
  };
};
