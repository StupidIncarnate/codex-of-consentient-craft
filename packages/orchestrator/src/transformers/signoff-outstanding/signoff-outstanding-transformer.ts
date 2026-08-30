/**
 * PURPOSE: Returns the verification units still carrying NO sign-off on the track an operation item
 * belongs to — that item's work list. Nothing refuses a `done` over it; it is what
 * `get-qa-checklist` and the quest summary both report back to their readers.
 *
 * USAGE:
 * signoffOutstandingTransformer({ quest, operationItem });
 * // Returns QaChecklistItemId[] — empty means every unit in this item's track scope is signed
 *
 * This exists so coverage is COMPUTED rather than self-reported. A session holds its own coverage in
 * working context, and a long serial run degrades that context well before the scope is finished.
 * Recomputing from the graph and the persisted sign-offs gives every reader — the session, its
 * reviewer, a human picking the quest back up — the same ground-truth list instead of a claim.
 *
 * THE DENOMINATORS ARE NOT THE SIGN-OFF FIELDS, AND ONE FUNCTION SERVES ALL OF THEM. A `codeweaver`
 * item is measured against `codeweaverSignoff`, a `flowrider` item against `flowriderSignoff`, a
 * `siegemaster` item against `siegemasterSignoff` — and a denominator that shared another role's
 * field would resolve through this same lookup. No field reads another, so the same unit can be
 * outstanding for one track and settled for the next. Every role outside `byTrack` returns an empty
 * array — it has no track to measure.
 *
 * FLOW SCOPE IS DATA, NOT A ROLE BRANCH. Whether an item's own `flowIds` narrow its denominator is
 * `signoffTrackEligibilityStatics.byTrack[track].flowScope`, which states the DIMENSION the relay
 * sliced that track's items on rather than restating it as a role comparison here. Every track
 * reads `declared`: its `flowIds` ARE its COVERAGE SCOPE, and this reports exactly the flows the
 * session's own `get-qa-checklist({ questId, operationItemId })` call answers for. That call names
 * the item and nothing else: `getQaChecklistInputContract` is `.strict()`, and `operationItemId`
 * replaced `track`, `flowId` and `packageNames` as separate arguments, so the tool derives the flows
 * and the track from the item through this same transformer. Scoping an item over every runtime flow
 * instead hands the FIRST of several sibling items a work list several sessions were meant to split,
 * because every sibling flow sharing one of its packages lands in its denominator. An item declaring
 * no flows matches nothing, which is what keeps a flow-less quest and any track-less item
 * completable.
 *
 * THE PACKAGE NARROWING IS TWO SEPARATE QUESTIONS, and this file answers neither itself — it hands
 * the item's `packageNames` and the quest's `packagesAffected` to
 * `signoffFlowOutstandingTransformer`, which shares one narrowing with every other surface that
 * quotes a remainder.
 *
 * - The track's package KINDS say which packages a track can prove a unit in at all.
 * - The item's own package NAMES are what make the fan-out more than cosmetic. Codeweaver's seed
 *   becomes one item per package; without this each of them would carry the whole quest's
 *   denominator, so this item's work list would include every unit on every package instead of its
 *   own slice — the measured failure the slicing exists to fix. An item declaring NO names is scoped
 *   to the whole quest and is not narrowed.
 *
 * BOTH VERDICTS CLEAR A UNIT — `confirmed` and `unconfirmable` alike. What this reports is the
 * ABSENCE of a sign-off, so the list can always be emptied honestly.
 *
 * This file owns FLOW SCOPE — which flows an item is measured over. Which units within a flow are
 * outstanding is `signoffFlowOutstandingTransformer`, the same call `get-qa-checklist` makes for its
 * REMAINING count, so the ids this reports are byte-identical to the ones the tool handed the
 * session.
 */

import type { OperationItem, QaChecklistItemId, Quest } from '@dungeonmaster/shared/contracts';

import { operationSignoffScopeTransformer } from '../operation-signoff-scope/operation-signoff-scope-transformer';
import { signoffFlowOutstandingTransformer } from '../signoff-flow-outstanding/signoff-flow-outstanding-transformer';

export const signoffOutstandingTransformer = ({
  quest,
  operationItem,
}: {
  quest: Quest;
  operationItem: OperationItem;
}): QaChecklistItemId[] => {
  // The scope derivation is SHARED with `get-qa-checklist`, deliberately: this transformer reports
  // an operation item's work list, and that tool is what the agent reads to find out what it owes.
  // Two copies of "which flows, which packages, which track" is two answers to one question, and the
  // agent only ever sees one of them.
  const scope = operationSignoffScopeTransformer({ quest, operationItem });

  if (scope === null) {
    return [];
  }

  return scope.flows.flatMap((flow) =>
    signoffFlowOutstandingTransformer({
      flow,
      track: scope.track,
      packagesAffected: quest.packagesAffected,
      packageNames: scope.packageNames,
    }),
  );
};
