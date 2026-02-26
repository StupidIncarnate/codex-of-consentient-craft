import { gateSectionKeyContract } from './gate-section-key-contract';
import { GateSectionKeyStub } from './gate-section-key.stub';

describe('gateSectionKeyContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "flows"} => parses flows key', () => {
      const result = gateSectionKeyContract.parse('flows');

      expect(result).toBe('flows');
    });

    it('VALID: {value: "observables"} => parses observables key', () => {
      const result = gateSectionKeyContract.parse('observables');

      expect(result).toBe('observables');
    });

    it('VALID: {value: "toolingRequirements"} => parses tooling key', () => {
      const result = gateSectionKeyContract.parse('toolingRequirements');

      expect(result).toBe('toolingRequirements');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: "unknown"} => throws for invalid key', () => {
      expect(() => gateSectionKeyContract.parse('unknown')).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => gateSectionKeyContract.parse(null)).toThrow(/received null/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid gate section key', () => {
      const result = GateSectionKeyStub();

      expect(result).toBe('flows');
    });

    it('VALID: {value: "requirements"} => creates key with custom value', () => {
      const result = GateSectionKeyStub({ value: 'requirements' });

      expect(result).toBe('requirements');
    });
  });
});
