import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
} from '@dungeonmaster/shared/contracts';

import { questFlowObservableSeedTransformer } from './quest-flow-observable-seed-transformer';

describe('questFlowObservableSeedTransformer', () => {
  describe('status requires terminal observable', () => {
    it('VALID: {status: review_observables, flows with terminal node missing observable} => injects one observable into the terminal node', () => {
      const startNode = FlowNodeStub({ id: 'start' as never, label: 'Start' as never });
      const endNodeEmpty = FlowNodeStub({
        id: 'end' as never,
        label: 'End' as never,
        type: 'terminal',
      });
      const edge = FlowEdgeStub({
        id: 'start-to-end' as never,
        from: 'start' as never,
        to: 'end' as never,
      });
      const flows = [
        FlowStub({
          id: 'flow-a' as never,
          name: 'Flow A' as never,
          entryPoint: 'start' as never,
          exitPoints: ['end'] as never,
          nodes: [startNode, endNodeEmpty],
          edges: [edge],
        }),
      ];

      const result = questFlowObservableSeedTransformer({ flows, status: 'review_observables' });

      const seededObservable = FlowObservableStub({
        id: 'harness-terminal-observable' as never,
        description: 'harness-seeded observable' as never,
      });
      const endNodeSeeded = FlowNodeStub({
        id: 'end' as never,
        label: 'End' as never,
        type: 'terminal',
        observables: [seededObservable],
      });
      const expectedFlow = FlowStub({
        id: 'flow-a' as never,
        name: 'Flow A' as never,
        entryPoint: 'start' as never,
        exitPoints: ['end'] as never,
        nodes: [startNode, endNodeSeeded],
        edges: [edge],
      });

      expect(result).toStrictEqual([expectedFlow]);
    });

    it('VALID: {status: review_observables, flows already have terminal observable} => returns flows unchanged', () => {
      const existingObservable = FlowObservableStub({
        id: 'existing-observable' as never,
        description: 'existing observable' as never,
      });
      const startNode = FlowNodeStub({ id: 'start' as never, label: 'Start' as never });
      const endNode = FlowNodeStub({
        id: 'end' as never,
        label: 'End' as never,
        type: 'terminal',
        observables: [existingObservable],
      });
      const edge = FlowEdgeStub({
        id: 'start-to-end' as never,
        from: 'start' as never,
        to: 'end' as never,
      });
      const flows = [
        FlowStub({
          id: 'flow-a' as never,
          name: 'Flow A' as never,
          entryPoint: 'start' as never,
          exitPoints: ['end'] as never,
          nodes: [startNode, endNode],
          edges: [edge],
        }),
      ];

      const result = questFlowObservableSeedTransformer({ flows, status: 'review_observables' });

      expect(result).toStrictEqual(flows);
    });

    it('VALID: {status: review_observables, multiple flows with only first missing terminal observable} => injects into first terminal across all flows, subsequent terminals unchanged', () => {
      const flowAStart = FlowNodeStub({ id: 'start-a' as never, label: 'Start A' as never });
      const flowAEndEmpty = FlowNodeStub({
        id: 'end-a' as never,
        label: 'End A' as never,
        type: 'terminal',
      });
      const flowAEdge = FlowEdgeStub({
        id: 'a-start-to-end' as never,
        from: 'start-a' as never,
        to: 'end-a' as never,
      });
      const flowBStart = FlowNodeStub({ id: 'start-b' as never, label: 'Start B' as never });
      const flowBEndEmpty = FlowNodeStub({
        id: 'end-b' as never,
        label: 'End B' as never,
        type: 'terminal',
      });
      const flowBEdge = FlowEdgeStub({
        id: 'b-start-to-end' as never,
        from: 'start-b' as never,
        to: 'end-b' as never,
      });
      const flowA = FlowStub({
        id: 'flow-a' as never,
        name: 'Flow A' as never,
        entryPoint: 'start-a' as never,
        exitPoints: ['end-a'] as never,
        nodes: [flowAStart, flowAEndEmpty],
        edges: [flowAEdge],
      });
      const flowB = FlowStub({
        id: 'flow-b' as never,
        name: 'Flow B' as never,
        entryPoint: 'start-b' as never,
        exitPoints: ['end-b'] as never,
        nodes: [flowBStart, flowBEndEmpty],
        edges: [flowBEdge],
      });

      const result = questFlowObservableSeedTransformer({
        flows: [flowA, flowB],
        status: 'review_observables',
      });

      const seededObservable = FlowObservableStub({
        id: 'harness-terminal-observable' as never,
        description: 'harness-seeded observable' as never,
      });
      const flowAEndSeeded = FlowNodeStub({
        id: 'end-a' as never,
        label: 'End A' as never,
        type: 'terminal',
        observables: [seededObservable],
      });
      const flowAExpected = FlowStub({
        id: 'flow-a' as never,
        name: 'Flow A' as never,
        entryPoint: 'start-a' as never,
        exitPoints: ['end-a'] as never,
        nodes: [flowAStart, flowAEndSeeded],
        edges: [flowAEdge],
      });

      expect(result).toStrictEqual([flowAExpected, flowB]);
    });
  });

  describe('status does not require terminal observable', () => {
    it('VALID: {status: created, flows without observable} => returns flows unchanged', () => {
      const startNode = FlowNodeStub({ id: 'start' as never, label: 'Start' as never });
      const endNode = FlowNodeStub({
        id: 'end' as never,
        label: 'End' as never,
        type: 'terminal',
      });
      const edge = FlowEdgeStub({
        id: 'start-to-end' as never,
        from: 'start' as never,
        to: 'end' as never,
      });
      const flows = [
        FlowStub({
          id: 'flow-a' as never,
          name: 'Flow A' as never,
          entryPoint: 'start' as never,
          exitPoints: ['end'] as never,
          nodes: [startNode, endNode],
          edges: [edge],
        }),
      ];

      const result = questFlowObservableSeedTransformer({ flows, status: 'created' });

      expect(result).toStrictEqual(flows);
    });
  });
});
