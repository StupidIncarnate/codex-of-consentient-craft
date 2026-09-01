/**
 * PURPOSE: Returns ONE flow's verification units still carrying no sign-off on a given track
 *
 * USAGE:
 * signoffFlowOutstandingTransformer({ flow, track: 'flowrider' });
 * // Returns QaChecklistItemId[] — empty means every unit this track owns on this flow is signed
 *
 * ONE DEFINITION OF "OUTSTANDING", read by every surface that quotes it. `signoffOutstandingTransformer`
 * reports this list as an operation item's work list (nothing refuses a `done` over it), and
 * `get-qa-checklist` prints the same list as its REMAINING count when a caller names its track. A
 * second derivation would drift, and a work list naming ids the checklist reported as settled is
 * indistinguishable from a hallucinating one.
 *
 * FIVE EXCLUSIONS, all data in `signoffTrackEligibilityStatics` rather than branches here:
 * - Off-map probe families are Siegemaster's charter and are absent from Flowrider's denominator.
 * - An observable whose `addedBy` names a role running strictly AFTER a track cannot ever receive
 *   that track's sign-off, so counting it would report a permanent, uncloseable hole.
 * - VERIFICATION METHOD. An observable carrying `verifyByReading` is settled by opening the source
 *   file, and only Codeweaver's `verificationMethods` carries `reading` — so a read-check is out of
 *   both other denominators. No test reaches one: a green test proves the value is right, never
 *   where the value came from.
 * - PACKAGE KIND, which says which packages a track can prove a unit in at all, applied only when
 *   the caller hands over `packagesAffected` — the names on a node resolve to kinds through nothing
 *   else.
 * - The item's own declared PACKAGE NAMES, which is what gives each of Codeweaver's N per-package
 *   items a denominator of its own rather than N copies of the whole quest's.
 *
 * BOTH PACKAGE NARROWINGS ARE OPT-IN, and that is what lets three surfaces share one definition
 * without any of them lying. Every surface holding a quest passes `packagesAffected`, because the
 * KIND narrowing is a property of the track and each of them is asked about one track:
 * `signoffOutstandingTransformer` for the item whose work list it reports, `get-qa-checklist` for
 * the caller that named one, the quest summary once per row — its rows are keyed on the DENOMINATOR
 * track, so no row can span two roles' disjoint halves of one field. Only `packageNames` splits
 * them: an item-scoped caller (the work-list reader or a checklist caller holding an operation item)
 * passes its slice, and the summary passes none unless a caller hands one down. A caller holding
 * neither a quest nor an item narrows on nothing, which over-reports rather than emptying a
 * denominator.
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
  // A DENOMINATOR is not a sign-off field: two roles can write one field over disjoint slices of
  // the units under it. Indexed off the same entry the denominator comes from, so a new track
  // cannot arrive with a denominator and no field, or be routed to a field it does not write.
  const { signoffField } = eligibility;
  const eligibleKinds = new Set(eligibility.unitKinds.map(String));
  const eligibleOrigins = new Set(eligibility.observableOrigins.map(String));
  const eligibleMethods = new Set(eligibility.verificationMethods.map(String));

  const kindAndOriginUnits = qaUnitEnumerateTransformer({ flow })
    .filter((unit) => eligibleKinds.has(unit.kind))
    .filter((unit) => unit.kind !== 'observable' || eligibleOrigins.has(unit.addedBy))
    .filter(
      (unit) =>
        unit.kind !== 'observable' ||
        eligibleMethods.has(unit.verifyByReading === true ? 'reading' : 'test'),
    );

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
