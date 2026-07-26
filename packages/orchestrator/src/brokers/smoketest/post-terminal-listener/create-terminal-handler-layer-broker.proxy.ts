import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
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
    silenceStderrAndCaptureLogs: (): { wroteRejectionLog: () => boolean } => {
      const handle = registerSpyOn({ object: process.stderr, method: 'write' });
      // Every write must succeed regardless of content — this silences stderr wholesale
      // and records every call for the content-addressed lookup below.
      handle.calledWith([]).returns(true);
      return {
        wroteRejectionLog: (): boolean =>
          handle.callsMatching([
            (written: unknown): boolean =>
              typeof written === 'string' && written.includes('handler failed for quest'),
          ]).length > 0,
      };
    },
  };
};
