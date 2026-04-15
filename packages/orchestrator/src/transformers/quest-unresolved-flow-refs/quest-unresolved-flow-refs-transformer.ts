/**
 * PURPOSE: Returns descriptions of flow edges whose from/to refs do not resolve to existing nodes
 *
 * USAGE:
 * questUnresolvedFlowRefsTransformer({flows});
 * // Returns ErrorMessage[] — e.g. ["flow 'login' edge 'e1' has unresolved 'to' ref 'ghost'"].
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questUnresolvedFlowRefsTransformer = ({
  flows,
}: {
  flows?: Flow[];
}): ErrorMessage[] => {
  if (!flows) {
    return [];
  }

  const nodeIdsByFlowId = new Map<unknown, Set<unknown>>();
  for (const flow of flows) {
    const nodeIds = new Set<unknown>();
    for (const node of flow.nodes) {
      nodeIds.add(String(node.id));
    }
    nodeIdsByFlowId.set(String(flow.id), nodeIds);
  }

  const offenders: ErrorMessage[] = [];

  for (const flow of flows) {
    const currentFlowNodeIds = nodeIdsByFlowId.get(String(flow.id)) ?? new Set<unknown>();

    for (const edge of flow.edges) {
      const refs = new Map<unknown, unknown>();
      refs.set('from', String(edge.from));
      refs.set('to', String(edge.to));

      for (const [directionKey, refValue] of refs) {
        const ref = String(refValue);
        let resolved = false;
        if (ref.includes(':')) {
          const [flowIdPart, nodeIdPart] = ref.split(':');
          if (
            flowIdPart !== undefined &&
            nodeIdPart !== undefined &&
            flowIdPart.length > 0 &&
            nodeIdPart.length > 0
          ) {
            const targetNodeIds = nodeIdsByFlowId.get(flowIdPart);
            resolved = targetNodeIds?.has(nodeIdPart) ?? false;
          }
        } else {
          resolved = currentFlowNodeIds.has(ref);
        }

        if (!resolved) {
          offenders.push(
            errorMessageContract.parse(
              `flow '${String(flow.id)}' edge '${String(edge.id)}' has unresolved '${String(directionKey)}' ref '${ref}'`,
            ),
          );
        }
      }
    }
  }

  return offenders;
};
