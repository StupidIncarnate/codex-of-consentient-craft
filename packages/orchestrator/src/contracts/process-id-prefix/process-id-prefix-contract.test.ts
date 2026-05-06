import { processIdPrefixContract } from './process-id-prefix-contract';
import { ProcessIdPrefixStub } from './process-id-prefix.stub';

describe('processIdPrefixContract', () => {
  describe('valid prefix', () => {
    it('VALID: {default stub} => parses to "proc"', () => {
      const result = ProcessIdPrefixStub();

      expect(result).toBe('proc');
    });

    it('VALID: {value: "chat"} => parses successfully', () => {
      const result = processIdPrefixContract.parse('chat');

      expect(result).toBe('chat');
    });

    it('VALID: {value: "design"} => parses successfully', () => {
      const result = processIdPrefixContract.parse('design');

      expect(result).toBe('design');
    });

    it('VALID: {value: "proc"} => parses successfully', () => {
      const result = processIdPrefixContract.parse('proc');

      expect(result).toBe('proc');
    });
  });

  describe('invalid prefix', () => {
    it('INVALID: {value: "agent"} => throws validation error', () => {
      expect(() => processIdPrefixContract.parse('agent')).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => processIdPrefixContract.parse('')).toThrow(/Invalid enum value/u);
    });
  });
});
