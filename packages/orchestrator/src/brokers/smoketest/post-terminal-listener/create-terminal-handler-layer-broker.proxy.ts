import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { processTerminalEventLayerBrokerProxy } from './process-terminal-event-layer-broker.proxy';

export const createTerminalHandlerLayerBrokerProxy = (): {
  reset: () => void;
  setupProcessSucceeds: () => void;
  setupProcessRejects: (params: { error: Error }) => void;
  getProcessCallArgs: () => readonly unknown[][];
  silenceStderrAndCaptureLogs: () => { wroteRejectionLog: () => boolean };
} => {
  const processProxy = processTerminalEventLayerBrokerProxy();

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
