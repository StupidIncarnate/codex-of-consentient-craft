/**
 * PURPOSE: Answers whether a timer handle is still keeping the event loop alive. Reach for this
 * before reporting an un-cleared timer as a leak — a `.unref()`-ed interval is un-cleared forever by
 * design and holds nothing open, so reporting it would be a false alarm every single run.
 *
 * USAGE:
 * isTimerHoldingLoopGuard({handle: setInterval(() => undefined, 1000)});
 * // Returns true; returns false once .unref() has been called on that handle
 */

import type { TimerHandle } from '../../contracts/timer-handle/timer-handle-contract';

export const isTimerHoldingLoopGuard = ({ handle }: { handle?: TimerHandle }): boolean => {
  if (!handle) {
    return false;
  }

  // jsdom hands back a plain number, which carries no methods. Treating that as holding is the safe
  // direction: a false report is visible and argued with, a missed leak is neither.
  if (typeof handle.hasRef !== 'function') {
    return true;
  }

  return handle.hasRef();
};
