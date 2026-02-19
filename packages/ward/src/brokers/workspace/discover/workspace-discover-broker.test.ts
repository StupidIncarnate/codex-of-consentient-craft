import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { workspaceDiscoverBroker } from './workspace-discover-broker';
import { workspaceDiscoverBrokerProxy } from './workspace-discover-broker.proxy';

describe('workspaceDiscoverBroker', () => {
  describe('multi-package mode', () => {
    it('VALID: {package.json has workspaces with glob pattern} => returns ProjectFolder array', async () => {
      const proxy = workspaceDiscoverBrokerProxy();
      proxy.setupMultiPackage({
        patterns: ['packages/*'],
        dirs: ['ward', 'shared'],
        packageNames: ['@dungeonmaster/ward', '@dungeonmaster/shared'],
      });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await workspaceDiscoverBroker({ rootPath });

      expect(result).toStrictEqual([
        { name: '@dungeonmaster/ward', path: '/project/packages/ward' },
        { name: '@dungeonmaster/shared', path: '/project/packages/shared' },
      ]);
    });
  });

  describe('single-package mode', () => {
    it('VALID: {package.json has no workspaces} => returns null', async () => {
      const proxy = workspaceDiscoverBrokerProxy();
      proxy.setupSinglePackage();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await workspaceDiscoverBroker({ rootPath });

      expect(result).toBeNull();
    });
  });

  describe('missing package.json', () => {
    it('EDGE: {no package.json} => returns null', async () => {
      const proxy = workspaceDiscoverBrokerProxy();
      proxy.setupNoPackageJson();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await workspaceDiscoverBroker({ rootPath });

      expect(result).toBeNull();
    });
  });
});
