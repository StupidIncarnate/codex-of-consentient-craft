import { PackageDiscoverResultStub } from './package-discover-result.stub';
import { packageDiscoverResultContract } from './package-discover-result-contract';

describe('packageDiscoverResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = PackageDiscoverResultStub();

      expect(packageDiscoverResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: wrong type} => throws', () => {
      expect(() => packageDiscoverResultContract.parse(123)).toThrow(/expected|invalid/iu);
    });
  });
});
