import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { questWorkLimitsStatics } from './quest-work-limits-statics';

describe('questWorkLimitsStatics', () => {
  describe('budget', () => {
    it('VALID: {budget} => reads the MCP verbatim ceiling rather than restating it', () => {
      expect(questWorkLimitsStatics.budget).toStrictEqual({
        maxSerializedChars: mcpToolResultStatics.maxVerbatimChars,
        indentSpaces: mcpToolResultStatics.jsonIndentSpaces,
      });
    });

    it('VALID: {maxSerializedChars} => is the measured 50,000-character ceiling', () => {
      expect(questWorkLimitsStatics.budget.maxSerializedChars).toBe(50_000);
    });
  });

  describe('cutOrder', () => {
    it('VALID: {cutOrder} => flows first, walkPaths last, and nothing the gate counts', () => {
      expect(questWorkLimitsStatics.cutOrder).toStrictEqual([
        'flows',
        'committedPaths',
        'sessionNotes',
        'walkPaths',
      ]);
    });
  });
});
