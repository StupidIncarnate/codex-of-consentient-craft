import { LocationsPruneAssetPathsFindResultStub } from './locations-prune-asset-paths-find-result.stub';
import { locationsPruneAssetPathsFindResultContract } from './locations-prune-asset-paths-find-result-contract';

describe('locationsPruneAssetPathsFindResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = LocationsPruneAssetPathsFindResultStub();

      expect(locationsPruneAssetPathsFindResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {runsDir: wrong type} => throws', () => {
      expect(() =>
        locationsPruneAssetPathsFindResultContract.parse({
          ...LocationsPruneAssetPathsFindResultStub(),
          runsDir: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
