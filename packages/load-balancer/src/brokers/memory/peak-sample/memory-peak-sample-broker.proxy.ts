import { clearTimeoutProxy } from '#gateway/node/clearTimeout/clear-timeout/clear-timeout.proxy';
import { setTimeoutProxy } from '#gateway/node/setTimeout/set-timeout/set-timeout.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import { machineRssByTreeBroker } from '../../machine/rss-by-tree/machine-rss-by-tree-broker';
import { machineRssByTreeBrokerProxy } from '../../machine/rss-by-tree/machine-rss-by-tree-broker.proxy';

export const memoryPeakSampleBrokerProxy = (): {
  setupSamples: (params: { rootPid: number; samples: readonly (number | null)[] }) => void;
  setupFails: (params: { rootPid: number }) => void;
  getCalls: (params: { rootPid: number }) => readonly unknown[][];
} => {
  machineRssByTreeBrokerProxy();
  clearTimeoutProxy();
  setTimeoutProxy();
  const handle: MockHandle = registerMock({ fn: machineRssByTreeBroker });

  return {
    setupSamples: ({
      rootPid,
      samples,
    }: {
      rootPid: number;
      samples: readonly (number | null)[];
    }): void => {
      const remainingSamples = [...samples];
      handle.calledWith([{ rootPid }]).implement(async () => {
        const nextValue =
          remainingSamples.length > 0
            ? remainingSamples.shift()
            : (samples[samples.length - 1] ?? null);
        return Promise.resolve(nextValue ?? null);
      });
    },

    setupFails: ({ rootPid }: { rootPid: number }): void => {
      const failureError = Object.assign(new Error('EACCES: permission denied'), {
        code: 'EACCES',
      });
      handle.calledWith([{ rootPid }]).rejects(failureError);
    },

    getCalls: ({ rootPid }: { rootPid: number }): readonly unknown[][] =>
      handle.callsMatching([{ rootPid }]),
  };
};
