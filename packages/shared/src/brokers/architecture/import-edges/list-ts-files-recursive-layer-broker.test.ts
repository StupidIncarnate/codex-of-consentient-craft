import { listTsFilesRecursiveLayerBroker } from './list-ts-files-recursive-layer-broker';
import { listTsFilesRecursiveLayerBrokerProxy } from './list-ts-files-recursive-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

const DIR_PATH = AbsoluteFilePathStub({ value: '/repo/packages/shared/src' });

describe('listTsFilesRecursiveLayerBroker', () => {
  describe('missing directory', () => {
    it('EMPTY: {missing dir} => returns empty array', () => {
      listTsFilesRecursiveLayerBrokerProxy();

      const result = listTsFilesRecursiveLayerBroker({ dirPath: DIR_PATH });

      expect(result).toStrictEqual([]);
    });
  });
});
