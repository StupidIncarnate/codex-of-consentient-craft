/**
 * PURPOSE: One `unconfirmable` sign-off, surfaced with the unit it settled, the track that wrote it,
 * and the whole sign-off so its reason and its routable question travel with it
 *
 * USAGE:
 * questSummaryUnconfirmableContract.parse({
 *   id: 'login-flow:observable:rejects-bleh-payload:flowrider',
 *   unitId: 'login-flow:observable:rejects-bleh-payload',
 *   flowId: 'login-flow',
 *   kind: 'observable',
 *   track: 'flowrider',
 *   signoff: {
 *     verdict: 'unconfirmable',
 *     evidence: 'the project Playwright config declares no webServer, so no e2e can reach the app',
 *     question: 'Who owns adding a webServer block to playwright.config.ts?',
 *     workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *     at: '2026-01-01T00:00:00.000Z',
 *   },
 * });
 * // Returns: QuestSummaryUnconfirmable — one element of QuestSummary.unconfirmable[]
 *
 * `unconfirmable` CLEARS THE COMPLETION GATE, which is exactly why it needs its own list. The gate
 * refuses the ABSENCE of a sign-off, not an honest one, so a quest can reach `complete` with real
 * holes in it and every one of those holes is an `unconfirmable` verdict. Nothing else surfaces
 * them: the flow counts say how many, and this says which, why, and what someone would have to
 * answer to close it.
 *
 * THE WHOLE `signoff` IS CARRIED rather than `evidence` and `question` copied out of it. Those two
 * are the point of the entry, but `workItemId` and `at` are what make it routable — who to ask and
 * when they hit the wall — and re-declaring the fields here would let the two shapes drift.
 *
 * `id` IS THE UNIT CROSSED WITH THE TRACK because the two tracks sign independently: one unit can be
 * unconfirmable on both, for different reasons, and a unit-only id would collide.
 */

import { z } from 'zod';

import { flowIdContract } from '../flow-id/flow-id-contract';
import { qaChecklistItemIdContract } from '../qa-checklist-item-id/qa-checklist-item-id-contract';
import { qaChecklistKindContract } from '../qa-checklist-kind/qa-checklist-kind-contract';
import { signoffContract } from '../signoff/signoff-contract';
import { signoffTrackContract } from '../signoff-track/signoff-track-contract';

export const questSummaryUnconfirmableContract = z.object({
  id: z
    .string()
    .min(1)
    .brand<'QuestSummaryUnconfirmableId'>()
    .describe('`<unitId>:<track>` — the unit crossed with the track that could not confirm it.'),
  unitId: qaChecklistItemIdContract,
  flowId: flowIdContract,
  kind: qaChecklistKindContract,
  track: signoffTrackContract,
  signoff: signoffContract.describe(
    'The sign-off verbatim. `evidence` is why confirmation was out of reach and `question` is what someone else would have to answer to close it; both are required on this verdict.',
  ),
});

export type QuestSummaryUnconfirmable = z.infer<typeof questSummaryUnconfirmableContract>;
