/**
 * PURPOSE: Extracts the run ID from ward CLI summary output by matching the first line format "run: <id>"
 *
 * USAGE:
 * wardOutputToRunIdTransformer({ output: ErrorMessageStub({ value: 'run: 1739625600000-a3f1\nlint: PASS' }) });
 * // Returns FileName('1739625600000-a3f1') or null if not found
 */

import {
  fileNameContract,
  type ErrorMessage,
  type FileName,
} from '@dungeonmaster/shared/contracts';

// Capture only the `<timestamp>-<hex>` run id. The line may carry a trailing total-duration
// suffix (`run: 1780108054226-a080  (80.7s)`) appended by ward's resultToSummaryTransformer;
// the suffix must not bleed into the captured id or `ward detail <runId>` fails to resolve it.
const RUN_ID_REGEX = /^run: (\d+-[a-f0-9]+)/mu;

export const wardOutputToRunIdTransformer = ({
  output,
}: {
  output: ErrorMessage;
}): FileName | null => {
  const match = RUN_ID_REGEX.exec(String(output));

  if (!match?.[1]) {
    return null;
  }

  return fileNameContract.parse(match[1]);
};
