import {
  FlowStub,
  FlowNodeStub,
  FlowEdgeStub,
  FlowObservableStub,
} from '@dungeonmaster/shared/contracts';

import { TestCaseIdStub } from '../../contracts/test-case-id/test-case-id.stub';

import { flowToTestCasesTransformer } from './flow-to-test-cases-transformer';

type TestCaseId = ReturnType<typeof TestCaseIdStub>;

const createIdGenerator = (): (() => TestCaseId) => {
  const id1 = TestCaseIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
  const id2 = TestCaseIdStub({ value: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e' });
  const id3 = TestCaseIdStub({ value: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f' });
  const ids = [id1, id2, id3];
  let index = 0;

  return (): TestCaseId => {
    const id = ids[index % ids.length] ?? id1;
    index++;

    return id;
  };
};

describe('flowToTestCasesTransformer', () => {
  describe('valid flows', () => {
    it('VALID: {linear path A -> B -> C terminal} => produces one test case with 3 steps', () => {
      const nodeA = FlowNodeStub({ id: 'start', label: 'Start', type: 'state' });
      const nodeB = FlowNodeStub({ id: 'middle', label: 'Middle', type: 'action' });
      const nodeC = FlowNodeStub({ id: 'end-state', label: 'End', type: 'terminal' });
      const flow = FlowStub({
        nodes: [nodeA, nodeB, nodeC],
        edges: [
          FlowEdgeStub({ id: 'start-to-middle', from: 'start', to: 'middle', label: 'next' }),
          FlowEdgeStub({ id: 'middle-to-end', from: 'middle', to: 'end-state', label: 'done' }),
        ],
      });

      const result = flowToTestCasesTransformer({ flow, generateId: createIdGenerator() });

      expect(result).toStrictEqual([
        {
          id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          flowId: flow.id,
          terminalNodeId: 'end-state',
          steps: [
            {
              nodeId: 'start',
              nodeLabel: 'Start',
              nodeType: 'state',
              transition: null,
              assertions: [],
            },
            {
              nodeId: 'middle',
              nodeLabel: 'Middle',
              nodeType: 'action',
              transition: 'next',
              assertions: [],
            },
            {
              nodeId: 'end-state',
              nodeLabel: 'End',
              nodeType: 'terminal',
              transition: 'done',
              assertions: [],
            },
          ],
        },
      ]);
    });

    it('VALID: {decision node with two branches} => produces two test cases', () => {
      const nodeA = FlowNodeStub({ id: 'start', label: 'Start', type: 'state' });
      const nodeB = FlowNodeStub({ id: 'check', label: 'Check', type: 'decision' });
      const nodeC = FlowNodeStub({ id: 'success-end', label: 'Success', type: 'terminal' });
      const nodeD = FlowNodeStub({ id: 'failure-end', label: 'Failure', type: 'terminal' });
      const flow = FlowStub({
        nodes: [nodeA, nodeB, nodeC, nodeD],
        edges: [
          FlowEdgeStub({ id: 'start-to-check', from: 'start', to: 'check', label: 'proceed' }),
          FlowEdgeStub({ id: 'check-to-success', from: 'check', to: 'success-end', label: 'yes' }),
          FlowEdgeStub({ id: 'check-to-failure', from: 'check', to: 'failure-end', label: 'no' }),
        ],
      });

      const result = flowToTestCasesTransformer({ flow, generateId: createIdGenerator() });

      expect(result).toStrictEqual([
        {
          id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          flowId: flow.id,
          terminalNodeId: 'success-end',
          steps: [
            {
              nodeId: 'start',
              nodeLabel: 'Start',
              nodeType: 'state',
              transition: null,
              assertions: [],
            },
            {
              nodeId: 'check',
              nodeLabel: 'Check',
              nodeType: 'decision',
              transition: 'proceed',
              assertions: [],
            },
            {
              nodeId: 'success-end',
              nodeLabel: 'Success',
              nodeType: 'terminal',
              transition: 'yes',
              assertions: [],
            },
          ],
        },
        {
          id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
          flowId: flow.id,
          terminalNodeId: 'failure-end',
          steps: [
            {
              nodeId: 'start',
              nodeLabel: 'Start',
              nodeType: 'state',
              transition: null,
              assertions: [],
            },
            {
              nodeId: 'check',
              nodeLabel: 'Check',
              nodeType: 'decision',
              transition: 'proceed',
              assertions: [],
            },
            {
              nodeId: 'failure-end',
              nodeLabel: 'Failure',
              nodeType: 'terminal',
              transition: 'no',
              assertions: [],
            },
          ],
        },
      ]);
    });

    it('VALID: {nodes with observables} => collects assertions from nodes along path', () => {
      const nodeA = FlowNodeStub({
        id: 'login-page',
        label: 'Login Page',
        type: 'state',
        observables: [
          FlowObservableStub({
            id: 'shows-login-form',
            type: 'ui-state',
            description: 'shows login form',
          }),
          FlowObservableStub({
            id: 'validates-credentials',
            type: 'api-call',
            description: 'validates credentials',
          }),
        ],
      });
      const nodeB = FlowNodeStub({ id: 'end-state', label: 'End', type: 'terminal' });
      const flow = FlowStub({
        nodes: [nodeA, nodeB],
        edges: [
          FlowEdgeStub({
            id: 'login-to-end',
            from: 'login-page',
            to: 'end-state',
            label: 'submit',
          }),
        ],
      });

      const result = flowToTestCasesTransformer({ flow, generateId: createIdGenerator() });

      expect(result).toStrictEqual([
        {
          id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          flowId: flow.id,
          terminalNodeId: 'end-state',
          steps: [
            {
              nodeId: 'login-page',
              nodeLabel: 'Login Page',
              nodeType: 'state',
              transition: null,
              assertions: [
                { type: 'ui-state', description: 'shows login form' },
                { type: 'api-call', description: 'validates credentials' },
              ],
            },
            {
              nodeId: 'end-state',
              nodeLabel: 'End',
              nodeType: 'terminal',
              transition: 'submit',
              assertions: [],
            },
          ],
        },
      ]);
    });

    it('VALID: {entry node} => has null transition', () => {
      const nodeA = FlowNodeStub({ id: 'start', label: 'Start', type: 'terminal' });
      const flow = FlowStub({
        nodes: [nodeA],
        edges: [],
      });

      const result = flowToTestCasesTransformer({ flow, generateId: createIdGenerator() });

      expect(result).toStrictEqual([
        {
          id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          flowId: flow.id,
          terminalNodeId: 'start',
          steps: [
            {
              nodeId: 'start',
              nodeLabel: 'Start',
              nodeType: 'terminal',
              transition: null,
              assertions: [],
            },
          ],
        },
      ]);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {flow with no nodes} => returns empty array', () => {
      const flow = FlowStub({ nodes: [], edges: [] });

      const result = flowToTestCasesTransformer({ flow, generateId: createIdGenerator() });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {entry leads into cycle} => cycle detection prevents infinite paths', () => {
      const nodeEntry = FlowNodeStub({ id: 'entry', label: 'Entry', type: 'state' });
      const nodeA = FlowNodeStub({ id: 'node-a', label: 'Node A', type: 'state' });
      const nodeB = FlowNodeStub({ id: 'node-b', label: 'Node B', type: 'state' });
      const flow = FlowStub({
        nodes: [nodeEntry, nodeA, nodeB],
        edges: [
          FlowEdgeStub({ id: 'entry-to-a', from: 'entry', to: 'node-a', label: 'start' }),
          FlowEdgeStub({ id: 'a-to-b', from: 'node-a', to: 'node-b', label: 'forward' }),
          FlowEdgeStub({ id: 'b-to-a', from: 'node-b', to: 'node-a', label: 'back' }),
        ],
      });

      const result = flowToTestCasesTransformer({ flow, generateId: createIdGenerator() });

      expect(result).toStrictEqual([
        {
          id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          flowId: flow.id,
          terminalNodeId: 'node-b',
          steps: [
            {
              nodeId: 'entry',
              nodeLabel: 'Entry',
              nodeType: 'state',
              transition: null,
              assertions: [],
            },
            {
              nodeId: 'node-a',
              nodeLabel: 'Node A',
              nodeType: 'state',
              transition: 'start',
              assertions: [],
            },
            {
              nodeId: 'node-b',
              nodeLabel: 'Node B',
              nodeType: 'state',
              transition: 'forward',
              assertions: [],
            },
          ],
        },
      ]);
    });

    it('EDGE: {edge labels become transition values} => edge labels preserved', () => {
      const nodeA = FlowNodeStub({ id: 'start', label: 'Start', type: 'state' });
      const nodeB = FlowNodeStub({ id: 'end-state', label: 'End', type: 'terminal' });
      const flow = FlowStub({
        nodes: [nodeA, nodeB],
        edges: [
          FlowEdgeStub({
            id: 'start-to-end',
            from: 'start',
            to: 'end-state',
            label: 'custom-transition',
          }),
        ],
      });

      const result = flowToTestCasesTransformer({ flow, generateId: createIdGenerator() });

      expect(result).toStrictEqual([
        {
          id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          flowId: flow.id,
          terminalNodeId: 'end-state',
          steps: [
            {
              nodeId: 'start',
              nodeLabel: 'Start',
              nodeType: 'state',
              transition: null,
              assertions: [],
            },
            {
              nodeId: 'end-state',
              nodeLabel: 'End',
              nodeType: 'terminal',
              transition: 'custom-transition',
              assertions: [],
            },
          ],
        },
      ]);
    });
  });
});
