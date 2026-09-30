import { toolUseContract } from './tool-use-contract';
import { ToolUseStub } from './tool-use.stub';

describe('toolUseContract', () => {
  describe('valid input', () => {
    it('VALID: {type: "tool_use", id, name, input: object} => returns ToolUse', () => {
      const result = ToolUseStub();

      expect(result).toStrictEqual({
        type: 'tool_use',
        id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
        name: 'Bash',
        input: { command: 'ls -la' },
      });
    });

    it('VALID: {input: null} => accepts null input', () => {
      const result = toolUseContract.parse({
        type: 'tool_use',
        id: 'toolu_abc',
        name: 'Read',
        input: null,
      });

      expect(result.input).toBe(null);
    });

    it('VALID: {input: string} => accepts string input', () => {
      const result = toolUseContract.parse({
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
        toolUseContract.parse({
          type: 'text',
          id: 'toolu_abc',
          name: 'Bash',
          input: {},
        }),
      ).toThrow(/Invalid input: expected/u);
    });

    it('INVALID: {id missing} => throws on missing required field', () => {
      expect(() => toolUseContract.parse({ type: 'tool_use', name: 'Bash', input: {} })).toThrow(
        /received undefined/u,
      );
    });

    it('INVALID: {id: ""} => throws on empty id', () => {
      expect(() =>
        toolUseContract.parse({ type: 'tool_use', id: '', name: 'Bash', input: {} }),
      ).toThrow(/too_small/u);
    });

    it('INVALID: {name missing} => throws on missing required field', () => {
      expect(() =>
        toolUseContract.parse({
          type: 'tool_use',
          id: 'toolu_abc',
          input: {},
        }),
      ).toThrow(/received undefined/u);
    });
  });
});
