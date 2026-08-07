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
 * TWO EXCLUSIONS, both data in `signoffTrackEligibilityStatics` rather than branches here:
 * - Off-map probe families are Siegemaster's charter and are absent from Flowrider's denominator.
 * - An observable whose `addedBy` names a role running strictly AFTER a track cannot ever receive
 *   that track's sign-off, so counting it would report a permanent, uncloseable hole.
 *
 * BOTH VERDICTS CLEAR A UNIT — `confirmed` and `unconfirmable` alike. What this measures is the
 * ABSENCE of a sign-off, so it can always be satisfied honestly.
 */

import type { Flow, QaChecklistItemId, SignoffTrack } from '@dungeonmaster/shared/contracts';

import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { qaUnitEnumerateTransformer } from '../qa-unit-enumerate/qa-unit-enumerate-transformer';

export const signoffFlowOutstandingTransformer = ({
  flow,
  track,
}: {
  flow: Flow;
  track: SignoffTrack;
}): QaChecklistItemId[] => {
  const signoffField = track === 'flowrider' ? 'flowriderSignoff' : 'siegemasterSignoff';
  const eligibility = signoffTrackEligibilityStatics.byTrack[track];
  const eligibleKinds = new Set(eligibility.unitKinds.map(String));
  const eligibleOrigins = new Set(eligibility.observableOrigins.map(String));

  return qaUnitEnumerateTransformer({ flow })
    .filter((unit) => eligibleKinds.has(unit.kind))
    .filter((unit) => unit.kind !== 'observable' || eligibleOrigins.has(unit.addedBy))
    .filter((unit) => unit[signoffField] === undefined)
    .map((unit) => unit.id);
};
