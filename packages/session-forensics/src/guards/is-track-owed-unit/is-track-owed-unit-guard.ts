/**
 * PURPOSE: Applies four of `trackDenominatorStatics`' six exclusions — flow type, unit kind,
 * observable provenance, verification method — to answer whether one track's denominator counts
 * one unit. Flow slice and package slice, the other two, are properties of an individual operation
 * item rather than of the unit or the track, and this guard is handed neither — so `true` here is
 * an UPPER BOUND on what a single session owed, never a settled count, and `get-qa-checklist`
 * stays the authority every caller must defer to.
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
