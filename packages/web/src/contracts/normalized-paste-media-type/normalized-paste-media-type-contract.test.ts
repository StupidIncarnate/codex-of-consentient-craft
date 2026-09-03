import { normalizedPasteMediaTypeContract } from './normalized-paste-media-type-contract';
import { NormalizedPasteMediaTypeStub } from './normalized-paste-media-type.stub';

describe('normalizedPasteMediaTypeContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "image/png"} => parses an already-canonical media type', () => {
      const result = normalizedPasteMediaTypeContract.parse('image/png');

      expect(result).toBe('image/png');
    });

    it('VALID: {value: "image/png; charset=utf-8"} => parses a parameterised media type unchanged', () => {
      const result = normalizedPasteMediaTypeContract.parse('image/png; charset=utf-8');

      expect(result).toBe('image/png; charset=utf-8');
    });

    it('EMPTY: {value: ""} => parses an empty candidate carrying no declared type', () => {
      const result = normalizedPasteMediaTypeContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: 123} => throws for number', () => {
      expect(() => normalizedPasteMediaTypeContract.parse(123)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => normalizedPasteMediaTypeContract.parse(null)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => normalizedPasteMediaTypeContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a value of "image/png"', () => {
      const result = NormalizedPasteMediaTypeStub();

      expect(result).toBe('image/png');
    });

    it('VALID: {value: "image/webp"} => creates a value with the custom media type', () => {
      const result = NormalizedPasteMediaTypeStub({ value: 'image/webp' });

      expect(result).toBe('image/webp');
    });
  });
});
