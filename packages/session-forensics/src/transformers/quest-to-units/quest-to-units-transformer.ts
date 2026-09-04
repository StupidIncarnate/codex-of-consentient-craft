/**
 * PURPOSE: A flow graph scatters what needs a sign-off across three different shapes — terminal-typed
 * nodes with nothing leaving them, LABELLED edges, node observables — plus a flow-level off-map probe
 * roster that lives outside the graph entirely. Nothing in a `Flow` is itself a list a counter can
 * walk. This is the one place that flattens all four into `VerificationUnit`s, so `quest-to-coverage`
 * and every other reader crosses ONE array instead of re-deriving the enumeration by hand.
 *
 * USAGE:
 * questToUnitsTransformer({ flows: [FlowStub({ nodes: [...], edges: [...] })] });
 * // Returns every terminal, branch, observable and off-map unit those flows define
 *
 * A `terminal`-typed node that still has an outgoing edge is NOT a unit — `isTerminalUnitGuard` carries
 * that rule and is reused rather than re-implemented here. An unlabelled edge is not a branch anyone
 * chose, so only labelled edges become units. All seven `qaOffMapProbeStatics` families are emitted for
 * EVERY flow regardless of what `offMapSignoffs` holds — that array records only the families already
 * signed, and counting it instead of the static roster under-reports what siegemaster is owed.
 *
 * Each unit's `trackVerdicts` is read straight off the source node/edge/observable's own
 * `codeweaverSignoff` / `flowriderSignoff` / `siegemasterSignoff` — an off-map unit's siegemaster
 * verdict comes from the matching `offMapSignoffs` entry instead, and it never carries the other two
 * tracks, since nothing else signs an off-map family. A sign-off object whose `verdict` is missing or
 * outside the two known values is treated as UNSIGNED for that track — its key is OMITTED rather than
 * defaulted to a guess, so a malformed record on disk under-reports coverage instead of silently
 * inflating it to `confirmed`.
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
    // An edge's `from` always originates inside this flow's own node graph — the cross-flow
    // form `flowEdgeRefContract` also accepts ("otherFlow:node") is a `to`-only shape for exit
    // jumps, so re-branding every `from` through `flowNodeIdContract` is safe here.
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
