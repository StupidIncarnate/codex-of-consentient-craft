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
 * // Returns every terminal, branch, observable and off-map unit those flows define
 *
 * Three rules decide what becomes a unit:
 * - A `terminal`-typed node that still has an outgoing edge is NOT a unit. `isTerminalUnitGuard`
 *   carries that rule, and this transformer calls it rather than re-implementing it.
 * - An unlabelled edge is not a branch anyone chose, so only labelled edges become units.
 * - All seven `qaOffMapProbeStatics` families are emitted for EVERY flow.
 *
 * Each unit's `trackVerdicts` is empty by default; sign-offs on flow elements have been retired, and
 * verdicts are tracked on work-item observations instead.
 */

import { qaOffMapProbeStatics } from '@dungeonmaster/shared/statics';
import { flowNodeIdContract } from '@dungeonmaster/shared/contracts';
import type { Flow } from '@dungeonmaster/shared/contracts';

import {
  verificationUnitContract,
  type VerificationUnit,
} from '../../contracts/verification-unit/verification-unit-contract';
import { isTerminalUnitGuard } from '../../guards/is-terminal-unit/is-terminal-unit-guard';

export const questToUnitsTransformer = ({
  flows,
}: {
  flows: readonly Flow[];
}): readonly VerificationUnit[] =>
  flows.flatMap((flow): VerificationUnit[] => {
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
          trackVerdicts: {},
        }),
      ];
    });

    const observableUnits = flow.nodes.flatMap((node): VerificationUnit[] =>
      node.observables.map((observable) =>
        verificationUnitContract.parse({
          flowId: flow.id,
          flowType: flow.flowType,
          kind: 'observable',
          unitId: observable.id,
          nodeId: node.id,
          packages: node.packages,
          ...(observable.addedBy !== 'spec' && { addedBy: observable.addedBy }),
          verificationMethod: observable.verifyByReading === true ? 'reading' : 'test',
          trackVerdicts: {},
        }),
      ),
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
          trackVerdicts: {},
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
          trackVerdicts: {},
        }),
    );

    return [...terminalUnits, ...observableUnits, ...branchUnits, ...offMapUnits];
  });
