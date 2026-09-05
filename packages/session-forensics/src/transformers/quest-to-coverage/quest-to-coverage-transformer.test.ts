import { questToCoverageTransformer } from './quest-to-coverage-transformer';
import { TrackCoverageStub } from '../../contracts/track-coverage/track-coverage.stub';
import {
  FlowStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  SignoffStub,
} from '@dungeonmaster/shared/contracts';

describe('questToCoverageTransformer', () => {
  describe('fully confirmed observable', () => {
    it('VALID: {one runtime flow, one spec observable confirmed by all three tracks} => codeweaver and flowrider owed 1/signed 1/confirmed 1, siegemaster carries the seven unsigned off-map units on top', () => {
      const observable = FlowObservableStub({
        id: 'shows-thumbnail',
        package: 'web',
        codeweaverSignoff: SignoffStub({ verdict: 'confirmed' }),
        flowriderSignoff: SignoffStub({ verdict: 'confirmed' }),
        siegemasterSignoff: SignoffStub({ verdict: 'confirmed' }),
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
          track: 'codeweaverSignoff',
          owed: 1,
          signed: 1,
          confirmed: 1,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'render-thumbnail-flow',
          track: 'flowriderSignoff',
          owed: 1,
          signed: 1,
          confirmed: 1,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'render-thumbnail-flow',
          track: 'siegemasterSignoff',
          owed: 8,
          signed: 1,
          confirmed: 1,
          unconfirmable: 0,
          unsigned: 7,
        }),
      ]);
    });
  });

  describe('mixed verdicts within one flow', () => {
    it('VALID: {one confirmed, one unconfirmable, one unsigned observable} => confirmed/unconfirmable/unsigned counts balance on every row', () => {
      const confirmedObservable = FlowObservableStub({
        id: 'obs-confirmed',
        package: 'web',
        codeweaverSignoff: SignoffStub({ verdict: 'confirmed' }),
        flowriderSignoff: SignoffStub({ verdict: 'confirmed' }),
        siegemasterSignoff: SignoffStub({ verdict: 'confirmed' }),
      });
      const unconfirmableObservable = FlowObservableStub({
        id: 'obs-unconfirmable',
        package: 'web',
        codeweaverSignoff: SignoffStub({
          verdict: 'unconfirmable',
          toSettle: 'drive a real send through a live quest and read the session JSONL',
        }),
        flowriderSignoff: SignoffStub({
          verdict: 'unconfirmable',
          toSettle: 'drive a real send through a live quest and read the session JSONL',
        }),
        siegemasterSignoff: SignoffStub({
          verdict: 'unconfirmable',
          toSettle: 'drive a real send through a live quest and read the session JSONL',
        }),
      });
      const unsignedObservable = FlowObservableStub({ id: 'obs-unsigned', package: 'web' });
      const nodeA = FlowNodeStub({
        id: 'node-a',
        type: 'state',
        packages: ['web'],
        observables: [confirmedObservable],
      });
      const nodeB = FlowNodeStub({
        id: 'node-b',
        type: 'state',
        packages: ['web'],
        observables: [unconfirmableObservable],
      });
      const nodeC = FlowNodeStub({
        id: 'node-c',
        type: 'state',
        packages: ['web'],
        observables: [unsignedObservable],
      });
      const flow = FlowStub({
        id: 'mixed-verdict-flow',
        flowType: 'runtime',
        nodes: [nodeA, nodeB, nodeC],
        edges: [],
      });

      const result = questToCoverageTransformer({ flows: [flow] });

      expect(result).toStrictEqual([
        TrackCoverageStub({
          flowId: 'mixed-verdict-flow',
          track: 'codeweaverSignoff',
          owed: 3,
          signed: 2,
          confirmed: 1,
          unconfirmable: 1,
          unsigned: 1,
        }),
        TrackCoverageStub({
          flowId: 'mixed-verdict-flow',
          track: 'flowriderSignoff',
          owed: 3,
          signed: 2,
          confirmed: 1,
          unconfirmable: 1,
          unsigned: 1,
        }),
        TrackCoverageStub({
          flowId: 'mixed-verdict-flow',
          track: 'siegemasterSignoff',
          owed: 10,
          signed: 2,
          confirmed: 1,
          unconfirmable: 1,
          unsigned: 8,
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
          track: 'codeweaverSignoff',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'siegemaster-found-flow',
          track: 'flowriderSignoff',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'siegemaster-found-flow',
          track: 'siegemasterSignoff',
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
          track: 'codeweaverSignoff',
          owed: 1,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 1,
        }),
        TrackCoverageStub({
          flowId: 'reads-source-flow',
          track: 'flowriderSignoff',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'reads-source-flow',
          track: 'siegemasterSignoff',
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
          track: 'codeweaverSignoff',
          owed: 1,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 1,
        }),
        TrackCoverageStub({
          flowId: 'settings-sync-flow',
          track: 'flowriderSignoff',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'settings-sync-flow',
          track: 'siegemasterSignoff',
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
    it('VALID: {one of seven off-map families signed} => all seven land only in siegemasters owed, one confirmed and six unsigned', () => {
      const flow = FlowStub({
        id: 'off-map-focus-flow',
        flowType: 'runtime',
        nodes: [],
        edges: [],
        offMapSignoffs: [
          FlowOffMapSignoffStub({
            id: 'perf',
            siegemasterSignoff: SignoffStub({ verdict: 'confirmed' }),
          }),
        ],
      });

      const result = questToCoverageTransformer({ flows: [flow] });

      expect(result).toStrictEqual([
        TrackCoverageStub({
          flowId: 'off-map-focus-flow',
          track: 'codeweaverSignoff',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'off-map-focus-flow',
          track: 'flowriderSignoff',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'off-map-focus-flow',
          track: 'siegemasterSignoff',
          owed: 7,
          signed: 1,
          confirmed: 1,
          unconfirmable: 0,
          unsigned: 6,
        }),
      ]);
    });
  });

  describe('stray sign-off outside eligibility', () => {
    it('INVALID: {siegemaster-authored observable carrying a codeweaverSignoff} => absent from codeweavers owed AND signed', () => {
      const observable = FlowObservableStub({
        id: 'found-mid-quest-signed-stray',
        package: 'web',
        addedBy: 'siegemaster',
        codeweaverSignoff: SignoffStub({ verdict: 'confirmed' }),
      });
      const node = FlowNodeStub({
        id: 'compose-node',
        type: 'state',
        packages: ['web'],
        observables: [observable],
      });
      const flow = FlowStub({
        id: 'stray-signoff-flow',
        flowType: 'runtime',
        nodes: [node],
        edges: [],
      });

      const result = questToCoverageTransformer({ flows: [flow] });

      expect(result).toStrictEqual([
        TrackCoverageStub({
          flowId: 'stray-signoff-flow',
          track: 'codeweaverSignoff',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'stray-signoff-flow',
          track: 'flowriderSignoff',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'stray-signoff-flow',
          track: 'siegemasterSignoff',
          owed: 8,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 8,
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
          track: 'codeweaverSignoff',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'bare-flow',
          track: 'flowriderSignoff',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'bare-flow',
          track: 'siegemasterSignoff',
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
          track: 'codeweaverSignoff',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-alpha',
          track: 'flowriderSignoff',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-alpha',
          track: 'siegemasterSignoff',
          owed: 7,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 7,
        }),
        TrackCoverageStub({
          flowId: 'flow-beta',
          track: 'codeweaverSignoff',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-beta',
          track: 'flowriderSignoff',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-beta',
          track: 'siegemasterSignoff',
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
