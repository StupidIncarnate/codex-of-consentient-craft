import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { folderResolveLayerBroker } from './folder-resolve-layer-broker';
import { folderResolveLayerBrokerProxy } from './folder-resolve-layer-broker.proxy';

describe('folderResolveLayerBroker', () => {
  describe('valid package.json', () => {
    it('VALID: {package.json has name} => returns ProjectFolder with package name', async () => {
      const proxy = folderResolveLayerBrokerProxy();
      proxy.setupReturnsPackage({ name: '@dungeonmaster/ward' });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await folderResolveLayerBroker({ rootPath });

      expect(result).toStrictEqual({
        name: '@dungeonmaster/ward',
        path: '/project',
      });
    });
  });

  describe('missing package.json', () => {
    it('EDGE: {no package.json} => returns ProjectFolder with path as name fallback', async () => {
      const proxy = folderResolveLayerBrokerProxy();
      proxy.setupThrows();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await folderResolveLayerBroker({ rootPath });

      expect(result).toStrictEqual({
        name: '/project',
        path: '/project',
      });
    });
  });
});
