import { toolInputKeyContract } from './tool-input-key-contract';
import { ToolInputKeyStub } from './tool-input-key.stub';

describe('toolInputKeyContract', () => {
  describe('valid keys', () => {
    it('VALID: {"command"} => parses successfully', () => {
      const value = ToolInputKeyStub();

      const result = toolInputKeyContract.parse(value);

      expect(result).toBe('command');
    });
  });

  describe('invalid keys', () => {
    it('INVALID: {non-string} => throws validation error', () => {
      expect(() => {
        toolInputKeyContract.parse(42);
      }).toThrow(/Expected string/u);
    });
  });
});
