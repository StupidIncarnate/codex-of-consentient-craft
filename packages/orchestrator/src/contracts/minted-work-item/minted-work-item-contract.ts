/**
 * PURPOSE: One work item the router has decided to create, before anything persists it. Reach for
 * this over `workItemContract` (`@dungeonmaster/shared/contracts`) by TIME: that one is the persisted
 * row, with the id, status, timestamps and refs the write path fills in; this is the half the router
 * DECIDES, and it invents none of the rest.
 *
 * USAGE:
 * mintedWorkItemContract.parse({
 *   step: 'fixHappy',
 *   role: 'siegemaster',
 *   assignedUnitIds: ['send-flow:off-map:perf'],
 *   mintedBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 * });
 * // Returns: MintedWorkItem — `assignedUnitIds` defaults to [] and `needsLane` to false
 *
 * `assignedUnitIds` IS ALREADY FILTERED against the record. A piece's own `assignedUnitIds` is the
 * planner's INTENT; this is what the session is actually answerable for, which is why story 14's
 * signal gate reads the work item's copy and never the piece's.
 *
 * `pieceId` AND `payload` COME APART on a mark-, request-, invalidation- or return-mint: there is no
 * piece, so `pieceId` is absent, while `payload` may still carry the ORIGINATING piece's brief copied
 * across. A unit no piece ever claimed gets neither, and that is the reviewer's whole job — there is
 * nothing to copy from, and synthesising a payload for it would invent a brief nobody wrote.
 */

import {
  pieceIdContract,
  questWorkItemIdContract,
  stepNameContract,
  unitIdContract,
  workItemRoleContract,
} from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const mintedWorkItemContract = z.object({
  step: stepNameContract,
  role: workItemRoleContract.describe(
    'Copied from the operation item this scope belongs to — never invented.',
  ),
  assignedUnitIds: z.array(unitIdContract).default([]),
  pieceId: pieceIdContract.optional(),
  payload: z
    .record(z.unknown())
    .optional()
    .describe("The piece's own brief, or the copy inherited from the piece that first claimed."),
  mintedBy: questWorkItemIdContract
    .optional()
    .describe(
      'THE RETURN EDGE — the work item whose `unmet` marks or `request` caused this one to exist.',
    ),
  needsLane: z
    .boolean()
    .default(false)
    .describe(
      'Copied off the step config: this item needs a siegelense lane before it dispatches.',
    ),
});

export type MintedWorkItem = z.infer<typeof mintedWorkItemContract>;
