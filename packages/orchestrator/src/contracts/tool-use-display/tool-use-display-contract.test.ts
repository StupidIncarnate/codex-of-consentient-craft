import { toolUseDisplayContract } from './tool-use-display-contract';
import { ToolUseDisplayStub } from './tool-use-display.stub';

describe('toolUseDisplayContract', () => {
  describe('valid input', () => {
    it('VALID: {value: tool name display} => returns branded string', () => {
      const result = ToolUseDisplayStub({ value: '[Bash]' });

      expect(result).toBe('[Bash]');
    });

    it('VALID: {value: tool with newline} => returns branded string', () => {
      const result = ToolUseDisplayStub({ value: '[Task]\n' });

      expect(result).toBe('[Task]\n');
    });
  });

  describe('invalid input', () => {
    it('INVALID_VALUE: {value: empty string} => throws ZodError', () => {
      expect(() => toolUseDisplayContract.parse('')).toThrow(
        /String must contain at least 1 character/u,
      );
    });
  });
});
