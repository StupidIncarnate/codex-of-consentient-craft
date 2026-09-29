import { propertyReusedFieldTransformer } from './property-reused-field-transformer';

describe('propertyReusedFieldTransformer', () => {
  describe('a reuse', () => {
    it('VALID: {plain reuse of id} => returns the reused field', () => {
      const result = propertyReusedFieldTransformer({ text: 'questId: questContract.shape.id' });

      expect(result).toBe('questContract.shape.id');
    });

    it('VALID: {plain reuse of a non-id key with a modifier} => returns the reused field', () => {
      const result = propertyReusedFieldTransformer({
        text: 'guildSlug: guildContract.shape.slug.optional()',
      });

      expect(result).toBe('guildContract.shape.slug');
    });

    it('VALID: {getter reuse} => returns the reused field', () => {
      const result = propertyReusedFieldTransformer({
        text: "get questId(): z.core.$ZodType<string & z.$brand<'QuestId'>> {\n return questContract.shape.id;\n }",
      });

      expect(result).toBe('questContract.shape.id');
    });
  });

  describe('not a reuse', () => {
    it('VALID: {inline brand} => returns null', () => {
      const result = propertyReusedFieldTransformer({
        text: "questId: z.string().brand<'QuestId'>()",
      });

      expect(result).toBe(null);
    });

    it('VALID: {standalone brand contract} => returns null', () => {
      const result = propertyReusedFieldTransformer({ text: 'questId: questIdContract' });

      expect(result).toBe(null);
    });

    it('EMPTY: {shorthand property} => returns null', () => {
      const result = propertyReusedFieldTransformer({ text: 'questId' });

      expect(result).toBe(null);
    });
  });
});
