/**
 * PURPOSE: Reads one instance's `runs/` directory listing and decides, in the ONE place `results`
 * and `status` both read from, how many runs exist, which is the latest, and whether that latest
 * run's own `.json` stored return landed. `run-execute-broker.ts` appends to a run's `.jsonl`
 * transcript INSIDE the step loop and writes the matching `.json` ONCE, after the loop exits — so an
 * instance killed mid-run-2 leaves `run_2.jsonl` on disk with no `run_2.json`. Counting `.json` files
 * instead would undercount by exactly the crashed run a post-mortem most needs to find
 * (siegelense-tooling.md line 1206: "a death at step 7 of run 2 does not lose runs 1 and 2"), so
 * `runCount`/`latestRunId` come off the `.jsonl` set. `evidenceComplete` is `true` when there are no
 * runs at all, or when the latest run's `.json` sits beside its `.jsonl`; `false` only when the
 * driver died before that closing write ran — the signal `status`'s `evidenceComplete` field reports
 * (chunk-03-read-path-and-perception.md §3.C, spec line 2707).
 *
 * USAGE:
 * runEvidenceComputeTransformer({ entries: ['run_1.jsonl', 'run_1.json', 'run_2.jsonl'] });
 * // Returns { runCount: 2, latestRunId: 'run_2', evidenceComplete: false }
 */

import { readingCountContract } from '../../contracts/reading-count/reading-count-contract';
import type { ReadingCount } from '../../contracts/reading-count/reading-count-contract';
import { runIdContract } from '../../contracts/run-id/run-id-contract';
import type { RunId } from '../../contracts/run-id/run-id-contract';
import { evidenceFileStatics } from '../../statics/evidence-file/evidence-file-statics';
import { instanceLifecycleStatics } from '../../statics/instance-lifecycle/instance-lifecycle-statics';

export const runEvidenceComputeTransformer = ({
  entries,
}: {
  entries: readonly string[];
}): { runCount: ReadingCount; latestRunId: RunId | null; evidenceComplete: boolean } => {
  const runIds: RunId[] = entries
    .filter((entry) => entry.endsWith(evidenceFileStatics.extensions.transcript))
    .map((entry) => entry.slice(0, entry.length - evidenceFileStatics.extensions.transcript.length))
    .filter((candidate) => runIdContract.safeParse(candidate).success)
    .map((candidate) => runIdContract.parse(candidate));

  if (runIds.length === 0) {
    return { runCount: readingCountContract.parse(0), latestRunId: null, evidenceComplete: true };
  }

  const sortedDescending = [...runIds].sort(
    (first, second) =>
      Number(second.slice(instanceLifecycleStatics.ids.runPrefix.length)) -
      Number(first.slice(instanceLifecycleStatics.ids.runPrefix.length)),
  );
  const latestRunId = sortedDescending[0] ?? null;
  const evidenceComplete =
    latestRunId === null
      ? true
      : entries.includes(`${latestRunId}${evidenceFileStatics.extensions.runReturn}`);

  return {
    runCount: readingCountContract.parse(runIds.length),
    latestRunId,
    evidenceComplete,
  };
};
