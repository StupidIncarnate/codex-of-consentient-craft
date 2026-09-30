import { readPackageNameOptionalLayerBroker } from './read-package-name-optional-layer-broker';
import { readPackageNameOptionalLayerBrokerProxy } from './read-package-name-optional-layer-broker.proxy';

describe('readPackageNameOptionalLayerBroker', () => {
  describe('valid inputs', () => {
    it('VALID: {a real package.json} => returns its branded name', async () => {
      const proxy = readPackageNameOptionalLayerBrokerProxy();
      const packageJsonPath = '/repo/packages/node/package.json';
      proxy.setupPackageJson({ packageJsonPath, name: '@dungeonmaster/node' });

      const result = await readPackageNameOptionalLayerBroker({ packageJsonPath });

      expect(result).toBe('@dungeonmaster/node');
    });
  });

  describe('empty input', () => {
    it('EMPTY: {package.json does not exist} => returns undefined', async () => {
      const proxy = readPackageNameOptionalLayerBrokerProxy();
      const packageJsonPath = '/repo/packages/node/package.json';
      proxy.setupMissing({ packageJsonPath });

      const result = await readPackageNameOptionalLayerBroker({ packageJsonPath });

      expect(result).toBe(undefined);
    });
  });

  describe('error cases', () => {
    it('ERROR: {read fails for a reason other than a missing file} => rejects with the real error', async () => {
      const proxy = readPackageNameOptionalLayerBrokerProxy();
      const packageJsonPath = '/repo/packages/node/package.json';
      proxy.setupPermissionDenied({ packageJsonPath });

      await expect(readPackageNameOptionalLayerBroker({ packageJsonPath })).rejects.toThrow(
        /EACCES/u,
      );
    });
  });
});
