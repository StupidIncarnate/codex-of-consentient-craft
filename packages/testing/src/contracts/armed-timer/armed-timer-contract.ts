/**
 * PURPOSE: A timer the watch adapter saw armed, plus the question only the adapter can answer —
 * whether it is STILL holding the event loop. Reach for this over `openHandleFinding` while a suite
 * is running; the finding is what a still-pending armed timer becomes once the suite has ended.
 *
 * The node handle itself never appears here on purpose. `isPending` closes over it inside the
 * adapter, so nothing downstream has to know what a `NodeJS.Timeout` is or that jsdom hands back a
 * number instead.
 *
 * USAGE:
 * const armed = ArmedTimerStub({kind: 'setInterval'});
 * armed.isPending();
 * // Returns true while the timer is un-cleared and still ref-ed
 */

import { z } from 'zod';
import { openHandleStatics } from '../../statics/open-handle/open-handle-statics';

export const armedTimerContract = z.object({
  kind: z.enum(openHandleStatics.timers.arm).brand<'OpenHandleKind'>(),
  stack: z.string().brand<'OpenHandleStack'>(),
});

export type ArmedTimer = z.infer<typeof armedTimerContract> & {
  isPending: () => boolean;
};
