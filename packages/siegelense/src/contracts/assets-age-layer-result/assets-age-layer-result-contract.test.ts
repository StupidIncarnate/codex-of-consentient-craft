import { AssetsAgeLayerResultStub } from './assets-age-layer-result.stub';
import { assetsAgeLayerResultContract } from './assets-age-layer-result-contract';

describe('assetsAgeLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = AssetsAgeLayerResultStub();

      expect(assetsAgeLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {instances: wrong type} => throws', () => {
      expect(() =>
        assetsAgeLayerResultContract.parse({ ...AssetsAgeLayerResultStub(), instances: 'nope' }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
