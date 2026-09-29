/**
 * PURPOSE: The opaque thing a timer-arming function hands back, typed by the ONE question anything
 * downstream asks of it. Reach for this rather than `NodeJS.Timeout` anywhere the value may have
 * come from jsdom, which returns a plain number and so carries no methods at all.
 *
 * USAGE:
 * const handle: TimerHandle = setInterval(() => undefined, 1000);
 * handle.hasRef?.();
 * // Returns false once something has called .unref() on it
 */

import { z } from '#gateway/npm/zod';

// A bare (stripping) object, not `.loose()`: a real value this contract also has to accept — Node's
// own `Timeout` / `Immediate`, handed back by the real `setTimeout`/`setInterval`/`setImmediate` —
// carries dozens of internal fields no caller reads, and a passthrough schema would copy every one
// of them onto the parsed result. Stripping is also why the exported type below is hand-written
// rather than `z.infer<typeof timerHandleContract> & {...}`: an index signature could never be
// satisfied by a real `Timeout`/`Immediate` value, which carries no index signature of its own.
export const timerHandleContract = z.object({});

export interface TimerHandle {
  hasRef?: () => boolean;
}
