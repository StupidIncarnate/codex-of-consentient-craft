import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { readPackageJsonSafeLayerBroker } from './read-package-json-safe-layer-broker';
import { readPackageJsonSafeLayerBrokerProxy } from './read-package-json-safe-layer-broker.proxy';

describe('readPackageJsonSafeLayerBroker()', () => {
  describe('valid package.json', () => {
    it('VALID: {valid package.json with name and deps} => returns parsed PackageJson', async () => {
      const proxy = readPackageJsonSafeLayerBrokerProxy();
      const pkgJsonPath = FilePathStub({ value: '/repo/packages/shared/package.json' });
      proxy.returns({
        pkgJsonPath,
        content: '{"name":"@dm/shared","dependencies":{"zod":"*"},"devDependencies":{}}',
      });

      const result = await readPackageJsonSafeLayerBroker({ pkgJsonPath });

      expect(result).toStrictEqual({
        name: '@dm/shared',
        dependencies: { zod: '*' },
        devDependencies: {},
      });
    });

    it('VALID: {package.json with no name} => returns PackageJson without name', async () => {
      const proxy = readPackageJsonSafeLayerBrokerProxy();
      const pkgJsonPath = FilePathStub({ value: '/repo/packages/scripts/package.json' });
      proxy.returns({ pkgJsonPath, content: '{"dependencies":{}}' });

      const result = await readPackageJsonSafeLayerBroker({ pkgJsonPath });

      expect(result).toStrictEqual({ dependencies: {} });
    });
  });

  describe('error handling', () => {
    it('ERROR: {file not found} => returns undefined', async () => {
      const proxy = readPackageJsonSafeLayerBrokerProxy();
      const pkgJsonPath = FilePathStub({ value: '/repo/packages/missing/package.json' });
      proxy.throws({ pkgJsonPath, error: new Error('ENOENT: no such file') });

      const result = await readPackageJsonSafeLayerBroker({ pkgJsonPath });

      expect(result).toBe(undefined);
    });

    it('ERROR: {invalid JSON} => returns undefined', async () => {
      const proxy = readPackageJsonSafeLayerBrokerProxy();
      const pkgJsonPath = FilePathStub({ value: '/repo/packages/broken/package.json' });
      proxy.returns({ pkgJsonPath, content: 'not valid json {{' });

      const result = await readPackageJsonSafeLayerBroker({ pkgJsonPath });

      expect(result).toBe(undefined);
    });
  });
});
