import { FlowNodeStub, FlowObservableStub } from '@dungeonmaster/shared/contracts';

import type { TestCaseStepStub } from '../../contracts/test-case-step/test-case-step.stub';

import { flowPathToStepsTransformer } from './flow-path-to-steps-transformer';

type FlowNode = ReturnType<typeof FlowNodeStub>;
type FlowNodeId = FlowNode['id'];
type Transition = ReturnType<typeof TestCaseStepStub>['transition'];

describe('flowPathToStepsTransformer', () => {
  describe('valid paths', () => {
    it('VALID: {single node, no observables} => returns step with empty assertions', () => {
      const node = FlowNodeStub({ id: 'login-page', type: 'state', observables: [] });
      const nodeMap = new Map<FlowNodeId, FlowNode>([[node.id, node]]);

      const result = flowPathToStepsTransformer({
        path: [{ nodeId: node.id, transition: null }],
        nodeMap,
      });

      expect(result).toStrictEqual([
        {
          nodeId: 'login-page',
          nodeLabel: 'Login Page',
          nodeType: 'state',
          transition: null,
          assertions: [],
        },
      ]);
    });

    it('VALID: {node with observables} => flattens assertions from then[]', () => {
      const observable = FlowObservableStub({
        then: [
          { type: 'ui-state', description: 'shows dashboard' },
          { type: 'api-call', description: 'fetches user data' },
        ],
      });
      const node = FlowNodeStub({
        id: 'dashboard',
        label: 'Dashboard',
        type: 'state',
        observables: [observable],
      });
      const nodeMap = new Map<FlowNodeId, FlowNode>([[node.id, node]]);

      const result = flowPathToStepsTransformer({
        path: [{ nodeId: node.id, transition: 'success' as Transition }],
        nodeMap,
      });

      expect(result).toStrictEqual([
        {
          nodeId: 'dashboard',
          nodeLabel: 'Dashboard',
          nodeType: 'state',
          transition: 'success',
          assertions: [
            { type: 'ui-state', description: 'shows dashboard' },
            { type: 'api-call', description: 'fetches user data' },
          ],
        },
      ]);
    });

    it('VALID: {multiple observables} => flattens all assertions', () => {
      const obs1 = FlowObservableStub({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        then: [{ type: 'ui-state', description: 'shows form' }],
      });
      const obs2 = FlowObservableStub({
        id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
        then: [{ type: 'api-call', description: 'validates input' }],
      });
      const node = FlowNodeStub({
        id: 'form-page',
        label: 'Form Page',
        type: 'state',
        observables: [obs1, obs2],
      });
      const nodeMap = new Map<FlowNodeId, FlowNode>([[node.id, node]]);

      const result = flowPathToStepsTransformer({
        path: [{ nodeId: node.id, transition: null }],
        nodeMap,
      });

      expect(result).toStrictEqual([
        {
          nodeId: 'form-page',
          nodeLabel: 'Form Page',
          nodeType: 'state',
          transition: null,
          assertions: [
            { type: 'ui-state', description: 'shows form' },
            { type: 'api-call', description: 'validates input' },
          ],
        },
      ]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {missing node in map} => returns defaults', () => {
      const nodeMap = new Map<FlowNodeId, FlowNode>();

      const result = flowPathToStepsTransformer({
        path: [{ nodeId: 'missing-node' as FlowNodeId, transition: null }],
        nodeMap,
      });

      expect(result).toStrictEqual([
        {
          nodeId: 'missing-node',
          nodeLabel: 'Unknown',
          nodeType: 'state',
          transition: null,
          assertions: [],
        },
      ]);
    });
  });
});
