/**
 * PURPOSE: Resolves the three paths one run's evidence lives at — the transcript, the stored `run`
 * return payload, and the directory its screenshots land in. Takes `evidencePath` as a parameter
 * rather than composing `locationsRootPathFindBroker()` itself, since the caller already resolved it
 * once (via `locationsInstanceEvidencePathFindBroker`) and re-deriving the guild partition here would
 * risk disagreeing with it. Every path is namespaced by BOTH the run id and, downstream through
 * `shotsDir`, the step index — step numbering restarts at 1 per run, so a resolver keyed on the step
 * alone would let the second run's `step4.png` silently overwrite the first's.
 *
 * USAGE:
 * locationsRunPathsFindBroker({
 *   evidencePath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1' }),
 *   runId: RunIdStub({ value: 'run_2' }),
 * });
 * // Returns {
 * //   transcript: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_2.jsonl',
 * //   storedReturn: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_2.json',
 * //   shotsDir: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_2',
 * // }
 */

import { locationsRunPathsFindResultContract } from '../../../contracts/locations-run-paths-find-result/locations-run-paths-find-result-contract';
import type { LocationsRunPathsFindResult } from '../../../contracts/locations-run-paths-find-result/locations-run-paths-find-result-contract';
import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { evidenceFileStatics } from '../../../statics/evidence-file/evidence-file-statics';
import type { SiegeRun } from '@dungeonmaster/shared/contracts';

export const locationsRunPathsFindBroker = ({
  evidencePath,
  runId,
}: {
  evidencePath: string;
  runId: SiegeRun['id'];
}): LocationsRunPathsFindResult => {
  const transcript = join(
    evidencePath,
    locationsStatics.siegelense.runsDir,
    `${runId}${evidenceFileStatics.extensions.transcript}`,
  );

  const storedReturn = join(
    evidencePath,
    locationsStatics.siegelense.runsDir,
    `${runId}${evidenceFileStatics.extensions.runReturn}`,
  );

  const shotsDir = join(evidencePath, locationsStatics.siegelense.runsDir, runId);

  return locationsRunPathsFindResultContract.parse({
    transcript,
    storedReturn,
    shotsDir,
  });
};
