import { locationsDesignScaffoldPathFindBroker } from './locations-design-scaffold-path-find-broker';
import { locationsDesignScaffoldPathFindBrokerProxy } from './locations-design-scaffold-path-find-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('locationsDesignScaffoldPathFindBroker', () => {
  describe('design scaffold path resolution', () => {
    it('VALID: {questFolderPath: "/quest"} => returns /quest/design', () => {
      const proxy = locationsDesignScaffoldPathFindBrokerProxy();

      proxy.setupDesignScaffoldPath({
        designPath: FilePathStub({ value: '/quest/design' }),
      });

      const result = locationsDesignScaffoldPathFindBroker({
        questFolderPath: AbsoluteFilePathStub({ value: '/quest' }),
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/quest/design' }));
    });
  });
});
