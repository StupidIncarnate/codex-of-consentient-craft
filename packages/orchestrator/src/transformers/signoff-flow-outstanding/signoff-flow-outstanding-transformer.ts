/**
 * PURPOSE: Returns ONE flow's verification units still carrying no sign-off on a given track
 *
 * USAGE:
 * signoffFlowOutstandingTransformer({ flow, track: 'flowrider' });
 * // Returns QaChecklistItemId[] — empty means every unit this track owns on this flow is signed
 *
 * ONE DEFINITION OF "OUTSTANDING", read by both surfaces that quote it. The signal-back completion
 * gate (`signoffOutstandingTransformer`) refuses `done` on this list, and `get-qa-checklist` prints
 * the same list as its REMAINING count when a caller names its track. A second derivation would
 * drift, and a gate refusing ids the checklist reported as settled is indistinguishable from a
 * hallucinating gate.
 *
 * FOUR EXCLUSIONS, all data in `signoffTrackEligibilityStatics` rather than branches here:
 * - Off-map probe families are Siegemaster's charter and are absent from Flowrider's denominator.
 * - An observable whose `addedBy` names a role running strictly AFTER a track cannot ever receive
 *   that track's sign-off, so counting it would report a permanent, uncloseable hole.
 * - PACKAGE KIND, which is what splits Flowrider from Groundstomper, applied only when the caller
 *   hands over `packagesAffected` — the names on a node resolve to kinds through nothing else.
 * - The item's own declared PACKAGE NAMES, which is what gives each of Flowrider's N per-package
 *   items and its one seam item a denominator of its own rather than N copies of the whole quest's.
 *
 * BOTH PACKAGE NARROWINGS ARE OPT-IN, and that is what lets three surfaces share one definition
 * without any of them lying. Every surface holding a quest passes `packagesAffected`, because the
 * KIND narrowing is a property of the track and each of them is asked about one track: the
 * completion gate for the item it is refusing, `get-qa-checklist` for the caller that named one, the
 * quest summary once per row — its rows are keyed on the DENOMINATOR track, so the three of them
 * partition a flow's units rather than one row spanning two roles' disjoint halves. Only
 * `packageNames` splits them: the gate and a checklist caller holding an operation item pass its
 * slice, and the summary passes none unless a caller hands one down. A caller holding neither a
 * quest nor an item narrows on nothing, which over-reports rather than emptying a denominator.
 *
 * BOTH VERDICTS CLEAR A UNIT — `confirmed` and `unconfirmable` alike. What this measures is the
 * ABSENCE of a sign-off, so it can always be satisfied honestly.
 */

import type {
  Flow,
  PackageName,
  QaChecklistItemId,
  QuestPackageEntry,
} from '@dungeonmaster/shared/contracts';

import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { qaUnitEnumerateTransformer } from '../qa-unit-enumerate/qa-unit-enumerate-transformer';
import { qaUnitsInPackageScopeTransformer } from '../qa-units-in-package-scope/qa-units-in-package-scope-transformer';

export const signoffFlowOutstandingTransformer = ({
  flow,
  track,
  packagesAffected = [],
  packageNames = [],
}: {
  flow: Flow;
  track: keyof typeof signoffTrackEligibilityStatics.byTrack;
  packagesAffected?: readonly QuestPackageEntry[];
  packageNames?: readonly PackageName[];
}): QaChecklistItemId[] => {
  const eligibility = signoffTrackEligibilityStatics.byTrack[track];
  // THREE tracks over TWO fields: Flowrider and Groundstomper both write `flowriderSignoff` — they
  // are disjoint by PACKAGE KIND, never by field — and Siegemaster alone writes
  // `siegemasterSignoff`. Indexed off the same entry the denominator comes from, so a new track
  // cannot arrive with a denominator and no field, or be routed to the field it does not write.
  const { signoffField } = eligibility;
  const eligibleKinds = new Set(eligibility.unitKinds.map(String));
  const eligibleOrigins = new Set(eligibility.observableOrigins.map(String));

  const kindAndOriginUnits = qaUnitEnumerateTransformer({ flow })
    .filter((unit) => eligibleKinds.has(unit.kind))
    .filter((unit) => unit.kind !== 'observable' || eligibleOrigins.has(unit.addedBy));

  return qaUnitsInPackageScopeTransformer({
    flow,
    units: kindAndOriginUnits,
    track,
    packagesAffected,
    packageNames,
  })
    .filter((unit) => unit[signoffField] === undefined)
    .map((unit) => unit.id);
};
