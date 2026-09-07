import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { packageReadLayerBroker } from './package-read-layer-broker';
import { packageReadLayerBrokerProxy } from './package-read-layer-broker.proxy';

describe('packageReadLayerBroker', () => {
  describe('valid package', () => {
    it('VALID: {valid package.json with name and src/} => returns ProjectFolder', async () => {
      const fullPath = '/project/packages/ward';
      const proxy = packageReadLayerBrokerProxy();
      proxy.setupReturnsPackage({ fullPath, name: '@dungeonmaster/ward' });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await packageReadLayerBroker({
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
      const proxy = packageReadLayerBrokerProxy();
      proxy.setupThrows({ fullPath });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await packageReadLayerBroker({
        fullPath,
        rootPath,
      });

      expect(result).toBe(null);
    });
  });

  describe('no name field', () => {
    it('EDGE: {package.json without name} => returns null', async () => {
      const fullPath = '/project/packages/anon';
      const proxy = packageReadLayerBrokerProxy();
      proxy.setupReturnsNoName({ fullPath });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await packageReadLayerBroker({
        fullPath,
        rootPath,
      });

      expect(result).toBe(null);
    });
  });

  describe('no src directory', () => {
    it('EDGE: {valid package but no src/} => returns null and warns', async () => {
      const fullPath = '/project/packages/standards';
      const proxy = packageReadLayerBrokerProxy();
      proxy.setupReturnsPackageNoSrc({ fullPath, name: '@dungeonmaster/standards' });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await packageReadLayerBroker({
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
