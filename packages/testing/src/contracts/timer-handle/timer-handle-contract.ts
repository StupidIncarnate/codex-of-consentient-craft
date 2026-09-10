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

import { z } from 'zod';

export const timerHandleContract = z.object({});

export type TimerHandle = z.infer<typeof timerHandleContract> & {
  hasRef?: () => boolean;
};
