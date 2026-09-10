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
    .filter((line) => !line.includes(openHandleStatics.report.selfFrame))
    .filter((line) => !line.includes(openHandleStatics.report.internalFrame))
    .slice(0, openHandleStatics.report.maxStackFrames);

  return armedTimerContract.shape.stack.parse(frames.join('\n'));
};
