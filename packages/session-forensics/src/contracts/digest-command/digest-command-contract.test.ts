import { digestCommandContract } from './digest-command-contract';
import { DigestCommandStub } from './digest-command.stub';

describe('digestCommandContract', () => {
  describe('valid commands', () => {
    it('VALID: summary => parses successfully', () => {
      const command = DigestCommandStub({ value: 'summary' });

      const result = digestCommandContract.parse(command);

      expect(result).toBe('summary');
    });

    it('VALID: buckets => parses successfully', () => {
      const command = DigestCommandStub({ value: 'buckets' });

      const result = digestCommandContract.parse(command);

      expect(result).toBe('buckets');
    });

    it('VALID: gaps => parses successfully', () => {
      const command = DigestCommandStub({ value: 'gaps' });

      const result = digestCommandContract.parse(command);

      expect(result).toBe('gaps');
    });

    it('VALID: coverage => parses successfully', () => {
      const command = DigestCommandStub({ value: 'coverage' });

      const result = digestCommandContract.parse(command);

      expect(result).toBe('coverage');
    });
  });

  describe('invalid commands', () => {
    it('INVALID: unknown command string => throws validation error', () => {
      expect(() => {
        digestCommandContract.parse('unknown');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
