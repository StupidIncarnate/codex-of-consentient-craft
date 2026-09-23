/**
 * PURPOSE: Zod schema for the reason an agent gives on its `signal-back` call after it has declared
 * the outcome `wall` through `quest-work` — the environment wall that no fresh session of the same
 * role could get past.
 *
 * USAGE:
 * const reason = blockedReasonContract.parse('git add is permission-denied in a dispatched session');
 * // Returns branded BlockedReason type
 *
 * WHEN-TO-USE: On the `signal-back` call for a work item that declared `wall`. The orchestrator
 *   writes it onto that work item's `errorMessage` (re-branded), which the execution row renders,
 *   so the user sees WHY the quest halted instead of an unexplained `blocked` status.
 * WHEN-NOT-TO-USE: For scope that simply remains unmet — that mints a successor scoped to exactly
 *   those units, and its handoff is the git commit message, never this field.
 */

import { z } from 'zod';

export const blockedReasonContract = z.string().min(1).brand<'BlockedReason'>();

export type BlockedReason = z.infer<typeof blockedReasonContract>;
