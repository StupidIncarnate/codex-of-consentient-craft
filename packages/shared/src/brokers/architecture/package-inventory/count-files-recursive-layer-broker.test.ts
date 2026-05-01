import { countFilesRecursiveLayerBroker } from './count-files-recursive-layer-broker';
import { countFilesRecursiveLayerBrokerProxy } from './count-files-recursive-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('countFilesRecursiveLayerBroker', () => {
  describe('flat directory', () => {
    it('VALID: directory with 3 files => returns 3', () => {
      const proxy = countFilesRecursiveLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/project/src/contracts' });

      proxy.setupFlatDirectory({ fileNames: ['a.ts', 'b.ts', 'c.ts'] });

      const result = countFilesRecursiveLayerBroker({ dirPath });

      expect(result).toBe(3);
    });
  });

  describe('nested directory', () => {
    it('VALID: directory with subdirectory containing files => returns total count', () => {
      const proxy = countFilesRecursiveLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/project/src/brokers' });

      proxy.setupNestedDirectory({
        files: ['file.ts'],
        subdirs: [{ name: 'sub', files: ['a.ts', 'b.ts'] }],
      });

      const result = countFilesRecursiveLayerBroker({ dirPath });

      expect(result).toBe(3);
    });
  });

  describe('empty directory', () => {
    it('EMPTY: empty directory => returns 0', () => {
      const proxy = countFilesRecursiveLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/project/src/empty' });

      proxy.setupEmpty();

      const result = countFilesRecursiveLayerBroker({ dirPath });

      expect(result).toBe(0);
    });
  });

  describe('error handling', () => {
    it('ERROR: directory read fails => returns 0', () => {
      const proxy = countFilesRecursiveLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/nonexistent' });

      proxy.setupError({ error: new Error('ENOENT') });

      const result = countFilesRecursiveLayerBroker({ dirPath });

      expect(result).toBe(0);
    });
  });
});
