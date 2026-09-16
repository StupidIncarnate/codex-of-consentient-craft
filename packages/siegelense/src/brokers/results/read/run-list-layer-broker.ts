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
 *   evidencePath: AbsoluteFilePathStub({ value: '/repo/.siegelense/unowned/instances/inst_1' }),
 * });
 * // Returns { runCount: 2, latestRunId: 'run_2', evidenceComplete: true } for an instance holding
 * // run_1.jsonl + run_1.json + run_2.jsonl + run_2.json
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { runEvidenceComputeTransformer } from '../../../transformers/run-evidence-compute/run-evidence-compute-transformer';

export const runListLayerBroker = async ({
  evidencePath,
}: {
  evidencePath: AbsoluteFilePath;
}): Promise<{ runCount: ReadingCount; latestRunId: RunId | null; evidenceComplete: boolean }> => {
  const runsDir = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [evidencePath, locationsStatics.siegelense.runsDir] }),
  );

  const entries = await fsReaddirAdapter({ dirPath: runsDir });

  return runEvidenceComputeTransformer({ entries });
};
