import { toolResultBlockParamContract } from './tool-result-block-param-contract';
import {
  EmptyToolResultBlockParamStub,
  ErrorToolResultBlockParamStub,
  ToolResultBlockParamStub,
} from './tool-result-block-param.stub';

describe('toolResultBlockParamContract', () => {
  describe('valid input', () => {
    it('VALID: {type: "tool_result", content: string} => returns ToolResultBlockParam', () => {
      const result = ToolResultBlockParamStub();

      expect(result).toStrictEqual({
        type: 'tool_result',
        tool_use_id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
        content: 'File contents retrieved successfully.',
      });
    });

    it('VALID: {is_error: true, content: string} => returns error result', () => {
      const result = ErrorToolResultBlockParamStub();

      expect(result).toStrictEqual({
        type: 'tool_result',
        tool_use_id: 'toolu_016sbUuxidMBZVMKM9jpHsqK',
        content: "Claude requested permissions to use the tool, but you haven't granted it yet.",
        is_error: true,
      });
    });

    it('VALID: {no content} => accepts missing content', () => {
      const result = EmptyToolResultBlockParamStub();

      expect(result).toStrictEqual({
        type: 'tool_result',
        tool_use_id: 'toolu_01TaskDispatch7890abcd',
      });
    });

    it('VALID: {content: [TextBlockParam]} => accepts content as block array', () => {
      const result = toolResultBlockParamContract.parse({
        type: 'tool_result',
        tool_use_id: 'toolu_abc',
        content: [{ type: 'text', text: 'Result paragraph.' }],
      });

      expect(result.content).toStrictEqual([{ type: 'text', text: 'Result paragraph.' }]);
    });

    it('VALID: {content: [ImageBlockParam]} => accepts image block in array', () => {
      const result = toolResultBlockParamContract.parse({
        type: 'tool_result',
        tool_use_id: 'toolu_abc',
        content: [
          {
            type: 'image',
            source: { type: 'url', url: 'https://example.com/screenshot.png' },
          },
        ],
      });

      expect(result.content).toStrictEqual([
        {
          type: 'image',
          source: { type: 'url', url: 'https://example.com/screenshot.png' },
        },
      ]);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {type: "text"} => throws wrong discriminator', () => {
      expect(() =>
        toolResultBlockParamContract.parse({
          type: 'text',
          tool_use_id: 'toolu_abc',
          content: 'result',
        }),
      ).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {tool_use_id missing} => throws on missing required field', () => {
      expect(() =>
        toolResultBlockParamContract.parse({ type: 'tool_result', content: 'result' }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {tool_use_id: ""} => throws on empty tool_use_id', () => {
      expect(() =>
        toolResultBlockParamContract.parse({
          type: 'tool_result',
          tool_use_id: '',
          content: 'result',
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID: {is_error: "yes"} => throws on non-boolean is_error', () => {
      expect(() =>
        toolResultBlockParamContract.parse({
          type: 'tool_result',
          tool_use_id: 'toolu_abc',
          is_error: 'yes' as never,
        }),
      ).toThrow(/Expected boolean/u);
    });
  });
});
