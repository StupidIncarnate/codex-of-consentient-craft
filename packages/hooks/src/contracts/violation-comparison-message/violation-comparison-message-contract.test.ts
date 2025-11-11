import { violationComparisonMessageContract } from './violation-comparison-message-contract';
import { ViolationComparisonMessageStub } from './violation-comparison-message.stub';

describe('violationComparisonMessageContract', () => {
  describe('valid messages', () => {
    it('VALID: {value: message with header} => parses successfully', () => {
      const message = ViolationComparisonMessageStub({
        value:
          '🛑 New code quality violations detected:\n\n  ❌ Type Safety Violation: 1 violation',
      });

      const result = violationComparisonMessageContract.parse(message);

      expect(result).toBe(
        '🛑 New code quality violations detected:\n\n  ❌ Type Safety Violation: 1 violation',
      );
    });

    it('VALID: {value: empty string} => parses successfully', () => {
      const message = ViolationComparisonMessageStub({ value: '' });

      const result = violationComparisonMessageContract.parse(message);

      expect(result).toBe('');
    });

    it('VALID: {value: multi-line message} => parses successfully', () => {
      const message = ViolationComparisonMessageStub({
        value:
          '🛑 New code quality violations detected:\n\n  ❌ Rule 1: 2 violations\n     Line 5:10 - Error message\n\nPlease fix these violations.',
      });

      const result = violationComparisonMessageContract.parse(message);

      expect(result).toBe(
        '🛑 New code quality violations detected:\n\n  ❌ Rule 1: 2 violations\n     Line 5:10 - Error message\n\nPlease fix these violations.',
      );
    });
  });

  describe('invalid messages', () => {
    it('INVALID: {value: number} => throws validation error', () => {
      expect(() => {
        return violationComparisonMessageContract.parse(123);
      }).toThrow('Expected string');
    });

    it('INVALID: {value: null} => throws validation error', () => {
      expect(() => {
        return violationComparisonMessageContract.parse(null);
      }).toThrow('Expected string');
    });

    it('INVALID: {value: object} => throws validation error', () => {
      expect(() => {
        return violationComparisonMessageContract.parse({ message: 'test' });
      }).toThrow('Expected string');
    });
  });
});
