import { toolUseBlockParamContract } from './tool-use-block-param-contract';
import { ToolUseBlockParamStub } from './tool-use-block-param.stub';

describe('toolUseBlockParamContract', () => {
  describe('valid input', () => {
    it('VALID: {type: "tool_use", id, name, input: object} => returns ToolUseBlockParam', () => {
      const result = ToolUseBlockParamStub();

      expect(result).toStrictEqual({
        type: 'tool_use',
        id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
        name: 'Bash',
        input: { command: 'ls -la' },
      });
    });

    it('VALID: {input: null} => accepts null input', () => {
      const result = toolUseBlockParamContract.parse({
        type: 'tool_use',
        id: 'toolu_abc',
        name: 'Read',
        input: null,
      });

      expect(result.input).toBe(null);
    });

    it('VALID: {input: string} => accepts string input', () => {
      const result = toolUseBlockParamContract.parse({
        type: 'tool_use',
        id: 'toolu_abc',
        name: 'Read',
        input: 'some string input',
      });

      expect(result.input).toBe('some string input');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {type: "text"} => throws wrong discriminator', () => {
      expect(() =>
        toolUseBlockParamContract.parse({
          type: 'text',
          id: 'toolu_abc',
          name: 'Bash',
          input: {},
        }),
      ).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {id missing} => throws on missing required field', () => {
      expect(() =>
        toolUseBlockParamContract.parse({ type: 'tool_use', name: 'Bash', input: {} }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {id: ""} => throws on empty id', () => {
      expect(() =>
        toolUseBlockParamContract.parse({ type: 'tool_use', id: '', name: 'Bash', input: {} }),
      ).toThrow(/too_small/u);
    });

    it('INVALID: {name missing} => throws on missing required field', () => {
      expect(() =>
        toolUseBlockParamContract.parse({
          type: 'tool_use',
          id: 'toolu_abc',
          input: {},
        }),
      ).toThrow(/Required/u);
    });
  });
});
