import { formInputValueContract } from './form-input-value-contract';
import { FormInputValueStub } from './form-input-value.stub';

describe('formInputValueContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "hello"} => parses input value', () => {
      const result = formInputValueContract.parse('hello');

      expect(result).toBe('hello');
    });

    it('VALID: {value: ""} => parses empty string', () => {
      const result = formInputValueContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid inputs', () => {
    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => formInputValueContract.parse(null)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => formInputValueContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid input value', () => {
      const result = FormInputValueStub();

      expect(result).toBe('stub-input-value');
    });

    it('VALID: {value: "custom"} => creates input value with custom value', () => {
      const result = FormInputValueStub({ value: 'custom' });

      expect(result).toBe('custom');
    });
  });
});
