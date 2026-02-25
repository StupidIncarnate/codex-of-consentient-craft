import { toolUseIdContract } from './tool-use-id-contract';
import { ToolUseIdStub } from './tool-use-id.stub';

describe('toolUseIdContract', () => {
  describe('valid tool use ids', () => {
    it('VALID: {value: "toolu_01EaCJyt5y8gzMNyGYarwUDZ"} => parses successfully', () => {
      const result = ToolUseIdStub({ value: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ' });

      expect(toolUseIdContract.parse(result)).toBe('toolu_01EaCJyt5y8gzMNyGYarwUDZ');
    });
  });

  describe('invalid tool use ids', () => {
    it('INVALID_VALUE: {value: ""} => throws validation error', () => {
      expect(() => toolUseIdContract.parse('')).toThrow(/too_small/u);
    });
  });
});
