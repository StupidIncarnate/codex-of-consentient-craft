import { locationsQuestImagesPathFindBroker } from './locations-quest-images-path-find-broker';
import { locationsQuestImagesPathFindBrokerProxy } from './locations-quest-images-path-find-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('locationsQuestImagesPathFindBroker', () => {
  describe('images path resolution', () => {
    it('VALID: {questFolderPath: "/quest"} => returns /quest/images', () => {
      const proxy = locationsQuestImagesPathFindBrokerProxy();

      proxy.setupQuestImagesPath({
        questImagesPath: FilePathStub({ value: '/quest/images' }),
      });

      const result = locationsQuestImagesPathFindBroker({
        questFolderPath: AbsoluteFilePathStub({ value: '/quest' }),
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/quest/images' }));
    });
  });
});
