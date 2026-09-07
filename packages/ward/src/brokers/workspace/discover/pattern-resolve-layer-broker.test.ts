import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { patternResolveLayerBroker } from './pattern-resolve-layer-broker';
import { patternResolveLayerBrokerProxy } from './pattern-resolve-layer-broker.proxy';

describe('patternResolveLayerBroker', () => {
  describe('glob pattern', () => {
    it('VALID: {"packages/*" with two subdirs} => returns two ProjectFolders', async () => {
      const proxy = patternResolveLayerBrokerProxy();
      proxy.setupGlobPattern({
        dirs: ['ward', 'shared'],
        packageNames: ['@dungeonmaster/ward', '@dungeonmaster/shared'],
      });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await patternResolveLayerBroker({
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
      const proxy = patternResolveLayerBrokerProxy();
      proxy.setupDirectPattern({ packageName: '@dungeonmaster/ward' });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await patternResolveLayerBroker({
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
      const proxy = patternResolveLayerBrokerProxy();
      proxy.setupGlobPatternDirFails();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await patternResolveLayerBroker({
        pattern: 'packages/*',
        rootPath,
      });

      expect(result).toStrictEqual([]);
    });
  });
});
