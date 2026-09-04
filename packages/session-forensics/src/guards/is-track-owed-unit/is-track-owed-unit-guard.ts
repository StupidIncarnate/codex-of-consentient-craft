/**
 * PURPOSE: Answers one question — does this sign-off track owe a verdict on this unit? A sign-off
 * track is one reviewing role: codeweaver, flowrider or siegemaster. A unit is one signable thing
 * in a flow graph, a flow being one graph of work inside a quest. How many units a track owes is
 * that track's denominator, the bottom half of its coverage fraction.
 *
 * `trackDenominatorStatics` lists six exclusions, and this guard applies four of them: flow type,
 * unit kind, observable provenance, and verification method. An observable is something a node says
 * a reader should be able to see; its provenance is which role added it. The other two exclusions
 * are flow slice and package slice. Both belong to a single operation item rather than to the unit
 * or the track, and nobody hands this guard an operation item. So a `true` here is an UPPER BOUND
 * on what one session owed, never a settled count. `get-qa-checklist` stays the authority every
 * caller defers to.
 *
 * USAGE:
 * isTrackOwedUnitGuard({ track: 'flowriderSignoff', unit: VerificationUnitStub({ flowType: 'operational' }) });
 * // Returns false — flowrider's denominator excludes operational flows
 */

import { trackDenominatorStatics } from '../../statics/track-denominator/track-denominator-statics';
import type { VerificationUnit } from '../../contracts/verification-unit/verification-unit-contract';

export const isTrackOwedUnitGuard = ({
  track,
  unit,
}: {
  track?: keyof typeof trackDenominatorStatics.byTrack;
  unit?: VerificationUnit;
}): boolean => {
  if (track === undefined || unit === undefined) {
    return false;
  }

  const eligibility = trackDenominatorStatics.byTrack[track];
  const eligibleFlowTypes = new Set(eligibility.flowTypes.map(String));
  const eligibleKinds = new Set(eligibility.unitKinds.map(String));

  if (!eligibleFlowTypes.has(unit.flowType)) {
    return false;
  }
  if (!eligibleKinds.has(unit.kind)) {
    return false;
  }
  if (unit.kind !== 'observable') {
    return true;
  }

  const eligibleOrigins = new Set(eligibility.observableOrigins.map(String));
  const eligibleMethods = new Set(eligibility.verificationMethods.map(String));
  const origin = unit.addedBy ?? 'spec';

  if (!eligibleOrigins.has(origin)) {
    return false;
  }
  return eligibleMethods.has(unit.verificationMethod);
};
