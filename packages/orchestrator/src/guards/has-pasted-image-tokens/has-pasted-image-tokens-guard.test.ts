import { hasPastedImageTokensGuard } from './has-pasted-image-tokens-guard';

describe('hasPastedImageTokensGuard', () => {
  describe('messages carrying a pasted-image token', () => {
    it('VALID: {one token mid-sentence} => returns true', () => {
      const text =
        'look at this ![Pasted Image 1](/home/u/.dungeonmaster/guilds/g/quests/q/images/2f1c.png) please';

      expect(hasPastedImageTokensGuard({ text })).toBe(true);
    });

    it('VALID: {two tokens in one message} => returns true', () => {
      const text =
        'compare ![Pasted Image 1](/home/u/.dungeonmaster/guilds/g/quests/q/images/2f1c.png) with ' +
        '![Pasted Image 2](/home/u/.dungeonmaster/guilds/g/quests/q/images/9ab0.png)';

      expect(hasPastedImageTokensGuard({ text })).toBe(true);
    });

    it('EDGE: {multi-digit ordinal, space in path} => returns true', () => {
      const text =
        '![Pasted Image 12](/home/u/.dungeonmaster/guilds/g/quests/q/images/with space.png)';

      expect(hasPastedImageTokensGuard({ text })).toBe(true);
    });
  });

  describe('messages with no pasted-image token', () => {
    it('EMPTY: {text: ""} => returns false', () => {
      expect(hasPastedImageTokensGuard({ text: '' })).toBe(false);
    });

    it('EMPTY: {text omitted} => returns false', () => {
      expect(hasPastedImageTokensGuard({})).toBe(false);
    });

    it('INVALID: {bare placeholder with no ! and no (path)} => returns false', () => {
      expect(hasPastedImageTokensGuard({ text: '[Pasted Image 1]' })).toBe(false);
    });

    it('INVALID: {ordinary prose with no token} => returns false', () => {
      expect(hasPastedImageTokensGuard({ text: 'just run the ward and report back' })).toBe(false);
    });
  });
});
