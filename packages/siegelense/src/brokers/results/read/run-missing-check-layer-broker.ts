/**
 * PURPOSE: The one probe every `resultsReadBroker` kind branch runs before trusting a `matched: 0`
 * — reads the stored return and, only if THAT is ENOENT, the transcript; both absent means the run
 * never happened (or was fully pruned), and this throws `RunMissingError` rather than letting a
 * mistyped run id read back identically to a run that genuinely logged nothing of the asked-for
 * kind. Either file present means the run is real, so the caller's own zero stands as a legitimate
 * empty. Reach for this over inlining the same two-file catch chain again at each call site — one
 * place is what keeps every kind's refusal message identical and keeps them from drifting apart.
 *
 * USAGE:
 * await runMissingCheckLayerBroker({
 *   instanceId: InstanceIdStub(), runId: RunIdStub({ value: 'run_999' }),
 *   storedReturnPath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/.../run_999.json' }),
 *   transcriptPath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/.../run_999.jsonl' }),
 * });
 * // Throws RunMissingError when neither file exists; otherwise returns the stored return's raw
 * // FileContents (or null, for a run that crashed before its closing write)
 */

import { runMissingCheckLayerResultContract } from '../../../contracts/run-missing-check-layer-result/run-missing-check-layer-result-contract';
import type { RunMissingCheckLayerResult } from '../../../contracts/run-missing-check-layer-result/run-missing-check-layer-result-contract';
import type { SiegeInstance, SiegeRun } from '@dungeonmaster/shared/contracts';
import { readFileIfExists } from '#gateway/node/fs__promises';

import { RunMissingError } from '../../../errors/run-missing/run-missing-error';

export const runMissingCheckLayerBroker = async ({
  instanceId,
  runId,
  storedReturnPath,
  transcriptPath,
}: {
  instanceId: SiegeInstance['id'];
  runId: SiegeRun['id'];
  storedReturnPath: string;
  transcriptPath: string;
}): Promise<RunMissingCheckLayerResult> => {
  const rawStored = await readFileIfExists(storedReturnPath);
  if (rawStored !== null) {
    return runMissingCheckLayerResultContract.parse({ storedReturnContent: rawStored });
  }

  const transcriptContent = await readFileIfExists(transcriptPath);
  if (transcriptContent === null) {
    throw new RunMissingError({ instanceId, runId });
  }

  return runMissingCheckLayerResultContract.parse({ storedReturnContent: null });
};
