/**
 * PURPOSE: ONE flow's line in a quest summary — its identity and one coverage row per verification
 * track that is measured over it
 *
 * USAGE:
 * questSummaryFlowContract.parse({
 *   id: 'login-flow',
 *   name: 'Login Flow',
 *   flowType: 'runtime',
 *   tracks: [{ id: 'flowrider', confirmed: 12, unconfirmable: 1, outstanding: 3 }],
 * });
 * // Returns: QuestSummaryFlow — one element of QuestSummary.flows[]
 *
 * `tracks` CARRIES ONLY THE DENOMINATORS THIS FLOW IS MEASURED BY, which is why it is a list and not
 * a fixed set. `signoffTrackEligibilityStatics` says which flow types each denominator includes, and
 * the two authoring ones are runtime flows alone: an operational flow is verified by checking its
 * end state, never by a flow-perspective suite or a browser walk, so printing their rows on one
 * would report outstanding counts no session of either role can ever bring to zero.
 *
 * `name` and `flowType` are carried rather than left for the reader to join back to `quest.flows`,
 * because the summary's whole job is to be the one thing a reader has to load.
 */

import { z } from 'zod';

import { flowContract } from '../flow/flow-contract';
import { flowIdContract } from '../flow-id/flow-id-contract';
import { flowTypeContract } from '../flow-type/flow-type-contract';
import { questSummaryTrackCountsContract } from '../quest-summary-track-counts/quest-summary-track-counts-contract';

export const questSummaryFlowContract = z.object({
  id: flowIdContract,
  name: flowContract.shape.name,
  flowType: flowTypeContract,
  tracks: z
    .array(questSummaryTrackCountsContract)
    .default([])
    .describe(
      'One row per verification track whose denominator includes this flow. A track absent from the list does not measure this flow at all, which is a different statement from measuring it and finding nothing.',
    ),
});

export type QuestSummaryFlow = z.infer<typeof questSummaryFlowContract>;
