import { cliArgContract } from './cli-arg-contract';
import { CliArgStub } from './cli-arg.stub';

describe('cliArgContract', () => {
  describe('valid', () => {
    it('VALID: {value: "--verbose"} => parses flag argument', () => {
      const result = cliArgContract.parse('--verbose');

      expect(result).toBe('--verbose');
    });

    it('VALID: {value: "lint"} => parses positional argument', () => {
      const result = cliArgContract.parse('lint');

      expect(result).toBe('lint');
    });
  });

  describe('stub', () => {
    it('VALID: {default} => returns default CliArg', () => {
      const result = CliArgStub();

      expect(result).toBe('--verbose');
    });
  });
});
