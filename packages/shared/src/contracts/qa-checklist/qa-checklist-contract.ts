/**
 * PURPOSE: Defines the complete, deterministically-enumerated QA surface of ONE flow — every walk
 * path, every atomic verification unit, and which of those units still have no disposition
 *
 * USAGE:
 * qaChecklistContract.parse({
 *   flowId: 'view-persisted-comments', flowName: 'View Persisted Comments on a Quest',
 *   entryPoint: '/:guildSlug/quest/:questId', paths: [...], items: [...],
 *   remainingItemIds: ['view-persisted-comments:observable:check-badge-count-text'],
 * });
 * // Returns: QaChecklist — the answer to "what is left on this flow?"
 *
 * This is the shape the `get-qa-checklist` MCP tool returns. `items` is produced by walking
 * `quest.flows` with no model in the loop, so it cannot summarise, skip a long tail, or lose
 * fidelity on a 45-observable flow. `remainingItemIds` is what that list still owes the CALLING
 * verification track — the units no work item of that track has marked `met` or `cant-meet` — which
 * is what makes completion a computed fact: a session asks what is left rather than recalling what
 * it did.
 */

import { z } from 'zod';

import { flowIdContract } from '../flow-id/flow-id-contract';
import { qaChecklistItemIdContract } from '../qa-checklist-item-id/qa-checklist-item-id-contract';
import { qaChecklistItemContract } from '../qa-checklist-item/qa-checklist-item-contract';
import { qaWalkPathContract } from '../qa-walk-path/qa-walk-path-contract';

export const qaChecklistContract = z.object({
  flowId: flowIdContract,
  flowName: z.string().min(1).brand<'FlowName'>(),
  entryPoint: z.string().min(1).brand<'FlowEntryPoint'>(),
  paths: z
    .array(qaWalkPathContract)
    .default([])
    .describe('Every simple route from an entry node to a terminal — the itineraries to dispatch.'),
  pathsTruncated: z
    .boolean()
    .default(false)
    .describe(
      'True when path enumeration hit its cap and this list is incomplete. Surfaced rather than silently trimmed, because a truncated list that reads as complete is how scope goes missing.',
    ),
  items: z
    .array(qaChecklistItemContract)
    .default([])
    .describe(
      'Every atomic verification unit on this flow. THIS is the definition of done, not `paths`.',
    ),
  remainingItemIds: z
    .array(qaChecklistItemIdContract)
    .default([])
    .describe(
      "The units still outstanding for the track that asked. A unit leaves this list on a `met` or a `cant-meet` recorded in `workItem.observations` by a work item whose ROLE is that track — the tracks are independent, so a unit another track settled is still outstanding for yours, and an `unmet` settles it for nobody, since `unmet` is what mints the successor that carries it again. Asked with no track, every unit is listed: that is the read-only whole-quest shape, not a claim about any track's coverage.",
    ),
});

export type QaChecklist = z.infer<typeof qaChecklistContract>;
