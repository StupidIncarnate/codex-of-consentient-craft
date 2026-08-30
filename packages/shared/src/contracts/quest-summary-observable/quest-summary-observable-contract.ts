/**
 * PURPOSE: One observable that was NOT in the spec at approval — its verbatim text, where it hangs
 * on the graph, and which role added it mid-quest
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
 * // Returns: QuestSummaryObservable — one element of QuestSummary.midQuestObservables[]
 *
 * THIS IS THE SCOPE-DRIFT LEDGER. Everything here was discovered while the quest ran: a defect a
 * walker measured, a case an implementer found, a hole the operator wrote in by hand. The user
 * approved a spec that did not contain it, so "what got added after you approved, and by whom" is
 * the one question a summary has to be able to answer without diffing two quest files.
 *
 * `id` is the DERIVED verification unit id (`<flowId>:observable:<observableId>`), not the raw
 * observable id, so an entry here addresses the same unit `get-qa-checklist` prints and a track's
 * own work list names. `observableId` is kept alongside it because that is what a modify-quest write
 * names.
 *
 * `addedBy` is never `spec` here: a `spec` origin means the observable was in the flow at approval,
 * which is the absence of drift, and listing it would bury the four real additions under forty.
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
    'The role that wrote this observable in after approval. Never `spec` — a spec-origin observable is not a mid-quest addition.',
  ),
  observableType: outcomeTypeContract,
  description: flowObservableContract.shape.description.describe(
    'The observable text exactly as its author wrote it. Carried verbatim, and allowed to be blank, because a blank description is a spec hole the reader must see rather than a reason to drop the row.',
  ),
});

export type QuestSummaryObservable = z.infer<typeof questSummaryObservableContract>;
