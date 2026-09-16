/**
 * PURPOSE: The whole `status {}` answer — the vocabulary a caller can ask about, the machine block,
 * and one row per instance, alive or dead (spec line 1170: `monitored`, `machine`, `instances`).
 * Reach for this over building the three parts ad hoc at a call site — this is the one shape both
 * `siegelense-status` and `dungeonmaster siegelense status` render from.
 *
 * USAGE:
 * statusAnswerContract.parse({
 *   monitored: ['rss per process group', 'free memory', 'free disk', 'load average', 'kernel OOM events'],
 *   machine: { freeMemMB: 980, totalMemMB: 16000, freeDiskMB: 2100, cores: 8, loadAvg: [7.9, 6.2, 4.1], oomKillsSinceBoot: 2, lastOomAt: '20:11:04' },
 *   instances: [],
 * });
 * // Returns a validated StatusAnswer
 */

import { z } from 'zod';

import { instanceStatusContract } from '../instance-status/instance-status-contract';
import { machineReadingContract } from '../machine-reading/machine-reading-contract';
import { monitoredMetricContract } from '../monitored-metric/monitored-metric-contract';

export const statusAnswerContract = z.object({
  monitored: z.array(monitoredMetricContract).readonly(),
  machine: machineReadingContract,
  instances: z.array(instanceStatusContract).readonly(),
});

export type StatusAnswer = z.infer<typeof statusAnswerContract>;
