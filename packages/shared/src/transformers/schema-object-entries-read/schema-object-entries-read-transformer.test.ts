import { schemaObjectEntriesReadTransformer } from './schema-object-entries-read-transformer';

describe('schemaObjectEntriesReadTransformer', () => {
  describe('object roots', () => {
    it('VALID: {keys, a quoted key and a getter behind a brand call} => lists key and value text in written order', () => {
      const result = schemaObjectEntriesReadTransformer({
        text: [
            'z.object({',
            "  id: z.string().brand<'ThingId'>(),",
            "  'other-key': z.number(),",
            '  get parent() { return thingContract.shape.id; },',
            "}).brand<'Thing'>()",
          ].join('\n'),
      });

      expect(result).toStrictEqual([
        { key: 'id', valueText: "z.string().brand<'ThingId'>()" },
        { key: 'other-key', valueText: 'z.number()' },
        { key: 'parent', valueText: 'thingContract.shape.id' },
      ]);
    });

    it('VALID: {z.strictObject behind parentheses and optional} => reads the object root', () => {
      const result = schemaObjectEntriesReadTransformer({
        text: '(z.strictObject({ a: z.string() })).optional()',
      });

      expect(result).toStrictEqual([{ key: 'a', valueText: 'z.string()' }]);
    });
  });

  describe('no object root', () => {
    it.each(['z.enum(["a"])', 'someContract', 'z.object(shape)', 'z.string().min(1)'])(
      'EMPTY: {%s} => returns no entries',
      (value) => {
        expect(
          schemaObjectEntriesReadTransformer({ text: value }),
        ).toStrictEqual([]);
      },
    );

    it('EMPTY: {a spread and a method in the literal} => skips entries with no key or value', () => {
      const result = schemaObjectEntriesReadTransformer({
        text: 'z.object({ ...base, run() {}, ok: z.string() })',
      });

      expect(result).toStrictEqual([{ key: 'ok', valueText: 'z.string()' }]);
    });
  });
});
