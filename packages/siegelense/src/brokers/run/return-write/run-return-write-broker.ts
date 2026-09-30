/**
 * PURPOSE: Writes one run's own `RunResult` to `runs/run_N.json` — the stored return `results {
 * instance, run }` with no `step` and no `kind` answers from in chunk 3 (siegelense-tooling.md line
 * 1634: "results { instance, run } with no step and no kind returns that run's stored return"). Reach
 * for this over `runTranscriptAppendBroker`: the transcript grows one line PER STEP as the batch
 * runs, while this is the run's own single closing summary, written once after the batch is done.
 *
 * USAGE:
 * await runReturnWriteBroker({
 *   storedReturnPath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/.../runs/run_2.json' }),
 *   result: RunResultStub(),
 * });
 * // Writes the whole RunResult as JSON, then resolves with nothing
 */

import { writeFile } from '#gateway/node/fs__promises';
import type { RunResult } from '../../../contracts/run-result/run-result-contract';

export const runReturnWriteBroker = async ({
  storedReturnPath,
  result,
}: {
  storedReturnPath: string;
  result: RunResult;
}): Promise<void> => writeFile(storedReturnPath, `${JSON.stringify(result)}\n`);
