/**
 * PURPOSE: Answers "did each role deliver what it owed on this flow?" Reach for `quest-to-units`
 * instead when the question is the flatter one, "list every signable thing that could carry a
 * sign-off". This transformer settles the answer once per (flow, track) pair. A flow is one graph
 * of work inside a quest; a track is one reviewing role — codeweaver, flowrider or siegemaster.
 *
 * Its numbers are only ever an UPPER BOUND on what one session owed. `isTrackOwedUnitGuard` cannot
 * apply the flow-slice or package-slice exclusions without an operation item, and a whole-quest
 * reading has no operation item to hand it. `get-qa-checklist` stays the authority a caller defers
 * to.
 *
 * USAGE:
 * questToCoverageTransformer({ flows: [FlowStub({ id: 'checkout-flow', nodes: [...], edges: [...] })] });
 * // Returns one row per (flow, track) pair. Flows come back in input order, tracks in
 * // trackDenominatorStatics order.
 */

import type { Flow } from '@dungeonmaster/shared/contracts';

import {
  trackCoverageContract,
  type TrackCoverage,
} from '../../contracts/track-coverage/track-coverage-contract';
import { isTrackOwedUnitGuard } from '../../guards/is-track-owed-unit/is-track-owed-unit-guard';
import { trackDenominatorStatics } from '../../statics/track-denominator/track-denominator-statics';
import { questToUnitsTransformer } from '../quest-to-units/quest-to-units-transformer';

export const questToCoverageTransformer = ({
  flows,
}: {
  flows: readonly Flow[];
}): readonly TrackCoverage[] => {
  const units = questToUnitsTransformer({ flows });
  const tracks = Object.keys(
    trackDenominatorStatics.byTrack,
  ) as readonly (keyof typeof trackDenominatorStatics.byTrack)[];

  return flows.flatMap((flow): TrackCoverage[] => {
    const flowUnits = units.filter((unit) => unit.flowId === flow.id);

    return tracks.map((track): TrackCoverage => {
      const owedUnits = flowUnits.filter((unit) => isTrackOwedUnitGuard({ track, unit }));
      const signedUnits = owedUnits.filter((unit) => Object.hasOwn(unit.trackVerdicts, track));
      const confirmedUnits = signedUnits.filter(
        (unit) => unit.trackVerdicts[track] === 'confirmed',
      );
      const unconfirmableUnits = signedUnits.filter(
        (unit) => unit.trackVerdicts[track] === 'unconfirmable',
      );

      return trackCoverageContract.parse({
        flowId: flow.id,
        track,
        owed: owedUnits.length,
        signed: signedUnits.length,
        confirmed: confirmedUnits.length,
        unconfirmable: unconfirmableUnits.length,
        unsigned: owedUnits.length - signedUnits.length,
      });
    });
  });
};
