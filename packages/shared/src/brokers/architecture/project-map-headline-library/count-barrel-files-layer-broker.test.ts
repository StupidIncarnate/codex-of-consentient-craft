import { countBarrelFilesLayerBroker } from './count-barrel-files-layer-broker';
import { countBarrelFilesLayerBrokerProxy } from './count-barrel-files-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

const DIR_PATH = AbsoluteFilePathStub({ value: '/repo/packages/shared/src/contracts' });

describe('countBarrelFilesLayerBroker', () => {
  describe('missing directory', () => {
    it('EMPTY: {missing dir} => returns 0', () => {
      const proxy = countBarrelFilesLayerBrokerProxy();
      proxy.setupMissing({ dirPath: DIR_PATH });

      const result = countBarrelFilesLayerBroker({ dirPath: DIR_PATH });

      expect(result).toBe(0);
    });
  });

  describe('flat directory with source files', () => {
    it('VALID: {2 .ts source files} => returns 2', () => {
      const proxy = countBarrelFilesLayerBrokerProxy();
      proxy.setupFiles({
        dirPath: DIR_PATH,
        fileNames: ['foo-contract.ts', 'bar-contract.ts'],
      });

      const result = countBarrelFilesLayerBroker({ dirPath: DIR_PATH });

      expect(result).toBe(2);
    });

    it('VALID: {source and test files} => counts only source files', () => {
      const proxy = countBarrelFilesLayerBrokerProxy();
      proxy.setupFiles({
        dirPath: DIR_PATH,
        fileNames: ['foo-contract.ts', 'foo-contract.test.ts', 'foo-contract.stub.ts'],
      });

      const result = countBarrelFilesLayerBroker({ dirPath: DIR_PATH });

      expect(result).toBe(1);
    });

    it('EMPTY: {no files} => returns 0', () => {
      const proxy = countBarrelFilesLayerBrokerProxy();
      proxy.setupFiles({ dirPath: DIR_PATH, fileNames: [] });

      const result = countBarrelFilesLayerBroker({ dirPath: DIR_PATH });

      expect(result).toBe(0);
    });
  });
});
