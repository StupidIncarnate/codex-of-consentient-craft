import { PruneAssetsListResultStub } from './prune-assets-list-result.stub';
import { pruneAssetsListResultContract } from './prune-assets-list-result-contract';

describe('pruneAssetsListResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = PruneAssetsListResultStub();

      expect(pruneAssetsListResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {assets: wrong type} => throws', () => {
      expect(() =>
        pruneAssetsListResultContract.parse({ ...PruneAssetsListResultStub(), assets: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
