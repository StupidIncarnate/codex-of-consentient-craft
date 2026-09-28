import { readStdinToEndProxy } from '#gateway/node/process/read-stdin-to-end/read-stdin-to-end.proxy';
import { rateLimitsSnapshotWriteBrokerProxy } from '../../../brokers/rate-limits/snapshot-write/rate-limits-snapshot-write-broker.proxy';
import { rateLimitsHistoryAppendBrokerProxy } from '../../../brokers/rate-limits/history-append/rate-limits-history-append-broker.proxy';

export const CliStatuslineTapResponderProxy = (): {
  setupStdin: ({ data }: { data: string }) => void;
  setupAcceptedWrite: () => void;
  setupThrottledWrite: ({ mtimeMs }: { mtimeMs: number }) => void;
  restoreStdin: () => void;
  getSnapshotWriteCalls: () => readonly { path: unknown; content: unknown }[];
  getHistoryAppendCalls: () => readonly { path: unknown; content: unknown }[];
} => {
  const stdinProxy = readStdinToEndProxy();
  const writeProxy = rateLimitsSnapshotWriteBrokerProxy();
  const historyProxy = rateLimitsHistoryAppendBrokerProxy();

  return {
    setupStdin: ({ data }: { data: string }): void => {
      stdinProxy.returns({ contents: data });
    },
    setupAcceptedWrite: (): void => {
      writeProxy.setupAcceptedWrite();
      historyProxy.setupAcceptedAppend();
    },
    setupThrottledWrite: ({ mtimeMs }: { mtimeMs: number }): void => {
      writeProxy.setupThrottledWrite({ mtimeMs });
    },
    restoreStdin: (): void => {
      stdinProxy.restore();
    },
    getSnapshotWriteCalls: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getWriteCalls(),
    getHistoryAppendCalls: (): readonly { path: unknown; content: unknown }[] =>
      historyProxy.getAppendCalls(),
  };
};
