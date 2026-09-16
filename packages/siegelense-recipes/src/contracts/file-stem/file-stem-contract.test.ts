import { fileStemContract } from './file-stem-contract';
import { FileStemStub } from './file-stem.stub';

describe('fileStemContract', () => {
  describe('valid stems', () => {
    it('VALID: {value: "seed-session-1"} => parses unchanged', () => {
      const result = fileStemContract.parse('seed-session-1');

      expect(result).toBe('seed-session-1');
    });

    it('VALID: {stub with value override} => parses with the overridden value', () => {
      const result = FileStemStub({ value: 'agent-seed-agent-1' });

      expect(result).toBe('agent-seed-agent-1');
    });
  });

  describe('invalid stems', () => {
    it('INVALID: {value: ""} => throws "String must contain at least 1 character"', () => {
      expect(() => fileStemContract.parse('')).toThrow(/String must contain at least 1 character/u);
    });
  });
});
