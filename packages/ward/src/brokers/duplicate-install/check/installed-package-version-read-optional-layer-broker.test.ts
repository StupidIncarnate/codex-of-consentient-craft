import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';

import { installedPackageVersionReadOptionalLayerBroker } from './installed-package-version-read-optional-layer-broker';
import { installedPackageVersionReadOptionalLayerBrokerProxy } from './installed-package-version-read-optional-layer-broker.proxy';

describe('installedPackageVersionReadOptionalLayerBroker', () => {
  describe('valid inputs', () => {
    it('VALID: {an installed copy} => returns its branded version', async () => {
      const proxy = installedPackageVersionReadOptionalLayerBrokerProxy();
      const packageJsonPath = FilePathStub({
        value: '/repo/packages/web/node_modules/@mantine/core/package.json',
      });
      proxy.setupInstalled({ packageJsonPath, version: '8.3.14' });

      const result = await installedPackageVersionReadOptionalLayerBroker({ packageJsonPath });

      expect(result).toBe('8.3.14');
    });
  });

  describe('empty input', () => {
    it('EMPTY: {package not installed at this location} => returns undefined', async () => {
      const proxy = installedPackageVersionReadOptionalLayerBrokerProxy();
      const packageJsonPath = FilePathStub({
        value: '/repo/packages/web/node_modules/@mantine/core/package.json',
      });
      proxy.setupMissing({ packageJsonPath });

      const result = await installedPackageVersionReadOptionalLayerBroker({ packageJsonPath });

      expect(result).toBe(undefined);
    });
  });

  describe('error cases', () => {
    it('ERROR: {read fails for a reason other than a missing file} => rejects with the real error', async () => {
      const proxy = installedPackageVersionReadOptionalLayerBrokerProxy();
      const packageJsonPath = FilePathStub({
        value: '/repo/packages/web/node_modules/@mantine/core/package.json',
      });
      proxy.setupPermissionDenied({ packageJsonPath });

      await expect(
        installedPackageVersionReadOptionalLayerBroker({ packageJsonPath }),
      ).rejects.toThrow(/EACCES/u);
    });
  });
});
