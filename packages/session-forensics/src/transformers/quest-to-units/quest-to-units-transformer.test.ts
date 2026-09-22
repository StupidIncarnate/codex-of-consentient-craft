import { questToUnitsTransformer } from './quest-to-units-transformer';
import { VerificationUnitStub } from '../../contracts/verification-unit/verification-unit.stub';
import {
  FlowStub,
  FlowNodeStub,
  FlowEdgeStub,
  FlowObservableStub,
} from '@dungeonmaster/shared/contracts';
import { qaOffMapProbeStatics } from '@dungeonmaster/shared/statics';

describe('questToUnitsTransformer', () => {
  describe('terminal units', () => {
    it('VALID: {terminal node, no outgoing edge} => one terminal unit', () => {
      const node = FlowNodeStub({ id: 'checkout-success', type: 'terminal', packages: ['web'] });
      const flow = FlowStub({ id: 'checkout-flow', nodes: [node], edges: [] });

      const result = questToUnitsTransformer({ flows: [flow] });

      const offMapUnits = Object.keys(qaOffMapProbeStatics.byFamily).map((family) =>
        VerificationUnitStub({
          flowId: 'checkout-flow',
          kind: 'off-map',
          unitId: family,
          packages: [],
          trackVerdicts: {},
        }),
      );

      expect(result).toStrictEqual([
        VerificationUnitStub({
          flowId: 'checkout-flow',
          kind: 'terminal',
          unitId: 'checkout-success',
          nodeId: 'checkout-success',
          packages: ['web'],
          trackVerdicts: {},
        }),
        ...offMapUnits,
      ]);
    });

    it('INVALID: {terminal node, has outgoing edge} => no terminal unit for it', () => {
      const node = FlowNodeStub({
        id: 'reject-payment-back',
        type: 'terminal',
        packages: ['web'],
      });
      const edge = FlowEdgeStub({ id: 'retry-edge', from: 'reject-payment-back', to: 'cart' });
      const flow = FlowStub({ id: 'payment-flow', nodes: [node], edges: [edge] });

      const result = questToUnitsTransformer({ flows: [flow] });

      const offMapUnits = Object.keys(qaOffMapProbeStatics.byFamily).map((family) =>
        VerificationUnitStub({
          flowId: 'payment-flow',
          kind: 'off-map',
          unitId: family,
          packages: [],
          trackVerdicts: {},
        }),
      );

      expect(result).toStrictEqual(offMapUnits);
    });

    it('EDGE: {two terminal nodes, neither has an outgoing edge} => two terminal units', () => {
      const nodeA = FlowNodeStub({ id: 'order-cancelled', type: 'terminal', packages: ['web'] });
      const nodeB = FlowNodeStub({ id: 'order-shipped', type: 'terminal', packages: ['web'] });
      const flow = FlowStub({ id: 'order-flow', nodes: [nodeA, nodeB], edges: [] });

      const result = questToUnitsTransformer({ flows: [flow] });

      const offMapUnits = Object.keys(qaOffMapProbeStatics.byFamily).map((family) =>
        VerificationUnitStub({
          flowId: 'order-flow',
          kind: 'off-map',
          unitId: family,
          packages: [],
          trackVerdicts: {},
        }),
      );

      expect(result).toStrictEqual([
        VerificationUnitStub({
          flowId: 'order-flow',
          kind: 'terminal',
          unitId: 'order-cancelled',
          nodeId: 'order-cancelled',
          packages: ['web'],
          trackVerdicts: {},
        }),
        VerificationUnitStub({
          flowId: 'order-flow',
          kind: 'terminal',
          unitId: 'order-shipped',
          nodeId: 'order-shipped',
          packages: ['web'],
          trackVerdicts: {},
        }),
        ...offMapUnits,
      ]);
    });
  });

  describe('branch units', () => {
    it('VALID: {labelled edge} => one branch unit', () => {
      const edge = FlowEdgeStub({
        id: 'attach-fails',
        from: 'compose-node',
        to: 'error-node',
        label: 'attach fails',
      });
      const flow = FlowStub({ id: 'send-flow', nodes: [], edges: [edge] });

      const result = questToUnitsTransformer({ flows: [flow] });

      const offMapUnits = Object.keys(qaOffMapProbeStatics.byFamily).map((family) =>
        VerificationUnitStub({
          flowId: 'send-flow',
          kind: 'off-map',
          unitId: family,
          packages: [],
          trackVerdicts: {},
        }),
      );

      expect(result).toStrictEqual([
        VerificationUnitStub({
          flowId: 'send-flow',
          kind: 'branch',
          unitId: 'attach-fails',
          nodeId: 'compose-node->error-node',
          packages: [],
          trackVerdicts: {},
        }),
        ...offMapUnits,
      ]);
    });

    it('INVALID: {unlabelled edge} => no branch unit', () => {
      const edge = FlowEdgeStub({ id: 'plain-edge', from: 'node-a', to: 'node-b' });
      const flow = FlowStub({ id: 'flow-x', nodes: [], edges: [edge] });

      const result = questToUnitsTransformer({ flows: [flow] });

      const offMapUnits = Object.keys(qaOffMapProbeStatics.byFamily).map((family) =>
        VerificationUnitStub({
          flowId: 'flow-x',
          kind: 'off-map',
          unitId: family,
          packages: [],
          trackVerdicts: {},
        }),
      );

      expect(result).toStrictEqual(offMapUnits);
    });
  });

  describe('observable units', () => {
    it('VALID: {verifyByReading: true} => verificationMethod reading', () => {
      const observable = FlowObservableStub({
        id: 'reads-source',
        package: 'web',
        verifyByReading: true,
      });
      const node = FlowNodeStub({
        id: 'compose-node',
        packages: ['web'],
        observables: [observable],
      });
      const flow = FlowStub({ id: 'flow-y', nodes: [node], edges: [] });

      const result = questToUnitsTransformer({ flows: [flow] });

      const offMapUnits = Object.keys(qaOffMapProbeStatics.byFamily).map((family) =>
        VerificationUnitStub({
          flowId: 'flow-y',
          kind: 'off-map',
          unitId: family,
          packages: [],
          trackVerdicts: {},
        }),
      );

      expect(result).toStrictEqual([
        VerificationUnitStub({
          flowId: 'flow-y',
          kind: 'observable',
          unitId: 'reads-source',
          nodeId: 'compose-node',
          packages: ['web'],
          verificationMethod: 'reading',
          trackVerdicts: {},
        }),
        ...offMapUnits,
      ]);
    });

    it('VALID: {no verifyByReading} => verificationMethod test', () => {
      const observable = FlowObservableStub({ id: 'shows-toast', package: 'web' });
      const node = FlowNodeStub({
        id: 'compose-node',
        packages: ['web'],
        observables: [observable],
      });
      const flow = FlowStub({ id: 'flow-z', nodes: [node], edges: [] });

      const result = questToUnitsTransformer({ flows: [flow] });

      const offMapUnits = Object.keys(qaOffMapProbeStatics.byFamily).map((family) =>
        VerificationUnitStub({
          flowId: 'flow-z',
          kind: 'off-map',
          unitId: family,
          packages: [],
          trackVerdicts: {},
        }),
      );

      expect(result).toStrictEqual([
        VerificationUnitStub({
          flowId: 'flow-z',
          kind: 'observable',
          unitId: 'shows-toast',
          nodeId: 'compose-node',
          packages: ['web'],
          verificationMethod: 'test',
          trackVerdicts: {},
        }),
        ...offMapUnits,
      ]);
    });

    it('VALID: {addedBy: siegemaster} => carried through', () => {
      const observable = FlowObservableStub({
        id: 'found-mid-quest',
        package: 'web',
        addedBy: 'siegemaster',
      });
      const node = FlowNodeStub({
        id: 'compose-node',
        packages: ['web'],
        observables: [observable],
      });
      const flow = FlowStub({ id: 'flow-mid', nodes: [node], edges: [] });

      const result = questToUnitsTransformer({ flows: [flow] });

      const offMapUnits = Object.keys(qaOffMapProbeStatics.byFamily).map((family) =>
        VerificationUnitStub({
          flowId: 'flow-mid',
          kind: 'off-map',
          unitId: family,
          packages: [],
          trackVerdicts: {},
        }),
      );

      expect(result).toStrictEqual([
        VerificationUnitStub({
          flowId: 'flow-mid',
          kind: 'observable',
          unitId: 'found-mid-quest',
          nodeId: 'compose-node',
          packages: ['web'],
          addedBy: 'siegemaster',
          trackVerdicts: {},
        }),
        ...offMapUnits,
      ]);
    });

    it('EMPTY: {no addedBy} => absent on the unit', () => {
      const observable = FlowObservableStub({ id: 'in-spec-from-start', package: 'web' });
      const node = FlowNodeStub({
        id: 'compose-node',
        packages: ['web'],
        observables: [observable],
      });
      const flow = FlowStub({ id: 'flow-spec', nodes: [node], edges: [] });

      const result = questToUnitsTransformer({ flows: [flow] });

      const offMapUnits = Object.keys(qaOffMapProbeStatics.byFamily).map((family) =>
        VerificationUnitStub({
          flowId: 'flow-spec',
          kind: 'off-map',
          unitId: family,
          packages: [],
          trackVerdicts: {},
        }),
      );

      expect(result).toStrictEqual([
        VerificationUnitStub({
          flowId: 'flow-spec',
          kind: 'observable',
          unitId: 'in-spec-from-start',
          nodeId: 'compose-node',
          packages: ['web'],
          trackVerdicts: {},
        }),
        ...offMapUnits,
      ]);
    });

    it('EDGE: {two observables on one node} => two observable units, in node order', () => {
      const observableA = FlowObservableStub({ id: 'shows-spinner', package: 'web' });
      const observableB = FlowObservableStub({ id: 'shows-result', package: 'web' });
      const node = FlowNodeStub({
        id: 'compose-node',
        packages: ['web'],
        observables: [observableA, observableB],
      });
      const flow = FlowStub({ id: 'flow-two-obs', nodes: [node], edges: [] });

      const result = questToUnitsTransformer({ flows: [flow] });

      const offMapUnits = Object.keys(qaOffMapProbeStatics.byFamily).map((family) =>
        VerificationUnitStub({
          flowId: 'flow-two-obs',
          kind: 'off-map',
          unitId: family,
          packages: [],
          trackVerdicts: {},
        }),
      );

      expect(result).toStrictEqual([
        VerificationUnitStub({
          flowId: 'flow-two-obs',
          kind: 'observable',
          unitId: 'shows-spinner',
          nodeId: 'compose-node',
          packages: ['web'],
          trackVerdicts: {},
        }),
        VerificationUnitStub({
          flowId: 'flow-two-obs',
          kind: 'observable',
          unitId: 'shows-result',
          nodeId: 'compose-node',
          packages: ['web'],
          trackVerdicts: {},
        }),
        ...offMapUnits,
      ]);
    });
  });

  describe('off-map units', () => {
    it('EDGE: {zero offMapSignoffs entries} => seven units, all trackVerdicts empty', () => {
      const node = FlowNodeStub({ id: 'idle', type: 'state', packages: ['web'] });
      const flow = FlowStub({
        id: 'no-signoffs-flow',
        nodes: [node],
        edges: [],
        offMapSignoffs: [],
      });

      const result = questToUnitsTransformer({ flows: [flow] });

      const offMapUnits = Object.keys(qaOffMapProbeStatics.byFamily).map((family) =>
        VerificationUnitStub({
          flowId: 'no-signoffs-flow',
          kind: 'off-map',
          unitId: family,
          packages: [],
          trackVerdicts: {},
        }),
      );

      expect(result).toStrictEqual(offMapUnits);
    });
  });

  describe('multiple unit kinds in one flow', () => {
    it('VALID: {terminal + observable + labelled edge} => all four kinds, terminal/observable/branch/off-map order', () => {
      const terminalNode = FlowNodeStub({
        id: 'confirm-done',
        type: 'terminal',
        packages: ['web'],
      });
      const observableNode = FlowNodeStub({
        id: 'compose-node',
        type: 'state',
        packages: ['web'],
        observables: [FlowObservableStub({ id: 'shows-thumbnail', package: 'web' })],
      });
      const edge = FlowEdgeStub({
        id: 'attach-fails',
        from: 'compose-node',
        to: 'error-node',
        label: 'attach fails',
      });
      const flow = FlowStub({
        id: 'combo-flow',
        nodes: [terminalNode, observableNode],
        edges: [edge],
      });

      const result = questToUnitsTransformer({ flows: [flow] });

      const offMapUnits = Object.keys(qaOffMapProbeStatics.byFamily).map((family) =>
        VerificationUnitStub({
          flowId: 'combo-flow',
          kind: 'off-map',
          unitId: family,
          packages: [],
          trackVerdicts: {},
        }),
      );

      expect(result).toStrictEqual([
        VerificationUnitStub({
          flowId: 'combo-flow',
          kind: 'terminal',
          unitId: 'confirm-done',
          nodeId: 'confirm-done',
          packages: ['web'],
          trackVerdicts: {},
        }),
        VerificationUnitStub({
          flowId: 'combo-flow',
          kind: 'observable',
          unitId: 'shows-thumbnail',
          nodeId: 'compose-node',
          packages: ['web'],
          trackVerdicts: {},
        }),
        VerificationUnitStub({
          flowId: 'combo-flow',
          kind: 'branch',
          unitId: 'attach-fails',
          nodeId: 'compose-node->error-node',
          packages: [],
          trackVerdicts: {},
        }),
        ...offMapUnits,
      ]);
    });
  });

  describe('multiple flows', () => {
    it('VALID: {two flows} => units from both, each carrying its own flowId', () => {
      const flowA = FlowStub({ id: 'flow-a', nodes: [], edges: [] });
      const flowB = FlowStub({ id: 'flow-b', nodes: [], edges: [] });

      const result = questToUnitsTransformer({ flows: [flowA, flowB] });

      const offMapUnitsA = Object.keys(qaOffMapProbeStatics.byFamily).map((family) =>
        VerificationUnitStub({
          flowId: 'flow-a',
          kind: 'off-map',
          unitId: family,
          packages: [],
          trackVerdicts: {},
        }),
      );
      const offMapUnitsB = Object.keys(qaOffMapProbeStatics.byFamily).map((family) =>
        VerificationUnitStub({
          flowId: 'flow-b',
          kind: 'off-map',
          unitId: family,
          packages: [],
          trackVerdicts: {},
        }),
      );

      expect(result).toStrictEqual([...offMapUnitsA, ...offMapUnitsB]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {flows: []} => []', () => {
      const result = questToUnitsTransformer({ flows: [] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {flow with no nodes and no edges} => exactly seven units, all off-map', () => {
      const flow = FlowStub({ id: 'bare-flow', nodes: [], edges: [] });

      const result = questToUnitsTransformer({ flows: [flow] });

      const offMapUnits = Object.keys(qaOffMapProbeStatics.byFamily).map((family) =>
        VerificationUnitStub({
          flowId: 'bare-flow',
          kind: 'off-map',
          unitId: family,
          packages: [],
          trackVerdicts: {},
        }),
      );

      expect(result).toStrictEqual(offMapUnits);
    });
  });
});
