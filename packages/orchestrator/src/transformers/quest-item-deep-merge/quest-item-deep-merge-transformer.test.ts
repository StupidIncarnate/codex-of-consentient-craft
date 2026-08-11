import {
  AgentIdStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  ItemWithIdStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  SignoffStub,
  WorkItemForUpsertStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { qaOffMapProbeStatics } from '@dungeonmaster/shared/statics';

import { IsoTimestampStub } from '../../contracts/iso-timestamp/iso-timestamp.stub';
import { questItemDeepMergeTransformer } from './quest-item-deep-merge-transformer';

type Flow = ReturnType<typeof FlowStub>;

// The off-map probe families a flow carries one sign-off entry per. Derived from the probe statics,
// whose colocated test pins its keys 1:1 with qaOffMapFamilyContract's options — a test file cannot
// read the contract's options, so this is the honest source for the full family set.
const OFF_MAP_FAMILIES = Object.keys(qaOffMapProbeStatics.byFamily);

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
        offMapSignoffs: [],
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

  describe('observable merge by id (regression: preserve per-observable fields)', () => {
    it('VALID: {update patches one observable by id, omitting designRef} => preserves the untouched fields', () => {
      const keptObservable = FlowObservableStub({
        id: 'obs-1',
        description: 'old description',
        designRef: 'design/dashboard.png',
      });
      const siblingObservable = FlowObservableStub({
        id: 'obs-2',
        description: 'sibling description',
      });
      const existingNode = FlowNodeStub({
        id: 'n1',
        observables: [keptObservable, siblingObservable],
      });
      const existing = FlowStub({ id: 'flow-a', nodes: [existingNode] });

      const updateNode = FlowNodeStub({
        id: 'n1',
        observables: [
          FlowObservableStub({
            id: 'obs-1',
            description: 'new description',
          }),
        ],
      });
      const update = FlowStub({ id: 'flow-a', nodes: [updateNode] });
      Reflect.deleteProperty(update, 'edges');

      const result = questItemDeepMergeTransformer({ existing, update });

      const { nodes } = result as Flow;
      const { observables } = nodes[0]!;

      expect(observables).toStrictEqual([
        {
          id: 'obs-1',
          type: 'ui-state',
          package: 'auth-service',
          description: 'new description',
          designRef: 'design/dashboard.png',
          addedBy: 'spec',
        },
        siblingObservable,
      ]);
    });
  });

  describe('null-as-clear (key removal)', () => {
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

    it('VALID: {update sets an existing key to null} => the key is removed from the result', () => {
      const existing = ItemWithIdStub({
        id: 'o1',
        description: 'redirects to dashboard',
        siegemasterSignoff: { verdict: 'pass', at: '2026-01-01T00:00:00.000Z' },
      });
      const update = ItemWithIdStub({ id: 'o1', siegemasterSignoff: null });

      const result = questItemDeepMergeTransformer({ existing, update });

      expect(result).toStrictEqual({ id: 'o1', description: 'redirects to dashboard' });
    });

    it('VALID: {update sets a key to null that the existing item does not have} => result is unchanged and has no such key', () => {
      const existing = ItemWithIdStub({ id: 'o1', description: 'redirects to dashboard' });
      const update = ItemWithIdStub({ id: 'o1', siegemasterSignoff: null });

      const result = questItemDeepMergeTransformer({ existing, update });

      expect(result).toStrictEqual({ id: 'o1', description: 'redirects to dashboard' });
    });

    it('VALID: {update carries null for one key and a real value for another} => one key removed, the other written', () => {
      const existing = ItemWithIdStub({
        id: 'o1',
        description: 'old description',
        siegemasterSignoff: { verdict: 'pass', at: '2026-01-01T00:00:00.000Z' },
      });
      const update = ItemWithIdStub({
        id: 'o1',
        description: 'new description',
        siegemasterSignoff: null,
      });

      const result = questItemDeepMergeTransformer({ existing, update });

      expect(result).toStrictEqual({ id: 'o1', description: 'new description' });
    });

    it('EDGE: {update sets an id-bearing ARRAY field to null} => the array key is removed', () => {
      const existing = ItemWithIdStub({
        id: 'f1',
        name: 'Login Flow',
        nodes: [{ id: 'n1', label: 'Node 1' }],
      });
      const update = ItemWithIdStub({ id: 'f1', nodes: null });

      const result = questItemDeepMergeTransformer({ existing, update });

      expect(result).toStrictEqual({ id: 'f1', name: 'Login Flow' });
    });

    it('EDGE: {null does not disturb sibling keys on the same object}', () => {
      const existing = ItemWithIdStub({
        id: 'o1',
        description: 'redirects to dashboard',
        designRef: 'design/dashboard.png',
        siegemasterSignoff: { verdict: 'pass', at: '2026-01-01T00:00:00.000Z' },
      });
      const update = ItemWithIdStub({ id: 'o1', siegemasterSignoff: null });

      const result = questItemDeepMergeTransformer({ existing, update });

      expect(result).toStrictEqual({
        id: 'o1',
        description: 'redirects to dashboard',
        designRef: 'design/dashboard.png',
      });
    });

    it('VALID: {nested observable sets siegemasterSignoff to null} => clears that signoff through the array recursion and keeps flowriderSignoff', () => {
      const existing = ItemWithIdStub({
        id: 'f1',
        nodes: [
          {
            id: 'n1',
            observables: [
              {
                id: 'o1',
                description: 'redirects to dashboard',
                siegemasterSignoff: { verdict: 'pass', at: '2026-01-01T00:00:00.000Z' },
                flowriderSignoff: { verdict: 'pass', at: '2026-01-02T00:00:00.000Z' },
              },
            ],
          },
        ],
      });
      const update = ItemWithIdStub({
        id: 'f1',
        nodes: [{ id: 'n1', observables: [{ id: 'o1', siegemasterSignoff: null }] }],
      });

      const result = questItemDeepMergeTransformer({ existing, update });

      expect(result).toStrictEqual({
        id: 'f1',
        nodes: [
          {
            id: 'n1',
            observables: [
              {
                id: 'o1',
                description: 'redirects to dashboard',
                flowriderSignoff: { verdict: 'pass', at: '2026-01-02T00:00:00.000Z' },
              },
            ],
          },
        ],
      });
    });
  });

  describe('sign-off merge (two independent tracks over one element)', () => {
    it('VALID: {observable already carrying siegemasterSignoff, update sets only flowriderSignoff} => both sign-offs survive', () => {
      const siegemasterSignoff = SignoffStub({ evidence: 'walked it against the dev server' });
      const flowriderSignoff = SignoffStub({
        evidence: 'packages/web/src/a.test.ts:12 — red without the redirect',
      });
      const existingObservable = FlowObservableStub({ id: 'obs-1', siegemasterSignoff });
      const existingNode = FlowNodeStub({ id: 'n1', observables: [existingObservable] });
      const existing = FlowStub({ id: 'flow-a', nodes: [existingNode] });
      const update = ItemWithIdStub({
        id: 'flow-a',
        nodes: [{ id: 'n1', observables: [{ id: 'obs-1', flowriderSignoff }] }],
      });

      const result = questItemDeepMergeTransformer({ existing, update });

      const { nodes } = result as Flow;
      const { observables } = nodes[0]!;

      expect(observables).toStrictEqual([
        {
          id: 'obs-1',
          type: 'ui-state',
          package: 'auth-service',
          description: 'redirects to dashboard',
          addedBy: 'spec',
          siegemasterSignoff,
          flowriderSignoff,
        },
      ]);
    });

    it('VALID: {update sets ONE offMapSignoffs entry} => the other six families survive untouched', () => {
      const siegemasterSignoff = SignoffStub({ evidence: 'double-submitted, it serialised' });
      const flowriderSignoff = SignoffStub({
        evidence: 'packages/web/src/b.test.ts:9 — red without the lock',
      });
      const existing = FlowStub({
        id: 'flow-a',
        offMapSignoffs: OFF_MAP_FAMILIES.map((family) =>
          FlowOffMapSignoffStub({ id: family as never, siegemasterSignoff }),
        ),
      });
      const update = ItemWithIdStub({
        id: 'flow-a',
        offMapSignoffs: [{ id: 'concurrency', flowriderSignoff }],
      });

      const result = questItemDeepMergeTransformer({ existing, update });

      const { offMapSignoffs } = result as Flow;
      const expected = OFF_MAP_FAMILIES.map((family) =>
        FlowOffMapSignoffStub({ id: family as never, siegemasterSignoff }),
      );
      expected[OFF_MAP_FAMILIES.indexOf('concurrency')] = FlowOffMapSignoffStub({
        id: 'concurrency',
        siegemasterSignoff,
        flowriderSignoff,
      });

      expect(offMapSignoffs).toStrictEqual(expected);
    });

    it('VALID: {observable patch sets siegemasterSignoff to null} => that key is deleted and flowriderSignoff is intact', () => {
      const siegemasterSignoff = SignoffStub({ evidence: 'walked it against the dev server' });
      const flowriderSignoff = SignoffStub({
        evidence: 'packages/web/src/a.test.ts:12 — red without the redirect',
      });
      const existingObservable = FlowObservableStub({
        id: 'obs-1',
        siegemasterSignoff,
        flowriderSignoff,
      });
      const existingNode = FlowNodeStub({ id: 'n1', observables: [existingObservable] });
      const existing = FlowStub({ id: 'flow-a', nodes: [existingNode] });
      const update = ItemWithIdStub({
        id: 'flow-a',
        nodes: [{ id: 'n1', observables: [{ id: 'obs-1', siegemasterSignoff: null }] }],
      });

      const result = questItemDeepMergeTransformer({ existing, update });

      const { nodes } = result as Flow;
      const { observables } = nodes[0]!;

      expect(observables).toStrictEqual([
        {
          id: 'obs-1',
          type: 'ui-state',
          package: 'auth-service',
          description: 'redirects to dashboard',
          addedBy: 'spec',
          flowriderSignoff,
        },
      ]);
    });

    it('EMPTY: {observable carrying no sign-off keys, patched with a description} => neither sign-off key appears on the merged observable', () => {
      const existingObservable = FlowObservableStub({
        id: 'obs-1',
        description: 'old description',
      });
      const existingNode = FlowNodeStub({ id: 'n1', observables: [existingObservable] });
      const existing = FlowStub({ id: 'flow-a', nodes: [existingNode] });
      const update = ItemWithIdStub({
        id: 'flow-a',
        nodes: [{ id: 'n1', observables: [{ id: 'obs-1', description: 'new description' }] }],
      });

      const result = questItemDeepMergeTransformer({ existing, update });

      const { nodes } = result as Flow;
      const { observables } = nodes[0]!;

      expect(observables).toStrictEqual([
        {
          id: 'obs-1',
          type: 'ui-state',
          package: 'auth-service',
          description: 'new description',
          addedBy: 'spec',
        },
      ]);
    });

    // Batching is what the coverage minion is told to do: 50 sign-offs in ONE call, not 50 calls.
    // The risk this pins is the recursion depth — flows, then nodes, then observables are three
    // nested id-keyed upserts, and a merge that lands flow-one and silently drops flow-three is
    // indistinguishable from a partial write at the call site. The single toStrictEqual over the
    // whole merged item is what catches both halves: all 50 sign-offs present, and the edge, the
    // untouched sibling node, and the off-map siegemasterSignoff unchanged.
    it('VALID: {ONE merge upserting 50 flowrider sign-offs across 3 flows} => all 50 land and every untouched element on those flows is unchanged', () => {
      const flowriderSignoff = SignoffStub({
        evidence: 'packages/web/src/login.e2e.ts:31 — red without the redirect',
      });
      const siegemasterSignoff = SignoffStub({ evidence: 'walked it against the dev server' });

      const existing = ItemWithIdStub({
        id: 'add-auth',
        flows: [
          FlowStub({
            id: 'flow-one',
            edges: [FlowEdgeStub({ id: 'edge-one' })],
            nodes: [
              FlowNodeStub({
                id: 'node-one',
                observables: Array.from({ length: 20 }, (_unused, index) =>
                  FlowObservableStub({ id: `obs-one-${index}` as never }),
                ),
              }),
            ],
          }),
          FlowStub({
            id: 'flow-two',
            nodes: [
              FlowNodeStub({
                id: 'node-two',
                observables: Array.from({ length: 20 }, (_unused, index) =>
                  FlowObservableStub({ id: `obs-two-${index}` as never }),
                ),
              }),
              FlowNodeStub({
                id: 'node-two-untouched',
                observables: [FlowObservableStub({ id: 'obs-untouched' })],
              }),
            ],
          }),
          FlowStub({
            id: 'flow-three',
            offMapSignoffs: [FlowOffMapSignoffStub({ id: 'concurrency', siegemasterSignoff })],
            nodes: [
              FlowNodeStub({
                id: 'node-three',
                observables: Array.from({ length: 10 }, (_unused, index) =>
                  FlowObservableStub({ id: `obs-three-${index}` as never }),
                ),
              }),
            ],
          }),
        ],
      });
      const update = ItemWithIdStub({
        id: 'add-auth',
        flows: [
          {
            id: 'flow-one',
            nodes: [
              {
                id: 'node-one',
                observables: Array.from({ length: 20 }, (_unused, index) => ({
                  id: `obs-one-${index}`,
                  flowriderSignoff,
                })),
              },
            ],
          },
          {
            id: 'flow-two',
            nodes: [
              {
                id: 'node-two',
                observables: Array.from({ length: 20 }, (_unused, index) => ({
                  id: `obs-two-${index}`,
                  flowriderSignoff,
                })),
              },
            ],
          },
          {
            id: 'flow-three',
            nodes: [
              {
                id: 'node-three',
                observables: Array.from({ length: 10 }, (_unused, index) => ({
                  id: `obs-three-${index}`,
                  flowriderSignoff,
                })),
              },
            ],
          },
        ],
      });

      const result = questItemDeepMergeTransformer({ existing, update });

      expect(result).toStrictEqual({
        id: 'add-auth',
        flows: [
          FlowStub({
            id: 'flow-one',
            edges: [FlowEdgeStub({ id: 'edge-one' })],
            nodes: [
              FlowNodeStub({
                id: 'node-one',
                observables: Array.from({ length: 20 }, (_unused, index) =>
                  FlowObservableStub({ id: `obs-one-${index}` as never, flowriderSignoff }),
                ),
              }),
            ],
          }),
          FlowStub({
            id: 'flow-two',
            nodes: [
              FlowNodeStub({
                id: 'node-two',
                observables: Array.from({ length: 20 }, (_unused, index) =>
                  FlowObservableStub({ id: `obs-two-${index}` as never, flowriderSignoff }),
                ),
              }),
              FlowNodeStub({
                id: 'node-two-untouched',
                observables: [FlowObservableStub({ id: 'obs-untouched' })],
              }),
            ],
          }),
          FlowStub({
            id: 'flow-three',
            offMapSignoffs: [FlowOffMapSignoffStub({ id: 'concurrency', siegemasterSignoff })],
            nodes: [
              FlowNodeStub({
                id: 'node-three',
                observables: Array.from({ length: 10 }, (_unused, index) =>
                  FlowObservableStub({ id: `obs-three-${index}` as never, flowriderSignoff }),
                ),
              }),
            ],
          }),
        ],
      });
    });
  });
});
