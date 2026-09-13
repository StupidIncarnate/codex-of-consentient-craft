/**
 * PURPOSE: Renders one test failure's message for the summary of a file-scoped run — the whole
 * message where it fits under the cap, and its first `maxLines` plus a marker naming the `detail`
 * command where it does not.
 *
 * USAGE:
 * inlineFailureMessageTransformer({
 *   message: failure.message,
 *   maxLines: inlineFailureStatics.message.maxLines,
 *   runId: wardResult.runId,
 *   displayPath: 'packages/ward/src/a.test.ts',
 * });
 * // Returns: the message, or its first 40 lines + '... 12 more lines — npm run ward -- detail <id> <path>'
 *
 * THE MARKER NAMES THE FILE, not just the run. `ward detail <runId>` with no path prints every
 * failure in the run plus its passing tests, which is the blob this printing exists to avoid; the
 * two-argument form answers for the one file whose message got trimmed.
 *
 * TRAILING BLANK LINES ARE DROPPED BEFORE COUNTING, so a message that only LOOKS long because jest
 * padded it is not reported as trimmed when nothing was.
 *
 * SO ARE STACK FRAMES INSIDE `node_modules`, and the cap is why. One `toStrictEqual` failure carries
 * fourteen `jest-circus` and `jest-runner` frames under an eleven-line diff — nothing a reader can
 * act on, and the file's own frame is already among the lines that stay. Left in, three failures
 * spend the budget on runner internals and the third one's diff is what gets trimmed away.
 */

import type { RunId } from '../../contracts/run-id/run-id-contract';
import type { ErrorEntry } from '../../contracts/error-entry/error-entry-contract';
import {
  testFailureContract,
  type TestFailure,
} from '../../contracts/test-failure/test-failure-contract';

const DEPENDENCY_STACK_FRAME = /^\s*at .*[/\\]node_modules[/\\]/u;

export const inlineFailureMessageTransformer = ({
  message,
  maxLines,
  runId,
  displayPath,
}: {
  message: TestFailure['message'];
  maxLines: number;
  runId: RunId;
  displayPath: ErrorEntry['filePath'];
}): TestFailure['message'] => {
  const lines = String(message)
    .split('\n')
    .filter((line) => !DEPENDENCY_STACK_FRAME.test(line));

  while (lines.length > 0 && lines[lines.length - 1]?.trim() === '') {
    lines.pop();
  }

  if (lines.length <= maxLines) {
    return testFailureContract.shape.message.parse(lines.join('\n'));
  }

  const omitted = lines.length - maxLines;
  const marker = `... ${String(omitted)} more lines — npm run ward -- detail ${String(runId)} ${String(displayPath)}`;

  return testFailureContract.shape.message.parse([...lines.slice(0, maxLines), marker].join('\n'));
};
