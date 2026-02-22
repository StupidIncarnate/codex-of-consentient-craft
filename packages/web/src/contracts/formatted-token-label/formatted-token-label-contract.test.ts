import { formattedTokenLabelContract } from './formatted-token-label-contract';
import { FormattedTokenLabelStub } from './formatted-token-label.stub';

describe('formattedTokenLabelContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "29.4k"} => parses abbreviated label', () => {
      const result = formattedTokenLabelContract.parse('29.4k');

      expect(result).toBe('29.4k');
    });

    it('VALID: {value: "150"} => parses raw number label', () => {
      const result = formattedTokenLabelContract.parse('150');

      expect(result).toBe('150');
    });

    it('VALID: {value: "A"} => parses single character label', () => {
      const result = formattedTokenLabelContract.parse('A');

      expect(result).toBe('A');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => formattedTokenLabelContract.parse('')).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID_VALUE: {value: 123} => throws for number', () => {
      expect(() => formattedTokenLabelContract.parse(123)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => formattedTokenLabelContract.parse(null)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => formattedTokenLabelContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid formatted token label with default value "29.4k"', () => {
      const result = FormattedTokenLabelStub();

      expect(result).toBe('29.4k');
    });

    it('VALID: {value: "150"} => creates formatted token label with custom value', () => {
      const result = FormattedTokenLabelStub({ value: '150' });

      expect(result).toBe('150');
    });
  });
});
