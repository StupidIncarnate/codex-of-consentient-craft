import { recipeContextContract } from './recipe-context-contract';
import { RecipeContextStub } from './recipe-context.stub';

describe('recipeContextContract', () => {
  describe('valid contexts', () => {
    it('VALID: {apiBaseUrl, homePath} => parses to the complete object', () => {
      const context = RecipeContextStub({
        apiBaseUrl: 'http://dungeonmaster.localhost:41001',
        homePath: '/tmp/dm-siege-inst_abc',
      });

      expect(context).toStrictEqual({
        apiBaseUrl: 'http://dungeonmaster.localhost:41001',
        homePath: '/tmp/dm-siege-inst_abc',
      });
    });
  });

  describe('a recipe may not hold a screen', () => {
    it('INVALID: {browser} => throws naming the unrecognized key', () => {
      expect(() =>
        recipeContextContract.parse({
          apiBaseUrl: 'http://dungeonmaster.localhost:41001',
          homePath: '/tmp/dm-siege-inst_abc',
          browser: 'anything',
        }),
      ).toThrow(/Unrecognized key\(s\) in object: 'browser'/u);
    });

    it('INVALID: {page} => throws naming the unrecognized key', () => {
      expect(() =>
        recipeContextContract.parse({
          apiBaseUrl: 'http://dungeonmaster.localhost:41001',
          homePath: '/tmp/dm-siege-inst_abc',
          page: 'anything',
        }),
      ).toThrow(/Unrecognized key\(s\) in object: 'page'/u);
    });
  });

  describe('invalid contexts', () => {
    it('INVALID: {homePath: relative} => throws', () => {
      expect(() =>
        recipeContextContract.parse({
          apiBaseUrl: 'http://dungeonmaster.localhost:41001',
          homePath: 'tmp/dm-siege-inst_abc',
        }),
      ).toThrow(/absolute/iu);
    });

    it('EMPTY: {homePath: ""} => throws', () => {
      expect(() =>
        recipeContextContract.parse({
          apiBaseUrl: 'http://dungeonmaster.localhost:41001',
          homePath: '',
        }),
      ).toThrow(/too_small|at least/u);
    });
  });
});
