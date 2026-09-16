/**
 * PURPOSE: The whole `status {}` answer — the vocabulary a caller can ask about, the machine block,
 * and one row per instance, alive or dead (spec line 1170: `monitored`, `machine`, `instances`).
 * `queriedInstanceState` carries the resolved state of the id a NAMED query asked for — `unknown`,
 * `alive`, `dead`, `killed` or `pruned` — and is `null` for a fleet listing, where no single id was
 * named and the concept does not apply. Without it, a named query that resolves to zero rows and an
 * empty fleet both answer `instances: []`, and the JSON itself carries nothing to tell them apart —
 * exactly the ambiguity `instanceState` on `resultsAnswerContract` already closes for `results`
 * (siegelense-tooling.md:2317, "no instance by that id, ever" vs. a walk that found nothing;
 * :2319-2321, "`pruned` and `unknown` are real answers, not empty results"). `results` carries that
 * field unconditionally because every `results` query already names one instance; `status` also
 * serves the fleet form, so this field is nullable rather than always populated. Reach for this over
 * building the three parts ad hoc at a call site — this is the one shape both `siegelense-status` and
 * `dungeonmaster siegelense status` render from.
 *
 * USAGE:
 * statusAnswerContract.parse({
 *   monitored: ['rss per process group', 'free memory', 'free disk', 'load average', 'kernel OOM events'],
 *   machine: { freeMemMB: 980, totalMemMB: 16000, freeDiskMB: 2100, cores: 8, loadAvg: [7.9, 6.2, 4.1], oomKillsSinceBoot: 2, lastOomAt: '20:11:04' },
 *   instances: [],
 *   queriedInstanceState: null,
 * });
 * // Returns a validated StatusAnswer
 */

import { z } from 'zod';

import { instanceStateContract } from '../instance-state/instance-state-contract';
import { instanceStatusContract } from '../instance-status/instance-status-contract';
import { machineReadingContract } from '../machine-reading/machine-reading-contract';
import { monitoredMetricContract } from '../monitored-metric/monitored-metric-contract';

export const statusAnswerContract = z.object({
  monitored: z.array(monitoredMetricContract).readonly(),
  machine: machineReadingContract,
  instances: z.array(instanceStatusContract).readonly(),
  queriedInstanceState: instanceStateContract.nullable(),
});

export type StatusAnswer = z.infer<typeof statusAnswerContract>;
