import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { readStdinToEndProxy } from '#gateway/node/process/read-stdin-to-end/read-stdin-to-end.proxy';
import { rateLimitsSnapshotWriteBrokerProxy } from '../../../brokers/rate-limits/snapshot-write/rate-limits-snapshot-write-broker.proxy';
import { rateLimitsHistoryAppendBrokerProxy } from '../../../brokers/rate-limits/history-append/rate-limits-history-append-broker.proxy';

export const CliStatuslineTapResponderProxy = (): {
  setupStdin: ({ data }: { data: string }) => void;
  setupAcceptedWrite: () => void;
  setupThrottledWrite: ({ mtimeMs }: { mtimeMs: number }) => void;
  setupNow: (params: { nowMs: number }) => void;
  restoreStdin: () => void;
  getStdoutWrites: () => readonly unknown[];
  getStderrWrites: () => readonly unknown[];
  getSnapshotWriteCalls: () => readonly { path: unknown; content: unknown }[];
  getHistoryAppendCalls: () => readonly { path: unknown; content: unknown }[];
} => {
  const stdinProxy = readStdinToEndProxy();
  const writeProxy = rateLimitsSnapshotWriteBrokerProxy();
  const historyProxy = rateLimitsHistoryAppendBrokerProxy();
  const stdout = stdoutProxy();
  const stderr = stderrProxy();
  const nowHandle = registerSpyOn({ object: Date, method: 'now' });

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
    // Date.now takes no argument, so the empty tuple is its exact address.
    setupNow: ({ nowMs }: { nowMs: number }): void => {
      nowHandle.calledWith([]).returns(nowMs);
    },
    getStdoutWrites: (): readonly unknown[] => stdout.getWrites(),
    getStderrWrites: (): readonly unknown[] => stderr.getWrites(),
    restoreStdin: (): void => {
      stdinProxy.restore();
    },
    getSnapshotWriteCalls: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getWriteCalls(),
    getHistoryAppendCalls: (): readonly { path: unknown; content: unknown }[] =>
      historyProxy.getAppendCalls(),
  };
};
