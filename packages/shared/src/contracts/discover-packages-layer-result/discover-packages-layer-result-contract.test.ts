import { DiscoverPackagesLayerResultStub } from './discover-packages-layer-result.stub';
import { discoverPackagesLayerResultContract } from './discover-packages-layer-result-contract';

describe('discoverPackagesLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = DiscoverPackagesLayerResultStub();

      expect(discoverPackagesLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: wrong type} => throws', () => {
      expect(() => discoverPackagesLayerResultContract.parse(123)).toThrow(/expected|invalid/iu);
    });
  });
});
