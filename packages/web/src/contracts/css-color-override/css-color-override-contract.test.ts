import { cssColorOverrideContract } from './css-color-override-contract';
import { CssColorOverrideStub } from './css-color-override.stub';

describe('cssColorOverrideContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "#ff6b35"} => parses color value', () => {
      const result = cssColorOverrideContract.parse('#ff6b35');

      expect(result).toBe('#ff6b35');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => cssColorOverrideContract.parse('')).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => cssColorOverrideContract.parse(null)).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid color override', () => {
      const result = CssColorOverrideStub();

      expect(result).toBe('#ff6b35');
    });

    it('VALID: {value: "#000"} => creates color with custom value', () => {
      const result = CssColorOverrideStub({ value: '#000' });

      expect(result).toBe('#000');
    });
  });
});
