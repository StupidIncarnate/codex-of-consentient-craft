import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';

import { projectFolderDiscoverBroker } from './project-folder-discover-broker';
import { projectFolderDiscoverBrokerProxy } from './project-folder-discover-broker.proxy';

describe('projectFolderDiscoverBroker', () => {
  describe('discovers packages', () => {
    it('VALID: {git finds multiple package.json files} => returns ProjectFolder array', async () => {
      const proxy = projectFolderDiscoverBrokerProxy();
      proxy.setupFindsPackages({
        gitOutput: 'packages/ward/package.json\npackages/shared/package.json\n',
        packageContents: [
          JSON.stringify({ name: '@dungeonmaster/ward' }),
          JSON.stringify({ name: '@dungeonmaster/shared' }),
        ],
      });

      const result = await projectFolderDiscoverBroker({
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([
        ProjectFolderStub({ name: '@dungeonmaster/ward', path: '/project/packages/ward' }),
        ProjectFolderStub({ name: '@dungeonmaster/shared', path: '/project/packages/shared' }),
      ]);
    });
  });

  describe('no packages found', () => {
    it('EMPTY: {git returns empty output} => returns empty array', async () => {
      const proxy = projectFolderDiscoverBrokerProxy();
      proxy.setupNoPackages();

      const result = await projectFolderDiscoverBroker({
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('git failure', () => {
    it('ERROR: {git ls-files fails} => returns empty array', async () => {
      const proxy = projectFolderDiscoverBrokerProxy();
      proxy.setupGitFails();

      const result = await projectFolderDiscoverBroker({
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
