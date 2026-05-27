/**
 * PURPOSE: Partial work item schema for modify-quest-input. Only id is required;
 *          all other fields are optional for partial updates.
 *
 * USAGE:
 * workItemForUpsertContract.parse({ id: 'f47ac10b-...', status: 'complete' });
 * // Returns: WorkItemForUpsert with only id required
 *
 * CLEAR SEMANTICS:
 * - `sessionId`, `agentId`, and `startedAt` accept explicit `null` to mean
 *   "remove this field from the persisted work item." Used by orphan-reset to
 *   discard stale per-run identity when flipping in_progress → pending.
 * - The MCP `modify-quest` boundary strips `workItems` entirely, so these
 *   nullable fields are orchestrator-internal — no LLM caller can set them.
 */

import { z } from 'zod';

import { agentIdContract } from '../agent-id/agent-id-contract';
import { questWorkItemIdContract } from '../quest-work-item-id/quest-work-item-id-contract';
import { sessionIdContract } from '../session-id/session-id-contract';
import { workItemContract } from '../work-item/work-item-contract';

export const workItemForUpsertContract = workItemContract.partial().extend({
  id: questWorkItemIdContract,
  sessionId: sessionIdContract.nullable().optional(),
  agentId: agentIdContract.nullable().optional(),
  startedAt: z.string().datetime().brand<'IsoTimestamp'>().nullable().optional(),
});

export type WorkItemForUpsert = ReturnType<typeof workItemForUpsertContract.parse>;
