import { nameLikenessRankTransformer } from './name-likeness-rank-transformer';

describe('nameLikenessRankTransformer', () => {
  describe('ranking', () => {
    it('VALID: {a name containing the missing one, one sharing a word, one unrelated} => containing first, then shared word, then unrelated', () => {
      const result = nameLikenessRankTransformer({
        target: '[data-testid="GUILD_ADD"]',
        names: ['PIXEL_BTN', 'GUILD_LIST', 'GUILD_ADD_BTN'],
      });

      expect(result).toStrictEqual(['GUILD_ADD_BTN', 'GUILD_LIST', 'PIXEL_BTN']);
    });

    it('VALID: {no shared words} => fewer edits rank first', () => {
      const result = nameLikenessRankTransformer({
        target: '[data-testid="NOPE"]',
        names: ['APP_MAP_CONTAINER', 'ROPE', 'PIXEL_SPRITE', 'NODE'],
      });

      expect(result).toStrictEqual(['ROPE', 'NODE', 'PIXEL_SPRITE', 'APP_MAP_CONTAINER']);
    });

    it('VALID: {different case} => likeness ignores case', () => {
      const result = nameLikenessRankTransformer({
        target: '[data-testid="guild-add"]',
        names: ['QUEST_LIST', 'GUILD-ADD'],
      });

      expect(result).toStrictEqual(['GUILD-ADD', 'QUEST_LIST']);
    });

    it('VALID: {single-quoted testid} => reads the testid out of the selector', () => {
      const result = nameLikenessRankTransformer({
        target: "[data-testid='MODAL_CLOSE']",
        names: ['PIXEL_BTN', 'MODAL'],
      });

      expect(result).toStrictEqual(['MODAL', 'PIXEL_BTN']);
    });

    it('VALID: {target with no testid} => ranks against the whole selector', () => {
      const result = nameLikenessRankTransformer({
        target: 'button',
        names: ['GUILD_LIST', 'button'],
      });

      expect(result).toStrictEqual(['button', 'GUILD_LIST']);
    });
  });

  describe('ties and duplicates', () => {
    it('EDGE: {equal likeness} => keeps document order', () => {
      const result = nameLikenessRankTransformer({
        target: '[data-testid="ZZZZ"]',
        names: ['ABCD', 'EFGH', 'IJKL'],
      });

      expect(result).toStrictEqual(['ABCD', 'EFGH', 'IJKL']);
    });

    it('EDGE: {a name listed twice} => lists it once, at its first appearance', () => {
      const result = nameLikenessRankTransformer({
        target: '[data-testid="ZZZZ"]',
        names: ['ABCD', 'EFGH', 'ABCD'],
      });

      expect(result).toStrictEqual(['ABCD', 'EFGH']);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {names: []} => returns []', () => {
      const result = nameLikenessRankTransformer({ target: '[data-testid="X"]', names: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
