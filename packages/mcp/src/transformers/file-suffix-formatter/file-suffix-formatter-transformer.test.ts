import { ContentTextStub } from '../../contracts/content-text/content-text.stub';
import { fileSuffixFormatterTransformer } from './file-suffix-formatter-transformer';

describe('fileSuffixFormatterTransformer', () => {
  describe('TypeScript file extensions', () => {
    it('VALID: {suffix: -broker.ts} => removes .ts extension', () => {
      const result = fileSuffixFormatterTransformer({
        suffix: ContentTextStub({ value: '-broker.ts' }),
      });

      expect(result).toBe('-broker');
    });

    it('VALID: {suffix: -widget.tsx} => removes .tsx extension', () => {
      const result = fileSuffixFormatterTransformer({
        suffix: ContentTextStub({ value: '-widget.tsx' }),
      });

      expect(result).toBe('-widget');
    });

    it('VALID: {suffix: -guard.ts} => removes .ts extension', () => {
      const result = fileSuffixFormatterTransformer({
        suffix: ContentTextStub({ value: '-guard.ts' }),
      });

      expect(result).toBe('-guard');
    });
  });

  describe('non-TypeScript suffixes', () => {
    it('VALID: {suffix: -test} => returns unchanged', () => {
      const result = fileSuffixFormatterTransformer({
        suffix: ContentTextStub({ value: '-test' }),
      });

      expect(result).toBe('-test');
    });

    it('VALID: {suffix: .stub.ts} => removes .ts extension only', () => {
      const result = fileSuffixFormatterTransformer({
        suffix: ContentTextStub({ value: '.stub.ts' }),
      });

      expect(result).toBe('.stub');
    });
  });
});
