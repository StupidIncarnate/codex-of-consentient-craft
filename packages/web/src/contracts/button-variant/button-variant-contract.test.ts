import { buttonVariantContract } from './button-variant-contract';
import { ButtonVariantStub } from './button-variant.stub';

describe('buttonVariantContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "primary"} => parses primary variant', () => {
      const result = buttonVariantContract.parse('primary');

      expect(result).toBe('primary');
    });

    it('VALID: {value: "ghost"} => parses ghost variant', () => {
      const result = buttonVariantContract.parse('ghost');

      expect(result).toBe('ghost');
    });

    it('VALID: {value: "danger"} => parses danger variant', () => {
      const result = buttonVariantContract.parse('danger');

      expect(result).toBe('danger');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: "secondary"} => throws for unknown variant', () => {
      expect(() => buttonVariantContract.parse('secondary')).toThrow(/Invalid enum value/u);
    });

    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => buttonVariantContract.parse('')).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => buttonVariantContract.parse(null)).toThrow(/received null/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => buttonVariantContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid button variant', () => {
      const result = ButtonVariantStub();

      expect(result).toBe('primary');
    });

    it('VALID: {value: "ghost"} => creates variant with custom value', () => {
      const result = ButtonVariantStub({ value: 'ghost' });

      expect(result).toBe('ghost');
    });

    it('VALID: {value: "danger"} => creates variant with danger value', () => {
      const result = ButtonVariantStub({ value: 'danger' });

      expect(result).toBe('danger');
    });
  });
});
