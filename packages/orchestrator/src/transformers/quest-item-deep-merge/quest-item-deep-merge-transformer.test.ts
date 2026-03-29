import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
} from '@dungeonmaster/shared/contracts';

import { questItemDeepMergeTransformer } from './quest-item-deep-merge-transformer';

type Flow = ReturnType<typeof FlowStub>;

describe('questItemDeepMergeTransformer', () => {
  describe('scalar merge', () => {
    it('VALID: {update overwrites scalar} => returns merged item with updated name', () => {
      const existing = FlowStub({ id: 'flow-a', name: 'Old Name', entryPoint: '/old' });
      const update = FlowStub({ id: 'flow-a', name: 'New Name', entryPoint: '/old' });

      const result = questItemDeepMergeTransformer({ existing, update });

      const { id, name } = result;

      expect(id).toBe('flow-a');
      expect(name).toBe('New Name');
    });
  });

  describe('array of id-bearing items (deep recurse)', () => {
    it('VALID: {update adds nested node} => appends to nodes array', () => {
      const existingNode = FlowNodeStub({ id: 'n1', label: 'Node 1' });
      const newNode = FlowNodeStub({ id: 'n2', label: 'Node 2' });
      const existing = FlowStub({ id: 'flow-a', nodes: [existingNode] });
      const update = FlowStub({ id: 'flow-a', nodes: [newNode] });

      const result = questItemDeepMergeTransformer({ existing, update });

      const { nodes } = result as Flow;

      expect(nodes).toStrictEqual([existingNode, newNode]);
    });

    it('VALID: {update modifies nested node by id} => merges nested node', () => {
      const existingNode = FlowNodeStub({ id: 'n1', label: 'Old Label' });
      const updatedNode = FlowNodeStub({ id: 'n1', label: 'New Label' });
      const existing = FlowStub({ id: 'flow-a', nodes: [existingNode] });
      const update = FlowStub({ id: 'flow-a', nodes: [updatedNode] });

      const result = questItemDeepMergeTransformer({ existing, update });

      const { nodes } = result as Flow;

      expect(nodes).toStrictEqual([updatedNode]);
    });

    it('VALID: {update adds observable to existing node} => deep recurse into node observables', () => {
      const existingObs = FlowObservableStub({ id: 'obs-1', description: 'First' });
      const newObs = FlowObservableStub({ id: 'obs-2', description: 'Second' });
      const existingNode = FlowNodeStub({ id: 'n1', observables: [existingObs] });
      const updateNode = FlowNodeStub({ id: 'n1', observables: [newObs] });
      const existing = FlowStub({ id: 'flow-a', nodes: [existingNode] });
      const update = FlowStub({ id: 'flow-a', nodes: [updateNode] });

      const result = questItemDeepMergeTransformer({ existing, update });

      const { nodes } = result as Flow;
      const { observables } = nodes[0]!;

      expect(observables).toStrictEqual([existingObs, newObs]);
    });
  });

  describe('array of primitives (replace)', () => {
    it('VALID: {update replaces exitPoints} => replaces entirely', () => {
      const existing = FlowStub({ id: 'flow-a', exitPoints: ['/old-exit'] });
      const update = FlowStub({ id: 'flow-a', exitPoints: ['/new-exit-1', '/new-exit-2'] });

      const result = questItemDeepMergeTransformer({ existing, update });

      const { exitPoints } = result as Flow;

      expect(exitPoints).toStrictEqual(['/new-exit-1', '/new-exit-2']);
    });
  });

  describe('nested delete', () => {
    it('VALID: {nested node with _delete: true} => removes from nodes array', () => {
      const nodeKeep = FlowNodeStub({ id: 'n1', label: 'Keep' });
      const nodeDelete = FlowNodeStub({ id: 'n2', label: 'Delete' });
      const existing = FlowStub({ id: 'flow-a', nodes: [nodeKeep, nodeDelete] });
      const update = FlowStub({ id: 'flow-a', nodes: [FlowNodeStub({ id: 'n2' })] });
      Object.assign(update.nodes[0] as Record<PropertyKey, unknown>, { _delete: true });

      const result = questItemDeepMergeTransformer({ existing, update });

      const { nodes } = result as Flow;

      expect(nodes).toStrictEqual([nodeKeep]);
    });
  });

  describe('omitted sibling arrays preserved', () => {
    it('VALID: {update has nodes but no edges key} => preserves existing edges', () => {
      const existingNode = FlowNodeStub({ id: 'n1', label: 'Node 1' });
      const existingEdge = FlowEdgeStub({ id: 'e1', from: 'n1', to: 'n2' });
      const newNode = FlowNodeStub({ id: 'n2', label: 'Node 2' });
      const existing = FlowStub({ id: 'flow-a', nodes: [existingNode], edges: [existingEdge] });
      const update = FlowStub({ id: 'flow-a', nodes: [newNode] });
      Reflect.deleteProperty(update, 'edges');

      const result = questItemDeepMergeTransformer({ existing, update });

      const { nodes, edges } = result as Flow;

      expect(nodes).toStrictEqual([existingNode, newNode]);
      expect(edges).toStrictEqual([existingEdge]);
    });

    it('VALID: {update has edges but no nodes key} => preserves existing nodes', () => {
      const existingNode = FlowNodeStub({ id: 'n1', label: 'Node 1' });
      const existingEdge = FlowEdgeStub({ id: 'e1', from: 'n1', to: 'n2' });
      const newEdge = FlowEdgeStub({ id: 'e2', from: 'n2', to: 'n3' });
      const existing = FlowStub({ id: 'flow-a', nodes: [existingNode], edges: [existingEdge] });
      const update = FlowStub({ id: 'flow-a', edges: [newEdge] });
      Reflect.deleteProperty(update, 'nodes');

      const result = questItemDeepMergeTransformer({ existing, update });

      const { nodes, edges } = result as Flow;

      expect(nodes).toStrictEqual([existingNode]);
      expect(edges).toStrictEqual([existingEdge, newEdge]);
    });

    it('VALID: {update node without observables key} => preserves existing observables', () => {
      const existingObs = FlowObservableStub({ id: 'obs-1', description: 'Existing' });
      const existingNode = FlowNodeStub({
        id: 'n1',
        label: 'Old Label',
        observables: [existingObs],
      });
      const existing = FlowStub({ id: 'flow-a', nodes: [existingNode] });
      const update = FlowStub({
        id: 'flow-a',
        nodes: [FlowNodeStub({ id: 'n1', label: 'New Label' })],
      });
      Reflect.deleteProperty(update, 'edges');
      Reflect.deleteProperty(update.nodes[0] as Record<PropertyKey, unknown>, 'observables');

      const result = questItemDeepMergeTransformer({ existing, update });

      const { nodes } = result as Flow;

      expect(nodes[0]?.label).toBe('New Label');
      expect(nodes[0]?.observables).toStrictEqual([existingObs]);
    });
  });

  describe('empty array preserves existing', () => {
    it('VALID: {update has empty nodes array} => existing nodes preserved', () => {
      const existingNode = FlowNodeStub({ id: 'n1', label: 'Node 1' });
      const existing = FlowStub({ id: 'flow-a', nodes: [existingNode] });
      const update = FlowStub({ id: 'flow-a', nodes: [] });

      const result = questItemDeepMergeTransformer({ existing, update });

      const { nodes } = result as Flow;

      expect(nodes).toStrictEqual([existingNode]);
    });
  });

  describe('partial scalar update preserves other fields', () => {
    it('VALID: {update has only id and name} => all other existing fields preserved', () => {
      const existingNode = FlowNodeStub({ id: 'n1', label: 'Node 1' });
      const existingEdge = FlowEdgeStub({ id: 'e1', from: 'n1', to: 'n2' });
      const existing = FlowStub({
        id: 'flow-a',
        name: 'Old Name',
        entryPoint: '/old',
        exitPoints: ['/exit'],
        nodes: [existingNode],
        edges: [existingEdge],
      });
      const update = FlowStub({ id: 'flow-a', name: 'New Name' });
      Reflect.deleteProperty(update, 'entryPoint');
      Reflect.deleteProperty(update, 'exitPoints');
      Reflect.deleteProperty(update, 'nodes');
      Reflect.deleteProperty(update, 'edges');

      const result = questItemDeepMergeTransformer({ existing, update });

      expect(result).toStrictEqual({
        id: 'flow-a',
        name: 'New Name',
        entryPoint: '/old',
        exitPoints: ['/exit'],
        nodes: [existingNode],
        edges: [existingEdge],
      });
    });
  });

  describe('edge upsert', () => {
    it('VALID: {update adds edge} => appends to edges array', () => {
      const existingEdge = FlowEdgeStub({ id: 'e1', from: 'n1', to: 'n2' });
      const newEdge = FlowEdgeStub({ id: 'e2', from: 'n2', to: 'n3' });
      const existing = FlowStub({ id: 'flow-a', edges: [existingEdge] });
      const update = FlowStub({ id: 'flow-a', edges: [newEdge] });

      const result = questItemDeepMergeTransformer({ existing, update });

      const { edges } = result as Flow;

      expect(edges).toStrictEqual([existingEdge, newEdge]);
    });

    it('VALID: {update modifies edge label} => merges edge', () => {
      const existingEdge = FlowEdgeStub({ id: 'e1', from: 'n1', to: 'n2', label: 'Old' });
      const updatedEdge = FlowEdgeStub({ id: 'e1', from: 'n1', to: 'n2', label: 'New' });
      const existing = FlowStub({ id: 'flow-a', edges: [existingEdge] });
      const update = FlowStub({ id: 'flow-a', edges: [updatedEdge] });

      const result = questItemDeepMergeTransformer({ existing, update });

      const { edges } = result as Flow;

      expect(edges).toStrictEqual([updatedEdge]);
    });
  });
});
