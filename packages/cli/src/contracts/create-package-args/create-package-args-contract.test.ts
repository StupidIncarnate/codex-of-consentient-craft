import { packageBuildOrderStatics } from '@dungeonmaster/shared/statics';

import { createPackageArgsContract } from './create-package-args-contract';
import { CreatePackageArgsStub } from './create-package-args.stub';

const PACKAGE_TYPES = packageBuildOrderStatics.tiers.flat();

describe('createPackageArgsContract', () => {
  describe('valid input', () => {
    it('VALID: {name, packageType, description, packagesDir, dryRun} => parses every field', () => {
      const result = createPackageArgsContract.parse({
        name: '@acme/widgets',
        packageType: 'library',
        description: 'A widget package',
        packagesDir: 'packages',
        dryRun: true,
      });

      expect(result).toStrictEqual({
        name: '@acme/widgets',
        packageType: 'library',
        description: 'A widget package',
        packagesDir: 'packages',
        dryRun: true,
      });
    });

    it('VALID: {name: "@acme/widgets"} => defaults dryRun to false and omits the rest', () => {
      const result = createPackageArgsContract.parse({ name: '@acme/widgets' });

      expect(result).toStrictEqual({
        name: '@acme/widgets',
        dryRun: false,
      });
    });

    it.each(PACKAGE_TYPES)('VALID: {packageType: %s} => parses successfully', (packageType) => {
      const result = createPackageArgsContract.parse({ packageType });

      expect(result).toStrictEqual({ packageType, dryRun: false });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {packageType: "not-a-real-type"} => throws validation error', () => {
      expect(() =>
        createPackageArgsContract.parse({ packageType: 'not-a-real-type' as never }),
      ).toThrow(/Invalid enum value/u);
    });
  });

  describe('CreatePackageArgsStub', () => {
    it('VALID: {} => returns default stub', () => {
      const result = CreatePackageArgsStub();

      expect(result).toStrictEqual({
        name: '@acme/widgets',
        packageType: 'library',
        dryRun: false,
      });
    });
  });
});
