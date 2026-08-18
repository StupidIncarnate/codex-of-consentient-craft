/**
 * PURPOSE: Resolves ONE operation item to the exact verification scope its role is measured over —
 * the track, the flows, and the package slice. This is the single derivation behind both surfaces
 * that ask the question: `get-qa-checklist`, which an agent reads, and the signal-back completion
 * gate, which refuses that agent's `done`.
 *
 * USAGE:
 * const scope = operationSignoffScopeTransformer({ quest, operationItem });
 * // Returns { track, flows, packageNames } — or null when the role has no sign-off track at all
 *
 * WHY IT EXISTS: the scope used to be assembled by the CALLER, out of three arguments it had to
 * supply by hand — `track`, `flowId` and `packageNames` — and every one of them was a way to ask a
 * different question from the one the gate would answer:
 *
 * - `track` is the DENOMINATOR name, not the sign-off field. Flowrider and Groundstomper both write
 *   `flowriderSignoff` over DISJOINT package kinds, so naming the sibling returns the exact
 *   complement of your own work: a remainder that clears at zero while the gate still refuses.
 * - `packageNames` is `.optional()`, so omitting it does not error — it silently WIDENS the
 *   measurement to the whole quest. A session then works units a sibling item is gated on while its
 *   own remainder never empties.
 * - `flowId` is the same trap for the two `declared` tracks, where the item's own flow list is the
 *   scope.
 *
 * All three are already ON the operation item (`role`, `flowIds`, `packageNames`), which is why the
 * gate never had to be told them. Deriving from the item instead of accepting them makes the two
 * answers the same answer by construction, and removes the only three ways a caller could ask
 * wrongly. It also removes them from a MINION's briefing problem: a `get-agent-prompt` fetch hands a
 * minion the Quest ID and nothing else, so an id it can be given is reachable where three
 * hand-copied scope arguments are not.
 *
 * `null` is the honest answer for a role with no track — `codeweaver` and `pesteater` are measured
 * on their rendered scope block rather than the flow graph, and `spiritmender` / `warpgate` on
 * nothing. It is NOT an error: the gate returns "nothing outstanding" for them, and the tool tells
 * the caller its discipline has no checklist denominator.
 */

import type { Flow, OperationItem, PackageName, Quest } from '@dungeonmaster/shared/contracts';

import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';

type SignoffTrack = keyof typeof signoffTrackEligibilityStatics.byTrack;

export const operationSignoffScopeTransformer = ({
  quest,
  operationItem,
}: {
  quest: Quest;
  operationItem: OperationItem;
}): {
  track: SignoffTrack;
  flows: readonly Flow[];
  packageNames: readonly PackageName[];
} | null => {
  if (
    operationItem.role !== 'flowrider' &&
    operationItem.role !== 'groundstomper' &&
    operationItem.role !== 'siegemaster'
  ) {
    return null;
  }

  const track: SignoffTrack = operationItem.role;

  // Which FLOW TYPES, flow SLICE rule, UNIT KINDS, PACKAGE KINDS, package SLICE rule and observable
  // origins a track measures is data in `signoffTrackEligibilityStatics` — one file answers "what is
  // in this track's denominator" rather than that rule being half data and half a branch here.
  const eligibility = signoffTrackEligibilityStatics.byTrack[track];
  const eligibleFlowTypes = new Set(eligibility.flowTypes.map(String));
  const typedFlows = quest.flows.filter((flow) => eligibleFlowTypes.has(flow.flowType));

  // A `declared` track's items were sliced BY FLOW, so the item's own list is its scope; an
  // `every-eligible` track's were sliced by package, so its denominator is every flow of an eligible
  // type. An empty declared set matches no flow, which is how a per-flow item carrying no flowIds
  // stays ungated without a special case.
  const scopedFlowIds = new Set(operationItem.flowIds.map(String));
  const flows =
    eligibility.flowScope === 'declared'
      ? typedFlows.filter((flow) => scopedFlowIds.has(String(flow.id)))
      : typedFlows;

  return { track, flows, packageNames: operationItem.packageNames };
};
