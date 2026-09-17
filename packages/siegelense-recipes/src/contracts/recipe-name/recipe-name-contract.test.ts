import { recipeNameContract } from './recipe-name-contract';
import { RecipeNameStub } from './recipe-name.stub';

describe('recipeNameContract', () => {
  describe('valid names', () => {
    it('VALID: {value: "guild-with-three-quests"} => parses to itself', () => {
      const name = RecipeNameStub({ value: 'guild-with-three-quests' });

      const result = recipeNameContract.parse(name);

      expect(result).toBe('guild-with-three-quests');
    });

    it('VALID: {value: "session-with-nested-subagent"} => parses to itself', () => {
      const name = RecipeNameStub({ value: 'session-with-nested-subagent' });

      const result = recipeNameContract.parse(name);

      expect(result).toBe('session-with-nested-subagent');
    });

    it('EDGE: {value: "guild2"} => a digit inside a segment parses', () => {
      const name = RecipeNameStub({ value: 'guild2' });

      const result = recipeNameContract.parse(name);

      expect(result).toBe('guild2');
    });
  });

  describe('invalid names', () => {
    it('EMPTY: {value: ""} => throws the kebab-case message', () => {
      expect(() => {
        RecipeNameStub({ value: '' });
      }).toThrow(/Recipe name must be kebab-case/u);
    });

    it('INVALID: {value: "GuildWithThreeQuests"} => camelCase throws', () => {
      expect(() => {
        RecipeNameStub({ value: 'GuildWithThreeQuests' });
      }).toThrow(/Recipe name must be kebab-case/u);
    });

    it('INVALID: {value: "guild with quests"} => a space throws', () => {
      expect(() => {
        RecipeNameStub({ value: 'guild with quests' });
      }).toThrow(/Recipe name must be kebab-case/u);
    });

    it('INVALID: {value: "guild--with-quests"} => a doubled hyphen throws', () => {
      expect(() => {
        RecipeNameStub({ value: 'guild--with-quests' });
      }).toThrow(/Recipe name must be kebab-case/u);
    });

    it('INVALID: {value: "guild-"} => a trailing hyphen throws', () => {
      expect(() => {
        RecipeNameStub({ value: 'guild-' });
      }).toThrow(/Recipe name must be kebab-case/u);
    });
  });
});
