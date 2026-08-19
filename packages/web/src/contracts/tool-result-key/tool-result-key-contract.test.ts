import { toolResultKeyContract } from './tool-result-key-contract';
import { ToolResultKeyStub } from './tool-result-key.stub';

describe('toolResultKeyContract', () => {
  describe('valid keys', () => {
    it('VALID: {"prompt"} => parses successfully', () => {
      const value = ToolResultKeyStub();

      const result = toolResultKeyContract.parse(value);

      expect(result).toBe('prompt');
    });
  });

  describe('invalid keys', () => {
    it('INVALID: {non-string} => throws validation error', () => {
      expect(() => {
        toolResultKeyContract.parse(42);
      }).toThrow(/Expected string/u);
    });
  });
});
