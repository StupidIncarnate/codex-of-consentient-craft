import { OwnerIndexPackageStub } from './owner-index-package.stub';
import { ownerIndexPackageContract } from './owner-index-package-contract';

describe('ownerIndexPackageContract', () => {
  describe('valid input', () => {
    it('VALID: {defaults} => returns a package with no dependencies', () => {
      expect(OwnerIndexPackageStub()).toStrictEqual({
        name: '@repo/example',
        dir: '/repo/packages/example',
        dependencies: [],
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {dir: relative} => throws ZodError', () => {
      expect(() =>
        ownerIndexPackageContract.parse({ ...OwnerIndexPackageStub(), dir: 'packages/a' }),
      ).toThrow(/Path must be absolute/u);
    });
  });
});
