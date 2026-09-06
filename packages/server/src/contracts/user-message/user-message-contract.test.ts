import { userMessageContract } from './user-message-contract';
import { UserMessageStub } from './user-message.stub';

describe('userMessageContract', () => {
  describe('valid inputs', () => {
    it('VALID: "fix the login bug" => parses to UserMessage branded type', () => {
      const result = userMessageContract.parse('fix the login bug');

      expect(result).toBe('fix the login bug');
    });

    it('VALID: UserMessageStub() => returns default stub value', () => {
      const result = UserMessageStub();

      expect(result).toBe('stub user message');
    });

    it('VALID: UserMessageStub({value: "custom message"}) => returns custom value', () => {
      const result = UserMessageStub({ value: 'custom message' });

      expect(result).toBe('custom message');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: "" => throws validation error', () => {
      expect(() => {
        userMessageContract.parse('');
      }).toThrow(/at least 1 character/u);
    });

    it('INVALID: 123 => throws validation error for non-string', () => {
      expect(() => {
        userMessageContract.parse(123 as never);
      }).toThrow(/Expected string, received number/u);
    });
  });
});
