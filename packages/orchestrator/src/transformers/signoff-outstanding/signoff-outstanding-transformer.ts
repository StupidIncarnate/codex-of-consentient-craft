/**
 * PURPOSE: Returns the verification units still carrying NO sign-off on the track an operation item
 * belongs to — the list the signal-back completion gate refuses `done` on
 *
 * USAGE:
 * signoffOutstandingTransformer({ quest, operationItem });
 * // Returns QaChecklistItemId[] — empty means every unit in this item's track scope is signed
 *
 * This exists so completion is COMPUTED. A session holds its own coverage in working context, and a
 * long serial run degrades that context well before the scope is finished — which is how a pass
 * covers part of it and reports done. Recomputing from the graph and the persisted sign-offs takes
 * the claim out of the agent's hands entirely.
 *
 * THREE DENOMINATORS OVER TWO SIGN-OFF FIELDS, ONE FUNCTION. A `flowrider` item and a
 * `groundstomper` item are both measured against `flowriderSignoff`, over DISJOINT package kinds; a
 * `siegemaster` item against `siegemasterSignoff`. Neither field reads the other, so the same unit
 * can be outstanding for one track and settled for the other. Every role other than those three
 * returns an empty array and is never gated here.
 *
 * SCOPE IS PER-ROLE, AND THE ROLE IS THE ONLY GATE CONDITION.
 * - `flowrider` and `groundstomper` are gated UNCONDITIONALLY on role. Their denominators are
 *   computed HERE, at gate time, as the quest's flows of the types `signoffTrackEligibilityStatics`
 *   gives that track — never from `operationItem.flowIds`. Reading `flowIds` would reopen the exact
 *   hole this closes: an item declaring none would be ungated, and a whole-quest flowrider item
 *   legitimately carries none. Zero eligible flows yields zero units for the right reason (there is
 *   nothing walkable to prove), not because the gate was skipped.
 * - `siegemaster` keeps `flowIds` as its COVERAGE SCOPE — one item per flow, of either flow type,
 *   because it verifies an operational flow's end state as well as a runtime flow's walk. An item
 *   declaring no flows matches nothing and is not gated, which is what keeps a flow-less quest and
 *   any pre-gate item completable.
 *
 * THE PACKAGE NARROWING IS TWO SEPARATE QUESTIONS, and this file answers neither itself — it hands
 * the item's `packageNames` and the quest's `packagesAffected` to
 * `signoffFlowOutstandingTransformer`, which shares one narrowing with every other surface that
 * quotes a remainder.
 *
 * - The track's package KINDS stop Groundstomper being gated on server-side units no browser can
 *   observe, and stop Flowrider being gated on UI units it will not write.
 * - The item's own package NAMES are what make the fan-out more than cosmetic. Flowrider's tail
 *   seed becomes N per-package items plus one seam item; without this each of the N would carry the
 *   whole quest's denominator, so signalling `done` on one package's slice would demand every unit
 *   on every package — which is the measured failure the slicing exists to fix. An item declaring
 *   NO names is scoped to the whole quest and is not narrowed, which keeps a flow-less or untagged
 *   quest gated exactly as before.
 *
 * BOTH VERDICTS CLEAR A UNIT — `confirmed` and `unconfirmable` alike. What this refuses is the
 * ABSENCE of a sign-off, so it can always be satisfied honestly.
 *
 * This file owns FLOW SCOPE — which flows an item is measured over. Which units within a flow are
 * outstanding is `signoffFlowOutstandingTransformer`, the same call `get-qa-checklist` makes for its
 * REMAINING count, so the ids named in a refusal are byte-identical to the ones the tool handed the
 * session — and the gate never pays for that tool's unbounded path walk.
 */

import type { OperationItem, QaChecklistItemId, Quest } from '@dungeonmaster/shared/contracts';

import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { signoffFlowOutstandingTransformer } from '../signoff-flow-outstanding/signoff-flow-outstanding-transformer';

export const signoffOutstandingTransformer = ({
  quest,
  operationItem,
}: {
  quest: Quest;
  operationItem: OperationItem;
}): QaChecklistItemId[] => {
  if (
    operationItem.role !== 'flowrider' &&
    operationItem.role !== 'groundstomper' &&
    operationItem.role !== 'siegemaster'
  ) {
    return [];
  }

  const track = operationItem.role;

  // Which FLOW TYPES, UNIT KINDS, PACKAGE KINDS, package SLICE rule and observable origins a track
  // measures is data in `signoffTrackEligibilityStatics` — one file answers "what is in this
  // track's denominator" rather than that rule being half data and half a branch here.
  const eligibility = signoffTrackEligibilityStatics.byTrack[track];
  const eligibleFlowTypes = new Set(eligibility.flowTypes.map(String));
  const typedFlows = quest.flows.filter((flow) => eligibleFlowTypes.has(flow.flowType));

  // The authoring tracks' denominator is every flow of an eligible type, resolved now. Siegemaster's
  // is the item's declared flows. An empty declared set matches no flow, which is how a siegemaster
  // item carrying no flowIds stays ungated without a special case.
  const scopedFlowIds = new Set(operationItem.flowIds.map(String));
  const scopedFlows =
    track === 'siegemaster'
      ? typedFlows.filter((flow) => scopedFlowIds.has(String(flow.id)))
      : typedFlows;

  return scopedFlows.flatMap((flow) =>
    signoffFlowOutstandingTransformer({
      flow,
      track,
      packagesAffected: quest.packagesAffected,
      packageNames: operationItem.packageNames,
    }),
  );
};
