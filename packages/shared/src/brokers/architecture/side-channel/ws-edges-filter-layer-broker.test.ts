import { wsEdgesFilterLayerBroker } from './ws-edges-filter-layer-broker';
import { wsEdgesFilterLayerBrokerProxy } from './ws-edges-filter-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { WsEdgeStub } from '../../../contracts/ws-edge/ws-edge.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' });
const OTHER_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/server' });

const EMITTER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/orchestrator/src/state/orchestration-events/orchestration-events-state.ts',
});
const CONSUMER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/adapters/orchestrator/events-on/events-on-adapter.ts',
});

describe('wsEdgesFilterLayerBroker', () => {
  describe('no edges', () => {
    it('EMPTY: {no ws edges} => returns empty emitter and consumer arrays', () => {
      wsEdgesFilterLayerBrokerProxy();

      const result = wsEdgesFilterLayerBroker({ wsEdges: [], packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual({ emitterEdges: [], consumerEdges: [] });
    });
  });

  describe('emitter in package', () => {
    it('VALID: {emitter file under packageRoot} => appears in emitterEdges, not consumerEdges', () => {
      wsEdgesFilterLayerBrokerProxy();
      const edge = WsEdgeStub({ emitterFile: EMITTER_FILE, consumerFiles: [CONSUMER_FILE] });

      const result = wsEdgesFilterLayerBroker({ wsEdges: [edge], packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual({ emitterEdges: [edge], consumerEdges: [] });
    });
  });

  describe('consumer in package', () => {
    it('VALID: {consumer file under packageRoot, emitter elsewhere} => appears in consumerEdges', () => {
      wsEdgesFilterLayerBrokerProxy();
      const edge = WsEdgeStub({ emitterFile: EMITTER_FILE, consumerFiles: [CONSUMER_FILE] });

      const result = wsEdgesFilterLayerBroker({ wsEdges: [edge], packageRoot: OTHER_ROOT });

      expect(result).toStrictEqual({ emitterEdges: [], consumerEdges: [edge] });
    });
  });

  describe('unrelated package', () => {
    it('EMPTY: {no files under packageRoot} => returns empty arrays', () => {
      wsEdgesFilterLayerBrokerProxy();
      const unrelatedRoot = AbsoluteFilePathStub({ value: '/repo/packages/web' });
      const edge = WsEdgeStub({ emitterFile: EMITTER_FILE, consumerFiles: [CONSUMER_FILE] });

      const result = wsEdgesFilterLayerBroker({ wsEdges: [edge], packageRoot: unrelatedRoot });

      expect(result).toStrictEqual({ emitterEdges: [], consumerEdges: [] });
    });
  });

  describe('emitter takes priority over consumer for same package', () => {
    it('VALID: {edge emitted AND consumed by same package} => only in emitterEdges', () => {
      wsEdgesFilterLayerBrokerProxy();
      const samePackageConsumer = AbsoluteFilePathStub({
        value:
          '/repo/packages/orchestrator/src/brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker.ts',
      });
      const edge = WsEdgeStub({
        emitterFile: EMITTER_FILE,
        consumerFiles: [samePackageConsumer],
      });

      const result = wsEdgesFilterLayerBroker({ wsEdges: [edge], packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual({ emitterEdges: [edge], consumerEdges: [] });
    });
  });
});
