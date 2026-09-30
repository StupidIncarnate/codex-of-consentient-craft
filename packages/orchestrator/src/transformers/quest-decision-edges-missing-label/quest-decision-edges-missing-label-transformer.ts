/**
 * PURPOSE: Returns descriptions of edges leaving decision nodes that have no label
 *
 * USAGE:
 * questDecisionEdgesMissingLabelTransformer({flows});
 * // Returns ErrorMessage[] — e.g. ["flow 'login' edge 'e1' from decision 'check-auth' has no label"].
 */
import type { Flow } from '@dungeonmaster/shared/contracts';

export const questDecisionEdgesMissingLabelTransformer = ({
  flows,
}: {
  flows?: Flow[];
}): string[] => {
  if (!flows) {
    return [];
  }

  const offenders: string[] = [];

  for (const flow of flows) {
    const decisionNodeIds = new Set<unknown>();
    for (const node of flow.nodes) {
      if (node.type === 'decision') {
        decisionNodeIds.add(String(node.id));
      }
    }

    for (const edge of flow.edges) {
      const fromId = String(edge.from);
      if (!decisionNodeIds.has(fromId)) {
        continue;
      }
      const labelIsEmpty = edge.label === undefined || String(edge.label).length === 0;
      if (labelIsEmpty) {
        offenders.push(
          `flow '${String(flow.id)}' edge '${String(edge.id)}' from decision '${fromId}' has no label`,
        );
      }
    }
  }

  return offenders;
};
