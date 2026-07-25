/**
 * PURPOSE: Zod schema for the reason an agent gives when it signals `operationStatus: 'blocked'` —
 * the environment wall that no fresh session of the same role could get past.
 *
 * USAGE:
 * const reason = blockedReasonContract.parse('git add is permission-denied in a dispatched session');
 * // Returns branded BlockedReason type
 *
 * WHEN-TO-USE: On a signal-back whose outcome is `blocked`. The orchestrator writes it onto the
 *   signalled work item's `errorMessage` (re-branded), which the execution row renders, so the
 *   user sees WHY the quest halted instead of an unexplained `blocked` status.
 * WHEN-NOT-TO-USE: For scope that simply remains — that is `partial`, whose handoff is the git
 *   commit message, and it is bounded by the role's pt-chain budget rather than halting the quest.
 */

import { z } from 'zod';

export const blockedReasonContract = z.string().min(1).brand<'BlockedReason'>();

export type BlockedReason = z.infer<typeof blockedReasonContract>;
