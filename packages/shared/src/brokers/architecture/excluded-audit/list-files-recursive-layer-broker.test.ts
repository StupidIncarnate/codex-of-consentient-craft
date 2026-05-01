import { listFilesRecursiveLayerBroker } from './list-files-recursive-layer-broker';
import { listFilesRecursiveLayerBrokerProxy } from './list-files-recursive-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

const DIR_PATH = AbsoluteFilePathStub({ value: '/repo/packages/shared/src/guards' });

describe('listFilesRecursiveLayerBroker', () => {
  describe('empty directory', () => {
    it('EMPTY: {no files} => returns empty array', () => {
      const proxy = listFilesRecursiveLayerBrokerProxy();
      proxy.setupEmpty();

      const result = listFilesRecursiveLayerBroker({ dirPath: DIR_PATH });

      expect(result).toStrictEqual([]);
    });
  });

  describe('flat directory with implementation files', () => {
    it('VALID: {single non-test file} => returns that file path', () => {
      const proxy = listFilesRecursiveLayerBrokerProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/shared/src/guards/is-non-test-file-guard.ts',
      });
      proxy.setupFlatDirectory({ filePaths: [filePath] });

      const result = listFilesRecursiveLayerBroker({ dirPath: DIR_PATH });

      expect(result).toStrictEqual([
        AbsoluteFilePathStub({
          value: `${String(DIR_PATH)}/is-non-test-file-guard.ts`,
        }),
      ]);
    });

    it('VALID: {test file only} => returns empty array (test filtered)', () => {
      const proxy = listFilesRecursiveLayerBrokerProxy();
      const testFile = AbsoluteFilePathStub({
        value: '/repo/packages/shared/src/guards/is-non-test-file-guard.test.ts',
      });
      proxy.setupFlatDirectory({ filePaths: [testFile] });

      const result = listFilesRecursiveLayerBroker({ dirPath: DIR_PATH });

      expect(result).toStrictEqual([]);
    });
  });

  describe('nested directory tree', () => {
    it('VALID: {files nested under subfolders} => returns all non-test files recursively', () => {
      const proxy = listFilesRecursiveLayerBrokerProxy();
      const implFile = AbsoluteFilePathStub({
        value: '/repo/packages/shared/src/guards/is-non-test-file/is-non-test-file-guard.ts',
      });
      const testFile = AbsoluteFilePathStub({
        value: '/repo/packages/shared/src/guards/is-non-test-file/is-non-test-file-guard.test.ts',
      });
      proxy.setupVirtualTree({ filePaths: [implFile, testFile] });

      const result = listFilesRecursiveLayerBroker({ dirPath: DIR_PATH });

      expect(result).toStrictEqual([implFile]);
    });

    it('VALID: {multiple nested folders} => lists files from all nested folders', () => {
      const proxy = listFilesRecursiveLayerBrokerProxy();
      const file1 = AbsoluteFilePathStub({
        value: '/repo/packages/shared/src/guards/is-non-test-file/is-non-test-file-guard.ts',
      });
      const file2 = AbsoluteFilePathStub({
        value: '/repo/packages/shared/src/guards/is-source-file/is-source-file-guard.ts',
      });
      proxy.setupVirtualTree({ filePaths: [file1, file2] });

      const result = listFilesRecursiveLayerBroker({ dirPath: DIR_PATH });

      expect(result).toStrictEqual([file1, file2]);
    });
  });
});
