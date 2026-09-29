import { valueReuseFixTextTransformer } from './value-reuse-fix-text-transformer';

describe('valueReuseFixTextTransformer', () => {
  describe('a value that can be replaced', () => {
    it('VALID: {inline brand} => returns the bare reuse', () => {
      const result = valueReuseFixTextTransformer({
        valueText: "z.string().brand<'QuestId'>()",
        reuse: 'questContract.shape.id',
      });

      expect(result).toBe('questContract.shape.id');
    });

    it('VALID: {standalone brand ending in optional} => keeps optional', () => {
      const result = valueReuseFixTextTransformer({
        valueText: 'questIdContract.optional()',
        reuse: 'questContract.shape.id',
      });

      expect(result).toBe('questContract.shape.id.optional()');
    });

    it('VALID: {nullable then optional} => keeps both in order', () => {
      const result = valueReuseFixTextTransformer({
        valueText: 'z.string().nullable().optional()',
        reuse: 'questContract.shape.id',
      });

      expect(result).toBe('questContract.shape.id.nullable().optional()');
    });
  });

  describe('a value with a default', () => {
    it('EMPTY: {default call} => returns null', () => {
      const result = valueReuseFixTextTransformer({
        valueText: "z.string().default('x')",
        reuse: 'questContract.shape.id',
      });

      expect(result).toBe(null);
    });
  });
});
