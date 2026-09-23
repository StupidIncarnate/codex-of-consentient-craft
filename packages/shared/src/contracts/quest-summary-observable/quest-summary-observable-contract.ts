/**
 * PURPOSE: One observable, addressed and attributed — its verbatim text, where it hangs on the
 * graph, and which role wrote it. Backs two different `QuestSummary` slices with different
 * filtering rules: `midQuestObservables` (scope drift — every observable NOT authored at spec
 * approval) and `humanChecks` (every `verifyByHuman` observable, spec-authored ones included).
 *
 * USAGE:
 * questSummaryObservableContract.parse({
 *   id: 'login-flow:observable:rejects-bleh-payload',
 *   flowId: 'login-flow',
 *   nodeId: 'submit-credentials',
 *   observableId: 'rejects-bleh-payload',
 *   addedBy: 'siegemaster',
 *   observableType: 'api-call',
 *   description: 'POST /api/auth/login returns 400 for a non-JSON body',
 * });
 * // Returns: QuestSummaryObservable — one element of QuestSummary.midQuestObservables[] or
 * // QuestSummary.humanChecks[]
 *
 * ON `midQuestObservables` THIS IS THE SCOPE-DRIFT LEDGER: every entry there was discovered while
 * the quest ran — a defect a walker measured, a case an implementer found, a hole the operator wrote
 * in by hand. The caller filters `spec`-origin observables out before building that slice, since a
 * `spec` origin means the observable was in the flow at approval, which is the absence of drift.
 *
 * ON `humanChecks` `addedBy` CARRIES NO SUCH RESTRICTION: a spec-authored `verifyByHuman` observable
 * is exactly as real a human check as one a role writes in mid-quest, so that slice lists every
 * origin, `spec` included.
 *
 * `id` is the DERIVED verification unit id (`<flowId>:observable:<observableId>`), not the raw
 * observable id, so an entry here addresses the same unit id `get-quest-work` serves and a track's
 * own work list names. `observableId` is kept alongside it because that is what a modify-quest write
 * names.
 */

import { z } from 'zod';

import { flowIdContract } from '../flow-id/flow-id-contract';
import { flowNodeIdContract } from '../flow-node-id/flow-node-id-contract';
import { flowObservableContract } from '../flow-observable/flow-observable-contract';
import { observableIdContract } from '../observable-id/observable-id-contract';
import { observableOriginContract } from '../observable-origin/observable-origin-contract';
import { outcomeTypeContract } from '../outcome-type/outcome-type-contract';
import { qaChecklistItemIdContract } from '../qa-checklist-item-id/qa-checklist-item-id-contract';

export const questSummaryObservableContract = z.object({
  id: qaChecklistItemIdContract,
  flowId: flowIdContract,
  nodeId: flowNodeIdContract,
  observableId: observableIdContract,
  addedBy: observableOriginContract.describe(
    'Who wrote this observable in. On `midQuestObservables`, never `spec` — that slice is scope drift, filtered to post-approval additions. On `humanChecks`, `spec` is a legitimate value — a spec-authored verifyByHuman observable is still a human check.',
  ),
  observableType: outcomeTypeContract,
  description: flowObservableContract.shape.description.describe(
    'The observable text exactly as its author wrote it. Carried verbatim, and allowed to be blank, because a blank description is a spec hole the reader must see rather than a reason to drop the row.',
  ),
});

export type QuestSummaryObservable = z.infer<typeof questSummaryObservableContract>;
