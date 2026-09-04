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
 * - All seven `qaOffMapProbeStatics` families are emitted for EVERY flow, whatever `offMapSignoffs`
 *   holds. That array records only the families already signed. Counting it instead of the static
 *   roster under-reports what siegemaster is owed.
 *
 * Each unit's `trackVerdicts` comes straight off its own source: the node's, edge's or observable's
 * `codeweaverSignoff`, `flowriderSignoff` and `siegemasterSignoff`. An off-map unit is the one
 * exception. Its siegemaster verdict comes from the matching `offMapSignoffs` entry, and it never
 * carries the other two tracks, because nothing else signs an off-map family.
 *
 * A sign-off whose `verdict` is missing, or holds anything but the two known values, counts as
 * UNSIGNED for that track. This transformer OMITS the key rather than guessing a default. A
 * malformed record on disk therefore under-reports coverage instead of silently inflating it to
 * `confirmed`.
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

      const codeweaverVerdict = node.codeweaverSignoff?.verdict;
      const flowriderVerdict = node.flowriderSignoff?.verdict;
      const siegemasterVerdict = node.siegemasterSignoff?.verdict;

      return [
        verificationUnitContract.parse({
          flowId: flow.id,
          flowType: flow.flowType,
          kind: 'terminal',
          unitId: node.id,
          nodeId: node.id,
          packages: node.packages,
          trackVerdicts: {
            ...(codeweaverVerdict === 'confirmed' || codeweaverVerdict === 'unconfirmable'
              ? { codeweaverSignoff: codeweaverVerdict }
              : {}),
            ...(flowriderVerdict === 'confirmed' || flowriderVerdict === 'unconfirmable'
              ? { flowriderSignoff: flowriderVerdict }
              : {}),
            ...(siegemasterVerdict === 'confirmed' || siegemasterVerdict === 'unconfirmable'
              ? { siegemasterSignoff: siegemasterVerdict }
              : {}),
          },
        }),
      ];
    });

    const observableUnits = flow.nodes.flatMap((node): VerificationUnit[] =>
      node.observables.map((observable) => {
        const codeweaverVerdict = observable.codeweaverSignoff?.verdict;
        const flowriderVerdict = observable.flowriderSignoff?.verdict;
        const siegemasterVerdict = observable.siegemasterSignoff?.verdict;

        return verificationUnitContract.parse({
          flowId: flow.id,
          flowType: flow.flowType,
          kind: 'observable',
          unitId: observable.id,
          nodeId: node.id,
          packages: node.packages,
          ...(observable.addedBy !== 'spec' && { addedBy: observable.addedBy }),
          verificationMethod: observable.verifyByReading === true ? 'reading' : 'test',
          trackVerdicts: {
            ...(codeweaverVerdict === 'confirmed' || codeweaverVerdict === 'unconfirmable'
              ? { codeweaverSignoff: codeweaverVerdict }
              : {}),
            ...(flowriderVerdict === 'confirmed' || flowriderVerdict === 'unconfirmable'
              ? { flowriderSignoff: flowriderVerdict }
              : {}),
            ...(siegemasterVerdict === 'confirmed' || siegemasterVerdict === 'unconfirmable'
              ? { siegemasterSignoff: siegemasterVerdict }
              : {}),
          },
        });
      }),
    );

    const branchUnits = flow.edges.flatMap((edge): VerificationUnit[] => {
      if (edge.label === undefined) {
        return [];
      }

      const codeweaverVerdict = edge.codeweaverSignoff?.verdict;
      const flowriderVerdict = edge.flowriderSignoff?.verdict;
      const siegemasterVerdict = edge.siegemasterSignoff?.verdict;

      return [
        verificationUnitContract.parse({
          flowId: flow.id,
          flowType: flow.flowType,
          kind: 'branch',
          unitId: edge.id,
          nodeId: `${edge.from}->${edge.to}`,
          trackVerdicts: {
            ...(codeweaverVerdict === 'confirmed' || codeweaverVerdict === 'unconfirmable'
              ? { codeweaverSignoff: codeweaverVerdict }
              : {}),
            ...(flowriderVerdict === 'confirmed' || flowriderVerdict === 'unconfirmable'
              ? { flowriderSignoff: flowriderVerdict }
              : {}),
            ...(siegemasterVerdict === 'confirmed' || siegemasterVerdict === 'unconfirmable'
              ? { siegemasterSignoff: siegemasterVerdict }
              : {}),
          },
        }),
      ];
    });

    const offMapUnits = Object.keys(qaOffMapProbeStatics.byFamily).map(
      (family): VerificationUnit => {
        const signoff = flow.offMapSignoffs.find((entry) => entry.id === family);
        const siegemasterVerdict = signoff?.siegemasterSignoff?.verdict;

        return verificationUnitContract.parse({
          flowId: flow.id,
          flowType: flow.flowType,
          kind: 'off-map',
          unitId: family,
          trackVerdicts: {
            ...(siegemasterVerdict === 'confirmed' || siegemasterVerdict === 'unconfirmable'
              ? { siegemasterSignoff: siegemasterVerdict }
              : {}),
          },
        });
      },
    );

    return [...terminalUnits, ...observableUnits, ...branchUnits, ...offMapUnits];
  });
