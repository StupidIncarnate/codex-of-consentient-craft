/**
 * PURPOSE: Appends one step's `StepReading` to `runs/run_N.jsonl` as its own JSON line — the per-step
 * transcript flush (siegelense-tooling.md line 1676: "the step transcript is flushed PER STEP, never
 * buffered... A buffered transcript loses the whole run on a crash, including the steps that led to
 * it"). Reach for this over writing the reading inline inside `runExecuteBroker`: a dedicated broker
 * is what lets that caller's own proxy prove each append landed DURING the run rather than only once
 * at the end.
 *
 * USAGE:
 * await runTranscriptAppendBroker({
 *   transcriptPath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/.../runs/run_2.jsonl' }),
 *   reading: StepReadingStub(),
 * });
 * // Appends one JSON line
 */

import { appendFile } from '#gateway/node/fs__promises';

import type { StepReading } from '../../../contracts/step-reading/step-reading-contract';

export const runTranscriptAppendBroker = async ({
  transcriptPath,
  reading,
}: {
  transcriptPath: string;
  reading: StepReading;
}): Promise<void> => appendFile(transcriptPath, `${JSON.stringify(reading)}\n`);
