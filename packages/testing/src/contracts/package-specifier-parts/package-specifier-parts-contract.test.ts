import { packageSpecifierPartsContract } from './package-specifier-parts-contract';
import { PackageSpecifierPartsStub } from './package-specifier-parts.stub';

describe('packageSpecifierPartsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {packageName, subpath} => parses successfully', () => {
      const result = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/bin',
        subpath: 'testing',
      });

      expect(result).toStrictEqual({ packageName: '@dungeonmaster/bin', subpath: 'testing' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {packageName missing} => throws a Zod validation error', () => {
      expect(() => packageSpecifierPartsContract.parse({ subpath: 'testing' })).toThrow(
        /packageName/u,
      );
    });

    it('INVALID: {subpath missing} => throws a Zod validation error', () => {
      expect(() =>
        packageSpecifierPartsContract.parse({ packageName: '@dungeonmaster/bin' }),
      ).toThrow(/subpath/u);
    });
  });
});
