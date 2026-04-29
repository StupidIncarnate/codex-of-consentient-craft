import { toolReferenceBlockParamContract } from './tool-reference-block-param-contract';
import { ToolReferenceBlockParamStub } from './tool-reference-block-param.stub';

describe('toolReferenceBlockParamContract', () => {
  describe('valid input', () => {
    it('VALID: {type: "tool_reference", tool_name: "mcp__dungeonmaster__get-quest"} => returns ToolReferenceBlockParam', () => {
      const result = ToolReferenceBlockParamStub();

      expect(result).toStrictEqual({
        type: 'tool_reference',
        tool_name: 'mcp__dungeonmaster__get-quest',
      });
    });

    it('VALID: {tool_name: "Bash"} => accepts any non-empty tool name', () => {
      const result = toolReferenceBlockParamContract.parse({
        type: 'tool_reference',
        tool_name: 'Bash',
      });

      expect(result.tool_name).toBe('Bash');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {type: "text"} => throws wrong discriminator', () => {
      expect(() =>
        toolReferenceBlockParamContract.parse({
          type: 'text',
          tool_name: 'Bash',
        }),
      ).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {tool_name missing} => throws on missing required field', () => {
      expect(() => toolReferenceBlockParamContract.parse({ type: 'tool_reference' })).toThrow(
        /Required/u,
      );
    });

    it('INVALID: {tool_name: 123} => throws on non-string tool_name', () => {
      expect(() =>
        toolReferenceBlockParamContract.parse({ type: 'tool_reference', tool_name: 123 as never }),
      ).toThrow(/Expected string/u);
    });
  });
});
