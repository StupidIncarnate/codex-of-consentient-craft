/**
 * PURPOSE: One automatic veto on dispatch, raised by the rate-limit guardrail rather than by the
 *   user. Reach for this over the `mode` field on dispatchStateContract whenever the stop was not a
 *   person pressing pause: `mode` is the user's lever and the guardrail must never write it, or an
 *   auto-resume would restart a queue somebody deliberately stopped.
 *
 * USAGE:
 * dispatchHoldContract.parse({
 *   reason: 'approaching-limit',
 *   window: 'seven-day',
 *   detail: '7d window at 93%',
 *   heldAt: '2026-09-13T04:49:29.242Z',
 *   resumeAt: '2026-09-13T06:00:00.000Z',
 * });
 * // Returns: DispatchHold — dispatch stays refused until now passes resumeAt
 */

import { z } from 'zod';

export const dispatchHoldContract = z.object({
  // `approaching-limit` is raised from a snapshot percentage before anything breaks; `rejected` is
  // raised after the API answered 429, which is the case where no snapshot was fresh enough to
  // catch it first.
  reason: z.enum(['approaching-limit', 'rejected']),
  window: z.enum(['five-hour', 'seven-day']),
  // Rendered verbatim in the queue UI, so the user reads why the queue stopped without opening a
  // log. Built by the transformer that raises the hold.
  detail: z.string().min(1).brand<'DispatchHoldDetail'>(),
  heldAt: z.string().datetime().brand<'IsoTimestamp'>(),
  resumeAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type DispatchHold = z.infer<typeof dispatchHoldContract>;
