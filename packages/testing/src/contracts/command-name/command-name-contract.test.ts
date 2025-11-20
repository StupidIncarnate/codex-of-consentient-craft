import { commandNameContract } from './command-name-contract';
import { CommandNameStub } from './command-name.stub';

describe('commandNameContract', () => {
  describe('valid command names', () => {
    it('VALID: {value: "test"} => parses successfully', () => {
      const command = CommandNameStub({ value: 'test' });

      const parsed = commandNameContract.parse(command);

      expect(parsed).toBe('test');
    });

    it('VALID: {value: "lint"} => parses different command', () => {
      const command = CommandNameStub({ value: 'lint' });

      const parsed = commandNameContract.parse(command);

      expect(parsed).toBe('lint');
    });
  });

  describe('invalid command names', () => {
    it('INVALID_COMMAND_NAME: {value: number} => throws validation error', () => {
      expect(() => {
        return commandNameContract.parse(123 as never);
      }).toThrow(/Expected string/u);
    });
  });
});
