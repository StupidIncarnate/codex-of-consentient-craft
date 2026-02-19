import { checkTypeContract } from './check-type-contract';
import { CheckTypeStub } from './check-type.stub';

describe('checkTypeContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "lint"} => parses lint', () => {
      const result = checkTypeContract.parse('lint');

      expect(result).toBe('lint');
    });

    it('VALID: {value: "typecheck"} => parses typecheck', () => {
      const result = checkTypeContract.parse('typecheck');

      expect(result).toBe('typecheck');
    });

    it('VALID: {value: "test"} => parses test', () => {
      const result = checkTypeContract.parse('test');

      expect(result).toBe('test');
    });

  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: "e2e"} => throws for removed e2e check type', () => {
      expect(() => checkTypeContract.parse('e2e')).toThrow(/Invalid enum value/u);
    });

    it('INVALID_VALUE: {value: "unknown"} => throws for unknown check type', () => {
      expect(() => checkTypeContract.parse('unknown')).toThrow(/Invalid enum value/u);
    });

    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => checkTypeContract.parse('')).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => checkTypeContract.parse(null)).toThrow(/received null/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => checkTypeContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid check type', () => {
      const result = CheckTypeStub();

      expect(result).toBe('lint');
    });

    it('VALID: {value: "test"} => creates check type with custom value', () => {
      const result = CheckTypeStub({ value: 'test' });

      expect(result).toBe('test');
    });
  });
});
