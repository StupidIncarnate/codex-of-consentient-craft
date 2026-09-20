import { hexColourContract } from './hex-colour-contract';
import { HexColourStub } from './hex-colour.stub';

describe('hexColourContract', () => {
  describe('valid colours', () => {
    it('VALID: {value: "#0d0907"} => parses successfully', () => {
      const hexColour = HexColourStub({ value: '#0d0907' });

      const result = hexColourContract.parse(hexColour);

      expect(result).toBe('#0d0907');
    });

    it('VALID: {value: "#ffffff"} => parses successfully', () => {
      const hexColour = HexColourStub({ value: '#ffffff' });

      const result = hexColourContract.parse(hexColour);

      expect(result).toBe('#ffffff');
    });
  });

  describe('invalid colours', () => {
    it('INVALID: {value: "#0D0907"} => an uppercase hex string throws validation error', () => {
      expect(() => {
        hexColourContract.parse('#0D0907');
      }).toThrow(/Invalid/u);
    });

    it('INVALID: {value: "0d0907"} => a missing leading hash throws validation error', () => {
      expect(() => {
        hexColourContract.parse('0d0907');
      }).toThrow(/Invalid/u);
    });

    it('INVALID: {value: "#0d09"} => a short hex string throws validation error', () => {
      expect(() => {
        hexColourContract.parse('#0d09');
      }).toThrow(/Invalid/u);
    });
  });
});
