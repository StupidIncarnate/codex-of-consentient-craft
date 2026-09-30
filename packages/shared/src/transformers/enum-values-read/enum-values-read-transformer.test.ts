import { enumValuesReadTransformer } from './enum-values-read-transformer';

describe('enumValuesReadTransformer', () => {
  describe('enum chains', () => {
    it("VALID: {z.enum(['b', 'a'])} => returns the values sorted", () => {
      expect(
        enumValuesReadTransformer({ text: "z.enum(['b', 'a'])" }),
      ).toStrictEqual(['a', 'b']);
    });

    it("VALID: {z.enum([...]).brand<'Kind'>()} => reads through the brand call", () => {
      expect(
        enumValuesReadTransformer({
          text: "z.enum(['open', 'done']).brand<'Kind'>()",
        }),
      ).toStrictEqual(['done', 'open']);
    });

    it('VALID: {double-quoted values behind a property access and parentheses} => returns the values', () => {
      expect(
        enumValuesReadTransformer({
          text: '(z.enum(["y", "x"]).describe("d"))!.optional',
        }),
      ).toStrictEqual(['x', 'y']);
    });
  });

  describe('not an enum', () => {
    it('EMPTY: {z.object({})} => returns undefined', () => {
      expect(enumValuesReadTransformer({ text: 'z.object({})' })).toBe(
        undefined,
      );
    });

    it('EMPTY: {a bare identifier} => returns undefined', () => {
      expect(enumValuesReadTransformer({ text: 'someEnum' })).toBe(
        undefined,
      );
    });

    it('EMPTY: {z.enum(values) over an identifier} => returns undefined', () => {
      expect(
        enumValuesReadTransformer({ text: 'z.enum(values)' }),
      ).toBe(undefined);
    });

    it('EMPTY: {z.enum() with no argument} => returns undefined', () => {
      expect(enumValuesReadTransformer({ text: 'z.enum()' })).toBe(
        undefined,
      );
    });

    it('EMPTY: {z.enum with a computed element} => returns undefined', () => {
      expect(
        enumValuesReadTransformer({ text: "z.enum(['a', other])" }),
      ).toBe(undefined);
    });
  });
});
