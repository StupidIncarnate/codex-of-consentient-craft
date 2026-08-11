import { FlowEdgeStub, FlowNodeStub, FlowStub } from '@dungeonmaster/shared/contracts';

import { questUngluedSeamEdgesTransformer } from './quest-unglued-seam-edges-transformer';

describe('questUngluedSeamEdgesTransformer', () => {
  describe('endpoints that share a package', () => {
    it('EMPTY: {flows: []} => returns empty array', () => {
      const offenders = questUngluedSeamEdgesTransformer({ flows: [] });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {both endpoints tag web} => returns empty array', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({ id: 'press-warp', packages: ['web'] }),
          FlowNodeStub({ id: 'warp-spinner', packages: ['web'] }),
        ],
        edges: [FlowEdgeStub({ id: 'press-to-spinner', from: 'press-warp', to: 'warp-spinner' })],
      });

      const offenders = questUngluedSeamEdgesTransformer({ flows: [flow] });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {glue node widened to carry both sides} => the seam is spanned, returns empty array', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({ id: 'press-warp', packages: ['web', 'server'] }),
          FlowNodeStub({ id: 'merge-status-ok', packages: ['server'] }),
        ],
        edges: [FlowEdgeStub({ id: 'press-to-status', from: 'press-warp', to: 'merge-status-ok' })],
      });

      const offenders = questUngluedSeamEdgesTransformer({ flows: [flow] });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {cross-flow ref whose target shares a package} => resolves through flowId:nodeId and passes', () => {
      const uiFlow = FlowStub({
        id: 'warpgate-merge',
        nodes: [FlowNodeStub({ id: 'press-warp', packages: ['web', 'server'] })],
        edges: [
          FlowEdgeStub({
            id: 'press-to-other-flow',
            from: 'press-warp',
            to: 'followup-chat:merge-status-ok',
          }),
        ],
      });
      const apiFlow = FlowStub({
        id: 'followup-chat',
        nodes: [FlowNodeStub({ id: 'merge-status-ok', packages: ['server'] })],
      });

      const offenders = questUngluedSeamEdgesTransformer({ flows: [uiFlow, apiFlow] });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('unglued seam', () => {
    it('INVALID: {press-warp tags web, merge-status-ok tags server} => names both endpoints and their tags, and says to widen one', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({ id: 'press-warp', packages: ['web'] }),
          FlowNodeStub({ id: 'merge-status-ok', packages: ['server'] }),
        ],
        edges: [FlowEdgeStub({ id: 'press-to-status', from: 'press-warp', to: 'merge-status-ok' })],
      });

      const offenders = questUngluedSeamEdgesTransformer({ flows: [flow] });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Edge 'press-to-status' in flow 'warpgate-merge' joins node 'press-warp' (packages: web) to node 'merge-status-ok' (packages: server), which share no package. An edge whose endpoints share no package is a boundary crossed with nothing spanning it — widen one endpoint to carry both packages (that endpoint IS the glue node), or insert a node between them that does.",
      ]);
    });

    it('INVALID: {cross-flow edge whose endpoints share nothing} => reported the same as an in-flow one', () => {
      const uiFlow = FlowStub({
        id: 'warpgate-merge',
        nodes: [FlowNodeStub({ id: 'press-warp', packages: ['web'] })],
        edges: [
          FlowEdgeStub({
            id: 'press-to-other-flow',
            from: 'press-warp',
            to: 'followup-chat:merge-status-ok',
          }),
        ],
      });
      const apiFlow = FlowStub({
        id: 'followup-chat',
        nodes: [FlowNodeStub({ id: 'merge-status-ok', packages: ['server'] })],
      });

      const offenders = questUngluedSeamEdgesTransformer({ flows: [uiFlow, apiFlow] });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Edge 'press-to-other-flow' in flow 'warpgate-merge' joins node 'press-warp' (packages: web) to node 'merge-status-ok' (packages: server), which share no package. An edge whose endpoints share no package is a boundary crossed with nothing spanning it — widen one endpoint to carry both packages (that endpoint IS the glue node), or insert a node between them that does.",
      ]);
    });

    it('INVALID: {multi-package endpoints overlapping in nothing} => lists every tag on each side', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({ id: 'press-warp', packages: ['web', 'shared'] }),
          FlowNodeStub({ id: 'merge-status-ok', packages: ['server', 'mcp'] }),
        ],
        edges: [FlowEdgeStub({ id: 'press-to-status', from: 'press-warp', to: 'merge-status-ok' })],
      });

      const offenders = questUngluedSeamEdgesTransformer({ flows: [flow] });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Edge 'press-to-status' in flow 'warpgate-merge' joins node 'press-warp' (packages: web, shared) to node 'merge-status-ok' (packages: server, mcp), which share no package. An edge whose endpoints share no package is a boundary crossed with nothing spanning it — widen one endpoint to carry both packages (that endpoint IS the glue node), or insert a node between them that does.",
      ]);
    });
  });

  describe('unresolved endpoints are left to the reference check', () => {
    it("EMPTY: {edge 'from' resolves to no node} => returns empty array", () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [FlowNodeStub({ id: 'merge-status-ok', packages: ['server'] })],
        edges: [FlowEdgeStub({ id: 'ghost-to-status', from: 'ghost', to: 'merge-status-ok' })],
      });

      const offenders = questUngluedSeamEdgesTransformer({ flows: [flow] });

      expect(offenders).toStrictEqual([]);
    });

    it("EMPTY: {edge 'to' resolves to no node} => returns empty array", () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [FlowNodeStub({ id: 'press-warp', packages: ['web'] })],
        edges: [FlowEdgeStub({ id: 'press-to-ghost', from: 'press-warp', to: 'ghost' })],
      });

      const offenders = questUngluedSeamEdgesTransformer({ flows: [flow] });

      expect(offenders).toStrictEqual([]);
    });

    it('EMPTY: {cross-flow ref naming a flow that does not exist} => returns empty array', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [FlowNodeStub({ id: 'press-warp', packages: ['web'] })],
        edges: [
          FlowEdgeStub({ id: 'press-to-nowhere', from: 'press-warp', to: 'no-such-flow:node' }),
        ],
      });

      const offenders = questUngluedSeamEdgesTransformer({ flows: [flow] });

      expect(offenders).toStrictEqual([]);
    });
  });
});
