import {
  AgentIdStub,
  DependencyStepStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  StepAssertionStub,
  WorkItemForUpsertStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { IsoTimestampStub } from '../../contracts/iso-timestamp/iso-timestamp.stub';
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
        flowType: 'runtime',
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

  describe('assertion merge by id (regression: preserve per-assertion fields)', () => {
    it('VALID: {update patches one assertion by id, omitting observablesSatisfied} => preserves the untouched observablesSatisfied', () => {
      const keptAssertion = StepAssertionStub({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        prefix: 'VALID',
        input: '{x}',
        expected: 'old expected',
        observablesSatisfied: ['obs-delete'],
      });
      const siblingAssertion = StepAssertionStub({
        id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
        prefix: 'ERROR',
        input: '{y}',
        expected: 'throws',
      });
      const existing = DependencyStepStub({
        id: 'web-quest-delete-broker' as never,
        assertions: [keptAssertion, siblingAssertion],
      });

      const update = DependencyStepStub({
        id: 'web-quest-delete-broker' as never,
        assertions: [
          StepAssertionStub({
            id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
            prefix: 'VALID',
            input: '{x}',
            expected: 'new expected',
          }),
        ],
      });
      // Partial assertion patch: strip everything but id + expected AFTER the stub parses, so only
      // those two fields travel into the merge. The rest must be preserved from the existing entry.
      Reflect.deleteProperty(update.assertions[0] as Record<PropertyKey, unknown>, 'prefix');
      Reflect.deleteProperty(update.assertions[0] as Record<PropertyKey, unknown>, 'input');

      const result = questItemDeepMergeTransformer({ existing, update });

      const { assertions } = result as ReturnType<typeof DependencyStepStub>;

      expect(assertions).toStrictEqual([
        {
          id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          prefix: 'VALID',
          input: '{x}',
          expected: 'new expected',
          observablesSatisfied: ['obs-delete'],
        },
        {
          id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
          prefix: 'ERROR',
          input: '{y}',
          expected: 'throws',
        },
      ]);
    });
  });

  describe('null-as-clear (scalar field removal)', () => {
    it('VALID: {update sets sessionId to null} => removes sessionId from merged work item', () => {
      const id = QuestWorkItemIdStub({ value: '11111111-1111-1111-1111-111111111111' });
      const existing = WorkItemStub({
        id,
        status: 'in_progress',
        sessionId: SessionIdStub({ value: 'sess-1' }),
      });
      const update = WorkItemForUpsertStub({
        id,
        sessionId: null,
        status: 'pending',
      });

      const result = questItemDeepMergeTransformer({ existing, update });

      const { sessionId: _droppedSessionId, ...withoutSessionId } = existing;

      expect(result).toStrictEqual({ ...withoutSessionId, status: 'pending' });
    });

    it('VALID: {update clears sessionId, agentId, and startedAt} => removes all three fields', () => {
      const id = QuestWorkItemIdStub({ value: '22222222-2222-2222-2222-222222222222' });
      const existing = WorkItemStub({
        id,
        status: 'in_progress',
        sessionId: SessionIdStub({ value: 'sess-2' }),
        agentId: AgentIdStub({ value: 'agent-2' }),
        startedAt: IsoTimestampStub({ value: '2026-01-01T00:00:00.000Z' }),
      });
      const update = WorkItemForUpsertStub({
        id,
        sessionId: null,
        agentId: null,
        startedAt: null,
        status: 'pending',
      });

      const result = questItemDeepMergeTransformer({ existing, update });

      const {
        sessionId: _droppedSessionId,
        agentId: _droppedAgentId,
        startedAt: _droppedStartedAt,
        ...withoutClearedFields
      } = existing;

      expect(result).toStrictEqual({ ...withoutClearedFields, status: 'pending' });
    });
  });
});
