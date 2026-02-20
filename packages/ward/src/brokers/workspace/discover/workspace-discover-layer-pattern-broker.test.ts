import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { workspaceDiscoverLayerPatternBroker } from './workspace-discover-layer-pattern-broker';
import { workspaceDiscoverLayerPatternBrokerProxy } from './workspace-discover-layer-pattern-broker.proxy';

describe('workspaceDiscoverLayerPatternBroker', () => {
  describe('glob pattern', () => {
    it('VALID: {"packages/*" with two subdirs} => returns two ProjectFolders', async () => {
      const proxy = workspaceDiscoverLayerPatternBrokerProxy();
      proxy.setupGlobPattern({
        dirs: ['ward', 'shared'],
        packageNames: ['@dungeonmaster/ward', '@dungeonmaster/shared'],
      });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await workspaceDiscoverLayerPatternBroker({
        pattern: 'packages/*',
        rootPath,
      });

      expect(result).toStrictEqual([
        { name: '@dungeonmaster/ward', path: '/project/packages/ward' },
        { name: '@dungeonmaster/shared', path: '/project/packages/shared' },
      ]);
    });
  });

  describe('direct pattern', () => {
    it('VALID: {"packages/ward" direct path} => returns single ProjectFolder', async () => {
      const proxy = workspaceDiscoverLayerPatternBrokerProxy();
      proxy.setupDirectPattern({ packageName: '@dungeonmaster/ward' });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await workspaceDiscoverLayerPatternBroker({
        pattern: 'packages/ward',
        rootPath,
      });

      expect(result).toStrictEqual([
        { name: '@dungeonmaster/ward', path: '/project/packages/ward' },
      ]);
    });
  });

  describe('glob pattern with missing dir', () => {
    it('EDGE: {readdir fails} => returns empty array', async () => {
      const proxy = workspaceDiscoverLayerPatternBrokerProxy();
      proxy.setupGlobPatternDirFails();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await workspaceDiscoverLayerPatternBroker({
        pattern: 'packages/*',
        rootPath,
      });

      expect(result).toStrictEqual([]);
    });
  });
});
