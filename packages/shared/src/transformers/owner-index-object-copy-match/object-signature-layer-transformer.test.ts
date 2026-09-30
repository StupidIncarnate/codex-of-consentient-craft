import { objectSignatureLayerTransformer } from './object-signature-layer-transformer';

describe('objectSignatureLayerTransformer', () => {
  describe('object schemas', () => {
    it('VALID: {keys out of order with brands and spacing} => sorted keys with brand calls and whitespace removed', () => {
      const result = objectSignatureLayerTransformer({
        text: "z.object({ name: z.string().min(1).brand<'Name'>(), id: z.string( ).brand<'A'>() })",
      });

      expect(result).toBe('id:z.string()|name:z.string().min(1)');
    });

    it('VALID: {two objects differing only in brand texts} => the same signature', () => {
      const left = objectSignatureLayerTransformer({
        text: "z.object({ id: z.string().brand<'A'>() })",
      });
      const right = objectSignatureLayerTransformer({
        text: "z.object({ id: z.string().brand<'B'>() })",
      });

      expect([left, right]).toStrictEqual(['id:z.string()', 'id:z.string()']);
    });
  });

  describe('no keys', () => {
    it('EMPTY: {z.object({})} => returns undefined', () => {
      expect(
        objectSignatureLayerTransformer({ text: 'z.object({})' }),
      ).toBe(undefined);
    });
  });
});
