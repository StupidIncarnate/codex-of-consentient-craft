/**
 * PURPOSE: Extracts a RunId from child ward process stdout by matching the "run: <id>" line
 *
 * USAGE:
 * const runId = extractChildRunIdTransformer({ output: 'run: 1739625600000-a3f1\nlint: PASS' });
 * // Returns RunId or null if pattern not found
 */

import { runIdContract, type RunId } from '../../contracts/run-id/run-id-contract';

const RUN_ID_PATTERN = /^run: (\d+-[a-f0-9]+)$/mu;

export const extractChildRunIdTransformer = ({ output }: { output: string }): RunId | null => {
  const match = RUN_ID_PATTERN.exec(output);

  if (match === null) {
    return null;
  }

  const parsed = runIdContract.safeParse(match[1]);
  return parsed.success ? parsed.data : null;
};
