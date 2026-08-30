/**
 * PURPOSE: Decomposes ONE flow into its atomic verification units — every terminal, every labelled
 * decision branch, every embedded observable, and every off-map probe family — carrying each unit's
 * derived id, its graph anchor, its verbatim source text and the three tracks' sign-offs on it
 *
 * USAGE:
 * qaUnitEnumerateTransformer({ flow });
 * // Returns QaVerificationUnit[] in checklist order: terminals, branches, observables, off-map
 *
 * THIS IS THE SINGLE ENUMERATION. `qaChecklistBuildTransformer` renders it for a session and
 * `signoffOutstandingTransformer` measures a track's remainder against it, so "the ids an
 * outstanding count names are the ids `get-qa-checklist` printed" holds structurally instead of by
 * two files agreeing to derive the same strings. Ids are computed from the graph, never minted, so
 * re-enumerating an unchanged flow reproduces them byte for byte.
 *
 * NO PATH WALK HAPPENS HERE, deliberately. `qaWalkPathsTransformer` enumerates every simple route
 * through the graph and is unbounded in the number of branches; an outstanding-count read can run
 * synchronously off any track's `done` and needs the unit set, never the routes. Keeping the walk
 * out of this file is what stops that read paying for a render concern.
 *
 * A TERMINAL IS A NODE WITH NO OUTGOING EDGE, which is not the same set as `type === 'terminal'`:
 * a node an author typed `terminal` may still point onward, and a plain `state` node may be where
 * the flow stops. Reading `type` would silently under- and over-count on the same graph.
 *
 * A BRANCH is one edge carrying a non-empty label — the decision the walk has to be FORCED down.
 * An unlabelled edge is just a transition and forces nothing.
 *
 * Off-map families are emitted for EVERY flow unconditionally: a flow graph only shows the paths its
 * author imagined, so a family can only leave the record carrying a real sign-off rather than a
 * silent omission.
 *
 * Each unit is built by spreading the graph element it came from. `z.object` strips the keys the
 * unit does not declare, so that spread is what carries `flowriderSignoff`, `siegemasterSignoff`
 * and `addedBy` through at their own names without a conditional per field — and an absent optional
 * on the source stays absent on the unit.
 */

import { qaOffMapFamilyContract } from '@dungeonmaster/shared/contracts';
import type { Flow } from '@dungeonmaster/shared/contracts';

import { qaVerificationUnitContract } from '../../contracts/qa-verification-unit/qa-verification-unit-contract';
import type { QaVerificationUnit } from '../../contracts/qa-verification-unit/qa-verification-unit-contract';

export const qaUnitEnumerateTransformer = ({ flow }: { flow: Flow }): QaVerificationUnit[] => {
  const flowId = String(flow.id);
  const nodesWithOutgoing = new Set(flow.edges.map((edge) => String(edge.from)));

  const terminalUnits = flow.nodes
    .filter((node) => !nodesWithOutgoing.has(String(node.id)))
    .map((node) =>
      qaVerificationUnitContract.parse({
        ...node,
        kind: 'terminal',
        id: `${flowId}:terminal:${String(node.id)}`,
        flowId: flow.id,
        nodeId: node.id,
        nodeLabel: node.label,
      }),
    );

  const branchUnits = flow.edges
    .filter((edge) => edge.label !== undefined && String(edge.label).length > 0)
    .map((edge) =>
      qaVerificationUnitContract.parse({
        ...edge,
        kind: 'branch',
        id: `${flowId}:branch:${String(edge.id)}`,
        flowId: flow.id,
        edgeId: edge.id,
        edgeFrom: edge.from,
        edgeLabel: edge.label,
        edgeTo: edge.to,
      }),
    );

  const observableUnits = flow.nodes.flatMap((node) =>
    node.observables.map((observable) =>
      qaVerificationUnitContract.parse({
        ...observable,
        kind: 'observable',
        id: `${flowId}:observable:${String(observable.id)}`,
        flowId: flow.id,
        nodeId: node.id,
        observableId: observable.id,
        observableType: observable.type,
        observableDescription: observable.description,
      }),
    ),
  );

  const offMapUnits = qaOffMapFamilyContract.options.map((family) => {
    const recorded = flow.offMapSignoffs.find((signoff) => signoff.id === family);

    return qaVerificationUnitContract.parse({
      ...(recorded ?? {}),
      kind: 'off-map',
      id: `${flowId}:off-map:${family}`,
      flowId: flow.id,
      offMapFamily: family,
    });
  });

  return [...terminalUnits, ...branchUnits, ...observableUnits, ...offMapUnits];
};
