import { mcpToolResultStatics } from '../mcp-tool-result/mcp-tool-result-statics';
import { questSummaryLimitsStatics } from './quest-summary-limits-statics';

const NOTICE_HEADROOM_CHARS = 1_000;

describe('questSummaryLimitsStatics', () => {
  describe('exported value', () => {
    it('VALID: {statics} => caps every variable-length section and the whole render', () => {
      expect(questSummaryLimitsStatics).toStrictEqual({
        maxFlows: 40,
        maxMidQuestObservables: 80,
        maxUnconfirmable: 80,
        maxNotesPerKind: 40,
        maxRenderChars: 48_000,
      });
    });
  });

  describe('the character ceiling clears the MCP verbatim-delivery budget', () => {
    // The render appends its truncation notice AFTER cutting at maxRenderChars, so the ceiling has
    // to leave room for that notice inside mcpToolResultStatics.maxVerbatimChars — otherwise the
    // very act of announcing the cut is what spills the result to a file.
    it('VALID: {maxRenderChars} => leaves room for the truncation notice under maxVerbatimChars', () => {
      expect(
        mcpToolResultStatics.maxVerbatimChars - questSummaryLimitsStatics.maxRenderChars,
      ).toBeGreaterThanOrEqual(NOTICE_HEADROOM_CHARS);
    });
  });
});
