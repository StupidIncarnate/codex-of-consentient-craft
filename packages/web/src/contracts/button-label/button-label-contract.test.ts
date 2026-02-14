import { buttonLabelContract } from './button-label-contract';
import { ButtonLabelStub } from './button-label.stub';

const MAX_BUTTON_LABEL_LENGTH = 50;

describe('buttonLabelContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "CREATE"} => parses button label', () => {
      const result = buttonLabelContract.parse('CREATE');

      expect(result).toBe('CREATE');
    });

    it('VALID: {value: "A"} => parses single character label', () => {
      const result = buttonLabelContract.parse('A');

      expect(result).toBe('A');
    });

    it('VALID: {value: max length} => parses max length label', () => {
      const label = 'A'.repeat(MAX_BUTTON_LABEL_LENGTH);
      const result = buttonLabelContract.parse(label);

      expect(result).toBe(label);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => buttonLabelContract.parse('')).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID_VALUE: {value: exceeds max} => throws for exceeding max length', () => {
      expect(() => buttonLabelContract.parse('A'.repeat(MAX_BUTTON_LABEL_LENGTH + 1))).toThrow(
        /String must contain at most 50 character/u,
      );
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => buttonLabelContract.parse(null)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => buttonLabelContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid button label', () => {
      const result = ButtonLabelStub();

      expect(result).toBe('CREATE');
    });

    it('VALID: {value: "SUBMIT"} => creates label with custom value', () => {
      const result = ButtonLabelStub({ value: 'SUBMIT' });

      expect(result).toBe('SUBMIT');
    });
  });
});
