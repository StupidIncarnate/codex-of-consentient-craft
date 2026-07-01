import { AgentIdStub } from '../../contracts/agent-id/agent-id.stub';

import { subagentDescendantAgentIdsTransformer } from './subagent-descendant-agent-ids-transformer';

describe('subagentDescendantAgentIdsTransformer', () => {
  describe('descendant closure', () => {
    it('EMPTY: {root with no edges} => returns only the root', () => {
      const root = AgentIdStub({ value: 'root-real' });
      const childEdges = new Map<
        ReturnType<typeof AgentIdStub>,
        ReturnType<typeof AgentIdStub>[]
      >();

      const result = subagentDescendantAgentIdsTransformer({ childEdges, rootAgentId: root });

      expect([...result]).toStrictEqual([root]);
    });

    it('VALID: {root spawns one child} => returns root and child', () => {
      const root = AgentIdStub({ value: 'root-real' });
      const child = AgentIdStub({ value: 'child-real' });
      const childEdges = new Map([[root, [child]]]);

      const result = subagentDescendantAgentIdsTransformer({ childEdges, rootAgentId: root });

      expect([...result]).toStrictEqual([root, child]);
    });

    it('VALID: {root -> child -> grandchild chain} => returns all three transitively', () => {
      const root = AgentIdStub({ value: 'root-real' });
      const child = AgentIdStub({ value: 'child-real' });
      const grandchild = AgentIdStub({ value: 'grandchild-real' });
      const childEdges = new Map([
        [root, [child]],
        [child, [grandchild]],
      ]);

      const result = subagentDescendantAgentIdsTransformer({ childEdges, rootAgentId: root });

      expect([...result]).toStrictEqual([root, child, grandchild]);
    });

    it('VALID: {root with two children} => returns root and both children', () => {
      const root = AgentIdStub({ value: 'root-real' });
      const childA = AgentIdStub({ value: 'child-a-real' });
      const childB = AgentIdStub({ value: 'child-b-real' });
      const childEdges = new Map([[root, [childA, childB]]]);

      const result = subagentDescendantAgentIdsTransformer({ childEdges, rootAgentId: root });

      expect([...result]).toStrictEqual([root, childA, childB]);
    });

    it('EDGE: {cycle root -> child -> root} => terminates and returns root and child once each', () => {
      const root = AgentIdStub({ value: 'root-real' });
      const child = AgentIdStub({ value: 'child-real' });
      const childEdges = new Map([
        [root, [child]],
        [child, [root]],
      ]);

      const result = subagentDescendantAgentIdsTransformer({ childEdges, rootAgentId: root });

      expect([...result]).toStrictEqual([root, child]);
    });

    it('VALID: {sibling subtree not reachable from root} => excludes the unrelated sibling', () => {
      const root = AgentIdStub({ value: 'root-real' });
      const child = AgentIdStub({ value: 'child-real' });
      const sibling = AgentIdStub({ value: 'sibling-real' });
      const siblingChild = AgentIdStub({ value: 'sibling-child-real' });
      const childEdges = new Map([
        [root, [child]],
        [sibling, [siblingChild]],
      ]);

      const result = subagentDescendantAgentIdsTransformer({ childEdges, rootAgentId: root });

      expect([...result]).toStrictEqual([root, child]);
    });
  });
});
