/**
 * PURPOSE: Partial work item schema for modify-quest-input. Only id is required;
 *          all other fields are optional for partial updates.
 *
 * USAGE:
 * workItemForUpsertContract.parse({ id: 'f47ac10b-...', status: 'complete' });
 * // Returns: WorkItemForUpsert with only id required
 *
 * CLEAR SEMANTICS:
 * - `sessionId` and `startedAt` accept explicit `null` to mean
 *   "remove this field from the persisted work item." Used by orphan-reset to
 *   discard stale per-run identity when flipping in_progress → pending.
 * - The MCP `modify-quest` boundary strips `workItems` entirely, so these
 *   nullable fields are orchestrator-internal — no LLM caller can set them.
 */

import { z } from '#gateway/npm/zod';

import { workItemContract } from '../work-item/work-item-contract';
import { sessionContract } from '../session/session-contract';

export const workItemForUpsertContract = workItemContract.partial().extend({
  id: workItemContract.shape.id,
  sessionId: sessionContract.shape.id.nullable().optional(),
  startedAt: z.iso.datetime().brand<'IsoTimestamp'>().nullable().optional(),
});

export type WorkItemForUpsert = z.infer<typeof workItemForUpsertContract>;
