import { duplicateInstallPackageNameContract } from './duplicate-install-package-name-contract';
import { DuplicateInstallPackageNameStub } from './duplicate-install-package-name.stub';

describe('duplicateInstallPackageNameContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "@mantine/core"} => parses successfully', () => {
      const result = duplicateInstallPackageNameContract.parse(
        DuplicateInstallPackageNameStub({ value: '@mantine/core' }),
      );

      expect(result).toBe('@mantine/core');
    });

    it('VALID: {value: "zod"} => parses successfully', () => {
      const result = duplicateInstallPackageNameContract.parse('zod');

      expect(result).toBe('zod');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: ""} => throws', () => {
      expect(() => duplicateInstallPackageNameContract.parse('')).toThrow(
        /expected string to have >=1 characters/u,
      );
    });

    it('INVALID: {value: 123} => throws', () => {
      expect(() => duplicateInstallPackageNameContract.parse(123)).toThrow(
        /expected string, received number/u,
      );
    });
  });
});
