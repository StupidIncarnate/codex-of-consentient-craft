/**
 * PURPOSE: Names every edge whose two endpoints share no package — a boundary the graph crosses with
 * nothing spanning it. This is the whole glue-node answer: rather than asking an author to declare a
 * node "glue", glue falls out of the graph invariant, and the nodes that end up carrying two packages
 * ARE the glue nodes. Reach for this once each node's own tag is known well-formed; whether a tag
 * exists at all is `questNodePackageCoverageViolationsTransformer`'s question.
 *
 * An endpoint that resolves to no node is skipped rather than reported — a dangling ref is already
 * named by `questUnresolvedFlowRefsTransformer`, and reporting it twice buries the seam finding.
 *
 * USAGE:
 * questUngluedSeamEdgesTransformer({flows: quest.flows});
 * // Returns ErrorMessage[] — one sentence per unglued edge, naming both endpoints and their tags.
 */
import type { FlowNodeStub, FlowStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;
type FlowNode = ReturnType<typeof FlowNodeStub>;

export const questUngluedSeamEdgesTransformer = ({ flows }: { flows: Flow[] }): ErrorMessage[] => {
  // Keyed `<flowId>:<nodeId>` so a cross-flow `flowId:nodeId` edge ref resolves through the same
  // lookup as a bare in-flow one.
  const nodesByQualifiedId = new Map<unknown, FlowNode>();
  for (const flow of flows) {
    for (const node of flow.nodes) {
      nodesByQualifiedId.set(`${String(flow.id)}:${String(node.id)}`, node);
    }
  }

  const offenders: ErrorMessage[] = [];

  for (const flow of flows) {
    const flowId = String(flow.id);

    for (const edge of flow.edges) {
      const fromRef = String(edge.from);
      const toRef = String(edge.to);
      const fromNode = nodesByQualifiedId.get(
        fromRef.includes(':') ? fromRef : `${flowId}:${fromRef}`,
      );
      const toNode = nodesByQualifiedId.get(toRef.includes(':') ? toRef : `${flowId}:${toRef}`);

      if (fromNode === undefined || toNode === undefined) {
        continue;
      }

      const fromPackages = new Set<unknown>(fromNode.packages.map((name) => String(name)));
      const shared = toNode.packages.filter((name) => fromPackages.has(String(name)));
      if (shared.length > 0) {
        continue;
      }

      const fromList = fromNode.packages.map((name) => String(name)).join(', ');
      const toList = toNode.packages.map((name) => String(name)).join(', ');
      offenders.push(
        errorMessageContract.parse(
          `Edge '${String(edge.id)}' in flow '${flowId}' joins node '${String(fromNode.id)}' (packages: ${fromList}) to node '${String(toNode.id)}' (packages: ${toList}), which share no package. An edge whose endpoints share no package is a boundary crossed with nothing spanning it — widen one endpoint to carry both packages (that endpoint IS the glue node), or insert a node between them that does.`,
        ),
      );
    }
  }

  return offenders;
};
