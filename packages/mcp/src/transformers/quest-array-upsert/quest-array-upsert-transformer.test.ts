import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
} from '@dungeonmaster/shared/contracts';

import { questArrayUpsertTransformer } from './quest-array-upsert-transformer';

type Flow = ReturnType<typeof FlowStub>;

describe('questArrayUpsertTransformer', () => {
  describe('adding new items', () => {
    it('VALID: {flow items} => upserts flow types', () => {
      const existing: Flow[] = [];
      const newFlow = FlowStub({
        id: 'login-flow',
        name: 'Login Flow',
        entryPoint: '/login',
        exitPoints: ['/dashboard'],
      });
      const updates = [newFlow];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Login Flow');
    });

    it('VALID: {existing: [item1], updates: [item2]} => adds without modifying existing', () => {
      const existingFlow = FlowStub({
        id: 'existing-flow',
        name: 'Existing',
        entryPoint: '/existing',
        exitPoints: ['/done'],
      });
      const newFlow = FlowStub({
        id: 'new-flow',
        name: 'New',
        entryPoint: '/new',
        exitPoints: ['/done'],
      });
      const existing = [existingFlow];
      const updates = [newFlow];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('Existing');
      expect(result[1]?.name).toBe('New');
    });
  });

  describe('updating existing items', () => {
    it('VALID: {existing: [item], updates: [same id, different values]} => updates item', () => {
      const existingFlow = FlowStub({
        id: 'auth-flow',
        name: 'Old Name',
        entryPoint: '/old',
        exitPoints: ['/done'],
      });
      const updatedFlow = FlowStub({
        id: 'auth-flow',
        name: 'New Name',
        entryPoint: '/new',
        exitPoints: ['/updated'],
      });
      const existing = [existingFlow];
      const updates = [updatedFlow];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('New Name');
      expect(result[0]?.entryPoint).toBe('/new');
    });
  });

  describe('delete operations', () => {
    it('VALID: {_delete: true} => removes item from array', () => {
      const flowA = FlowStub({ id: 'flow-a', name: 'Keep' });
      const flowB = FlowStub({ id: 'flow-b', name: 'Remove' });
      const existing = [flowA, flowB];

      const flowBDeleted = FlowStub({ id: 'flow-b' });
      Object.assign(flowBDeleted, { _delete: true });
      const updates = [flowBDeleted];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Keep');
    });
  });

  describe('deep upsert', () => {
    it('VALID: {add observable to existing node} => deep merges into nested array', () => {
      const existingObs = FlowObservableStub({ id: 'obs-1', description: 'First' });
      const newObs = FlowObservableStub({ id: 'obs-2', description: 'Second' });
      const existingNode = FlowNodeStub({ id: 'n1', observables: [existingObs] });
      const updateNode = FlowNodeStub({ id: 'n1', observables: [newObs] });
      const existing = [FlowStub({ id: 'flow-a', nodes: [existingNode] })];
      const updates = [FlowStub({ id: 'flow-a', nodes: [updateNode] })];

      const result = questArrayUpsertTransformer({ existing, updates });

      const { nodes } = result[0]!;

      expect(nodes).toHaveLength(1);

      const { observables } = nodes[0]!;

      expect(observables).toHaveLength(2);
      expect(observables[0]?.id).toBe('obs-1');
      expect(observables[1]?.id).toBe('obs-2');
    });

    it('VALID: {update observable description} => merges nested item', () => {
      const obs = FlowObservableStub({ id: 'obs-1', description: 'Old' });
      const node = FlowNodeStub({ id: 'n1', observables: [obs] });
      const existing = [FlowStub({ id: 'flow-a', nodes: [node] })];

      const updatedObs = FlowObservableStub({ id: 'obs-1', description: 'Updated' });
      const updateNode = FlowNodeStub({ id: 'n1', observables: [updatedObs] });
      const updates = [FlowStub({ id: 'flow-a', nodes: [updateNode] })];

      const result = questArrayUpsertTransformer({ existing, updates });

      const { nodes } = result[0]!;
      const { observables } = nodes[0]!;

      expect(observables).toHaveLength(1);
      expect(observables[0]?.description).toBe('Updated');
    });

    it('VALID: {nested delete observable} => removes from nested array', () => {
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

      expect(observables).toHaveLength(1);
      expect(observables[0]?.id).toBe('obs-1');
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

      expect(edges).toHaveLength(2);
      expect(edges[0]?.id).toBe('e1');
      expect(edges[1]?.id).toBe('e2');
    });

    it('VALID: {update edge label} => merges edge fields', () => {
      const existingEdge = FlowEdgeStub({ id: 'e1', from: 'n1', to: 'n2', label: 'Old' });
      const updatedEdge = FlowEdgeStub({ id: 'e1', from: 'n1', to: 'n2', label: 'New' });
      const existing = [FlowStub({ id: 'flow-a', edges: [existingEdge] })];
      const updates = [FlowStub({ id: 'flow-a', edges: [updatedEdge] })];

      const result = questArrayUpsertTransformer({ existing, updates });

      const { edges } = result[0]!;

      expect(edges).toHaveLength(1);
      expect(edges[0]?.label).toBe('New');
    });
  });

  describe('mixed operations', () => {
    it('VALID: {one updated, one deleted, one added} => applies all operations', () => {
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

      expect(result).toHaveLength(3);
      expect(result[0]?.name).toBe('Flow A Updated');
      expect(result[1]?.name).toBe('Flow C');
      expect(result[2]?.name).toBe('Flow D');
    });

    it('VALID: {existing: [a, b], updates: [a updated, c new]} => updates a, keeps b, adds c', () => {
      const flowA = FlowStub({
        id: 'flow-a',
        name: 'Item A',
        entryPoint: '/a',
        exitPoints: ['/done'],
      });
      const flowB = FlowStub({
        id: 'flow-b',
        name: 'Item B',
        entryPoint: '/b',
        exitPoints: ['/done'],
      });
      const flowAUpdated = FlowStub({
        id: 'flow-a',
        name: 'Item A Updated',
        entryPoint: '/a-updated',
        exitPoints: ['/done'],
      });
      const flowC = FlowStub({
        id: 'flow-c',
        name: 'Item C',
        entryPoint: '/c',
        exitPoints: ['/done'],
      });
      const existing = [flowA, flowB];
      const updates = [flowAUpdated, flowC];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(3);
      expect(result[0]?.name).toBe('Item A Updated');
      expect(result[1]?.name).toBe('Item B');
      expect(result[2]?.name).toBe('Item C');
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

      expect(nodes).toHaveLength(2);
      expect(edges).toHaveLength(1);
      expect(edges[0]?.id).toBe('e1');
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

      expect(nodes).toHaveLength(1);
      expect(nodes[0]?.id).toBe('n1');
      expect(edges).toHaveLength(2);
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
      expect(nodes[0]?.observables).toHaveLength(1);
      expect(nodes[0]?.observables[0]?.id).toBe('obs-1');
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

      expect(observables).toHaveLength(1);
      expect(observables[0]?.id).toBe('obs-1');
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

      expect(edges).toHaveLength(1);
      expect(edges[0]?.id).toBe('e1');
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {existing: [], updates: []} => returns empty array', () => {
      const existing: Flow[] = [];
      const updates: Flow[] = [];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {existing: [items], updates: []} => returns existing unchanged', () => {
      const existingFlow = FlowStub({
        id: 'auth-flow',
        name: 'Existing',
        entryPoint: '/existing',
        exitPoints: ['/done'],
      });
      const existing = [existingFlow];
      const updates: Flow[] = [];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Existing');
    });
  });
});
