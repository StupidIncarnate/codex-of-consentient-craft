import { installedPackageManifestContract } from './installed-package-manifest-contract';
import { InstalledPackageManifestStub } from './installed-package-manifest.stub';

describe('installedPackageManifestContract', () => {
  describe('valid inputs', () => {
    it('VALID: {version: "8.3.18"} => parses successfully', () => {
      const manifest = InstalledPackageManifestStub({ version: '8.3.18' });

      const result = installedPackageManifestContract.parse(manifest);

      expect(result.version).toBe('8.3.18');
    });

    it('VALID: {no version field} => parses with version undefined', () => {
      const result = installedPackageManifestContract.parse({ name: '@mantine/core' });

      expect(result.version).toBe(undefined);
    });

    it('VALID: {version plus extra passthrough fields} => keeps the extra fields', () => {
      const result = installedPackageManifestContract.parse({
        version: '8.3.18',
        name: '@mantine/core',
        license: 'MIT',
      });

      expect(result).toStrictEqual({ version: '8.3.18', name: '@mantine/core', license: 'MIT' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {version: ""} => throws', () => {
      expect(() => installedPackageManifestContract.parse({ version: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });
  });
});
