/**
 * PURPOSE: Collects all entry-to-terminal paths in a flow graph via recursive DFS traversal
 *
 * USAGE:
 * flowCollectPathsTransformer({path: [{nodeId, transition: null}], visited: new Set([nodeId]), nodeMap, outgoingEdges});
 * // Returns: CollectedPath[] with one entry per terminal-reaching path
 */

import type { FlowNode } from '@dungeonmaster/shared/contracts';

import type {
  CollectedPath,
  PathStep,
} from '../../contracts/collected-path/collected-path-contract';

type FlowNodeId = FlowNode['id'];
type Transition = PathStep['transition'];

export const flowCollectPathsTransformer = ({
  path,
  visited,
  nodeMap,
  outgoingEdges,
}: {
  path: PathStep[];
  visited: Set<FlowNodeId>;
  nodeMap: Map<FlowNodeId, FlowNode>;
  outgoingEdges: Map<FlowNodeId, { to: FlowNodeId; label: Transition }[]>;
}): CollectedPath[] => {
  const currentStep = path.at(-1);

  if (!currentStep) {
    return [];
  }

  const currentNode = nodeMap.get(currentStep.nodeId);

  if (!currentNode) {
    return [];
  }

  const edges = outgoingEdges.get(currentStep.nodeId) ?? [];

  if (currentNode.type === 'terminal' || edges.length === 0) {
    return [{ steps: path, terminalNodeId: currentStep.nodeId }];
  }

  const reachableEdges = edges.filter((edge) => !visited.has(edge.to));

  if (reachableEdges.length === 0) {
    return [{ steps: path, terminalNodeId: currentStep.nodeId }];
  }

  const results: CollectedPath[] = [];

  for (const edge of reachableEdges) {
    const nextVisited = new Set(visited);
    nextVisited.add(edge.to);

    const childPaths = flowCollectPathsTransformer({
      path: [...path, { nodeId: edge.to, transition: edge.label }],
      visited: nextVisited,
      nodeMap,
      outgoingEdges,
    });

    for (const childPath of childPaths) {
      results.push(childPath);
    }
  }

  return results;
};
