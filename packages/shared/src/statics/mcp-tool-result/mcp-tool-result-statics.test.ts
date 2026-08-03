import { mcpToolResultStatics } from './mcp-tool-result-statics';

describe('mcpToolResultStatics', () => {
  describe('full exported value', () => {
    it('VALID: {statics} => bounds a serialized MCP tool result to what Claude Code delivers verbatim', () => {
      expect(mcpToolResultStatics).toStrictEqual({
        maxOutputTokens: 25_000,
        verbatimTokenFactor: 0.5,
        estimatedCharsPerToken: 4,
        maxVerbatimChars: 50_000,
        jsonIndentSpaces: 2,
      });
    });
  });

  describe('maxVerbatimChars is the cheap-path early-out expressed in characters', () => {
    it('VALID: {maxOutputTokens, verbatimTokenFactor, estimatedCharsPerToken} => multiply to maxVerbatimChars', () => {
      const { maxOutputTokens, verbatimTokenFactor, estimatedCharsPerToken, maxVerbatimChars } =
        mcpToolResultStatics;

      expect(maxOutputTokens * verbatimTokenFactor * estimatedCharsPerToken).toBe(maxVerbatimChars);
    });

    it('VALID: {maxVerbatimChars} => sits below the hard ceiling, leaving room for the tokenizer to beat the estimate', () => {
      const { maxOutputTokens, estimatedCharsPerToken, maxVerbatimChars } = mcpToolResultStatics;

      expect(maxVerbatimChars).toBeLessThan(maxOutputTokens * estimatedCharsPerToken);
    });
  });
});
