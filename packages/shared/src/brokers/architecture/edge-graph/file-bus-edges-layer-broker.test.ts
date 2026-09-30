import { fileBusEdgesLayerBroker } from './file-bus-edges-layer-broker';
import { fileBusEdgesLayerBrokerProxy } from './file-bus-edges-layer-broker.proxy';

const PROJECT_ROOT = '/repo';

const WRITER_FILE = '/repo/packages/orchestrator/src/brokers/quest/outbox-append/quest-outbox-append-broker.ts';
const READER_FILE = '/repo/packages/orchestrator/src/brokers/quest/outbox-watch/quest-outbox-watch-broker.ts';
const TEST_FILE = '/repo/packages/orchestrator/src/brokers/quest/outbox-append/quest-outbox-append-broker.test.ts';

const PROMISES_IMPORT = "import { appendFile } from '#gateway/node/fs__promises';";
const TAIL_IMPORT = "import { tailFile } from '#gateway/node/fs';";

describe('fileBusEdgesLayerBroker', () => {
  describe('paired edges', () => {
    it('VALID: {writer and reader name the path with different variables, same locationsStatics key} => one paired edge', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: WRITER_FILE,
            source: [
                PROMISES_IMPORT,
                'const outboxFilePath = join(homePath, locationsStatics.dungeonmasterHome.eventOutbox);',
                'await appendFile(outboxFilePath, line);',
              ].join('\n'),
          },
          {
            path: READER_FILE,
            source: [
                TAIL_IMPORT,
                'const outboxPath = join(homePath, locationsStatics.dungeonmasterHome.eventOutbox);',
                "tailFile({ path: outboxPath, startPosition: 'end', onLine });",
              ].join('\n'),
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          filePath: '<computed: locationsStatics.dungeonmasterHome.eventOutbox>',
          writerFile: WRITER_FILE,
          watcherFile: READER_FILE,
          paired: true,
        },
      ]);
    });

    it('VALID: {literal path on both sides} => one paired edge', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: WRITER_FILE,
            source: `${PROMISES_IMPORT}\nawait appendFile('/data/bus.jsonl', line);`,
          },
          {
            path: READER_FILE,
            source: `${TAIL_IMPORT}\ntailFile({ path: '/data/bus.jsonl', onLine });`,
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          filePath: '/data/bus.jsonl',
          writerFile: WRITER_FILE,
          watcherFile: READER_FILE,
          paired: true,
        },
      ]);
    });
  });

  describe('several writers', () => {
    it('VALID: {two writers, one reader on the same path} => one paired edge per writer', () => {
      const otherWriter = '/repo/packages/hydration-recipes/src/brokers/quest/persist-direct/persist.ts';
      const proxy = fileBusEdgesLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: otherWriter,
            source: `${PROMISES_IMPORT}\nawait appendFile('/data/bus.jsonl', line);`,
          },
          {
            path: WRITER_FILE,
            source: `${PROMISES_IMPORT}\nawait appendFile('/data/bus.jsonl', line);`,
          },
          {
            path: READER_FILE,
            source: `${TAIL_IMPORT}\ntailFile({ path: '/data/bus.jsonl', onLine });`,
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          filePath: '/data/bus.jsonl',
          writerFile: otherWriter,
          watcherFile: READER_FILE,
          paired: true,
        },
        {
          filePath: '/data/bus.jsonl',
          writerFile: WRITER_FILE,
          watcherFile: READER_FILE,
          paired: true,
        },
      ]);
    });
  });

  describe('reader own touch', () => {
    it('VALID: {reader also appends an empty string to create the file} => writer is the other file', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: READER_FILE,
            source: [
                PROMISES_IMPORT,
                TAIL_IMPORT,
                "await appendFile('/data/bus.jsonl', '');",
                "tailFile({ path: '/data/bus.jsonl', onLine });",
              ].join('\n'),
          },
          {
            path: WRITER_FILE,
            source: `${PROMISES_IMPORT}\nawait appendFile('/data/bus.jsonl', line);`,
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          filePath: '/data/bus.jsonl',
          writerFile: WRITER_FILE,
          watcherFile: READER_FILE,
          paired: true,
        },
      ]);
    });

    it('VALID: {only the reader touches the path} => unpaired edge with no writer', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: READER_FILE,
            source: [
                PROMISES_IMPORT,
                TAIL_IMPORT,
                "await appendFile('/data/bus.jsonl', '');",
                "tailFile({ path: '/data/bus.jsonl', onLine });",
              ].join('\n'),
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          filePath: '/data/bus.jsonl',
          writerFile: null,
          watcherFile: READER_FILE,
          paired: false,
        },
      ]);
    });
  });

  describe('unpaired and ignored sources', () => {
    it('VALID: {writer with no reader} => unpaired edge with no watcher', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: WRITER_FILE,
            source: `${PROMISES_IMPORT}\nawait appendFile('/data/lonely.jsonl', line);`,
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          filePath: '/data/lonely.jsonl',
          writerFile: WRITER_FILE,
          watcherFile: null,
          paired: false,
        },
      ]);
    });

    it('VALID: {ensureDir call} => not a bus writer', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: WRITER_FILE,
            source: "import { ensureDir } from '#gateway/node/fs__promises';\nawait ensureDir('/data/dir');",
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {test file with a matching call} => skipped', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: TEST_FILE,
            source: `${PROMISES_IMPORT}\nawait appendFile('/data/bus.jsonl', line);`,
          },
        ],
      });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {no source files} => returns empty array', () => {
      const proxy = fileBusEdgesLayerBrokerProxy();
      proxy.setup({ sourceFiles: [] });

      const result = fileBusEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });
});
