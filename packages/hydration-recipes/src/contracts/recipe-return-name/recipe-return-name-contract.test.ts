import { recipeReturnNameContract } from './recipe-return-name-contract';
import { RecipeReturnNameStub } from './recipe-return-name.stub';

describe('recipeReturnNameContract', () => {
  describe('valid names', () => {
    it.each(['guildSlug', 'questId', 'sessions.nested', 'a.b.c', '_private'])(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        expect(RecipeReturnNameStub({ value })).toBe(value);
      },
    );
  });

  describe('invalid names', () => {
    it.each(['', '.leading', 'trailing.', 'double..dot', '1starts-with-digit', 'has space'])(
      'INVALID: {value: %s} => throws naming the segment rule',
      (value) => {
        expect(() => recipeReturnNameContract.parse(value)).toThrow(
          /dot-separated identifier segments/u,
        );
      },
    );
  });
});
