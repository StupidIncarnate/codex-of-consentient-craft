import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { operationsLedgerRenderStatics } from './operations-ledger-render-statics';

// Measured against the relay-scale fixture in `work-item-to-prompt-transformer.test.ts`, using
// `flowrider` — the largest prompt template, so it sets the budget for every role. Its served block
// is 49,220 characters at 21 ledger lines and 54,958 at 40, which gives 302 characters per line
// ((54,958 − 49,220) / 19) and a non-ledger remainder of 42,878 (49,220 − 21 × 302).
const FLOWRIDER_NON_LEDGER_CHARS = 42_878;
const LEDGER_LINE_SERIALIZED_CHARS = 302;
const ELISION_NOTICE_SERIALIZED_CHARS = 149;

// The slack the cap must leave on the worst-case role: about seven more ledger lines, so operation
// texts longer than the fixture's 280 characters do not immediately overflow. At 302 characters a
// line this pins the cap at 16 — raising it to 17 leaves 1,839 and fails here.
const MIN_HEADROOM_CHARS = 2_000;

describe('operationsLedgerRenderStatics', () => {
  describe('full exported value', () => {
    it('VALID: {statics} => bounds the operations-ledger render served through get-agent-prompt', () => {
      expect(operationsLedgerRenderStatics).toStrictEqual({
        maxRenderedItems: 16,
        minRecentCompleteItems: 3,
      });
    });
  });

  describe('the cap fits the measured worst-case served block', () => {
    it('VALID: {maxRenderedItems, flowrider remainder} => bounded render leaves the required headroom under maxVerbatimChars', () => {
      const bounded =
        FLOWRIDER_NON_LEDGER_CHARS +
        operationsLedgerRenderStatics.maxRenderedItems * LEDGER_LINE_SERIALIZED_CHARS +
        ELISION_NOTICE_SERIALIZED_CHARS;

      expect(mcpToolResultStatics.maxVerbatimChars - bounded).toBeGreaterThanOrEqual(
        MIN_HEADROOM_CHARS,
      );
    });

    it('VALID: {minRecentCompleteItems} => sits inside the cap, so the floor tops the render up rather than replacing the bound', () => {
      expect(operationsLedgerRenderStatics.minRecentCompleteItems).toBeLessThan(
        operationsLedgerRenderStatics.maxRenderedItems,
      );
    });
  });
});
