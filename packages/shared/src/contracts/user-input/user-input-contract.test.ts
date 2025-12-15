import { userInputContract } from './user-input-contract';
import { UserInputStub } from './user-input.stub';

describe('userInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: "help" => parses to UserInput branded type', () => {
      const result = userInputContract.parse('help');

      expect(result).toBe('help');
    });

    it('VALID: "spawn agent with some text" => parses to UserInput branded type', () => {
      const result = userInputContract.parse('spawn agent with some text');

      expect(result).toBe('spawn agent with some text');
    });

    it('VALID: "" => parses empty string to UserInput branded type', () => {
      const result = userInputContract.parse('');

      expect(result).toBe('');
    });

    it('VALID: "multi\nline\ninput" => parses multiline string to UserInput branded type', () => {
      const result = userInputContract.parse('multi\nline\ninput');

      expect(result).toBe('multi\nline\ninput');
    });
  });

  describe('stub', () => {
    it('VALID: UserInputStub() => returns default stub value', () => {
      const result = UserInputStub();

      expect(result).toBe('stub user input');
    });

    it('VALID: UserInputStub({value: "custom"}) => returns custom value', () => {
      const result = UserInputStub({ value: 'custom' });

      expect(result).toBe('custom');
    });
  });
});
