import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { workspaceDiscoverLayerReadBroker } from './workspace-discover-layer-read-broker';
import { workspaceDiscoverLayerReadBrokerProxy } from './workspace-discover-layer-read-broker.proxy';

describe('workspaceDiscoverLayerReadBroker', () => {
  describe('valid package', () => {
    it('VALID: {valid package.json with name and src/} => returns ProjectFolder', async () => {
      const fullPath = '/project/packages/ward';
      const proxy = workspaceDiscoverLayerReadBrokerProxy();
      proxy.setupReturnsPackage({ fullPath, name: '@dungeonmaster/ward' });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await workspaceDiscoverLayerReadBroker({
        fullPath,
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
      const fullPath = '/project/packages/missing';
      const proxy = workspaceDiscoverLayerReadBrokerProxy();
      proxy.setupThrows({ fullPath });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await workspaceDiscoverLayerReadBroker({
        fullPath,
        rootPath,
      });

      expect(result).toBe(null);
    });
  });

  describe('no name field', () => {
    it('EDGE: {package.json without name} => returns null', async () => {
      const fullPath = '/project/packages/anon';
      const proxy = workspaceDiscoverLayerReadBrokerProxy();
      proxy.setupReturnsNoName({ fullPath });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await workspaceDiscoverLayerReadBroker({
        fullPath,
        rootPath,
      });

      expect(result).toBe(null);
    });
  });

  describe('no src directory', () => {
    it('EDGE: {valid package but no src/} => returns null and warns', async () => {
      const fullPath = '/project/packages/standards';
      const proxy = workspaceDiscoverLayerReadBrokerProxy();
      proxy.setupReturnsPackageNoSrc({ fullPath, name: '@dungeonmaster/standards' });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await workspaceDiscoverLayerReadBroker({
        fullPath,
        rootPath,
      });

      expect(result).toBe(null);
      expect(proxy.getStderrCalls()).toStrictEqual([
        'ward: skipping @dungeonmaster/standards (no src/ directory)\n',
      ]);
    });
  });
});
