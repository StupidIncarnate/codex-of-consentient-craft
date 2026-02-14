import { cssFontFamilyContract } from './css-font-family-contract';
import { CssFontFamilyStub } from './css-font-family.stub';

describe('cssFontFamilyContract', () => {
  describe('valid font families', () => {
    it('VALID: "monospace" => parses to CssFontFamily branded type', () => {
      const result = cssFontFamilyContract.parse('monospace');

      expect(result).toBe('monospace');
    });

    it('VALID: "Arial, sans-serif" => parses compound font family', () => {
      const result = cssFontFamilyContract.parse('Arial, sans-serif');

      expect(result).toBe('Arial, sans-serif');
    });

    it('VALID: "\'Courier New\'" => parses quoted font name', () => {
      const result = cssFontFamilyContract.parse("'Courier New'");

      expect(result).toBe("'Courier New'");
    });
  });

  describe('invalid font families', () => {
    it('ERROR: "" => throws for empty string', () => {
      expect(() => cssFontFamilyContract.parse('')).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('ERROR: 123 => throws for non-string', () => {
      expect(() => cssFontFamilyContract.parse(123)).toThrow(/Expected string, received number/u);
    });
  });

  describe('stub', () => {
    it('VALID: CssFontFamilyStub() => returns default stub value', () => {
      const result = CssFontFamilyStub();

      expect(result).toBe('monospace');
    });

    it('VALID: CssFontFamilyStub({value: "serif"}) => returns custom value', () => {
      const result = CssFontFamilyStub({ value: 'serif' });

      expect(result).toBe('serif');
    });
  });
});
