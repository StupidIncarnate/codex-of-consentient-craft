import { asciiArtContract } from './ascii-art-contract';
import { AsciiArtStub } from './ascii-art.stub';

describe('asciiArtContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: box art} => parses ascii art string', () => {
      const art = '\u2554\u2550\u2550\u2550\u2557\n\u2551 D \u2551\n\u255a\u2550\u2550\u2550\u255d';
      const result = asciiArtContract.parse(art);

      expect(result).toBe(art);
    });

    it('VALID: {value: "X"} => parses single character art', () => {
      const result = asciiArtContract.parse('X');

      expect(result).toBe('X');
    });

    it('VALID: {value: multiline} => parses multiline art', () => {
      const art = '+-+\n| |\n+-+';
      const result = asciiArtContract.parse(art);

      expect(result).toBe(art);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => asciiArtContract.parse('')).toThrow(/String must contain at least 1 character/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => asciiArtContract.parse(null)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => asciiArtContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid ascii art', () => {
      const result = AsciiArtStub();

      expect(result).toBe(
        '\u2554\u2550\u2550\u2550\u2557\n\u2551 D \u2551\n\u255a\u2550\u2550\u2550\u255d',
      );
    });

    it('VALID: {value: "***"} => creates art with custom value', () => {
      const result = AsciiArtStub({ value: '***' });

      expect(result).toBe('***');
    });
  });
});
