/**
 * PURPOSE: Repeatedly samples a process-tree's resident memory via machineRssByTreeBroker on an
 * interval, tracking and returning the highest value observed over the run.
 * Reach for this over machineRssByTreeBroker directly when monitoring a long-running subprocess
 * whose peak memory occurs mid-execution rather than at fixed checkpoints.
 *
 * USAGE:
 * const sampler = await memoryPeakSampleBroker({ rootPid: 12345, intervalMs: 100 });
 * // ... subprocess executes ...
 * const peakMB = await sampler.stop();
 */

import { clearTimeout } from '#gateway/node/clearTimeout';
import { setTimeout } from '#gateway/node/setTimeout';

import { machineRssByTreeBroker } from '../../machine/rss-by-tree/machine-rss-by-tree-broker';

export const memoryPeakSampleBroker = async ({
  rootPid,
  intervalMs = 100,
}: {
  rootPid: number;
  intervalMs?: number;
}): Promise<{
  stop: () => Promise<number | null>;
  getCurrentPeak: () => number | null;
}> => {
  let peakMB: number | null = null;
  let isStopped = false;
  let timerHandle: NodeJS.Timeout | null = null;

  const sampleState = {
    step: async (): Promise<void> => {
      if (isStopped) {
        return;
      }
      try {
        const sample = await machineRssByTreeBroker({ rootPid });
        if (sample !== null) {
          peakMB = peakMB === null ? sample : Math.max(peakMB, sample);
        }
      } catch {
        // Failed sample skipped
      }
      timerHandle = setTimeout(() => {
        sampleState.step().then(
          () => undefined,
          () => undefined,
        );
      }, intervalMs);
    },
  };

  await sampleState.step();

  return {
    stop: async (): Promise<number | null> => {
      isStopped = true;
      if (timerHandle !== null) {
        clearTimeout(timerHandle);
        timerHandle = null;
      }
      await Promise.resolve();
      return peakMB;
    },
    getCurrentPeak: (): number | null => peakMB,
  };
};
