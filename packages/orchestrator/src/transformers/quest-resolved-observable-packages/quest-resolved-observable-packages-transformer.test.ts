import { FlowNodeStub, FlowObservableStub, FlowStub } from '@dungeonmaster/shared/contracts';

import { questResolvedObservablePackagesTransformer } from './quest-resolved-observable-packages-transformer';

describe('questResolvedObservablePackagesTransformer', () => {
  describe('a node tagging exactly one package', () => {
    it('VALID: {observable written with no package at all} => the node tag is written onto it', () => {
      const { package: _authoredPackage, ...observableWithoutPackage } = FlowObservableStub({
        id: 'warp-button-disables',
        type: 'ui-state',
        description: 'the WARP button goes disabled while the merge runs',
      });
      const node = FlowNodeStub({ id: 'press-warp', packages: ['web'], observables: [] });
      const flow = FlowStub({ id: 'warpgate-merge', nodes: [] });

      const result = questResolvedObservablePackagesTransformer({
        flows: [
          { ...flow, nodes: [{ ...node, observables: [observableWithoutPackage as never] }] },
        ],
      });

      expect(result[0]!.nodes[0]!.observables).toStrictEqual([
        {
          id: 'warp-button-disables',
          type: 'ui-state',
          description: 'the WARP button goes disabled while the merge runs',
          addedBy: 'spec',
          package: 'web',
        },
      ]);
    });

    it('VALID: {two observables, one written with a package and one without} => only the silent one is filled in', () => {
      const { package: _authoredPackage, ...silentObservable } = FlowObservableStub({
        id: 'warp-button-disables',
        type: 'ui-state',
        description: 'the WARP button goes disabled while the merge runs',
      });
      const authoredObservable = FlowObservableStub({
        id: 'merge-banner-shown',
        type: 'ui-state',
        description: 'the merged banner replaces the WARP button',
        package: 'web',
      });
      const node = FlowNodeStub({ id: 'press-warp', packages: ['web'], observables: [] });
      const flow = FlowStub({ id: 'warpgate-merge', nodes: [] });

      const result = questResolvedObservablePackagesTransformer({
        flows: [
          {
            ...flow,
            nodes: [
              {
                ...node,
                observables: [silentObservable as never, authoredObservable],
              },
            ],
          },
        ],
      });

      expect(
        result[0]!.nodes[0]!.observables.map((observable) => ({
          id: String(observable.id),
          package: String(observable.package),
        })),
      ).toStrictEqual([
        { id: 'warp-button-disables', package: 'web' },
        { id: 'merge-banner-shown', package: 'web' },
      ]);
    });

    it('VALID: {observable authoring a package the node does not tag} => the authored package survives untouched', () => {
      const authoredObservable = FlowObservableStub({
        id: 'merge-status-200',
        type: 'api-call',
        description: 'GET /api/quests/:id/merge-status returns 200',
        package: 'server',
      });
      const node = FlowNodeStub({
        id: 'press-warp',
        packages: ['web'],
        observables: [authoredObservable],
      });
      const flow = FlowStub({ id: 'warpgate-merge', nodes: [node] });

      const result = questResolvedObservablePackagesTransformer({ flows: [flow] });

      expect(result[0]!.nodes[0]!.observables).toStrictEqual([authoredObservable]);
    });

    it('EMPTY: {node carrying no observables} => the node is handed back unchanged', () => {
      const node = FlowNodeStub({ id: 'can-resolve-intake', packages: ['web'], observables: [] });
      const flow = FlowStub({ id: 'warpgate-merge', nodes: [node] });

      const result = questResolvedObservablePackagesTransformer({ flows: [flow] });

      expect(result).toStrictEqual([flow]);
    });
  });

  describe('a node with nothing to hand down', () => {
    it('INVALID: {node tags two packages, observable written with no package} => the observable is left without one', () => {
      const { package: _authoredPackage, ...observableWithoutPackage } = FlowObservableStub({
        id: 'merge-banner-shown',
        type: 'ui-state',
        description: 'the merged banner replaces the WARP button',
      });
      const node = FlowNodeStub({
        id: 'landed-on-base',
        packages: ['web', 'server'],
        observables: [],
      });
      const flow = FlowStub({ id: 'warpgate-merge', nodes: [] });

      const result = questResolvedObservablePackagesTransformer({
        flows: [
          { ...flow, nodes: [{ ...node, observables: [observableWithoutPackage as never] }] },
        ],
      });

      expect(result[0]!.nodes[0]!.observables).toStrictEqual([observableWithoutPackage]);
    });

    it('INVALID: {node carries no packages key, observable written with no package} => the observable is left without one', () => {
      const { package: _authoredPackage, ...observableWithoutPackage } = FlowObservableStub({
        id: 'merge-banner-shown',
        type: 'ui-state',
        description: 'the merged banner replaces the WARP button',
      });
      const { packages: _nodePackages, ...nodeWithoutPackages } = FlowNodeStub({
        id: 'landed-on-base',
        observables: [],
      });
      const flow = FlowStub({ id: 'warpgate-merge', nodes: [] });

      const result = questResolvedObservablePackagesTransformer({
        flows: [
          {
            ...flow,
            nodes: [
              { ...nodeWithoutPackages, observables: [observableWithoutPackage as never] } as never,
            ],
          },
        ],
      });

      expect(result[0]!.nodes[0]!.observables).toStrictEqual([observableWithoutPackage]);
    });
  });

  describe('shapes the whole-quest re-parse has not defaulted yet', () => {
    it('EMPTY: {flows: []} => returns an empty array', () => {
      const result = questResolvedObservablePackagesTransformer({ flows: [] });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {flow carrying no nodes key} => the flow is handed back unchanged', () => {
      const { nodes: _flowNodes, ...flowWithoutNodes } = FlowStub({ id: 'warpgate-merge' });

      const result = questResolvedObservablePackagesTransformer({
        flows: [flowWithoutNodes as never],
      });

      expect(result).toStrictEqual([flowWithoutNodes]);
    });

    it('EDGE: {node carrying no observables key} => the node is handed back unchanged', () => {
      const { observables: _nodeObservables, ...nodeWithoutObservables } = FlowNodeStub({
        id: 'press-warp',
        packages: ['web'],
      });
      const flow = FlowStub({ id: 'warpgate-merge', nodes: [] });

      const result = questResolvedObservablePackagesTransformer({
        flows: [{ ...flow, nodes: [nodeWithoutObservables as never] }],
      });

      expect(result[0]!.nodes).toStrictEqual([nodeWithoutObservables]);
    });
  });
});
