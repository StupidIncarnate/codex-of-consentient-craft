/**
 * PURPOSE: Counts the `runs/run_N.json` stored returns one instance holds on disk, and names the
 * highest-numbered run id among them — the run count `RunIdRequiredError` names and the "latest
 * run" an `alive` instance's `results` call defaults to (chunk-03-read-path-and-perception.md
 * §3.C). Reads the runs directory rather than the driver's own in-memory run counter
 * (`driverSessionState.nextRunId`), because `results` starts nothing and answers for an instance
 * whose driver may already be dead — the count and the latest id must both come off disk.
 * **Returns a COUNT and the latest id, never the list** — enumerating run ids is `status`'s
 * would-be job, not this one's.
 *
 * USAGE:
 * await runListLayerBroker({
 *   evidencePath: AbsoluteFilePathStub({ value: '/repo/.siegelense/unowned/instances/inst_1' }),
 * });
 * // Returns { runCount: 2, latestRunId: 'run_2' } for an instance holding run_1.json and run_2.json
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import { runIdContract } from '../../../contracts/run-id/run-id-contract';
import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { evidenceFileStatics } from '../../../statics/evidence-file/evidence-file-statics';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';

export const runListLayerBroker = async ({
  evidencePath,
}: {
  evidencePath: AbsoluteFilePath;
}): Promise<{ runCount: ReadingCount; latestRunId: RunId | null }> => {
  const runsDir = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [evidencePath, locationsStatics.siegelense.runsDir] }),
  );

  const entries = await fsReaddirAdapter({ dirPath: runsDir });

  const runIds: RunId[] = entries
    .filter((entry) => entry.endsWith(evidenceFileStatics.extensions.runReturn))
    .map((entry) => entry.slice(0, entry.length - evidenceFileStatics.extensions.runReturn.length))
    .filter((candidate) => runIdContract.safeParse(candidate).success)
    .map((candidate) => runIdContract.parse(candidate));

  if (runIds.length === 0) {
    return { runCount: readingCountContract.parse(0), latestRunId: null };
  }

  const sortedDescending = [...runIds].sort(
    (first, second) =>
      Number(second.slice(instanceLifecycleStatics.ids.runPrefix.length)) -
      Number(first.slice(instanceLifecycleStatics.ids.runPrefix.length)),
  );

  return {
    runCount: readingCountContract.parse(runIds.length),
    latestRunId: sortedDescending[0] ?? null,
  };
};
