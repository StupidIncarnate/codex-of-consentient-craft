import { questToCoverageTransformer } from './quest-to-coverage-transformer';
import { TrackCoverageStub } from '../../contracts/track-coverage/track-coverage.stub';
import {
  FlowStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
} from '@dungeonmaster/shared/contracts';

describe('questToCoverageTransformer', () => {
  describe('spec observable in runtime flow', () => {
    it('VALID: {one runtime flow, one spec observable} => codeweaver and flowrider owed 1, siegemaster carries seven off-map units on top', () => {
      const observable = FlowObservableStub({
        id: 'shows-thumbnail',
        package: 'web',
      });
      const node = FlowNodeStub({
        id: 'compose-node',
        type: 'state',
        packages: ['web'],
        observables: [observable],
      });
      const flow = FlowStub({
        id: 'render-thumbnail-flow',
        flowType: 'runtime',
        nodes: [node],
        edges: [],
      });

      const result = questToCoverageTransformer({ flows: [flow] });

      expect(result).toStrictEqual([
        TrackCoverageStub({
          flowId: 'render-thumbnail-flow',
          track: 'codeweaver',
          owed: 1,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 1,
        }),
        TrackCoverageStub({
          flowId: 'render-thumbnail-flow',
          track: 'flowrider',
          owed: 1,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 1,
        }),
        TrackCoverageStub({
          flowId: 'render-thumbnail-flow',
          track: 'siegemaster',
          owed: 8,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 8,
        }),
      ]);
    });
  });

  describe('multiple observables within one flow', () => {
    it('VALID: {three observables} => owed/unsigned counts balance on every row', () => {
      const observableA = FlowObservableStub({
        id: 'obs-a',
        package: 'web',
      });
      const observableB = FlowObservableStub({
        id: 'obs-b',
        package: 'web',
      });
      const observableC = FlowObservableStub({ id: 'obs-c', package: 'web' });
      const nodeA = FlowNodeStub({
        id: 'node-a',
        type: 'state',
        packages: ['web'],
        observables: [observableA],
      });
      const nodeB = FlowNodeStub({
        id: 'node-b',
        type: 'state',
        packages: ['web'],
        observables: [observableB],
      });
      const nodeC = FlowNodeStub({
        id: 'node-c',
        type: 'state',
        packages: ['web'],
        observables: [observableC],
      });
      const flow = FlowStub({
        id: 'multi-obs-flow',
        flowType: 'runtime',
        nodes: [nodeA, nodeB, nodeC],
        edges: [],
      });

      const result = questToCoverageTransformer({ flows: [flow] });

      expect(result).toStrictEqual([
        TrackCoverageStub({
          flowId: 'multi-obs-flow',
          track: 'codeweaver',
          owed: 3,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 3,
        }),
        TrackCoverageStub({
          flowId: 'multi-obs-flow',
          track: 'flowrider',
          owed: 3,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 3,
        }),
        TrackCoverageStub({
          flowId: 'multi-obs-flow',
          track: 'siegemaster',
          owed: 10,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 10,
        }),
      ]);
    });
  });

  describe('siegemaster-authored observable', () => {
    it('VALID: {addedBy: siegemaster, no sign-offs} => counted in siegemasters owed only, absent from codeweaver and flowrider entirely', () => {
      const observable = FlowObservableStub({
        id: 'found-mid-quest',
        package: 'web',
        addedBy: 'siegemaster',
      });
      const node = FlowNodeStub({
        id: 'compose-node',
        type: 'state',
        packages: ['web'],
        observables: [observable],
      });
      const flow = FlowStub({
        id: 'siegemaster-found-flow',
        flowType: 'runtime',
        nodes: [node],
        edges: [],
      });

      const result = questToCoverageTransformer({ flows: [flow] });

      expect(result).toStrictEqual([
        TrackCoverageStub({
          flowId: 'siegemaster-found-flow',
          track: 'codeweaver',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'siegemaster-found-flow',
          track: 'flowrider',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'siegemaster-found-flow',
          track: 'siegemaster',
          owed: 8,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 8,
        }),
      ]);
    });
  });

  describe('verifyByReading observable', () => {
    it('VALID: {verifyByReading: true} => counted in codeweavers owed only, siegemasters owed carries only the off-map baseline', () => {
      const observable = FlowObservableStub({
        id: 'reads-source',
        package: 'web',
        verifyByReading: true,
      });
      const node = FlowNodeStub({
        id: 'compose-node',
        type: 'state',
        packages: ['web'],
        observables: [observable],
      });
      const flow = FlowStub({
        id: 'reads-source-flow',
        flowType: 'runtime',
        nodes: [node],
        edges: [],
      });

      const result = questToCoverageTransformer({ flows: [flow] });

      expect(result).toStrictEqual([
        TrackCoverageStub({
          flowId: 'reads-source-flow',
          track: 'codeweaver',
          owed: 1,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 1,
        }),
        TrackCoverageStub({
          flowId: 'reads-source-flow',
          track: 'flowrider',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'reads-source-flow',
          track: 'siegemaster',
          owed: 7,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 7,
        }),
      ]);
    });
  });

  describe('operational flow', () => {
    it('VALID: {flowType: operational} => flowrider owed 0/signed 0/unsigned 0, codeweaver and siegemaster still count the observable', () => {
      const observable = FlowObservableStub({ id: 'saves-locally', package: 'web' });
      const node = FlowNodeStub({
        id: 'sync-node',
        type: 'state',
        packages: ['web'],
        observables: [observable],
      });
      const flow = FlowStub({
        id: 'settings-sync-flow',
        flowType: 'operational',
        nodes: [node],
        edges: [],
      });

      const result = questToCoverageTransformer({ flows: [flow] });

      expect(result).toStrictEqual([
        TrackCoverageStub({
          flowId: 'settings-sync-flow',
          track: 'codeweaver',
          owed: 1,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 1,
        }),
        TrackCoverageStub({
          flowId: 'settings-sync-flow',
          track: 'flowrider',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'settings-sync-flow',
          track: 'siegemaster',
          owed: 8,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 8,
        }),
      ]);
    });
  });

  describe('off-map families', () => {
    it('VALID: {off-map families} => all seven land only in siegemasters owed', () => {
      const flow = FlowStub({
        id: 'off-map-focus-flow',
        flowType: 'runtime',
        nodes: [],
        edges: [],
        offMapSignoffs: [
          FlowOffMapSignoffStub({
            id: 'perf',
          }),
        ],
      });

      const result = questToCoverageTransformer({ flows: [flow] });

      expect(result).toStrictEqual([
        TrackCoverageStub({
          flowId: 'off-map-focus-flow',
          track: 'codeweaver',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'off-map-focus-flow',
          track: 'flowrider',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'off-map-focus-flow',
          track: 'siegemaster',
          owed: 7,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 7,
        }),
      ]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {flows: []} => []', () => {
      const result = questToCoverageTransformer({ flows: [] });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {flow with no nodes and no edges} => three rows; siegemaster owed 7, codeweaver and flowrider owed 0', () => {
      const flow = FlowStub({ id: 'bare-flow', flowType: 'runtime', nodes: [], edges: [] });

      const result = questToCoverageTransformer({ flows: [flow] });

      expect(result).toStrictEqual([
        TrackCoverageStub({
          flowId: 'bare-flow',
          track: 'codeweaver',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'bare-flow',
          track: 'flowrider',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'bare-flow',
          track: 'siegemaster',
          owed: 7,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 7,
        }),
      ]);
    });
  });

  describe('multiple flows', () => {
    it('VALID: {two bare flows} => six rows, each carrying its own flowId, row order flow-major then track', () => {
      const flowA = FlowStub({ id: 'flow-alpha', flowType: 'runtime', nodes: [], edges: [] });
      const flowB = FlowStub({ id: 'flow-beta', flowType: 'runtime', nodes: [], edges: [] });

      const result = questToCoverageTransformer({ flows: [flowA, flowB] });

      expect(result).toStrictEqual([
        TrackCoverageStub({
          flowId: 'flow-alpha',
          track: 'codeweaver',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-alpha',
          track: 'flowrider',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-alpha',
          track: 'siegemaster',
          owed: 7,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 7,
        }),
        TrackCoverageStub({
          flowId: 'flow-beta',
          track: 'codeweaver',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-beta',
          track: 'flowrider',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-beta',
          track: 'siegemaster',
          owed: 7,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 7,
        }),
      ]);
    });
  });
});
