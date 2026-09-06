import { locationsQuestImagesPathFindBroker } from './locations-quest-images-path-find-broker';
import { locationsQuestImagesPathFindBrokerProxy } from './locations-quest-images-path-find-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { locationsStatics } from '../../../statics/locations/locations-statics';

describe('locationsQuestImagesPathFindBroker', () => {
  describe('images path resolution', () => {
    it('VALID: {questFolderPath: "/quest"} => joins questFolderPath with locationsStatics.quest.imagesDir', () => {
      // No setupQuestImagesPath staging here — pathJoinAdapterProxy's default is a REAL
      // passthrough to Node's path.join, so this proves the broker actually joins on
      // locationsStatics.quest.imagesDir rather than merely returning whatever join was told
      // to return. Staging the joined result directly (as the sibling ward-results test does)
      // would pass unchanged even if the broker joined on a different statics key entirely.
      locationsQuestImagesPathFindBrokerProxy();

      const result = locationsQuestImagesPathFindBroker({
        questFolderPath: AbsoluteFilePathStub({ value: '/quest' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({ value: `/quest/${locationsStatics.quest.imagesDir}` }),
      );
    });
  });
});
