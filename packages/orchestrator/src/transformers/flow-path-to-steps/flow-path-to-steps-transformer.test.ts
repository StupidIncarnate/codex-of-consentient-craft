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

    it('VALID: {node with observables} => collects assertions from observables', () => {
      const node = FlowNodeStub({
        id: 'dashboard',
        label: 'Dashboard',
        type: 'state',
        observables: [
          FlowObservableStub({
            id: 'shows-dashboard',
            type: 'ui-state',
            description: 'shows dashboard',
          }),
          FlowObservableStub({
            id: 'fetches-user-data',
            type: 'api-call',
            description: 'fetches user data',
          }),
        ],
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

    it('VALID: {multiple observables} => collects all assertions', () => {
      const obs1 = FlowObservableStub({
        id: 'shows-form',
        type: 'ui-state',
        description: 'shows form',
      });
      const obs2 = FlowObservableStub({
        id: 'validates-input',
        type: 'api-call',
        description: 'validates input',
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
