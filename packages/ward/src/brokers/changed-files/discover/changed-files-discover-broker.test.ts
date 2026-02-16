import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';

import { changedFilesDiscoverBroker } from './changed-files-discover-broker';
import { changedFilesDiscoverBrokerProxy } from './changed-files-discover-broker.proxy';

describe('changedFilesDiscoverBroker', () => {
  describe('changed files found', () => {
    it('VALID: {files changed on branch} => returns GitRelativePath array', async () => {
      const proxy = changedFilesDiscoverBrokerProxy();
      proxy.setupWithChangedFiles({ diffOutput: 'src/a.ts\nsrc/b.ts\n' });

      const result = await changedFilesDiscoverBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([
        GitRelativePathStub({ value: 'src/a.ts' }),
        GitRelativePathStub({ value: 'src/b.ts' }),
      ]);
    });
  });

  describe('no changes', () => {
    it('EMPTY: {no files changed} => returns empty array', async () => {
      const proxy = changedFilesDiscoverBrokerProxy();
      proxy.setupNoChanges();

      const result = await changedFilesDiscoverBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
