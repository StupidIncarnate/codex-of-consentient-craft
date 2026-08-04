/**
 * PURPOSE: Defines the complete, deterministically-enumerated blightwarden review surface of a
 * quest diff — every changed-file/concern unit, measured from `baseRef`, and which of those units
 * still carry no disposition
 *
 * USAGE:
 * blightChecklistContract.parse({
 *   baseRef: 'a1b2c3d4e5f6',
 *   items: [...],
 *   remainingItemIds: ['packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:coverage'],
 * });
 * // Returns: BlightChecklist — the answer to "what is left on this quest diff?"
 *
 * `items` is produced by crossing every changed impl file (measured from `baseRef`) with every
 * BlightConcern, so it cannot summarise, skip a long tail, or lose fidelity on a large diff.
 * `remainingItemIds` is the difference between that list and `quest.planningNotes.blightLedger`,
 * which is what makes completion a computed fact: a session asks what is left rather than
 * recalling what it did.
 */

import { z } from 'zod';

import { blightChecklistItemIdContract } from '../blight-checklist-item-id/blight-checklist-item-id-contract';
import { blightChecklistItemContract } from '../blight-checklist-item/blight-checklist-item-contract';

export const blightChecklistContract = z.object({
  baseRef: z
    .string()
    .min(1)
    .brand<'GitBaseRef'>()
    .describe('The commit this checklist enumerates the diff from — quest.baseRef.'),
  items: z
    .array(blightChecklistItemContract)
    .default([])
    .describe(
      'Every changed-file/concern unit on this quest diff. THIS is the definition of done, not the changed-file list alone.',
    ),
  remainingItemIds: z
    .array(blightChecklistItemIdContract)
    .default([])
    .describe(
      'The units carrying no entry in quest.planningNotes.blightLedger. Empty is the only state in which a blightwarden operation item may report `done`.',
    ),
});

export type BlightChecklist = z.infer<typeof blightChecklistContract>;
