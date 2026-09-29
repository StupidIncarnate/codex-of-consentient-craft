import { createPackageRequestContract } from './create-package-request-contract';
import { CreatePackageRequestStub } from './create-package-request.stub';

describe('createPackageRequestContract', () => {
  describe('valid input', () => {
    it('VALID: {full request} => parses successfully', () => {
      const result = createPackageRequestContract.parse(CreatePackageRequestStub());

      expect(result).toStrictEqual({
        packageName: '@acme/widgets',
        directoryName: 'widgets',
        packageType: 'library',
        description: 'Widgets package',
        packagesDir: 'packages',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {packageName missing} => throws', () => {
      expect(() => {
        return createPackageRequestContract.parse({
          directoryName: 'widgets',
          packageType: 'library',
          description: 'Widgets package',
          packagesDir: 'packages',
        });
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {directoryName missing} => throws', () => {
      expect(() => {
        return createPackageRequestContract.parse({
          packageName: '@acme/widgets',
          packageType: 'library',
          description: 'Widgets package',
          packagesDir: 'packages',
        });
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {packageType missing} => throws', () => {
      expect(() => {
        return createPackageRequestContract.parse({
          packageName: '@acme/widgets',
          directoryName: 'widgets',
          description: 'Widgets package',
          packagesDir: 'packages',
        });
      }).toThrow(/Invalid option: expected one of/u);
    });

    it('INVALID: {description missing} => throws', () => {
      expect(() => {
        return createPackageRequestContract.parse({
          packageName: '@acme/widgets',
          directoryName: 'widgets',
          packageType: 'library',
          packagesDir: 'packages',
        });
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {packagesDir missing} => throws', () => {
      expect(() => {
        return createPackageRequestContract.parse({
          packageName: '@acme/widgets',
          directoryName: 'widgets',
          packageType: 'library',
          description: 'Widgets package',
        });
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {packageType: "not-a-real-type"} => throws', () => {
      expect(() => {
        return CreatePackageRequestStub({ packageType: 'not-a-real-type' });
      }).toThrow(/Invalid option/u);
    });
  });
});
