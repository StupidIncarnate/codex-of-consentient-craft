import { sideChannelRenderLayerBroker } from './side-channel-render-layer-broker';
import { sideChannelRenderLayerBrokerProxy } from './side-channel-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { WsEdgeStub } from '../../../contracts/ws-edge/ws-edge.stub';
import { FileBusEdgeStub } from '../../../contracts/file-bus-edge/file-bus-edge.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const PACKAGE_NAME = ContentTextStub({ value: '@dungeonmaster/orchestrator' });

const EMITTER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/orchestrator/src/state/orchestration-events/orchestration-events-state.ts',
});
const CONSUMER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/adapters/orchestrator/events-on/events-on-adapter.ts',
});
const WRITER_FILE = AbsoluteFilePathStub({
  value:
    '/repo/packages/orchestrator/src/brokers/quest/outbox-append/quest-outbox-append-broker.ts',
});
const WATCHER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/adapters/orchestrator/outbox-watch/outbox-watch-adapter.ts',
});

describe('sideChannelRenderLayerBroker', () => {
  describe('WS emitter with single event', () => {
    it('VALID: {one emit edge} => renders package name line and event type line', () => {
      sideChannelRenderLayerBrokerProxy();
      const edge = WsEdgeStub({
        eventType: ContentTextStub({ value: 'chat-output' }),
        emitterFile: EMITTER_FILE,
        consumerFiles: [CONSUMER_FILE],
        paired: true,
      });

      const result = sideChannelRenderLayerBroker({
        wsEmitterEdges: [edge],
        wsConsumerEdges: [],
        fileBusWriterEdges: [],
        fileBusWatcherEdges: [],
        projectRoot: PROJECT_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe('@dungeonmaster/orchestrator');
      expect(lines.some((l) => l === '  │    event types: chat-output')).toBe(true);
    });
  });

  describe('WS emitter with multiple events from same file', () => {
    it('VALID: {two emit edges for same emitter file} => renders all event types', () => {
      sideChannelRenderLayerBrokerProxy();
      const edge1 = WsEdgeStub({
        eventType: ContentTextStub({ value: 'chat-output' }),
        emitterFile: EMITTER_FILE,
        consumerFiles: [CONSUMER_FILE],
        paired: true,
      });
      const edge2 = WsEdgeStub({
        eventType: ContentTextStub({ value: 'quest-modified' }),
        emitterFile: EMITTER_FILE,
        consumerFiles: [CONSUMER_FILE],
        paired: true,
      });

      const result = sideChannelRenderLayerBroker({
        wsEmitterEdges: [edge1, edge2],
        wsConsumerEdges: [],
        fileBusWriterEdges: [],
        fileBusWatcherEdges: [],
        projectRoot: PROJECT_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '  │    event types: chat-output')).toBe(true);
      expect(lines.some((l) => l === '  │                 quest-modified')).toBe(true);
    });
  });

  describe('file-bus writer edge', () => {
    it('VALID: {file-bus writer edge} => renders appends line', () => {
      sideChannelRenderLayerBrokerProxy();
      const edge = FileBusEdgeStub({
        filePath: ContentTextStub({ value: '/repo/.dungeonmaster/quests/quest.jsonl' }),
        writerFile: WRITER_FILE,
        watcherFile: WATCHER_FILE,
        paired: true,
      });

      const result = sideChannelRenderLayerBroker({
        wsEmitterEdges: [],
        wsConsumerEdges: [],
        fileBusWriterEdges: [edge],
        fileBusWatcherEdges: [],
        projectRoot: PROJECT_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some(
          (l) =>
            l ===
            '  └─ orchestrator/brokers/quest/outbox-append/quest-outbox-append-broker appends /repo/.dungeonmaster/quests/quest.jsonl',
        ),
      ).toBe(true);
    });
  });

  describe('consumer-only package', () => {
    it('VALID: {consumer edge, no emitter} => renders subscriber section without header block', () => {
      sideChannelRenderLayerBrokerProxy();
      const edge = WsEdgeStub({
        eventType: ContentTextStub({ value: 'chat-output' }),
        emitterFile: EMITTER_FILE,
        consumerFiles: [CONSUMER_FILE],
        paired: true,
      });

      const result = sideChannelRenderLayerBroker({
        wsEmitterEdges: [],
        wsConsumerEdges: [edge],
        fileBusWriterEdges: [],
        fileBusWatcherEdges: [],
        projectRoot: PROJECT_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some(
          (l) =>
            l ===
            'server/adapters/orchestrator/events-on/events-on-adapter        (in-memory bus subscriber)',
        ),
      ).toBe(true);
    });
  });

  describe('all empty', () => {
    it('EMPTY: {no edges} => returns empty string', () => {
      sideChannelRenderLayerBrokerProxy();

      const result = sideChannelRenderLayerBroker({
        wsEmitterEdges: [],
        wsConsumerEdges: [],
        fileBusWriterEdges: [],
        fileBusWatcherEdges: [],
        projectRoot: PROJECT_ROOT,
        packageName: PACKAGE_NAME,
      });

      expect(String(result)).toBe('');
    });
  });
});
