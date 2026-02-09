import { DagEdgeStub } from '../../contracts/dag-edge/dag-edge.stub';

import { dagReadyNodesProcessTransformer } from './dag-ready-nodes-process-transformer';

type DagNodeId = ReturnType<typeof DagEdgeStub>['id'];

describe('dagReadyNodesProcessTransformer', () => {
  describe('valid processing', () => {
    it('VALID: {empty ready list} => returns processed as-is', () => {
      const result = dagReadyNodesProcessTransformer({
        ready: [],
        depsRemaining: new Map<DagNodeId, DagNodeId[]>(),
        dependents: new Map<DagNodeId, DagNodeId[]>(),
        processed: [],
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {single ready node, no dependents} => returns that node', () => {
      const edge = DagEdgeStub({ id: 'node-a', dependsOn: [] });
      const depsRemaining = new Map<DagNodeId, DagNodeId[]>([[edge.id, []]]);
      const dependents = new Map<DagNodeId, DagNodeId[]>([[edge.id, []]]);

      const result = dagReadyNodesProcessTransformer({
        ready: [edge.id],
        depsRemaining,
        dependents,
        processed: [],
      });

      expect(result).toStrictEqual(['node-a']);
    });

    it('VALID: {ready node unlocks dependent} => returns both nodes', () => {
      const edgeA = DagEdgeStub({ id: 'node-a', dependsOn: [] });
      const edgeB = DagEdgeStub({ id: 'node-b', dependsOn: [edgeA.id] });
      const depsRemaining = new Map<DagNodeId, DagNodeId[]>([
        [edgeA.id, []],
        [edgeB.id, [edgeA.id]],
      ]);
      const dependents = new Map<DagNodeId, DagNodeId[]>([
        [edgeA.id, [edgeB.id]],
        [edgeB.id, []],
      ]);

      const result = dagReadyNodesProcessTransformer({
        ready: [edgeA.id],
        depsRemaining,
        dependents,
        processed: [],
      });

      expect(result).toStrictEqual(['node-a', 'node-b']);
    });
  });

  describe('with existing processed', () => {
    it('VALID: {processed already has items} => appends new items', () => {
      const edgeB = DagEdgeStub({ id: 'node-b', dependsOn: [] });
      const edgeA = DagEdgeStub({ id: 'node-a', dependsOn: [] });
      const depsRemaining = new Map<DagNodeId, DagNodeId[]>([[edgeB.id, []]]);
      const dependents = new Map<DagNodeId, DagNodeId[]>([[edgeB.id, []]]);

      const result = dagReadyNodesProcessTransformer({
        ready: [edgeB.id],
        depsRemaining,
        dependents,
        processed: [edgeA.id],
      });

      expect(result).toStrictEqual(['node-a', 'node-b']);
    });
  });
});
