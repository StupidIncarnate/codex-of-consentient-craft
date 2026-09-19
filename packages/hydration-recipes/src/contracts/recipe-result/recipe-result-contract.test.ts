import { recipeResultContract } from './recipe-result-contract';
import { RecipeResultStub } from './recipe-result.stub';

describe('recipeResultContract', () => {
  describe('valid results', () => {
    it('VALID: {dotted key} => parses to the complete flat record', () => {
      const result = RecipeResultStub({
        guildId: '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41',
        guildSlug: 'siege-guild',
        'sessions.nested': '/siege-guild/session/sess-nested',
      });

      expect(result).toStrictEqual({
        guildId: '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41',
        guildSlug: 'siege-guild',
        'sessions.nested': '/siege-guild/session/sess-nested',
      });
    });

    it('EMPTY: {} => parses to an empty record', () => {
      expect(recipeResultContract.parse({})).toStrictEqual({});
    });
  });

  describe('invalid results', () => {
    it('INVALID: {value: 3} => throws', () => {
      expect(() => recipeResultContract.parse({ guildId: 3 })).toThrow(/Expected string/u);
    });

    it('INVALID: {key: "has space"} => throws naming the segment rule', () => {
      expect(() => recipeResultContract.parse({ 'has space': 'x' })).toThrow(
        /dot-separated identifier segments/u,
      );
    });
  });
});
