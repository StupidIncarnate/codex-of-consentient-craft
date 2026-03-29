import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  FlowEdgeStub,
} from '@dungeonmaster/shared/contracts';

import { questHasUniqueSiblingIdsGuard } from './quest-has-unique-sibling-ids-guard';

describe('questHasUniqueSiblingIdsGuard', () => {
  describe('unique IDs', () => {
    it('VALID: {flows with unique ids} => returns true', () => {
      const result = questHasUniqueSiblingIdsGuard({
        updates: {
          flows: [FlowStub({ id: 'flow-a' }), FlowStub({ id: 'flow-b' })],
        },
      });

      expect(result).toBe(true);
    });

    it('VALID: {nodes with unique ids in flow} => returns true', () => {
      const node1 = FlowNodeStub({ id: 'n1', label: 'Node 1' });
      const node2 = FlowNodeStub({ id: 'n2', label: 'Node 2' });
      const result = questHasUniqueSiblingIdsGuard({
        updates: {
          flows: [FlowStub({ id: 'flow-a', nodes: [node1, node2] })],
        },
      });

      expect(result).toBe(true);
    });
  });

  describe('duplicate IDs', () => {
    it('INVALID: {duplicate flow ids} => returns false', () => {
      const result = questHasUniqueSiblingIdsGuard({
        updates: {
          flows: [FlowStub({ id: 'flow-a' }), FlowStub({ id: 'flow-a' })],
        },
      });

      expect(result).toBe(false);
    });

    it('INVALID: {duplicate node ids within flow} => returns false', () => {
      const node1 = FlowNodeStub({ id: 'n1', label: 'First' });
      const node2 = FlowNodeStub({ id: 'n1', label: 'Second' });
      const result = questHasUniqueSiblingIdsGuard({
        updates: {
          flows: [FlowStub({ id: 'flow-a', nodes: [node1, node2] })],
        },
      });

      expect(result).toBe(false);
    });

    it('INVALID: {duplicate observable ids within node} => returns false', () => {
      const obs1 = FlowObservableStub({ id: 'obs-dup', description: 'First' });
      const obs2 = FlowObservableStub({ id: 'obs-dup', description: 'Second' });
      const node = FlowNodeStub({ id: 'n1', observables: [obs1, obs2] });
      const result = questHasUniqueSiblingIdsGuard({
        updates: {
          flows: [FlowStub({ id: 'flow-a', nodes: [node] })],
        },
      });

      expect(result).toBe(false);
    });

    it('INVALID: {duplicate edge ids within flow} => returns false', () => {
      const edge1 = FlowEdgeStub({ id: 'e1', from: 'n1', to: 'n2' });
      const edge2 = FlowEdgeStub({ id: 'e1', from: 'n2', to: 'n3' });
      const result = questHasUniqueSiblingIdsGuard({
        updates: {
          flows: [FlowStub({ id: 'flow-a', edges: [edge1, edge2] })],
        },
      });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {updates: undefined} => returns true', () => {
      const result = questHasUniqueSiblingIdsGuard({});

      expect(result).toBe(true);
    });

    it('EMPTY: {updates: {}} => returns true', () => {
      const result = questHasUniqueSiblingIdsGuard({ updates: {} });

      expect(result).toBe(true);
    });

    it('VALID: {updates with non-array fields} => returns true', () => {
      const result = questHasUniqueSiblingIdsGuard({
        updates: { questId: 'test', status: 'created' },
      });

      expect(result).toBe(true);
    });
  });
});
