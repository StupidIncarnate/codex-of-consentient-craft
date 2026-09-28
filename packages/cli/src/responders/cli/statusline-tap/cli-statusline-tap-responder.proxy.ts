import { Readable } from 'stream';
import { readStdinToEndProxy } from '#gateway/node/process/read-stdin-to-end/read-stdin-to-end.proxy';
import { rateLimitsSnapshotWriteBrokerProxy } from '../../../brokers/rate-limits/snapshot-write/rate-limits-snapshot-write-broker.proxy';
import { rateLimitsHistoryAppendBrokerProxy } from '../../../brokers/rate-limits/history-append/rate-limits-history-append-broker.proxy';

// `readStdinToEndProxy` is intentionally empty (its own PURPOSE says why: process.stdin is a
// global, not an npm dependency with its own mockable call surface) — the caller drives a real
// Readable in its place via Object.defineProperty, the same swap the gateway's own colocated test
// uses.
const STDIN_ORIGINAL = Object.getOwnPropertyDescriptor(process, 'stdin');

export const CliStatuslineTapResponderProxy = (): {
  setupStdin: ({ data }: { data: string }) => void;
  setupAcceptedWrite: () => void;
  setupThrottledWrite: ({ mtimeMs }: { mtimeMs: number }) => void;
  restoreStdin: () => void;
  getSnapshotWriteCalls: () => readonly { path: unknown; content: unknown }[];
  getHistoryAppendCalls: () => readonly { path: unknown; content: unknown }[];
} => {
  readStdinToEndProxy();
  const writeProxy = rateLimitsSnapshotWriteBrokerProxy();
  const historyProxy = rateLimitsHistoryAppendBrokerProxy();

  return {
    setupStdin: ({ data }: { data: string }): void => {
      const stream = Readable.from(Buffer.from(data, 'utf8'));
      Object.defineProperty(process, 'stdin', {
        configurable: true,
        get: () => stream,
      });
    },
    setupAcceptedWrite: (): void => {
      writeProxy.setupAcceptedWrite();
      historyProxy.setupAcceptedAppend();
    },
    setupThrottledWrite: ({ mtimeMs }: { mtimeMs: number }): void => {
      writeProxy.setupThrottledWrite({ mtimeMs });
    },
    restoreStdin: (): void => {
      if (STDIN_ORIGINAL !== undefined) {
        Object.defineProperty(process, 'stdin', STDIN_ORIGINAL);
      }
    },
    getSnapshotWriteCalls: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getWriteCalls(),
    getHistoryAppendCalls: (): readonly { path: unknown; content: unknown }[] =>
      historyProxy.getAppendCalls(),
  };
};
