import { toolResultDisplayContentContract } from './tool-result-display-content-contract';
import { ToolResultDisplayContentStub } from './tool-result-display-content.stub';

describe('toolResultDisplayContentContract', () => {
  describe('valid content', () => {
    it('VALID: {"file contents here"} => parses successfully', () => {
      const value = ToolResultDisplayContentStub();

      const result = toolResultDisplayContentContract.parse(value);

      expect(result).toBe('file contents here');
    });

    it('EDGE: {half a JSON object} => parses, because a preview may cut mid-token', () => {
      const result = toolResultDisplayContentContract.parse('{"name":"codewea');

      expect(result).toBe('{"name":"codewea');
    });

    it('EMPTY: {""} => parses successfully', () => {
      const result = toolResultDisplayContentContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid content', () => {
    it('INVALID: {non-string} => throws validation error', () => {
      expect(() => {
        toolResultDisplayContentContract.parse(42);
      }).toThrow(/Expected string/u);
    });
  });
});
