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
 * verification track — the units carrying no sign-off in that track's own field — which is what
 * makes completion a computed fact: a session asks what is left rather than recalling what it did,
 * and reads the very number that will refuse its `done`.
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
      "The units still outstanding for the track that asked. Named a `track` and these are the units carrying no `flowriderSignoff` / `siegemasterSignoff` — the two tracks are independent, so a unit the other track has signed is still outstanding for yours. Empty is the only state in which that track's operation item may report `done`; `confirmed` and `unconfirmable` both clear a unit, so it always empties honestly.",
    ),
});

export type QaChecklist = z.infer<typeof qaChecklistContract>;
