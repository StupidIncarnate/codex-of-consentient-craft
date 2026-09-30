import { BundleBuildResultStub } from './bundle-build-result.stub';
import { bundleBuildResultContract } from './bundle-build-result-contract';

describe('bundleBuildResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = BundleBuildResultStub();

      expect(bundleBuildResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {bundleDir: wrong type} => throws', () => {
      expect(() =>
        bundleBuildResultContract.parse({ ...BundleBuildResultStub(), bundleDir: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
