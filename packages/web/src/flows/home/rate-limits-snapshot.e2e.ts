import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';

import { rateLimitsHarness } from '../../../test/harnesses/rate-limits/rate-limits.harness';

const POLL_TIMEOUT_MS = 9000;

// Input tokens weigh 1, so the spend the harness writes IS the weighted total the percentage is
// computed from: 4200 of a 10000 five-hour ceiling is 42%, and of a 21000 seven-day one is 20%.
const SPEND = 4200;
const FIVE_HOUR_CEILING = 10_000;
const SEVEN_DAY_CEILING = 21_000;

const rateLimits = rateLimitsHarness();
wireHarnessLifecycle({ harness: rateLimits, testObj: test });

test.describe('Rate Limits Snapshot', () => {
  test('VALID: {a ledger with both windows calibrated} => both rate-limit cards render with formatted text', async ({
    page,
  }) => {
    rateLimits.writeLedger({
      spendTokens: SPEND,
      fiveHourCeiling: FIVE_HOUR_CEILING,
      sevenDayCeiling: SEVEN_DAY_CEILING,
    });

    await page.goto('/');

    await expect(page.getByTestId('RATE_LIMITS_STACK')).toBeVisible({ timeout: POLL_TIMEOUT_MS });
    await expect(page.getByTestId('RATE_LIMIT_CARD_5H')).toHaveText(/^\[ 5h .* 42% \(.*\) \]$/u);
    await expect(page.getByTestId('RATE_LIMIT_CARD_7D')).toHaveText(/^\[ 7d .* 20% \(.*\) \]$/u);
  });

  test('EMPTY: {nothing measured and no ceiling learned} => rate-limits stack does not render', async ({
    page,
  }) => {
    rateLimits.writeLedger({ spendTokens: 0, fiveHourCeiling: null, sevenDayCeiling: null });

    await page.goto('/');

    await expect(page.getByTestId('LOGO_LINK')).toBeVisible();
    await expect(page.getByTestId('RATE_LIMITS_STACK')).toHaveCount(0);
  });
});
