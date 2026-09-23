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

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { evidenceFileStatics } from '../../../statics/evidence-file/evidence-file-statics';

export const locationsRunPathsFindBroker = ({
  evidencePath,
  runId,
}: {
  evidencePath: AbsoluteFilePath;
  runId: RunId;
}): {
  transcript: AbsoluteFilePath;
  storedReturn: AbsoluteFilePath;
  shotsDir: AbsoluteFilePath;
} => {
  const transcript = pathJoinAdapter({
    paths: [
      evidencePath,
      locationsStatics.siegelense.runsDir,
      `${runId}${evidenceFileStatics.extensions.transcript}`,
    ],
  });

  const storedReturn = pathJoinAdapter({
    paths: [
      evidencePath,
      locationsStatics.siegelense.runsDir,
      `${runId}${evidenceFileStatics.extensions.runReturn}`,
    ],
  });

  const shotsDir = pathJoinAdapter({
    paths: [evidencePath, locationsStatics.siegelense.runsDir, runId],
  });

  return {
    transcript: absoluteFilePathContract.parse(transcript),
    storedReturn: absoluteFilePathContract.parse(storedReturn),
    shotsDir: absoluteFilePathContract.parse(shotsDir),
  };
};
