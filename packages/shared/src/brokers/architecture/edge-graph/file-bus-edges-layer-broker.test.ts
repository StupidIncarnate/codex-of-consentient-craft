import { fileBusEdgesLayerBroker } from './file-bus-edges-layer-broker';
import { fileBusEdgesLayerBrokerProxy } from './file-bus-edges-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });

const WRITER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/orchestrator/src/brokers/chat/subagent-tail/chat-subagent-tail-broker.ts',
});
const WATCHER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/brokers/quest/outbox-watch/quest-outbox-watch-broker.ts',
});
const PROXY_FILE = AbsoluteFilePathStub({
  value:
    '/repo/packages/orchestrator/src/brokers/chat/subagent-tail/chat-subagent-tail-broker.proxy.ts',
});
const STUB_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/shared/src/contracts/file-bus-edge/file-bus-edge.stub.ts',
});
const TEST_FILE = AbsoluteFilePathStub({
  value:
    '/repo/packages/orchestrator/src/brokers/chat/subagent-tail/chat-subagent-tail-broker.test.ts',
});

describe('fileBusEdgesLayerBroker', () => {
  describe('writer detection', () => {
    it('VALID: {file with fsAppendFileAdapter and literal path} => detected as writer', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: WRITER_FILE,
            source: ContentTextStub({
              value:
                "await fsAppendFileAdapter({ filePath: '/repo/.dungeonmaster/quests/quest.jsonl', content: line });",
            }),
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          filePath: '/repo/.dungeonmaster/quests/quest.jsonl',
          writerFile: WRITER_FILE,
          watcherFile: null,
          paired: false,
        },
      ]);
    });

    it('VALID: {file with fsWriteFileAdapter and literal path} => detected as writer', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: WRITER_FILE,
            source: ContentTextStub({
              value:
                "await fsWriteFileAdapter({ filePath: '/repo/.dungeonmaster/event-outbox.jsonl', content: data });",
            }),
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          filePath: '/repo/.dungeonmaster/event-outbox.jsonl',
          writerFile: WRITER_FILE,
          watcherFile: null,
          paired: false,
        },
      ]);
    });
  });

  describe('watcher detection', () => {
    it('VALID: {file with fsWatchTailAdapter and literal path} => detected as watcher', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: WATCHER_FILE,
            source: ContentTextStub({
              value:
                "fsWatchTailAdapter({ filePath: '/repo/.dungeonmaster/quests/quest.jsonl', onLine });",
            }),
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          filePath: '/repo/.dungeonmaster/quests/quest.jsonl',
          writerFile: null,
          watcherFile: WATCHER_FILE,
          paired: false,
        },
      ]);
    });
  });

  describe('pairing', () => {
    it('VALID: {writer + watcher on same literal path} => paired=true', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: WRITER_FILE,
            source: ContentTextStub({
              value:
                "await fsAppendFileAdapter({ filePath: '/repo/.dungeonmaster/quests/quest.jsonl', content: line });",
            }),
          },
          {
            path: WATCHER_FILE,
            source: ContentTextStub({
              value:
                "fsWatchTailAdapter({ filePath: '/repo/.dungeonmaster/quests/quest.jsonl', onLine });",
            }),
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          filePath: '/repo/.dungeonmaster/quests/quest.jsonl',
          writerFile: WRITER_FILE,
          watcherFile: WATCHER_FILE,
          paired: true,
        },
      ]);
    });

    it('VALID: {writer only, no watcher} => paired=false, watcherFile=null', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: WRITER_FILE,
            source: ContentTextStub({
              value:
                "await fsWriteFileAdapter({ filePath: '/repo/.dungeonmaster/event-outbox.jsonl', content: data });",
            }),
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          filePath: '/repo/.dungeonmaster/event-outbox.jsonl',
          writerFile: WRITER_FILE,
          watcherFile: null,
          paired: false,
        },
      ]);
    });

    it('VALID: {watcher only, no writer} => writerFile=null and paired=false', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: WATCHER_FILE,
            source: ContentTextStub({
              value:
                "fsWatchTailAdapter({ filePath: '/repo/.dungeonmaster/event-outbox.jsonl', onLine });",
            }),
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          filePath: '/repo/.dungeonmaster/event-outbox.jsonl',
          writerFile: null,
          watcherFile: WATCHER_FILE,
          paired: false,
        },
      ]);
    });
  });

  describe('computed path matching', () => {
    it('VALID: {writer and watcher both use same computed broker reference} => paired=true', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: WRITER_FILE,
            source: ContentTextStub({
              value:
                'await fsAppendFileAdapter({ filePath: questPathBroker(questId), content: line });',
            }),
          },
          {
            path: WATCHER_FILE,
            source: ContentTextStub({
              value: 'fsWatchTailAdapter({ filePath: questPathBroker(questId), onLine });',
            }),
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          filePath: '<computed: questPathBroker>',
          writerFile: WRITER_FILE,
          watcherFile: WATCHER_FILE,
          paired: true,
        },
      ]);
    });
  });

  describe('test/proxy/stub file filtering', () => {
    it('VALID: {proxy file contains write call} => filtered out, produces no writer', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: PROXY_FILE,
            source: ContentTextStub({
              value:
                "await fsAppendFileAdapter({ filePath: '/repo/.dungeonmaster/quests/quest.jsonl', content: line });",
            }),
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {stub file contains watch call} => filtered out, produces no watcher', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: STUB_FILE,
            source: ContentTextStub({
              value:
                "fsWatchTailAdapter({ filePath: '/repo/.dungeonmaster/quests/quest.jsonl', onLine });",
            }),
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {test file contains write call} => filtered out, produces no writer', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();

      proxy.setup({
        sourceFiles: [
          {
            path: TEST_FILE,
            source: ContentTextStub({
              value:
                "await fsWriteFileAdapter({ filePath: '/repo/.dungeonmaster/quests/quest.jsonl', content: data });",
            }),
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty source files', () => {
    it('EMPTY: {no source files} => returns empty array', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();

      proxy.setup({ sourceFiles: [] });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });
});
