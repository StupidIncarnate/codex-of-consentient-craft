import { architectureStateWritesBroker } from './architecture-state-writes-broker';
import { architectureStateWritesBrokerProxy } from './architecture-state-writes-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('architectureStateWritesBroker', () => {
  describe('in-memory stores', () => {
    it('VALID: {state dir imported by a broker} => lists that store in inMemoryStores', () => {
      const proxy = architectureStateWritesBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' });
      const srcFile = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/design-process-broker.ts',
      });

      proxy.setupSourceFiles({
        filePaths: [srcFile],
        contents: [
          ContentTextStub({
            value: `import { designProcessState } from '../../state/design-process/design-process-state';`,
          }),
        ],
        stateDirNames: ['design-process'],
      });

      const result = architectureStateWritesBroker({ packageRoot });

      expect(result).toStrictEqual({
        inMemoryStores: ['design-process'],
        fileWrites: [],
        browserStorageWrites: [],
      });
    });

    it('VALID: {state dir NOT imported by any file} => not included in inMemoryStores', () => {
      const proxy = architectureStateWritesBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' });
      const srcFile = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/some-broker.ts',
      });

      proxy.setupSourceFiles({
        filePaths: [srcFile],
        contents: [
          ContentTextStub({
            value: `import { otherBroker } from '../../brokers/other/other-broker';`,
          }),
        ],
        stateDirNames: ['orphaned-store'],
      });

      const result = architectureStateWritesBroker({ packageRoot });

      expect(result).toStrictEqual({
        inMemoryStores: [],
        fileWrites: [],
        browserStorageWrites: [],
      });
    });
  });

  describe('file writes', () => {
    it('VALID: {fsAppendFileAdapter with literal path} => included in fileWrites sorted', () => {
      const proxy = architectureStateWritesBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' });
      const srcFile = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/append-broker.ts',
      });

      proxy.setupSourceFiles({
        filePaths: [srcFile],
        contents: [
          ContentTextStub({
            value: `await fsAppendFileAdapter({ filePath: '/data/event-outbox.jsonl', data });`,
          }),
        ],
        stateDirNames: [],
      });

      const result = architectureStateWritesBroker({ packageRoot });

      expect(result).toStrictEqual({
        inMemoryStores: [],
        fileWrites: ['/data/event-outbox.jsonl'],
        browserStorageWrites: [],
      });
    });

    it('VALID: {fsWriteFileAdapter with literal path} => included in fileWrites', () => {
      const proxy = architectureStateWritesBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' });
      const srcFile = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/write-broker.ts',
      });

      proxy.setupSourceFiles({
        filePaths: [srcFile],
        contents: [
          ContentTextStub({
            value: `await fsWriteFileAdapter({ filePath: '/data/quest.json', content });`,
          }),
        ],
        stateDirNames: [],
      });

      const result = architectureStateWritesBroker({ packageRoot });

      expect(result).toStrictEqual({
        inMemoryStores: [],
        fileWrites: ['/data/quest.json'],
        browserStorageWrites: [],
      });
    });

    it('VALID: {fsMkdirAdapter with broker-call arg} => emits computed entry after literals', () => {
      const proxy = architectureStateWritesBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' });
      const srcFile = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/mkdir-broker.ts',
      });

      proxy.setupSourceFiles({
        filePaths: [srcFile],
        contents: [
          ContentTextStub({
            value: `await fsMkdirAdapter({ filePath: questDirBroker(questId) });`,
          }),
        ],
        stateDirNames: [],
      });

      const result = architectureStateWritesBroker({ packageRoot });

      expect(result).toStrictEqual({
        inMemoryStores: [],
        fileWrites: ['<computed: questDirBroker>'],
        browserStorageWrites: [],
      });
    });

    it('VALID: {literal paths from one file} => sorted ascending with no duplicates', () => {
      const proxy = architectureStateWritesBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' });
      const srcFile = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/broker-a.ts',
      });

      proxy.setupSourceFiles({
        filePaths: [srcFile],
        contents: [
          ContentTextStub({
            value: [
              `await fsWriteFileAdapter({ filePath: '/z-quest.json', content });`,
              `await fsAppendFileAdapter({ filePath: '/a-outbox.jsonl', data });`,
              `await fsWriteFileAdapter({ filePath: '/z-quest.json', content });`,
            ].join('\n'),
          }),
        ],
        stateDirNames: [],
      });

      const result = architectureStateWritesBroker({ packageRoot });

      expect(result).toStrictEqual({
        inMemoryStores: [],
        fileWrites: ['/a-outbox.jsonl', '/z-quest.json'],
        browserStorageWrites: [],
      });
    });
  });

  describe('browser storage', () => {
    it('VALID: {localStorage.setItem in non-helper file} => listed in browserStorageWrites', () => {
      const proxy = architectureStateWritesBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/web' });
      const srcFile = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/session-adapter.ts',
      });

      proxy.setupSourceFiles({
        filePaths: [srcFile],
        contents: [
          ContentTextStub({
            value: `localStorage.setItem('session-id', value);`,
          }),
        ],
        stateDirNames: [],
      });

      const result = architectureStateWritesBroker({ packageRoot });

      expect(result).toStrictEqual({
        inMemoryStores: [],
        fileWrites: [],
        browserStorageWrites: ['localStorage: session-id'],
      });
    });
  });

  describe('test file filtering', () => {
    it('VALID: {test file name in source tree} => filtered out, not counted', () => {
      const proxy = architectureStateWritesBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' });
      // The .test.ts extension causes listSourceFilesLayerBroker to exclude this file
      const testFile = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/append-broker.test.ts',
      });

      proxy.setupSourceFiles({
        filePaths: [testFile],
        contents: [],
        stateDirNames: [],
      });

      const result = architectureStateWritesBroker({ packageRoot });

      expect(result).toStrictEqual({
        inMemoryStores: [],
        fileWrites: [],
        browserStorageWrites: [],
      });
    });
  });

  describe('empty package', () => {
    it('EMPTY: {package with no source files} => returns all empty arrays', () => {
      const proxy = architectureStateWritesBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/empty' });

      proxy.setupEmpty();

      const result = architectureStateWritesBroker({ packageRoot });

      expect(result).toStrictEqual({
        inMemoryStores: [],
        fileWrites: [],
        browserStorageWrites: [],
      });
    });
  });
});
