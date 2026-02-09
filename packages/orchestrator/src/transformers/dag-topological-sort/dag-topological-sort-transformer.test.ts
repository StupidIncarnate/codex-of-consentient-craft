import { DagEdgeStub } from '../../contracts/dag-edge/dag-edge.stub';

import { dagTopologicalSortTransformer } from './dag-topological-sort-transformer';

describe('dagTopologicalSortTransformer', () => {
  describe('valid DAGs', () => {
    it('VALID: {empty edges} => returns empty array', () => {
      const result = dagTopologicalSortTransformer({ edges: [] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {single node, no deps} => returns single node', () => {
      const edge = DagEdgeStub({ id: 'node-a', dependsOn: [] });

      const result = dagTopologicalSortTransformer({ edges: [edge] });

      expect(result).toStrictEqual(['node-a']);
    });

    it('VALID: {linear chain A -> B -> C} => returns topological order', () => {
      const edgeA = DagEdgeStub({ id: 'node-a', dependsOn: [] });
      const edgeB = DagEdgeStub({ id: 'node-b', dependsOn: [edgeA.id] });
      const edgeC = DagEdgeStub({ id: 'node-c', dependsOn: [edgeB.id] });

      const result = dagTopologicalSortTransformer({ edges: [edgeA, edgeB, edgeC] });

      expect(result).toStrictEqual(['node-a', 'node-b', 'node-c']);
    });

    it('VALID: {diamond shape} => returns all nodes', () => {
      const edgeA = DagEdgeStub({ id: 'node-a', dependsOn: [] });
      const edgeB = DagEdgeStub({ id: 'node-b', dependsOn: [edgeA.id] });
      const edgeC = DagEdgeStub({ id: 'node-c', dependsOn: [edgeA.id] });
      const edgeD = DagEdgeStub({ id: 'node-d', dependsOn: [edgeB.id, edgeC.id] });

      const result = dagTopologicalSortTransformer({ edges: [edgeA, edgeB, edgeC, edgeD] });

      expect(result).toStrictEqual(['node-a', 'node-b', 'node-c', 'node-d']);
    });

    it('VALID: {two independent nodes} => returns both', () => {
      const edgeA = DagEdgeStub({ id: 'node-a', dependsOn: [] });
      const edgeB = DagEdgeStub({ id: 'node-b', dependsOn: [] });

      const result = dagTopologicalSortTransformer({ edges: [edgeA, edgeB] });

      expect(result).toStrictEqual(['node-a', 'node-b']);
    });
  });

  describe('cyclic graphs', () => {
    it('INVALID_CYCLE: {A <-> B mutual dependency} => returns partial (not all nodes)', () => {
      const edgeA = DagEdgeStub({ id: 'node-a', dependsOn: ['node-b'] });
      const edgeB = DagEdgeStub({ id: 'node-b', dependsOn: ['node-a'] });

      const result = dagTopologicalSortTransformer({ edges: [edgeA, edgeB] });

      expect(result).toStrictEqual([]);
    });

    it('INVALID_CYCLE: {self-dependency} => returns empty', () => {
      const edgeA = DagEdgeStub({ id: 'node-a', dependsOn: ['node-a'] });

      const result = dagTopologicalSortTransformer({ edges: [edgeA] });

      expect(result).toStrictEqual([]);
    });

    it('INVALID_CYCLE: {A -> B -> C -> A} => returns empty', () => {
      const edgeA = DagEdgeStub({ id: 'node-a', dependsOn: ['node-c'] });
      const edgeB = DagEdgeStub({ id: 'node-b', dependsOn: ['node-a'] });
      const edgeC = DagEdgeStub({ id: 'node-c', dependsOn: ['node-b'] });

      const result = dagTopologicalSortTransformer({ edges: [edgeA, edgeB, edgeC] });

      expect(result).toStrictEqual([]);
    });
  });
});
