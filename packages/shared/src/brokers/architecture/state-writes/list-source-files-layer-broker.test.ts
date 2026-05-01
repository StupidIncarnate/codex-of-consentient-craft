import { listSourceFilesLayerBroker } from './list-source-files-layer-broker';
import { listSourceFilesLayerBrokerProxy } from './list-source-files-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('listSourceFilesLayerBroker', () => {
  describe('flat directory', () => {
    it('VALID: {dir with .ts files} => returns those paths', () => {
      const proxy = listSourceFilesLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const filePath = AbsoluteFilePathStub({ value: '/repo/packages/server/src/broker.ts' });

      proxy.setupFlatDirectory({ filePaths: [filePath] });

      const result = listSourceFilesLayerBroker({ dirPath });

      expect(result).toStrictEqual(['/repo/packages/server/src/broker.ts']);
    });

    it('VALID: {test files} => excluded from result', () => {
      const proxy = listSourceFilesLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const testFile = AbsoluteFilePathStub({ value: '/repo/packages/server/src/broker.test.ts' });

      proxy.setupFlatDirectory({ filePaths: [testFile] });

      const result = listSourceFilesLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {proxy files} => excluded from result', () => {
      const proxy = listSourceFilesLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const proxyFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/broker.proxy.ts',
      });

      proxy.setupFlatDirectory({ filePaths: [proxyFile] });

      const result = listSourceFilesLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {stub files} => excluded from result', () => {
      const proxy = listSourceFilesLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const stubFile = AbsoluteFilePathStub({ value: '/repo/packages/server/src/user.stub.ts' });

      proxy.setupFlatDirectory({ filePaths: [stubFile] });

      const result = listSourceFilesLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {non-source files like .json} => excluded from result', () => {
      const proxy = listSourceFilesLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const jsonFile = AbsoluteFilePathStub({ value: '/repo/packages/server/src/config.json' });

      proxy.setupFlatDirectory({ filePaths: [jsonFile] });

      const result = listSourceFilesLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty directory', () => {
    it('EMPTY: {empty dir} => returns empty array', () => {
      const proxy = listSourceFilesLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });

      proxy.setupEmpty();

      const result = listSourceFilesLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('missing directory', () => {
    it('ERROR: {readdir throws} => returns empty array', () => {
      const proxy = listSourceFilesLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/nonexistent/src' });

      proxy.setupImplementation({
        fn: () => {
          throw new Error('ENOENT');
        },
      });

      const result = listSourceFilesLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });
});
