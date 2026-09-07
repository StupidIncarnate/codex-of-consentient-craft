import { ContentTextStub } from '../../contracts/content-text/content-text.stub';
import { fileSuffixExtensionTransformer } from './file-suffix-extension-transformer';

describe('fileSuffixExtensionTransformer', () => {
  describe('TypeScript file extensions', () => {
    it('VALID: {suffix: -broker.ts} => returns .ts', () => {
      const result = fileSuffixExtensionTransformer({
        suffix: ContentTextStub({ value: '-broker.ts' }),
      });

      expect(result).toBe('.ts');
    });

    it('VALID: {suffix: -widget.tsx} => returns .tsx', () => {
      const result = fileSuffixExtensionTransformer({
        suffix: ContentTextStub({ value: '-widget.tsx' }),
      });

      expect(result).toBe('.tsx');
    });

    it('VALID: {suffix: .ts} => returns .ts', () => {
      const result = fileSuffixExtensionTransformer({
        suffix: ContentTextStub({ value: '.ts' }),
      });

      expect(result).toBe('.ts');
    });

    it('VALID: {suffix: .stub.ts} => returns .ts', () => {
      const result = fileSuffixExtensionTransformer({
        suffix: ContentTextStub({ value: '.stub.ts' }),
      });

      expect(result).toBe('.ts');
    });
  });

  describe('suffixes carrying no extension', () => {
    it('VALID: {suffix: -test} => returns empty string', () => {
      const result = fileSuffixExtensionTransformer({
        suffix: ContentTextStub({ value: '-test' }),
      });

      expect(result).toBe('');
    });

    it('EMPTY: {suffix: ""} => returns empty string', () => {
      const result = fileSuffixExtensionTransformer({
        suffix: ContentTextStub({ value: '' }),
      });

      expect(result).toBe('');
    });
  });
});
