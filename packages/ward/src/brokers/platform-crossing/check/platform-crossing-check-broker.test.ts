import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { platformCrossingCheckBroker } from './platform-crossing-check-broker';
import { platformCrossingCheckBrokerProxy } from './platform-crossing-check-broker.proxy';

describe('platformCrossingCheckBroker', () => {
  describe('empty input', () => {
    it('EMPTY: {repo with no workspace packages} => returns no violations', async () => {
      const proxy = platformCrossingCheckBrokerProxy();
      proxy.setupNoWorkspaces();

      const result = await platformCrossingCheckBroker({
        rootPath: FilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
