import { toolUseIdContract } from './tool-use-id-contract';
import { ToolUseIdStub } from './tool-use-id.stub';

describe('toolUseIdContract', () => {
  describe('valid input', () => {
    it('VALID: {value: "toolu_seed1"} => returns branded ToolUseId', () => {
      const result = ToolUseIdStub({ value: 'toolu_seed1' });

      expect(result).toBe('toolu_seed1');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {value: ""} => throws on empty string', () => {
      expect(() => toolUseIdContract.parse('')).toThrow(/too_small/u);
    });

    it('INVALID: {value: 123} => throws on non-string', () => {
      expect(() => toolUseIdContract.parse(123 as never)).toThrow(/Expected string/u);
    });
  });
});
