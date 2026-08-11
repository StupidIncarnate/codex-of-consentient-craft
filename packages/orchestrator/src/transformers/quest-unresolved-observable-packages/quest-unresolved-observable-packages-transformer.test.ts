import { FlowNodeStub, FlowObservableStub, FlowStub } from '@dungeonmaster/shared/contracts';

import { questUnresolvedObservablePackagesTransformer } from './quest-unresolved-observable-packages-transformer';

describe('questUnresolvedObservablePackagesTransformer', () => {
  describe('every observable names a package', () => {
    it('EMPTY: {flows: []} => returns an empty array', () => {
      const offenders = questUnresolvedObservablePackagesTransformer({ flows: [] });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {seam node whose two observables each name a side} => returns an empty array', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'landed-on-base',
            packages: ['web', 'server'],
            observables: [
              FlowObservableStub({ id: 'merge-banner-shown', package: 'web' }),
              FlowObservableStub({ id: 'merge-status-200', package: 'server' }),
            ],
          }),
        ],
      });

      const offenders = questUnresolvedObservablePackagesTransformer({ flows: [flow] });

      expect(offenders).toStrictEqual([]);
    });

    it("VALID: {observable naming a package its node does not tag} => returns an empty array, since attribution is not this rule's question", () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({
            id: 'press-warp',
            packages: ['web'],
            observables: [FlowObservableStub({ id: 'merge-status-200', package: 'server' })],
          }),
        ],
      });

      const offenders = questUnresolvedObservablePackagesTransformer({ flows: [flow] });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('an observable the save could not resolve', () => {
    it('INVALID: {node tags two packages, observable names none} => names the observable, its node, and both tags', () => {
      const { package: _authoredPackage, ...observableWithoutPackage } = FlowObservableStub({
        id: 'merge-banner-shown',
      });
      const node = FlowNodeStub({
        id: 'landed-on-base',
        packages: ['web', 'server'],
        observables: [],
      });
      const flow = FlowStub({ id: 'warpgate-merge', nodes: [] });

      const offenders = questUnresolvedObservablePackagesTransformer({
        flows: [
          { ...flow, nodes: [{ ...node, observables: [observableWithoutPackage as never] }] },
        ],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Observable 'merge-banner-shown' on node 'landed-on-base' in flow 'warpgate-merge' names no package, and its node tags web, server. An omitted package is filled in from the owning node only when that node tags exactly ONE — state the package this observable is read in, drawn from the ones its node already tags, or retag the node.",
      ]);
    });

    it('INVALID: {node carries no packages key, observable names none} => reports the node tags as none', () => {
      const { package: _authoredPackage, ...observableWithoutPackage } = FlowObservableStub({
        id: 'merge-banner-shown',
      });
      const { packages: _nodePackages, ...nodeWithoutPackages } = FlowNodeStub({
        id: 'landed-on-base',
        observables: [],
      });
      const flow = FlowStub({ id: 'warpgate-merge', nodes: [] });

      const offenders = questUnresolvedObservablePackagesTransformer({
        flows: [
          {
            ...flow,
            nodes: [
              { ...nodeWithoutPackages, observables: [observableWithoutPackage as never] } as never,
            ],
          },
        ],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Observable 'merge-banner-shown' on node 'landed-on-base' in flow 'warpgate-merge' names no package, and its node tags none. An omitted package is filled in from the owning node only when that node tags exactly ONE — state the package this observable is read in, drawn from the ones its node already tags, or retag the node.",
      ]);
    });

    it('INVALID: {observable carrying an empty package string} => reported the same as an absent one, because the persisted schema is the predicate', () => {
      const observable = FlowObservableStub({ id: 'merge-banner-shown', package: 'web' });
      const node = FlowNodeStub({
        id: 'landed-on-base',
        packages: ['web', 'server'],
        observables: [],
      });
      const flow = FlowStub({ id: 'warpgate-merge', nodes: [] });

      const offenders = questUnresolvedObservablePackagesTransformer({
        flows: [
          {
            ...flow,
            nodes: [{ ...node, observables: [{ ...observable, package: '' as never }] }],
          },
        ],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Observable 'merge-banner-shown' on node 'landed-on-base' in flow 'warpgate-merge' names no package, and its node tags web, server. An omitted package is filled in from the owning node only when that node tags exactly ONE — state the package this observable is read in, drawn from the ones its node already tags, or retag the node.",
      ]);
    });

    it('INVALID: {two seam nodes each carrying one silent observable} => one sentence per observable', () => {
      const { package: _bannerPackage, ...silentBanner } = FlowObservableStub({
        id: 'merge-banner-shown',
      });
      const { package: _statusPackage, ...silentStatus } = FlowObservableStub({
        id: 'merge-status-200',
      });
      const landedNode = FlowNodeStub({
        id: 'landed-on-base',
        packages: ['web', 'server'],
        observables: [],
      });
      const intakeNode = FlowNodeStub({
        id: 'can-resolve-intake',
        packages: ['web', 'mcp'],
        observables: [],
      });
      const flow = FlowStub({ id: 'warpgate-merge', nodes: [] });

      const offenders = questUnresolvedObservablePackagesTransformer({
        flows: [
          {
            ...flow,
            nodes: [
              { ...landedNode, observables: [silentBanner as never] },
              { ...intakeNode, observables: [silentStatus as never] },
            ],
          },
        ],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Observable 'merge-banner-shown' on node 'landed-on-base' in flow 'warpgate-merge' names no package, and its node tags web, server. An omitted package is filled in from the owning node only when that node tags exactly ONE — state the package this observable is read in, drawn from the ones its node already tags, or retag the node.",
        "Observable 'merge-status-200' on node 'can-resolve-intake' in flow 'warpgate-merge' names no package, and its node tags web, mcp. An omitted package is filled in from the owning node only when that node tags exactly ONE — state the package this observable is read in, drawn from the ones its node already tags, or retag the node.",
      ]);
    });
  });

  describe('shapes the whole-quest re-parse has not defaulted yet', () => {
    it('EDGE: {flow carrying no nodes key} => returns an empty array', () => {
      const { nodes: _flowNodes, ...flowWithoutNodes } = FlowStub({ id: 'warpgate-merge' });

      const offenders = questUnresolvedObservablePackagesTransformer({
        flows: [flowWithoutNodes as never],
      });

      expect(offenders).toStrictEqual([]);
    });

    it('EDGE: {node carrying no observables key} => returns an empty array', () => {
      const { observables: _nodeObservables, ...nodeWithoutObservables } = FlowNodeStub({
        id: 'press-warp',
        packages: ['web'],
      });
      const flow = FlowStub({ id: 'warpgate-merge', nodes: [] });

      const offenders = questUnresolvedObservablePackagesTransformer({
        flows: [{ ...flow, nodes: [nodeWithoutObservables as never] }],
      });

      expect(offenders).toStrictEqual([]);
    });
  });
});
