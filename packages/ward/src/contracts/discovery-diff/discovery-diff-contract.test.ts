import { DiscoveryDiffStub } from './discovery-diff.stub';
import { discoveryDiffContract } from './discovery-diff-contract';

describe('discoveryDiffContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = DiscoveryDiffStub();

      expect(discoveryDiffContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {onlyDiscovered: wrong type} => throws', () => {
      expect(() =>
        discoveryDiffContract.parse({ ...DiscoveryDiffStub(), onlyDiscovered: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
