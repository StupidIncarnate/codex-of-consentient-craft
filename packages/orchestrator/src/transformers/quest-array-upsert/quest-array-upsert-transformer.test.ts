import {
  DependencyStepStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
} from '@dungeonmaster/shared/contracts';

import { questArrayUpsertTransformer } from './quest-array-upsert-transformer';

type Flow = ReturnType<typeof FlowStub>;

describe('questArrayUpsertTransformer', () => {
  describe('adding new items', () => {
    it('VALID: {new item} => adds to array', () => {
      const flowA = FlowStub({ id: 'flow-a', name: 'Flow A' });
      const flowB = FlowStub({ id: 'flow-b', name: 'Flow B' });
      const existing = [flowA];
      const updates = [flowB];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toStrictEqual([flowA, flowB]);
    });

    it('VALID: {empty existing} => adds all updates', () => {
      const step = DependencyStepStub({ name: 'Step 1' });
      const updates = [step];

      const result = questArrayUpsertTransformer({ existing: [], updates });

      expect(result).toStrictEqual([step]);
    });
  });

  describe('updating existing items', () => {
    it('VALID: {existing item} => updates in place', () => {
      const existing = [FlowStub({ id: 'flow-a', name: 'Old' })];
      const updates = [FlowStub({ id: 'flow-a', name: 'New' })];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toStrictEqual([FlowStub({ id: 'flow-a', name: 'New' })]);
    });
  });

  describe('delete operations', () => {
    it('VALID: {_delete: true} => removes item from array', () => {
      const flowKeep = FlowStub({ id: 'flow-a', name: 'Keep' });
      const existing = [flowKeep, FlowStub({ id: 'flow-b', name: 'Remove' })];
      const flowToDelete = FlowStub({ id: 'flow-b' });
      Object.assign(flowToDelete, { _delete: true });
      const updates = [flowToDelete];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toStrictEqual([flowKeep]);
    });

    it('VALID: {_delete: true, id not found} => no-op', () => {
      const flowKeep = FlowStub({ id: 'flow-a', name: 'Keep' });
      const existing = [flowKeep];
      const flowToDelete = FlowStub({ id: 'nonexistent' });
      Object.assign(flowToDelete, { _delete: true });
      const updates = [flowToDelete];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toStrictEqual([flowKeep]);
    });
  });

  describe('deep upsert', () => {
    it('VALID: {add observable to existing node within existing flow} => deep merges', () => {
      const existingObs = FlowObservableStub({ id: 'obs-1', description: 'First' });
      const newObs = FlowObservableStub({ id: 'obs-2', description: 'Second' });
      const existingNode = FlowNodeStub({ id: 'n1', observables: [existingObs] });
      const updateNode = FlowNodeStub({ id: 'n1', observables: [newObs] });
      const existing = [FlowStub({ id: 'flow-a', nodes: [existingNode] })];
      const updates = [FlowStub({ id: 'flow-a', nodes: [updateNode] })];

      const result = questArrayUpsertTransformer({ existing, updates });

      const { nodes } = result[0]!;
      const { observables } = nodes[0]!;

      expect(observables).toStrictEqual([existingObs, newObs]);
    });

    it('VALID: {update observable description without touching other nodes} => preserves siblings', () => {
      const obs = FlowObservableStub({ id: 'obs-1', description: 'Old' });
      const node1 = FlowNodeStub({ id: 'n1', label: 'Node 1', observables: [obs] });
      const node2 = FlowNodeStub({ id: 'n2', label: 'Node 2' });
      const existing = [FlowStub({ id: 'flow-a', nodes: [node1, node2] })];

      const updatedObs = FlowObservableStub({ id: 'obs-1', description: 'Updated' });
      const updateNode = FlowNodeStub({ id: 'n1', observables: [updatedObs] });
      const updates = [FlowStub({ id: 'flow-a', nodes: [updateNode] })];

      const result = questArrayUpsertTransformer({ existing, updates });

      const { nodes } = result[0]!;

      expect(nodes[0]?.id).toBe('n1');
      expect(nodes[1]?.id).toBe('n2');

      const { observables } = nodes[0]!;

      expect(observables).toStrictEqual([updatedObs]);
    });

    it('VALID: {nested delete: remove observable from node} => removes nested item', () => {
      const obs1 = FlowObservableStub({ id: 'obs-1', description: 'Keep' });
      const obs2 = FlowObservableStub({ id: 'obs-2', description: 'Delete' });
      const node = FlowNodeStub({ id: 'n1', observables: [obs1, obs2] });
      const existing = [FlowStub({ id: 'flow-a', nodes: [node] })];

      const updateFlow = FlowStub({
        id: 'flow-a',
        nodes: [FlowNodeStub({ id: 'n1', observables: [FlowObservableStub({ id: 'obs-2' })] })],
      });
      Object.assign(updateFlow.nodes[0]?.observables[0] as Record<PropertyKey, unknown>, {
        _delete: true,
      });
      const updates = [updateFlow];

      const result = questArrayUpsertTransformer({ existing, updates });

      const { nodes } = result[0]!;
      const { observables } = nodes[0]!;

      expect(observables).toStrictEqual([obs1]);
    });
  });

  describe('edge upsert', () => {
    it('VALID: {add edge by id} => appends to edges array', () => {
      const existingEdge = FlowEdgeStub({ id: 'e1', from: 'n1', to: 'n2' });
      const newEdge = FlowEdgeStub({ id: 'e2', from: 'n2', to: 'n3' });
      const existing = [FlowStub({ id: 'flow-a', edges: [existingEdge] })];
      const updates = [FlowStub({ id: 'flow-a', edges: [newEdge] })];

      const result = questArrayUpsertTransformer({ existing, updates });

      const { edges } = result[0]!;

      expect(edges).toStrictEqual([existingEdge, newEdge]);
    });

    it('VALID: {update edge label} => merges edge fields', () => {
      const existingEdge = FlowEdgeStub({ id: 'e1', from: 'n1', to: 'n2', label: 'Old' });
      const updatedEdge = FlowEdgeStub({ id: 'e1', from: 'n1', to: 'n2', label: 'New' });
      const existing = [FlowStub({ id: 'flow-a', edges: [existingEdge] })];
      const updates = [FlowStub({ id: 'flow-a', edges: [updatedEdge] })];

      const result = questArrayUpsertTransformer({ existing, updates });

      const { edges } = result[0]!;

      expect(edges).toStrictEqual([updatedEdge]);
    });
  });

  describe('mixed operations', () => {
    it('VALID: {some updated, some added, some deleted} => applies all operations', () => {
      const flowA = FlowStub({ id: 'flow-a', name: 'Flow A' });
      const flowB = FlowStub({ id: 'flow-b', name: 'Flow B' });
      const flowC = FlowStub({ id: 'flow-c', name: 'Flow C' });
      const existing = [flowA, flowB, flowC];

      const flowAUpdated = FlowStub({ id: 'flow-a', name: 'Flow A Updated' });
      const flowD = FlowStub({ id: 'flow-d', name: 'Flow D' });
      const flowBDeleted = FlowStub({ id: 'flow-b' });
      Object.assign(flowBDeleted, { _delete: true });
      const updates = [flowAUpdated, flowBDeleted, flowD];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toStrictEqual([flowAUpdated, flowC, flowD]);
    });
  });

  describe('sibling array preservation', () => {
    it('VALID: {flow update with only nodes} => edges preserved', () => {
      const existingNode = FlowNodeStub({ id: 'n1', label: 'Node 1' });
      const existingEdge = FlowEdgeStub({ id: 'e1', from: 'n1', to: 'n2' });
      const newNode = FlowNodeStub({ id: 'n2', label: 'Node 2' });
      const existing = [FlowStub({ id: 'flow-a', nodes: [existingNode], edges: [existingEdge] })];
      const updateFlow = FlowStub({ id: 'flow-a', nodes: [newNode] });
      Reflect.deleteProperty(updateFlow, 'edges');
      const updates = [updateFlow];

      const result = questArrayUpsertTransformer({ existing, updates });

      const { nodes, edges } = result[0]!;

      expect(nodes).toStrictEqual([existingNode, newNode]);
      expect(edges).toStrictEqual([existingEdge]);
    });

    it('VALID: {flow update with only edges} => nodes preserved', () => {
      const existingNode = FlowNodeStub({ id: 'n1', label: 'Node 1' });
      const existingEdge = FlowEdgeStub({ id: 'e1', from: 'n1', to: 'n2' });
      const newEdge = FlowEdgeStub({ id: 'e2', from: 'n2', to: 'n3' });
      const existing = [FlowStub({ id: 'flow-a', nodes: [existingNode], edges: [existingEdge] })];
      const updateFlow = FlowStub({ id: 'flow-a', edges: [newEdge] });
      Reflect.deleteProperty(updateFlow, 'nodes');
      const updates = [updateFlow];

      const result = questArrayUpsertTransformer({ existing, updates });

      const { nodes, edges } = result[0]!;

      expect(nodes).toStrictEqual([existingNode]);
      expect(edges).toStrictEqual([existingEdge, newEdge]);
    });

    it('VALID: {node update without observables} => existing observables preserved', () => {
      const existingObs = FlowObservableStub({ id: 'obs-1', description: 'Existing' });
      const existingNode = FlowNodeStub({ id: 'n1', label: 'Old', observables: [existingObs] });
      const existing = [FlowStub({ id: 'flow-a', nodes: [existingNode] })];
      const updateFlow = FlowStub({
        id: 'flow-a',
        nodes: [FlowNodeStub({ id: 'n1', label: 'New' })],
      });
      Reflect.deleteProperty(updateFlow, 'edges');
      Reflect.deleteProperty(updateFlow.nodes[0] as Record<PropertyKey, unknown>, 'observables');
      const updates = [updateFlow];

      const result = questArrayUpsertTransformer({ existing, updates });

      const { nodes } = result[0]!;

      expect(nodes[0]?.label).toBe('New');
      expect(nodes[0]?.observables).toStrictEqual([existingObs]);
    });
  });

  describe('nested _delete via _delete flag', () => {
    it('VALID: {delete observable via _delete within node within flow} => removes observable', () => {
      const obs1 = FlowObservableStub({ id: 'obs-1', description: 'Keep' });
      const obs2 = FlowObservableStub({ id: 'obs-2', description: 'Delete' });
      const node = FlowNodeStub({ id: 'n1', observables: [obs1, obs2] });
      const existing = [FlowStub({ id: 'flow-a', nodes: [node] })];

      const updateFlow = FlowStub({
        id: 'flow-a',
        nodes: [FlowNodeStub({ id: 'n1', observables: [FlowObservableStub({ id: 'obs-2' })] })],
      });
      Reflect.deleteProperty(updateFlow, 'edges');
      Object.assign(updateFlow.nodes[0]?.observables[0] as Record<PropertyKey, unknown>, {
        _delete: true,
      });
      const updates = [updateFlow];

      const result = questArrayUpsertTransformer({ existing, updates });

      const { nodes } = result[0]!;
      const { observables } = nodes[0]!;

      expect(observables).toStrictEqual([obs1]);
    });

    it('VALID: {delete edge via _delete within flow} => removes edge', () => {
      const edge1 = FlowEdgeStub({ id: 'e1', from: 'n1', to: 'n2' });
      const edge2 = FlowEdgeStub({ id: 'e2', from: 'n2', to: 'n3' });
      const existing = [FlowStub({ id: 'flow-a', edges: [edge1, edge2] })];

      const updateFlow = FlowStub({
        id: 'flow-a',
        edges: [FlowEdgeStub({ id: 'e2', from: 'n2', to: 'n3' })],
      });
      Reflect.deleteProperty(updateFlow, 'nodes');
      Object.assign(updateFlow.edges[0] as Record<PropertyKey, unknown>, { _delete: true });
      const updates = [updateFlow];

      const result = questArrayUpsertTransformer({ existing, updates });

      const { edges } = result[0]!;

      expect(edges).toStrictEqual([edge1]);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {existing: [], updates: []} => returns empty array', () => {
      const existing: Flow[] = [];
      const updates: Flow[] = [];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {empty updates} => preserves existing', () => {
      const flow = FlowStub({ name: 'Existing' });
      const existing = [flow];

      const result = questArrayUpsertTransformer({ existing, updates: [] });

      expect(result).toStrictEqual([flow]);
    });
  });
});
