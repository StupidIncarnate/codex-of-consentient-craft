import { FlowNodeStub } from '@dungeonmaster/shared/contracts';

import type { TestCaseStepStub } from '../../contracts/test-case-step/test-case-step.stub';

import { flowCollectPathsTransformer } from './flow-collect-paths-transformer';

type FlowNode = ReturnType<typeof FlowNodeStub>;
type FlowNodeId = FlowNode['id'];
type Transition = ReturnType<typeof TestCaseStepStub>['transition'];

describe('flowCollectPathsTransformer', () => {
  describe('valid paths', () => {
    it('VALID: {single terminal node} => returns one path with one step', () => {
      const node = FlowNodeStub({ id: 'end-state', type: 'terminal' });
      const nodeMap = new Map<FlowNodeId, FlowNode>([[node.id, node]]);
      const outgoingEdges = new Map<FlowNodeId, { to: FlowNodeId; label: Transition }[]>();

      const result = flowCollectPathsTransformer({
        path: [{ nodeId: node.id, transition: null }],
        visited: new Set([node.id]),
        nodeMap,
        outgoingEdges,
      });

      expect(result).toStrictEqual([
        { steps: [{ nodeId: 'end-state', transition: null }], terminalNodeId: 'end-state' },
      ]);
    });

    it('VALID: {node with no outgoing edges} => treats as terminal', () => {
      const node = FlowNodeStub({ id: 'leaf-node', type: 'state' });
      const nodeMap = new Map<FlowNodeId, FlowNode>([[node.id, node]]);
      const outgoingEdges = new Map<FlowNodeId, { to: FlowNodeId; label: Transition }[]>();

      const result = flowCollectPathsTransformer({
        path: [{ nodeId: node.id, transition: null }],
        visited: new Set([node.id]),
        nodeMap,
        outgoingEdges,
      });

      expect(result).toStrictEqual([
        { steps: [{ nodeId: 'leaf-node', transition: null }], terminalNodeId: 'leaf-node' },
      ]);
    });

    it('VALID: {unknown node} => returns empty', () => {
      const nodeMap = new Map<FlowNodeId, FlowNode>();
      const outgoingEdges = new Map<FlowNodeId, { to: FlowNodeId; label: Transition }[]>();

      const result = flowCollectPathsTransformer({
        path: [{ nodeId: 'missing-node' as FlowNodeId, transition: null }],
        visited: new Set(['missing-node' as FlowNodeId]),
        nodeMap,
        outgoingEdges,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('cycle detection', () => {
    it('EDGE: {visited node in outgoing edge} => skips visited node', () => {
      const nodeA = FlowNodeStub({ id: 'node-a', type: 'state' });
      const nodeB = FlowNodeStub({ id: 'node-b', type: 'state' });
      const nodeMap = new Map<FlowNodeId, FlowNode>([
        [nodeA.id, nodeA],
        [nodeB.id, nodeB],
      ]);
      const outgoingEdges = new Map<FlowNodeId, { to: FlowNodeId; label: Transition }[]>([
        [nodeA.id, [{ to: nodeB.id, label: null }]],
        [nodeB.id, [{ to: nodeA.id, label: null }]],
      ]);

      const result = flowCollectPathsTransformer({
        path: [{ nodeId: nodeA.id, transition: null }],
        visited: new Set([nodeA.id]),
        nodeMap,
        outgoingEdges,
      });

      expect(result).toStrictEqual([
        {
          steps: [
            { nodeId: 'node-a', transition: null },
            { nodeId: 'node-b', transition: null },
          ],
          terminalNodeId: 'node-b',
        },
      ]);
    });
  });
});
