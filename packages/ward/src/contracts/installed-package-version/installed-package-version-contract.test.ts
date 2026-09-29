import { installedPackageVersionContract } from './installed-package-version-contract';
import { InstalledPackageVersionStub } from './installed-package-version.stub';

describe('installedPackageVersionContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "8.3.18"} => parses successfully', () => {
      const result = installedPackageVersionContract.parse(
        InstalledPackageVersionStub({ value: '8.3.18' }),
      );

      expect(result).toBe('8.3.18');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: ""} => throws', () => {
      expect(() => installedPackageVersionContract.parse('')).toThrow(
        /expected string to have >=1 characters/u,
      );
    });

    it('INVALID: {value: 123} => throws', () => {
      expect(() => installedPackageVersionContract.parse(123)).toThrow(
        /Invalid input: expected string, received number/u,
      );
    });
  });
});
