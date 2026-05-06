import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { RateLimitsSnapshotStub, RateLimitWindowStub } from '@dungeonmaster/shared/contracts';

import { rateLimitsHarness } from '../../test/harnesses/rate-limits/rate-limits.harness';

const POLL_TIMEOUT_MS = 9000;

const rateLimits = rateLimitsHarness();
wireHarnessLifecycle({ harness: rateLimits, testObj: test });

test.describe('Rate Limits Snapshot', () => {
  test('VALID: {snapshot file with 5h and 7d windows} => both rate-limit cards render with formatted text', async ({
    page,
  }) => {
    const snapshot = RateLimitsSnapshotStub({
      fiveHour: RateLimitWindowStub({ usedPercentage: 42 }),
      sevenDay: RateLimitWindowStub({ usedPercentage: 20 }),
    });
    rateLimits.writeSnapshot({ snapshot });

    await page.goto('/');

    await expect(page.getByTestId('RATE_LIMITS_STACK')).toBeVisible({ timeout: POLL_TIMEOUT_MS });
    await expect(page.getByTestId('RATE_LIMIT_CARD_5H')).toContainText('5h');
    await expect(page.getByTestId('RATE_LIMIT_CARD_5H')).toContainText('42%');
    await expect(page.getByTestId('RATE_LIMIT_CARD_7D')).toContainText('7d');
    await expect(page.getByTestId('RATE_LIMIT_CARD_7D')).toContainText('20%');
  });

  test('EMPTY: {no snapshot file} => rate-limits stack does not render', async ({ page }) => {
    rateLimits.clearSnapshot();

    await page.goto('/');

    await expect(page.getByTestId('LOGO_LINK')).toBeVisible();
    await expect(page.getByTestId('RATE_LIMITS_STACK')).toHaveCount(0);
  });
});
