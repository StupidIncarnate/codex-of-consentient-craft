import { FlowEdgeStub } from '@dungeonmaster/shared/contracts/flow-edge/flow-edge.stub';
import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowObservableStub } from '@dungeonmaster/shared/contracts/flow-observable/flow-observable.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';

import { questFlowObservableSeedTransformer } from './quest-flow-observable-seed-transformer';

describe('questFlowObservableSeedTransformer', () => {
  describe('status requires terminal observable', () => {
    it('VALID: {status: review_observables, flows with terminal node missing observable} => injects one observable into the terminal node', () => {
      const startNode = FlowNodeStub({ id: 'start', label: 'Start' });
      const endNodeEmpty = FlowNodeStub({
        id: 'end',
        label: 'End',
        type: 'terminal',
      });
      const edge = FlowEdgeStub({
        id: 'start-to-end',
        from: 'start',
        to: 'end',
      });
      const flows = [
        FlowStub({
          id: 'flow-a',
          name: 'Flow A',
          entryPoint: 'start',
          exitPoints: ['end'],
          nodes: [startNode, endNodeEmpty],
          edges: [edge],
        }),
      ];

      const result = questFlowObservableSeedTransformer({ flows, status: 'review_observables' });

      const seededObservable = FlowObservableStub({
        id: 'harness-terminal-observable',
        description: 'harness-seeded observable',
      });
      const endNodeSeeded = FlowNodeStub({
        id: 'end',
        label: 'End',
        type: 'terminal',
        observables: [seededObservable],
      });
      const expectedFlow = FlowStub({
        id: 'flow-a',
        name: 'Flow A',
        entryPoint: 'start',
        exitPoints: ['end'],
        nodes: [startNode, endNodeSeeded],
        edges: [edge],
      });

      expect(result).toStrictEqual([expectedFlow]);
    });

    it('VALID: {status: review_observables, flows already have terminal observable} => returns flows unchanged', () => {
      const existingObservable = FlowObservableStub({
        id: 'existing-observable',
        description: 'existing observable',
      });
      const startNode = FlowNodeStub({ id: 'start', label: 'Start' });
      const endNode = FlowNodeStub({
        id: 'end',
        label: 'End',
        type: 'terminal',
        observables: [existingObservable],
      });
      const edge = FlowEdgeStub({
        id: 'start-to-end',
        from: 'start',
        to: 'end',
      });
      const flows = [
        FlowStub({
          id: 'flow-a',
          name: 'Flow A',
          entryPoint: 'start',
          exitPoints: ['end'],
          nodes: [startNode, endNode],
          edges: [edge],
        }),
      ];

      const result = questFlowObservableSeedTransformer({ flows, status: 'review_observables' });

      expect(result).toStrictEqual(flows);
    });

    it('VALID: {status: review_observables, multiple flows with only first missing terminal observable} => injects into first terminal across all flows, subsequent terminals unchanged', () => {
      const flowAStart = FlowNodeStub({ id: 'start-a', label: 'Start A' });
      const flowAEndEmpty = FlowNodeStub({
        id: 'end-a',
        label: 'End A',
        type: 'terminal',
      });
      const flowAEdge = FlowEdgeStub({
        id: 'a-start-to-end',
        from: 'start-a',
        to: 'end-a',
      });
      const flowBStart = FlowNodeStub({ id: 'start-b', label: 'Start B' });
      const flowBEndEmpty = FlowNodeStub({
        id: 'end-b',
        label: 'End B',
        type: 'terminal',
      });
      const flowBEdge = FlowEdgeStub({
        id: 'b-start-to-end',
        from: 'start-b',
        to: 'end-b',
      });
      const flowA = FlowStub({
        id: 'flow-a',
        name: 'Flow A',
        entryPoint: 'start-a',
        exitPoints: ['end-a'],
        nodes: [flowAStart, flowAEndEmpty],
        edges: [flowAEdge],
      });
      const flowB = FlowStub({
        id: 'flow-b',
        name: 'Flow B',
        entryPoint: 'start-b',
        exitPoints: ['end-b'],
        nodes: [flowBStart, flowBEndEmpty],
        edges: [flowBEdge],
      });

      const result = questFlowObservableSeedTransformer({
        flows: [flowA, flowB],
        status: 'review_observables',
      });

      const seededObservable = FlowObservableStub({
        id: 'harness-terminal-observable',
        description: 'harness-seeded observable',
      });
      const flowAEndSeeded = FlowNodeStub({
        id: 'end-a',
        label: 'End A',
        type: 'terminal',
        observables: [seededObservable],
      });
      const flowAExpected = FlowStub({
        id: 'flow-a',
        name: 'Flow A',
        entryPoint: 'start-a',
        exitPoints: ['end-a'],
        nodes: [flowAStart, flowAEndSeeded],
        edges: [flowAEdge],
      });

      expect(result).toStrictEqual([flowAExpected, flowB]);
    });
  });

  describe('status does not require terminal observable', () => {
    it('VALID: {status: created, flows without observable} => returns flows unchanged', () => {
      const startNode = FlowNodeStub({ id: 'start', label: 'Start' });
      const endNode = FlowNodeStub({
        id: 'end',
        label: 'End',
        type: 'terminal',
      });
      const edge = FlowEdgeStub({
        id: 'start-to-end',
        from: 'start',
        to: 'end',
      });
      const flows = [
        FlowStub({
          id: 'flow-a',
          name: 'Flow A',
          entryPoint: 'start',
          exitPoints: ['end'],
          nodes: [startNode, endNode],
          edges: [edge],
        }),
      ];

      const result = questFlowObservableSeedTransformer({ flows, status: 'created' });

      expect(result).toStrictEqual(flows);
    });
  });
});
