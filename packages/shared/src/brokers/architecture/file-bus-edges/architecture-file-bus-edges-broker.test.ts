import { architectureFileBusEdgesBroker } from './architecture-file-bus-edges-broker';
import { architectureFileBusEdgesBrokerProxy } from './architecture-file-bus-edges-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { FileBusEdgeStub } from '../../../contracts/file-bus-edge/file-bus-edge.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const WRITER_FILE = AbsoluteFilePathStub({
  value:
    '/repo/packages/orchestrator/src/brokers/quest/outbox-append/quest-outbox-append-broker.ts',
});
const WATCHER_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/adapters/orchestrator/outbox-watch/outbox-watch-adapter.ts',
});

describe('architectureFileBusEdgesBroker', () => {
  describe('no source files', () => {
    it('EMPTY: {no files} => returns empty array', () => {
      const proxy = architectureFileBusEdgesBrokerProxy();
      proxy.setup({ sourceFiles: [] });

      const result = architectureFileBusEdgesBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('writer and watcher present', () => {
    it('VALID: {writer + watcher same path} => returns paired edge', () => {
      const proxy = architectureFileBusEdgesBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: WRITER_FILE,
            source: ContentTextStub({
              value: 'fsAppendFileAdapter({ filePath: outboxPath, content: line });',
            }),
          },
          {
            path: WATCHER_FILE,
            source: ContentTextStub({
              value: 'fsWatchTailAdapter({ filePath: outboxPath, onLine });',
            }),
          },
        ],
      });

      const result = architectureFileBusEdgesBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        FileBusEdgeStub({
          filePath: ContentTextStub({ value: '<computed: outboxPath>' }),
          writerFile: WRITER_FILE,
          watcherFile: WATCHER_FILE,
          paired: true,
        }),
      ]);
    });

    it('VALID: {writer only, no watcher} => returns unpaired edge', () => {
      const proxy = architectureFileBusEdgesBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: WRITER_FILE,
            source: ContentTextStub({
              value: 'fsAppendFileAdapter({ filePath: outboxPath, content: line });',
            }),
          },
        ],
      });

      const result = architectureFileBusEdgesBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        FileBusEdgeStub({
          filePath: ContentTextStub({ value: '<computed: outboxPath>' }),
          writerFile: WRITER_FILE,
          watcherFile: null,
          paired: false,
        }),
      ]);
    });
  });
});
