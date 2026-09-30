/**
 * PURPOSE: Reads one instance's `runs/` directory off disk and delegates the whole interpretation —
 * how many runs exist, which is the latest, and whether that latest run's evidence is complete — to
 * `runEvidenceComputeTransformer`, the ONE place `results` and `status` both read from
 * (chunk-03-read-path-and-perception.md §3.C). Reads the runs directory rather than the driver's own
 * in-memory run counter (`driverSessionState.nextRunId`), because `results` starts nothing and
 * answers for an instance whose driver may already be dead — the count and the latest id must both
 * come off disk. **Returns a COUNT and the latest id, never the list** — enumerating run ids is
 * `status`'s would-be job, not this one's.
 *
 * USAGE:
 * await runListLayerBroker({
 *   evidencePath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1' }),
 * });
 * // Returns { runCount: 2, latestRunId: 'run_2', evidenceComplete: true } for an instance holding
 * // run_1.jsonl + run_1.json + run_2.jsonl + run_2.json
 */

import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import type { SiegeRun } from '@dungeonmaster/shared/contracts';

import { readdirIfExists } from '#gateway/node/fs__promises';
import { runEvidenceComputeTransformer } from '../../../transformers/run-evidence-compute/run-evidence-compute-transformer';

export const runListLayerBroker = async ({
  evidencePath,
}: {
  evidencePath: string;
}): Promise<{ runCount: number; latestRunId: SiegeRun['id'] | null; evidenceComplete: boolean }> => {
  const runsDir = join(evidencePath, locationsStatics.siegelense.runsDir);

  const entries = (await readdirIfExists(runsDir)) ?? [];

  return runEvidenceComputeTransformer({ entries });
};
