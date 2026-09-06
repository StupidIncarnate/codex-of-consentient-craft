import { pasteMediaTypeNormalizeTransformer } from './paste-media-type-normalize-transformer';

describe('pasteMediaTypeNormalizeTransformer', () => {
  describe('already-canonical input', () => {
    it('VALID: {mediaType: "image/png"} => returns it unchanged', () => {
      const result = pasteMediaTypeNormalizeTransformer({ mediaType: 'image/png' });

      expect(result).toBe('image/png');
    });
  });

  describe('case', () => {
    it('VALID: {mediaType: "IMAGE/PNG"} => returns the lowercased form', () => {
      const result = pasteMediaTypeNormalizeTransformer({ mediaType: 'IMAGE/PNG' });

      expect(result).toBe('image/png');
    });

    it('VALID: {mediaType: "Image/Png"} => returns the lowercased form for mixed case', () => {
      const result = pasteMediaTypeNormalizeTransformer({ mediaType: 'Image/Png' });

      expect(result).toBe('image/png');
    });
  });

  describe('whitespace', () => {
    it('VALID: {mediaType: " image/png "} => returns the trimmed form', () => {
      const result = pasteMediaTypeNormalizeTransformer({ mediaType: ' image/png ' });

      expect(result).toBe('image/png');
    });

    it('EMPTY: {mediaType: "   "} => returns the empty string', () => {
      const result = pasteMediaTypeNormalizeTransformer({ mediaType: '   ' });

      expect(result).toBe('');
    });
  });

  describe('combined case and whitespace', () => {
    it('VALID: {mediaType: "  IMAGE/PNG  "} => returns the lowercased, trimmed form', () => {
      const result = pasteMediaTypeNormalizeTransformer({ mediaType: '  IMAGE/PNG  ' });

      expect(result).toBe('image/png');
    });
  });

  describe('parameterised types', () => {
    it('VALID: {mediaType: "Image/Png; Charset=UTF-8"} => lowercases the whole string, parameter included', () => {
      const result = pasteMediaTypeNormalizeTransformer({ mediaType: 'Image/Png; Charset=UTF-8' });

      expect(result).toBe('image/png; charset=utf-8');
    });
  });

  describe('empty input', () => {
    it('EMPTY: {mediaType: ""} => returns the empty string', () => {
      const result = pasteMediaTypeNormalizeTransformer({ mediaType: '' });

      expect(result).toBe('');
    });
  });
});
