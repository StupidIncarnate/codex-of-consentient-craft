import { hydrationCollectionContract } from './hydration-collection-contract';
import { HydrationCollectionStub } from './hydration-collection.stub';

describe('hydrationCollectionContract', () => {
  describe('valid collections', () => {
    it('VALID: {ingredient: "quest"} => returns the ingredient', () => {
      const result = HydrationCollectionStub({ ingredient: 'quest' });

      expect(result).toStrictEqual({ ingredient: 'quest' });
    });

    it('VALID: {ingredient: "guild"} => returns the ingredient', () => {
      const result = HydrationCollectionStub({ ingredient: 'guild' });

      expect(result).toStrictEqual({ ingredient: 'guild' });
    });
  });

  describe('invalid collections', () => {
    it('INVALID: {no ingredient} => throws Required', () => {
      expect(() => hydrationCollectionContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {ingredient: \'\'} => throws "String must contain at least 1 character(s)"', () => {
      expect(() => hydrationCollectionContract.parse({ ingredient: '' })).toThrow(
        /String must contain at least 1 character\(s\)/u,
      );
    });
  });
});
