import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { workspaceDiscoverLayerReadBroker } from './workspace-discover-layer-read-broker';
import { workspaceDiscoverLayerReadBrokerProxy } from './workspace-discover-layer-read-broker.proxy';

describe('workspaceDiscoverLayerReadBroker', () => {
  describe('valid package', () => {
    it('VALID: {valid package.json with name} => returns ProjectFolder', async () => {
      const proxy = workspaceDiscoverLayerReadBrokerProxy();
      proxy.setupReturnsPackage({ name: '@dungeonmaster/ward' });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await workspaceDiscoverLayerReadBroker({
        fullPath: '/project/packages/ward',
        rootPath,
      });

      expect(result).toStrictEqual({
        name: '@dungeonmaster/ward',
        path: '/project/packages/ward',
      });
    });
  });

  describe('missing package.json', () => {
    it('EDGE: {no package.json} => returns null', async () => {
      const proxy = workspaceDiscoverLayerReadBrokerProxy();
      proxy.setupThrows();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await workspaceDiscoverLayerReadBroker({
        fullPath: '/project/packages/missing',
        rootPath,
      });

      expect(result).toBeNull();
    });
  });

  describe('no name field', () => {
    it('EDGE: {package.json without name} => returns null', async () => {
      const proxy = workspaceDiscoverLayerReadBrokerProxy();
      proxy.setupReturnsNoName();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await workspaceDiscoverLayerReadBroker({
        fullPath: '/project/packages/anon',
        rootPath,
      });

      expect(result).toBeNull();
    });
  });
});
