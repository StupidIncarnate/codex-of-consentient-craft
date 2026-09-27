import { logLevelContract } from './log-level-contract';
import { LogLevelStub } from './log-level.stub';

describe('logLevelContract', () => {
  describe('valid members', () => {
    it.each(logLevelContract.options)('VALID: {value: %s} => parses to itself', (value) => {
      const logLevel = LogLevelStub({ value });

      const result = logLevelContract.parse(logLevel);

      expect(result).toBe(value);
    });
  });

  describe('invalid members', () => {
    it('INVALID: {value: "debug"} => an unlisted severity throws validation error', () => {
      expect(() => {
        LogLevelStub({ value: 'debug' as never });
      }).toThrow(/Invalid option/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: "ERROR"} => an uppercase variant of a valid member throws validation error', () => {
      expect(() => {
        logLevelContract.parse('ERROR');
      }).toThrow(/Invalid option/u);
    });
  });
});
