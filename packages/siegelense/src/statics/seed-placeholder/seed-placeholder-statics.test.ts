import { seedPlaceholderStatics } from './seed-placeholder-statics';

describe('seedPlaceholderStatics', () => {
  describe('what the pattern matches', () => {
    it.each(['{g.guildSlug}', '{s.sessions.nested}', '{_x.a}', '{g1.a_b.c}'])(
      'VALID: {text: %s} => matches',
      (text) => {
        expect(new RegExp(seedPlaceholderStatics.pattern.source, 'u').test(text)).toBe(true);
      },
    );
  });

  describe("what it deliberately does not match — an eval source's own braces", () => {
    it.each([
      '() => { return 1 }',
      'document.querySelectorAll("[data-testid=QUEST_ROW]").length === 3',
      '{g}',
      '{ g.guildSlug }',
      '{1g.x}',
      '{g.}',
    ])('INVALID: {text: %s} => does not match', (text) => {
      expect(new RegExp(seedPlaceholderStatics.pattern.source, 'u').test(text)).toBe(false);
    });
  });
});
