/**
 * PURPOSE: The one place that flattens a flow graph into a list a counter can walk. A flow is one
 * graph of work inside a quest, and it scatters the things that need a sign-off across four places:
 * terminal-typed nodes with nothing leaving them, LABELLED edges, node observables, and a
 * flow-level roster of off-map probe families that sits outside it. An observable is something
 * a node says a reader should be able to see. An off-map family is one of the standing check
 * categories siegemaster runs outside the graph. Nothing in a `Flow` is itself a walkable list, so
 * this transformer turns all four into `VerificationUnit`s. `quest-to-coverage` and every other
 * reader then crosses ONE array instead of re-deriving the enumeration by hand.
 *
 * USAGE:
 * questToUnitsTransformer({ flows: [FlowStub({ nodes: [...], edges: [...] })] });
 * // Returns every terminal, branch, observable and off-map unit those flows define, trackMarks
 * // empty on every one
 *
 * questToUnitsTransformer({ flows, workItems });
 * // Same units, with trackMarks populated from workItem.observations[] — decision 1's sign-off
 * // record. Optional and defaults to [] so every existing caller is unaffected.
 *
 * Three rules decide what becomes a unit:
 * - A `terminal`-typed node that still has an outgoing edge is NOT a unit. `isTerminalUnitGuard`
 *   carries that rule, and this transformer calls it rather than re-implementing it.
 * - An unlabelled edge is not a branch anyone chose, so only labelled edges become units.
 * - All seven `qaOffMapProbeStatics` families are emitted for EVERY flow.
 *
 * MATCHING AN OBSERVATION TO A UNIT rebuilds the COMPOSITE id `<flowId>:<kind>:<localId>` —
 * `unitIdContract`'s shape (`@dungeonmaster/shared`) and what orchestrator's
 * `qaUnitEnumerateTransformer` mints. session-forensics carries no dependency on orchestrator, so
 * this is a local, one-line rebuild off fields this transformer already has (`flow.id`, the unit's
 * `kind`, its own local `unitId`) — not logic worth a shared file, the same call
 * `trackDenominatorStatics`'s own header makes for the mirrored denominator table.
 *
 * PER TRACK, LAST OBSERVATION WINS BY WORK-ITEM ARRAY ORDER — the same rule
 * `questSummaryBuildTransformer` (orchestrator) applies, because a `review` step's `unmet` mints a
 * successor whose later mark is that track's current verdict. A track's marks come ONLY from work
 * items whose `role` equals that track (R2): a codeweaver's `met` never counts for flowrider.
 */

import { qaOffMapProbeStatics } from '@dungeonmaster/shared/statics';
import { flowNodeIdContract, unitIdContract } from '@dungeonmaster/shared/contracts';
import type { Flow, WorkItem, UnitMark, UnitId } from '@dungeonmaster/shared/contracts';

import {
  verificationUnitContract,
  type VerificationUnit,
} from '../../contracts/verification-unit/verification-unit-contract';
import { isTerminalUnitGuard } from '../../guards/is-terminal-unit/is-terminal-unit-guard';
import { trackDenominatorStatics } from '../../statics/track-denominator/track-denominator-statics';

export const questToUnitsTransformer = ({
  flows,
  workItems = [],
}: {
  flows: readonly Flow[];
  workItems?: readonly WorkItem[];
}): readonly VerificationUnit[] => {
  const tracks = Object.keys(
    trackDenominatorStatics.byTrack,
  ) as readonly (keyof typeof trackDenominatorStatics.byTrack)[];

  // ONE map per track, unitId -> that track's current mark. Built once for the whole quest rather
  // than per unit, so attaching marks below is a lookup, not a re-scan of every work item per unit.
  const marksByTrack = new Map(
    tracks.map((track) => [
      track,
      new Map<UnitId, UnitMark>(
        workItems
          .filter((workItem) => workItem.role === track)
          .flatMap((workItem) =>
            workItem.observations.map(
              (observation) => [observation.unitId, observation.mark] as const,
            ),
          ),
      ),
    ]),
  );

  const unitsByFlow = flows.flatMap((flow): VerificationUnit[] => {
    // Every edge's `from` names a node inside this same flow, so parsing it back through
    // `flowNodeIdContract` is safe. `flowEdgeRefContract` does accept a cross-flow form
    // ("otherFlow:node"), but only on `to`, where it marks an exit jump out of the flow.
    const edgeSourceIds = flow.edges.map((edge) => flowNodeIdContract.parse(edge.from));

    const terminalUnits = flow.nodes.flatMap((node): VerificationUnit[] => {
      if (!isTerminalUnitGuard({ nodeId: node.id, nodeType: node.type, edgeSourceIds })) {
        return [];
      }

      return [
        verificationUnitContract.parse({
          flowId: flow.id,
          flowType: flow.flowType,
          kind: 'terminal',
          unitId: node.id,
          nodeId: node.id,
          packages: node.packages,
          trackMarks: {},
        }),
      ];
    });

    const observableUnits = flow.nodes.flatMap((node): VerificationUnit[] =>
      node.observables.map((observable) => {
        // `verifyByHuman` wins over `verifyByReading` when an observable carries both — it names
        // the METHOD nothing automated can perform, where `verifyByReading` only names which
        // automated method applies (`flowObservableContract`'s own JSDoc). No track in
        // `trackDenominatorStatics` lists `human-check`, so this literal is what drops the unit out
        // of every track's denominator on the outside-measurement path this package serves.
        let verificationMethod: VerificationUnit['verificationMethod'] = 'test';

        if (observable.verifyByHuman === true) {
          verificationMethod = 'human-check';
        } else if (observable.verifyByReading === true) {
          verificationMethod = 'reading';
        }

        return verificationUnitContract.parse({
          flowId: flow.id,
          flowType: flow.flowType,
          kind: 'observable',
          unitId: observable.id,
          nodeId: node.id,
          packages: node.packages,
          ...(observable.addedBy !== 'spec' && { addedBy: observable.addedBy }),
          verificationMethod,
          trackMarks: {},
        });
      }),
    );

    const branchUnits = flow.edges.flatMap((edge): VerificationUnit[] => {
      if (edge.label === undefined) {
        return [];
      }

      return [
        verificationUnitContract.parse({
          flowId: flow.id,
          flowType: flow.flowType,
          kind: 'branch',
          unitId: edge.id,
          nodeId: `${edge.from}->${edge.to}`,
          trackMarks: {},
        }),
      ];
    });

    const offMapUnits = Object.keys(qaOffMapProbeStatics.byFamily).map(
      (family): VerificationUnit =>
        verificationUnitContract.parse({
          flowId: flow.id,
          flowType: flow.flowType,
          kind: 'off-map',
          unitId: family,
          trackMarks: {},
        }),
    );

    return [...terminalUnits, ...observableUnits, ...branchUnits, ...offMapUnits];
  });

  return unitsByFlow.map((unit) => {
    const compositeId = unitIdContract.safeParse(`${unit.flowId}:${unit.kind}:${unit.unitId}`);

    return verificationUnitContract.parse({
      ...unit,
      trackMarks: compositeId.success
        ? Object.fromEntries(
            tracks.flatMap((track) => {
              const mark = marksByTrack.get(track)?.get(compositeId.data);

              return mark === undefined ? [] : [[track, mark]];
            }),
          )
        : {},
    });
  });
};
