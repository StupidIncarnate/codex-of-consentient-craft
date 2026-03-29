import { gateSectionKeyContract } from './gate-section-key-contract';
import { GateSectionKeyStub } from './gate-section-key.stub';

describe('gateSectionKeyContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "flows"} => parses flows key', () => {
      const result = gateSectionKeyContract.parse('flows');

      expect(result).toBe('flows');
    });

    it('VALID: {value: "designDecisions"} => parses designDecisions key', () => {
      const result = gateSectionKeyContract.parse('designDecisions');

      expect(result).toBe('designDecisions');
    });

    it('VALID: {value: "contracts"} => parses contracts key', () => {
      const result = gateSectionKeyContract.parse('contracts');

      expect(result).toBe('contracts');
    });

    it('VALID: {value: "toolingRequirements"} => parses tooling key', () => {
      const result = gateSectionKeyContract.parse('toolingRequirements');

      expect(result).toBe('toolingRequirements');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: "unknown"} => throws for invalid key', () => {
      expect(() => gateSectionKeyContract.parse('unknown')).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: "requirements"} => throws for removed key', () => {
      expect(() => gateSectionKeyContract.parse('requirements')).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: "observables"} => throws for removed key', () => {
      expect(() => gateSectionKeyContract.parse('observables')).toThrow(/Invalid enum value/u);
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

    it('VALID: {value: "contracts"} => creates key with custom value', () => {
      const result = GateSectionKeyStub({ value: 'contracts' });

      expect(result).toBe('contracts');
    });
  });
});
