import { TsconfigDiscoverPatternsStub } from './tsconfig-discover-patterns.stub';
import { tsconfigDiscoverPatternsContract } from './tsconfig-discover-patterns-contract';

describe('tsconfigDiscoverPatternsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = TsconfigDiscoverPatternsStub();

      expect(tsconfigDiscoverPatternsContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {patterns: wrong type} => throws', () => {
      expect(() =>
        tsconfigDiscoverPatternsContract.parse({
          ...TsconfigDiscoverPatternsStub(),
          patterns: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
