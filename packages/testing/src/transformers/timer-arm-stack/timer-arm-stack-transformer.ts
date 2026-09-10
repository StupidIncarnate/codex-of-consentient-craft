/**
 * PURPOSE: Cuts a raw `Error.stack` down to the frames that name whoever armed a timer. Reach for
 * this rather than storing the stack whole: the top frames are the watch adapter's own wrappers and
 * node's timer plumbing, which name no caller, and the tail is jest's runtime, which names the same
 * runtime for every finding in the run.
 *
 * USAGE:
 * timerArmStackTransformer({stack: new Error('armed').stack});
 * // Returns the caller frames, newline-joined, capped at openHandleStatics.report.maxStackFrames
 */

import { armedTimerContract } from '../../contracts/armed-timer/armed-timer-contract';
import type { ArmedTimer } from '../../contracts/armed-timer/armed-timer-contract';
import { openHandleStatics } from '../../statics/open-handle/open-handle-statics';

export const timerArmStackTransformer = ({
  stack,
}: {
  stack?: string | undefined;
}): ArmedTimer['stack'] => {
  const frames = (stack ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('at '))
    // A frame with no line:column names no source and so names nothing anyone can fix.
    // `at new Promise (<anonymous>)` is the one that matters: it is what remains of a
    // Playwright-internal wait once its node_modules frames are gone, and it survived the foreign
    // filter to leave 50 unactionable findings on a clean five-spec batch.
    .filter((line) => /:\d+:\d+\)?$/u.test(line))
    .filter((line) => !openHandleStatics.report.selfFrames.some((mark) => line.includes(mark)))
    .filter((line) => !openHandleStatics.report.foreignFrames.some((mark) => line.includes(mark)))
    .slice(0, openHandleStatics.report.maxStackFrames);

  return armedTimerContract.shape.stack.parse(frames.join('\n'));
};
