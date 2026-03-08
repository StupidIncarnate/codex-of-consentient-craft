import { displayLabelContract } from './display-label-contract';
import { DisplayLabelStub } from './display-label.stub';

describe('displayLabelContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "some text"} => parses valid label', () => {
      const result = displayLabelContract.parse('some text');

      expect(result).toBe('some text');
    });

    it('VALID: {value: ""} => parses empty string', () => {
      const result = displayLabelContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: 123} => throws for number', () => {
      expect(() => displayLabelContract.parse(123)).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid display label', () => {
      const result = DisplayLabelStub();

      expect(result).toBe('Display label');
    });

    it('VALID: {value: "custom"} => creates with custom value', () => {
      const result = DisplayLabelStub({ value: 'custom' });

      expect(result).toBe('custom');
    });
  });
});
