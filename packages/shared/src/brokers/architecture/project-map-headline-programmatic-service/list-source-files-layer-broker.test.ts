import { listSourceFilesLayerBroker } from './list-source-files-layer-broker';
import { listSourceFilesLayerBrokerProxy } from './list-source-files-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

const DIR_PATH = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator/src' });

describe('listSourceFilesLayerBroker', () => {
  describe('empty directory', () => {
    it('EMPTY: {empty dir} => returns empty array', () => {
      const proxy = listSourceFilesLayerBrokerProxy();
      proxy.setupEmpty();

      const result = listSourceFilesLayerBroker({ dirPath: DIR_PATH });

      expect(result).toStrictEqual([]);
    });
  });

  describe('directory with source files', () => {
    it('VALID: {two .ts files in flat dir} => returns both paths', () => {
      const proxy = listSourceFilesLayerBrokerProxy();
      const file1 = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/quest-broker.ts',
      });
      const file2 = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/guild-broker.ts',
      });
      proxy.setupFlatDirectory({ filePaths: [file1, file2] });

      const result = listSourceFilesLayerBroker({ dirPath: DIR_PATH });

      expect(result.map(String)).toStrictEqual([
        '/repo/packages/orchestrator/src/quest-broker.ts',
        '/repo/packages/orchestrator/src/guild-broker.ts',
      ]);
    });

    it('VALID: {test file present} => test file excluded from results', () => {
      const proxy = listSourceFilesLayerBrokerProxy();
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/quest-broker.ts',
      });
      const testFile = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/quest-broker.test.ts',
      });
      proxy.setupFlatDirectory({ filePaths: [sourceFile, testFile] });

      const result = listSourceFilesLayerBroker({ dirPath: DIR_PATH });

      expect(result.map(String)).toStrictEqual(['/repo/packages/orchestrator/src/quest-broker.ts']);
    });
  });
});
