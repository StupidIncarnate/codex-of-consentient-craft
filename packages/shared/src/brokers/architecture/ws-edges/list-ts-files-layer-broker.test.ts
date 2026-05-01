import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { listTsFilesLayerBrokerProxy } from './list-ts-files-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

const DIR = AbsoluteFilePathStub({ value: '/repo/packages' });

describe('listTsFilesLayerBroker', () => {
  describe('empty directory', () => {
    it('EMPTY: {no files} => returns empty array', () => {
      const proxy = listTsFilesLayerBrokerProxy();
      proxy.setupEmpty();

      const result = listTsFilesLayerBroker({ dirPath: DIR });

      expect(result).toStrictEqual([]);
    });
  });

  describe('directory with ts files', () => {
    it('VALID: {two ts files} => returns both paths', () => {
      const proxy = listTsFilesLayerBrokerProxy();
      const file1 = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/state/orchestration-events-state.ts',
      });
      const file2 = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/adapters/orchestrator/events-on/events-on-adapter.ts',
      });
      proxy.setupVirtualTree({ filePaths: [file1, file2] });

      const result = listTsFilesLayerBroker({ dirPath: DIR });

      expect(result).toStrictEqual([file1, file2]);
    });
  });
});
