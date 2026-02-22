import { dropdownOptionContract } from './dropdown-option-contract';
import { DropdownOptionStub } from './dropdown-option.stub';

describe('dropdownOptionContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "high"} => parses dropdown option', () => {
      const result = dropdownOptionContract.parse('high');

      expect(result).toBe('high');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => dropdownOptionContract.parse('')).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => dropdownOptionContract.parse(null)).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid dropdown option', () => {
      const result = DropdownOptionStub();

      expect(result).toBe('high');
    });

    it('VALID: {value: "low"} => creates option with custom value', () => {
      const result = DropdownOptionStub({ value: 'low' });

      expect(result).toBe('low');
    });
  });
});
