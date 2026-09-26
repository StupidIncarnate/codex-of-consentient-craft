import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { duplicateInstallCheckBroker } from './duplicate-install-check-broker';
import { duplicateInstallCheckBrokerProxy } from './duplicate-install-check-broker.proxy';

describe('duplicateInstallCheckBroker', () => {
  describe('empty input', () => {
    it('EMPTY: {repo with no workspace packages} => returns no violations', async () => {
      const proxy = duplicateInstallCheckBrokerProxy();
      proxy.setupNoWorkspaces();

      const result = await duplicateInstallCheckBroker({
        rootPath: FilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
