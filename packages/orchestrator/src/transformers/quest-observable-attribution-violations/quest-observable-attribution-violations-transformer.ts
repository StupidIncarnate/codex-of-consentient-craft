/**
 * PURPOSE: Catches a seam DECLARED on a node and then asserted by nothing. Reach for this over
 * `questUngluedSeamEdgesTransformer` when the question is what the graph promises to OBSERVE rather
 * than what its edges join — that one reads the edge set, this one reads the observables hung off it.
 *
 * A package the seam rule FORCES a node to carry needs no observable of its own. It is not an
 * unproven claim: the edge set already asserts it, because dropping it would strand a neighbour.
 * Waiving exactly those packages, and no others, is what keeps the two rules co-satisfiable — a node
 * carrying one observable could otherwise never be glue, so a boundary landing on such a node would
 * have no remedy at all. The waiver is computed from the same edge set the seam rule reads, so the
 * two can no longer contradict each other by construction.
 *
 * A node carrying ZERO observables is exempt entirely. On a measured 100-node quest, 22 nodes were
 * decision nodes with no observables at all; they are still branch units in the checklist
 * denominator, so demanding coverage from them would reject a correct spec.
 *
 * USAGE:
 * questObservableAttributionViolationsTransformer({flows: quest.flows});
 * // Returns ErrorMessage[] — one sentence per mis-attributed observable, plus one per node carrying
 * // a package that is neither observed nor forced by a seam.
 */
import type { FlowNodeStub, FlowStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;
type FlowNode = ReturnType<typeof FlowNodeStub>;

export const questObservableAttributionViolationsTransformer = ({
  flows,
}: {
  flows: Flow[];
}): ErrorMessage[] => {
  // Keyed `<flowId>:<nodeId>` exactly as `questUngluedSeamEdgesTransformer` keys it, so a cross-flow
  // `flowId:nodeId` ref and a bare in-flow one resolve identically under both rules.
  const nodesByQualifiedId = new Map<unknown, FlowNode>();
  for (const flow of flows) {
    for (const node of flow.nodes) {
      nodesByQualifiedId.set(`${String(flow.id)}:${String(node.id)}`, node);
    }
  }

  // Every edge contributes its OTHER endpoint's packages to each of its endpoints, so a node's seam
  // obligations are readable without re-walking the edge list per node. An endpoint that resolves to
  // no node contributes nothing — a dangling ref is `questUnresolvedFlowRefsTransformer`'s finding.
  const neighbourPackages = new Map<unknown, Set<unknown>[]>();
  for (const flow of flows) {
    const edgeFlowId = String(flow.id);

    for (const edge of flow.edges) {
      const fromRef = String(edge.from);
      const toRef = String(edge.to);
      const fromKey = fromRef.includes(':') ? fromRef : `${edgeFlowId}:${fromRef}`;
      const toKey = toRef.includes(':') ? toRef : `${edgeFlowId}:${toRef}`;
      const fromNode = nodesByQualifiedId.get(fromKey);
      const toNode = nodesByQualifiedId.get(toKey);

      if (fromNode === undefined || toNode === undefined) {
        continue;
      }

      const fromPackages = new Set<unknown>(fromNode.packages.map((name) => String(name)));
      const toPackages = new Set<unknown>(toNode.packages.map((name) => String(name)));

      const fromNeighbours = neighbourPackages.get(fromKey) ?? [];
      fromNeighbours.push(toPackages);
      neighbourPackages.set(fromKey, fromNeighbours);

      const toNeighbours = neighbourPackages.get(toKey) ?? [];
      toNeighbours.push(fromPackages);
      neighbourPackages.set(toKey, toNeighbours);
    }
  }

  const offenders: ErrorMessage[] = [];

  for (const flow of flows) {
    const flowId = String(flow.id);

    for (const node of flow.nodes) {
      if (node.observables.length === 0) {
        continue;
      }

      const nodeId = String(node.id);
      const nodePackages = node.packages.map((name) => String(name));
      const nodePackageSet = new Set<unknown>(nodePackages);
      const coveredPackages = new Set<unknown>();

      for (const observable of node.observables) {
        const observablePackage = String(observable.package);
        if (!nodePackageSet.has(observablePackage)) {
          offenders.push(
            errorMessageContract.parse(
              `Observable '${String(observable.id)}' on node '${nodeId}' in flow '${flowId}' is attributed to package '${observablePackage}', which its node does not tag (node packages: ${nodePackages.join(', ')}). An observable sits on exactly ONE side of its node's seam — set its package to one the node already tags, or widen the node's packages to include it.`,
            ),
          );
          continue;
        }
        coveredPackages.add(observablePackage);
      }

      // A single-package node has nothing to under-cover: the save resolves every observable's
      // package from the node, so the union can only ever be that one package.
      if (node.packages.length === 1) {
        continue;
      }

      // A package is seam-forced when some incident edge shares EXACTLY it with this node: remove it
      // and that edge spans nothing. An edge sharing two packages forces neither, because either one
      // alone still spans it, and an already-unglued edge (sharing none) forces nothing — the seam
      // rule reports that edge itself rather than conscripting a package here to excuse it.
      const seamForcedPackages = new Set<unknown>();
      for (const otherPackages of neighbourPackages.get(`${flowId}:${nodeId}`) ?? []) {
        const shared = nodePackages.filter((name) => otherPackages.has(name));
        if (shared.length !== 1) {
          continue;
        }
        for (const name of shared) {
          seamForcedPackages.add(name);
        }
      }

      const uncovered = nodePackages.filter(
        (name) => !coveredPackages.has(name) && !seamForcedPackages.has(name),
      );
      if (uncovered.length === 0) {
        continue;
      }

      const coveredList =
        coveredPackages.size === 0
          ? 'none of them'
          : [...coveredPackages].map((name) => String(name)).join(', ');
      offenders.push(
        errorMessageContract.parse(
          `Node '${nodeId}' in flow '${flowId}' tags packages ${nodePackages.join(', ')} but its observables only cover ${coveredList}. Package(s) ${uncovered.join(', ')} are declared on the node and asserted by nothing — a seam declared on one side only. Add an observable carrying each uncovered package, or narrow the node's packages to what it really lands in.`,
        ),
      );
    }
  }

  return offenders;
};
