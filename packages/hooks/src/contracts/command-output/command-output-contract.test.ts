import { commandOutputContract } from './command-output-contract';
import { CommandOutputStub } from './command-output.stub';

describe('commandOutputContract', () => {
  describe('valid command output', () => {
    it('VALID: {value: "output"} => parses successfully', () => {
      const output = CommandOutputStub({ value: 'output' });

      const result = commandOutputContract.parse(output);

      expect(result).toBe('output');
    });

    it('VALID: {value: ""} => parses empty string', () => {
      const output = CommandOutputStub({ value: '' });

      const result = commandOutputContract.parse(output);

      expect(result).toBe('');
    });
  });
});
