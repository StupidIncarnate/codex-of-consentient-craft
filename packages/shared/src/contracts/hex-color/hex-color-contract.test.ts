import { hexColorContract } from './hex-color-contract';
import { HexColorStub } from './hex-color.stub';

describe('hexColorContract', () => {
  describe('valid hex colors', () => {
    it('VALID: #ff6b35 => parses to HexColor branded type', () => {
      const result = hexColorContract.parse('#ff6b35');

      expect(result).toBe('#ff6b35');
    });

    it('VALID: #000000 => parses to HexColor branded type', () => {
      const result = hexColorContract.parse('#000000');

      expect(result).toBe('#000000');
    });

    it('VALID: #FFFFFF => parses to HexColor branded type', () => {
      const result = hexColorContract.parse('#FFFFFF');

      expect(result).toBe('#FFFFFF');
    });

    it('VALID: #aaBB11 => parses mixed case to HexColor branded type', () => {
      const result = hexColorContract.parse('#aaBB11');

      expect(result).toBe('#aaBB11');
    });
  });

  describe('invalid hex colors', () => {
    it('ERROR: "ff6b35" => throws for missing hash prefix', () => {
      expect(() => hexColorContract.parse('ff6b35')).toThrow(/Must be a valid hex color/u);
    });

    it('ERROR: "#fff" => throws for shorthand hex', () => {
      expect(() => hexColorContract.parse('#fff')).toThrow(/Must be a valid hex color/u);
    });

    it('ERROR: "#gggggg" => throws for invalid hex characters', () => {
      expect(() => hexColorContract.parse('#gggggg')).toThrow(/Must be a valid hex color/u);
    });

    it('ERROR: "#ff6b35ff" => throws for 8-digit hex', () => {
      expect(() => hexColorContract.parse('#ff6b35ff')).toThrow(/Must be a valid hex color/u);
    });

    it('ERROR: "" => throws for empty string', () => {
      expect(() => hexColorContract.parse('')).toThrow(/Must be a valid hex color/u);
    });

    it('ERROR: 123 => throws for non-string', () => {
      expect(() => hexColorContract.parse(123)).toThrow(/Expected string, received number/u);
    });
  });

  describe('stub', () => {
    it('VALID: HexColorStub() => returns default stub value', () => {
      const result = HexColorStub();

      expect(result).toBe('#ff6b35');
    });

    it('VALID: HexColorStub({value: "#00ff00"}) => returns custom value', () => {
      const result = HexColorStub({ value: '#00ff00' });

      expect(result).toBe('#00ff00');
    });
  });
});
