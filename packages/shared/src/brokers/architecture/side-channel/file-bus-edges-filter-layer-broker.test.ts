import { fileBusEdgesFilterLayerBroker } from './file-bus-edges-filter-layer-broker';
import { fileBusEdgesFilterLayerBrokerProxy } from './file-bus-edges-filter-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { FileBusEdgeStub } from '../../../contracts/file-bus-edge/file-bus-edge.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' });
const SERVER_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/server' });

const WRITER_FILE = AbsoluteFilePathStub({
  value:
    '/repo/packages/orchestrator/src/brokers/quest/outbox-append/quest-outbox-append-broker.ts',
});
const WATCHER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/adapters/orchestrator/outbox-watch/outbox-watch-adapter.ts',
});

describe('fileBusEdgesFilterLayerBroker', () => {
  describe('no edges', () => {
    it('EMPTY: {no file-bus edges} => returns empty writer and watcher arrays', () => {
      fileBusEdgesFilterLayerBrokerProxy();

      const result = fileBusEdgesFilterLayerBroker({ fileBusEdges: [], packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual({ writerEdges: [], watcherEdges: [] });
    });
  });

  describe('writer in package', () => {
    it('VALID: {writer file under packageRoot} => appears in writerEdges', () => {
      fileBusEdgesFilterLayerBrokerProxy();
      const edge = FileBusEdgeStub({ writerFile: WRITER_FILE, watcherFile: WATCHER_FILE });

      const result = fileBusEdgesFilterLayerBroker({
        fileBusEdges: [edge],
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual({ writerEdges: [edge], watcherEdges: [] });
    });
  });

  describe('watcher in package', () => {
    it('VALID: {watcher file under packageRoot} => appears in watcherEdges', () => {
      fileBusEdgesFilterLayerBrokerProxy();
      const edge = FileBusEdgeStub({ writerFile: WRITER_FILE, watcherFile: WATCHER_FILE });

      const result = fileBusEdgesFilterLayerBroker({
        fileBusEdges: [edge],
        packageRoot: SERVER_ROOT,
      });

      expect(result).toStrictEqual({ writerEdges: [], watcherEdges: [edge] });
    });
  });

  describe('unrelated package', () => {
    it('EMPTY: {no files under packageRoot} => returns empty arrays', () => {
      fileBusEdgesFilterLayerBrokerProxy();
      const unrelatedRoot = AbsoluteFilePathStub({ value: '/repo/packages/web' });
      const edge = FileBusEdgeStub({ writerFile: WRITER_FILE, watcherFile: WATCHER_FILE });

      const result = fileBusEdgesFilterLayerBroker({
        fileBusEdges: [edge],
        packageRoot: unrelatedRoot,
      });

      expect(result).toStrictEqual({ writerEdges: [], watcherEdges: [] });
    });
  });
});
