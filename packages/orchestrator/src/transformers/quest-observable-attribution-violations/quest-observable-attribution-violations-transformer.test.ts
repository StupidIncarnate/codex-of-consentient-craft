import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
} from '@dungeonmaster/shared/contracts';

import { questObservableAttributionViolationsTransformer } from './quest-observable-attribution-violations-transformer';

describe('questObservableAttributionViolationsTransformer', () => {
  describe('attribution inside the node set', () => {
    it('EMPTY: {flows: []} => returns empty array', () => {
      const offenders = questObservableAttributionViolationsTransformer({ flows: [] });

      expect(offenders).toStrictEqual([]);
    });

    it("VALID: {single-package node, observable carries the node's package} => returns empty array", () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'press-warp',
            packages: ['web'],
            observables: [
              FlowObservableStub({ id: 'warp-button-disables', package: 'web', type: 'ui-state' }),
            ],
          }),
        ],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {glue node whose observables cover both sides of the seam} => returns empty array', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'landed-on-base',
            packages: ['web', 'server'],
            observables: [
              FlowObservableStub({ id: 'merge-banner-shown', package: 'web', type: 'ui-state' }),
              FlowObservableStub({ id: 'merge-status-200', package: 'server', type: 'api-call' }),
            ],
          }),
        ],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('zero-observable nodes are exempt', () => {
    it('EMPTY: {single-package decision node with no observables} => returns empty array', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'base-ahead',
            type: 'decision',
            packages: ['server'],
            observables: [],
          }),
        ],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders).toStrictEqual([]);
    });

    it('EMPTY: {multi-package decision node with no observables} => exempt, it is still a branch unit', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'can-resolve-intake',
            type: 'decision',
            packages: ['web', 'server'],
            observables: [],
          }),
        ],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('observable attributed outside its node set', () => {
    it("INVALID: {glue node tags web+server, observable says cli} => names the observable and the node's tags", () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'press-warp',
            packages: ['web', 'server'],
            observables: [
              FlowObservableStub({ id: 'merge-status-shown', package: 'cli', type: 'ui-state' }),
              FlowObservableStub({ id: 'merge-banner-shown', package: 'web', type: 'ui-state' }),
              FlowObservableStub({ id: 'merge-status-200', package: 'server', type: 'api-call' }),
            ],
          }),
        ],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Observable 'merge-status-shown' on node 'press-warp' in flow 'warpgate-merge' is attributed to package 'cli', which its node does not tag (node packages: web, server). An observable sits on exactly ONE side of its node's seam — set its package to one the node already tags, or widen the node's packages to include it.",
      ]);
    });

    it('INVALID: {single-package node, observable says another package} => reported without a coverage complaint', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'press-warp',
            packages: ['web'],
            observables: [
              FlowObservableStub({ id: 'merge-status-200', package: 'server', type: 'api-call' }),
            ],
          }),
        ],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Observable 'merge-status-200' on node 'press-warp' in flow 'warpgate-merge' is attributed to package 'server', which its node does not tag (node packages: web). An observable sits on exactly ONE side of its node's seam — set its package to one the node already tags, or widen the node's packages to include it.",
      ]);
    });

    it('INVALID: {seam-forced package, but an observable names a package outside the node set} => the seam waiver does not excuse the observable', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'press-warp',
            packages: ['web', 'server'],
            observables: [
              FlowObservableStub({ id: 'merge-banner-shown', package: 'web', type: 'ui-state' }),
              FlowObservableStub({ id: 'cli-exit-zero', package: 'cli', type: 'process-state' }),
            ],
          }),
          FlowNodeStub({ id: 'merge-status-ok', packages: ['server'], observables: [] }),
        ],
        edges: [FlowEdgeStub({ id: 'press-to-status', from: 'press-warp', to: 'merge-status-ok' })],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Observable 'cli-exit-zero' on node 'press-warp' in flow 'warpgate-merge' is attributed to package 'cli', which its node does not tag (node packages: web, server). An observable sits on exactly ONE side of its node's seam — set its package to one the node already tags, or widen the node's packages to include it.",
      ]);
    });
  });

  describe('a package the seam rule forces needs no observable of its own', () => {
    it('VALID: {ns-ready tags core+app with ONE observable naming core, inbound edge shares only core, outbound only app} => app is seam-forced, returns empty array', () => {
      const flow = FlowStub({
        id: 'scope-selection',
        nodes: [
          FlowNodeStub({
            id: 'ns-sweep-warned',
            packages: ['cli', 'core'],
            observables: [
              FlowObservableStub({
                id: 'sweep-warning-printed',
                package: 'cli',
                type: 'process-state',
              }),
              FlowObservableStub({ id: 'sweep-index-rebuilt', package: 'core', type: 'custom' }),
            ],
          }),
          FlowNodeStub({
            id: 'ns-ready',
            packages: ['core', 'app'],
            observables: [
              FlowObservableStub({ id: 'ns-index-ready', package: 'core', type: 'custom' }),
            ],
          }),
          FlowNodeStub({
            id: 'scope-header',
            packages: ['app'],
            observables: [
              FlowObservableStub({ id: 'scope-header-rendered', package: 'app', type: 'ui-state' }),
            ],
          }),
        ],
        edges: [
          FlowEdgeStub({ id: 'scope-e-sweep', from: 'ns-sweep-warned', to: 'ns-ready' }),
          FlowEdgeStub({ id: 'scope-e-prereq', from: 'ns-ready', to: 'scope-header' }),
        ],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {three consecutive nodes each carrying exactly ONE observable, desktop in the middle} => the middle node glues the chain, returns empty array', () => {
      const flow = FlowStub({
        id: 'cache-refresh',
        nodes: [
          FlowNodeStub({
            id: 'refresh-busy',
            packages: ['app'],
            observables: [
              FlowObservableStub({ id: 'refresh-spinner-shown', package: 'app', type: 'ui-state' }),
            ],
          }),
          FlowNodeStub({
            id: 'refresh-spawn-compile',
            packages: ['desktop', 'app'],
            observables: [
              FlowObservableStub({
                id: 'electron-run-as-node-set',
                package: 'desktop',
                type: 'environment',
              }),
            ],
          }),
          FlowNodeStub({
            id: 'refresh-streaming',
            packages: ['app'],
            observables: [
              FlowObservableStub({ id: 'refresh-status-text', package: 'app', type: 'ui-state' }),
            ],
          }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'refresh-e-busy-spawn',
            from: 'refresh-busy',
            to: 'refresh-spawn-compile',
          }),
          FlowEdgeStub({
            id: 'refresh-e-spawn-streaming',
            from: 'refresh-spawn-compile',
            to: 'refresh-streaming',
          }),
        ],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {node with TWO outbound edges, each sharing a different single package} => both are seam-forced, returns empty array', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'landed-on-base',
            packages: ['web', 'server', 'cli'],
            observables: [
              FlowObservableStub({ id: 'merge-banner-shown', package: 'web', type: 'ui-state' }),
            ],
          }),
          FlowNodeStub({ id: 'merge-status-ok', packages: ['server'], observables: [] }),
          FlowNodeStub({ id: 'warp-exit-zero', packages: ['cli'], observables: [] }),
        ],
        edges: [
          FlowEdgeStub({ id: 'landed-to-status', from: 'landed-on-base', to: 'merge-status-ok' }),
          FlowEdgeStub({ id: 'landed-to-exit', from: 'landed-on-base', to: 'warp-exit-zero' }),
        ],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {node with TWO inbound edges, each sharing a different single package} => both are seam-forced, returns empty array', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({ id: 'merge-status-ok', packages: ['server'], observables: [] }),
          FlowNodeStub({ id: 'warp-exit-zero', packages: ['cli'], observables: [] }),
          FlowNodeStub({
            id: 'landed-on-base',
            packages: ['web', 'server', 'cli'],
            observables: [
              FlowObservableStub({ id: 'merge-banner-shown', package: 'web', type: 'ui-state' }),
            ],
          }),
        ],
        edges: [
          FlowEdgeStub({ id: 'status-to-landed', from: 'merge-status-ok', to: 'landed-on-base' }),
          FlowEdgeStub({ id: 'exit-to-landed', from: 'warp-exit-zero', to: 'landed-on-base' }),
        ],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders).toStrictEqual([]);
    });

    it("VALID: {cross-flow edge whose 'to' is a qualified ref sharing the single package} => resolves through flowId:nodeId and waives it", () => {
      const uiFlow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'press-warp',
            packages: ['web', 'server'],
            observables: [
              FlowObservableStub({ id: 'merge-banner-shown', package: 'web', type: 'ui-state' }),
            ],
          }),
        ],
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
        nodes: [FlowNodeStub({ id: 'merge-status-ok', packages: ['server'], observables: [] })],
      });

      const offenders = questObservableAttributionViolationsTransformer({
        flows: [uiFlow, apiFlow],
      });

      expect(offenders).toStrictEqual([]);
    });

    it("VALID: {cross-flow edge whose 'from' is a qualified ref sharing the single package} => resolves through flowId:nodeId and waives it", () => {
      const apiFlow = FlowStub({
        id: 'followup-chat',
        nodes: [FlowNodeStub({ id: 'merge-status-ok', packages: ['server'], observables: [] })],
      });
      const uiFlow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'press-warp',
            packages: ['web', 'server'],
            observables: [
              FlowObservableStub({ id: 'merge-banner-shown', package: 'web', type: 'ui-state' }),
            ],
          }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'other-flow-to-press',
            from: 'followup-chat:merge-status-ok',
            to: 'press-warp',
          }),
        ],
      });

      const offenders = questObservableAttributionViolationsTransformer({
        flows: [apiFlow, uiFlow],
      });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('a package that is neither observed nor seam-forced', () => {
    it('INVALID: {node tags web+server with no edges at all, only web is observed} => names the uncovered package', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'landed-on-base',
            packages: ['web', 'server'],
            observables: [
              FlowObservableStub({ id: 'merge-banner-shown', package: 'web', type: 'ui-state' }),
            ],
          }),
        ],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Node 'landed-on-base' in flow 'warpgate-merge' tags packages web, server but its observables only cover web. Package(s) server are declared on the node and asserted by nothing — a seam declared on one side only. Add an observable carrying each uncovered package, or narrow the node's packages to what it really lands in.",
      ]);
    });

    it('INVALID: {node tags web+server, its only observable names neither} => reports the attribution AND the empty coverage', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'landed-on-base',
            packages: ['web', 'server'],
            observables: [
              FlowObservableStub({ id: 'cli-exit-zero', package: 'cli', type: 'process-state' }),
            ],
          }),
        ],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Observable 'cli-exit-zero' on node 'landed-on-base' in flow 'warpgate-merge' is attributed to package 'cli', which its node does not tag (node packages: web, server). An observable sits on exactly ONE side of its node's seam — set its package to one the node already tags, or widen the node's packages to include it.",
        "Node 'landed-on-base' in flow 'warpgate-merge' tags packages web, server but its observables only cover none of them. Package(s) web, server are declared on the node and asserted by nothing — a seam declared on one side only. Add an observable carrying each uncovered package, or narrow the node's packages to what it really lands in.",
      ]);
    });

    it('INVALID: {node tags web+server+cli, web observed, an edge forces server, cli is neither} => names cli alone', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'press-warp',
            packages: ['web', 'server', 'cli'],
            observables: [
              FlowObservableStub({ id: 'merge-banner-shown', package: 'web', type: 'ui-state' }),
            ],
          }),
          FlowNodeStub({ id: 'merge-status-ok', packages: ['server'], observables: [] }),
        ],
        edges: [FlowEdgeStub({ id: 'press-to-status', from: 'press-warp', to: 'merge-status-ok' })],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Node 'press-warp' in flow 'warpgate-merge' tags packages web, server, cli but its observables only cover web. Package(s) cli are declared on the node and asserted by nothing — a seam declared on one side only. Add an observable carrying each uncovered package, or narrow the node's packages to what it really lands in.",
      ]);
    });

    it('INVALID: {incident edge shares BOTH of the node packages} => it forces neither, so the unobserved one is still named', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'press-warp',
            packages: ['web', 'server'],
            observables: [
              FlowObservableStub({ id: 'merge-banner-shown', package: 'web', type: 'ui-state' }),
            ],
          }),
          FlowNodeStub({ id: 'warp-spinner', packages: ['web', 'server'], observables: [] }),
        ],
        edges: [FlowEdgeStub({ id: 'press-to-spinner', from: 'press-warp', to: 'warp-spinner' })],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Node 'press-warp' in flow 'warpgate-merge' tags packages web, server but its observables only cover web. Package(s) server are declared on the node and asserted by nothing — a seam declared on one side only. Add an observable carrying each uncovered package, or narrow the node's packages to what it really lands in.",
      ]);
    });

    it('INVALID: {incident edge shares NO package — an already-unglued seam} => it forces nothing, so the unobserved package is still named', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'press-warp',
            packages: ['web', 'server'],
            observables: [
              FlowObservableStub({ id: 'merge-banner-shown', package: 'web', type: 'ui-state' }),
            ],
          }),
          FlowNodeStub({ id: 'cli-runner', packages: ['cli'], observables: [] }),
        ],
        edges: [FlowEdgeStub({ id: 'press-to-runner', from: 'press-warp', to: 'cli-runner' })],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Node 'press-warp' in flow 'warpgate-merge' tags packages web, server but its observables only cover web. Package(s) server are declared on the node and asserted by nothing — a seam declared on one side only. Add an observable carrying each uncovered package, or narrow the node's packages to what it really lands in.",
      ]);
    });
  });

  describe('edges with an endpoint that resolves to no node force nothing', () => {
    it("INVALID: {edge 'from' is a dangling ref} => contributes no neighbour, so the unobserved package is still named", () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'press-warp',
            packages: ['web', 'server'],
            observables: [
              FlowObservableStub({ id: 'merge-banner-shown', package: 'web', type: 'ui-state' }),
            ],
          }),
        ],
        edges: [FlowEdgeStub({ id: 'ghost-to-press', from: 'ghost', to: 'press-warp' })],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Node 'press-warp' in flow 'warpgate-merge' tags packages web, server but its observables only cover web. Package(s) server are declared on the node and asserted by nothing — a seam declared on one side only. Add an observable carrying each uncovered package, or narrow the node's packages to what it really lands in.",
      ]);
    });

    it("INVALID: {edge 'to' is a dangling ref} => contributes no neighbour, so the unobserved package is still named", () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'press-warp',
            packages: ['web', 'server'],
            observables: [
              FlowObservableStub({ id: 'merge-banner-shown', package: 'web', type: 'ui-state' }),
            ],
          }),
        ],
        edges: [FlowEdgeStub({ id: 'press-to-ghost', from: 'press-warp', to: 'ghost' })],
      });

      const offenders = questObservableAttributionViolationsTransformer({ flows: [flow] });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Node 'press-warp' in flow 'warpgate-merge' tags packages web, server but its observables only cover web. Package(s) server are declared on the node and asserted by nothing — a seam declared on one side only. Add an observable carrying each uncovered package, or narrow the node's packages to what it really lands in.",
      ]);
    });
  });
});
