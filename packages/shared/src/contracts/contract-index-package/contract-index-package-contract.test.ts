import { ContractIndexPackageStub } from './contract-index-package.stub';
import { contractIndexPackageContract } from './contract-index-package-contract';

describe('contractIndexPackageContract', () => {
  describe('valid input', () => {
    it('VALID: {defaults} => returns the package name and directory', () => {
      const result = ContractIndexPackageStub();

      expect(result).toStrictEqual({ name: '@repo/example', dir: '/repo/packages/example' });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {dir: relative} => throws ZodError', () => {
      expect(() =>
        contractIndexPackageContract.parse({ ...ContractIndexPackageStub(), dir: 'packages/a' }),
      ).toThrow(/Path must be absolute/u);
    });

    it('INVALID: {name: empty} => throws ZodError', () => {
      expect(() =>
        contractIndexPackageContract.parse({ ...ContractIndexPackageStub(), name: '' }),
      ).toThrow(/>=1 characters/u);
    });
  });
});
