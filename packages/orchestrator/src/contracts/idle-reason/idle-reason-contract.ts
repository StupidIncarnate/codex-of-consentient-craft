/**
 * PURPOSE: The sentence a forced idle carries back to /dumpster-launch, telling the polling session
 *   why nothing will be returned. Reach for this whenever an idle is DECIDED rather than organic —
 *   the Node dispatcher owning the queue, or the rate-limit guardrail holding it — because a bare
 *   `{ type: 'idle' }` reads to that session as "no work right now" and it keeps polling.
 *
 * USAGE:
 * idleReasonContract.parse('rate-limit guardrail: 7d window at 93%. Dispatch resumes at ...');
 * // Returns a branded IdleReason
 */

import { z } from 'zod';

export const idleReasonContract = z.string().min(1).brand<'IdleReason'>();

export type IdleReason = z.infer<typeof idleReasonContract>;
