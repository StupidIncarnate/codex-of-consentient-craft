/**
 * PURPOSE: Generates test cases from a flow graph by traversing all entry-to-terminal paths via DFS
 *
 * USAGE:
 * flowToTestCasesTransformer({flow, generateId: () => crypto.randomUUID()});
 * // Returns: TestCase[] with one test case per unique path from entry to terminal node
 */

import type { Flow, FlowNode } from '@dungeonmaster/shared/contracts';
import { flowNodeIdContract } from '@dungeonmaster/shared/contracts';

import type { TestCase } from '../../contracts/test-case/test-case-contract';
import { testCaseContract } from '../../contracts/test-case/test-case-contract';
import { testCaseIdContract } from '../../contracts/test-case-id/test-case-id-contract';
import type { TestCaseStep } from '../../contracts/test-case-step/test-case-step-contract';
import { flowCollectPathsTransformer } from '../flow-collect-paths/flow-collect-paths-transformer';
import { flowPathToStepsTransformer } from '../flow-path-to-steps/flow-path-to-steps-transformer';

type FlowNodeId = FlowNode['id'];
type Transition = TestCaseStep['transition'];

export const flowToTestCasesTransformer = ({
  flow,
  generateId,
}: {
  flow: Flow;
  generateId: () => TestCase['id'];
}): TestCase[] => {
  const nodeMap = new Map(flow.nodes.map((node) => [node.id, node]));

  const incomingNodeIds = new Set(flow.edges.map((edge) => flowNodeIdContract.parse(edge.to)));
  const entryNodeIds = flow.nodes
    .filter((node) => !incomingNodeIds.has(node.id))
    .map((node) => node.id);

  const outgoingEdges = new Map<FlowNodeId, { to: FlowNodeId; label: Transition }[]>();
  for (const edge of flow.edges) {
    const fromId = flowNodeIdContract.parse(edge.from);
    const toId = flowNodeIdContract.parse(edge.to);
    const existing = outgoingEdges.get(fromId) ?? [];
    existing.push({
      to: toId,
      label: edge.label ?? null,
    });
    outgoingEdges.set(fromId, existing);
  }

  const allPaths = entryNodeIds.flatMap((entryNodeId) => {
    const visited = new Set<FlowNodeId>([entryNodeId]);

    return flowCollectPathsTransformer({
      path: [{ nodeId: entryNodeId, transition: null }],
      visited,
      nodeMap,
      outgoingEdges,
    });
  });

  return allPaths.map((collectedPath) =>
    testCaseContract.parse({
      id: testCaseIdContract.parse(generateId()),
      flowId: flow.id,
      terminalNodeId: collectedPath.terminalNodeId,
      steps: flowPathToStepsTransformer({
        path: collectedPath.steps,
        nodeMap,
      }),
    }),
  );
};
