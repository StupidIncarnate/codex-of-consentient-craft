import { JestDiscoverPatternsStub } from './jest-discover-patterns.stub';
import { jestDiscoverPatternsContract } from './jest-discover-patterns-contract';

describe('jestDiscoverPatternsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = JestDiscoverPatternsStub();

      expect(jestDiscoverPatternsContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {patterns: wrong type} => throws', () => {
      expect(() =>
        jestDiscoverPatternsContract.parse({ ...JestDiscoverPatternsStub(), patterns: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
