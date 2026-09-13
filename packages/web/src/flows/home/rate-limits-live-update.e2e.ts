import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { RateLimitsSnapshotStub, RateLimitWindowStub } from '@dungeonmaster/shared/contracts';

import { rateLimitsHarness } from '../../../test/harnesses/rate-limits/rate-limits.harness';

const POLL_TIMEOUT_MS = 9000;

// Input tokens weigh 1, so each spend below IS the weighted total: 4200 of 10000 is 42% and of
// 21000 is 20%; 8100 of the same two ceilings is 81% and 39%.
const FIVE_HOUR_CEILING = 10_000;
const SEVEN_DAY_CEILING = 21_000;
const INITIAL_SPEND = 4200;
const UPDATED_SPEND = 8100;

const rateLimits = rateLimitsHarness();
wireHarnessLifecycle({ harness: rateLimits, testObj: test });

test.describe('Rate Limits Live Update', () => {
  test('VALID: {reading updated mid-session} => rate-limits card DOM updates via WS without reload', async ({
    page,
  }) => {
    // 1. The ledger carries the NUMBERS the API serves. The rate-limits.json snapshot carries
    //    nothing the card reads — it is the file the orchestrator's poller diffs, and a change to
    //    it is the only thing that emits `rate-limits-updated`, which is the event this binding
    //    re-fetches on. Both are written, because this spec is about the wake, not the reading.
    rateLimits.writeLedger({
      spendTokens: INITIAL_SPEND,
      fiveHourCeiling: FIVE_HOUR_CEILING,
      sevenDayCeiling: SEVEN_DAY_CEILING,
    });
    rateLimits.writeSnapshot({
      snapshot: RateLimitsSnapshotStub({
        fiveHour: RateLimitWindowStub({ usedPercentage: 42 }),
        sevenDay: RateLimitWindowStub({ usedPercentage: 20 }),
      }),
    });

    // 2. Navigate to home
    await page.goto('/');

    // 3. Wait for initial render with the first reading's values
    await expect(page.getByTestId('RATE_LIMIT_CARD_5H')).toContainText('42%', {
      timeout: POLL_TIMEOUT_MS,
    });
    await expect(page.getByTestId('RATE_LIMIT_CARD_7D')).toContainText('20%');

    // 4. Move the ledger first, then touch the snapshot file — the file watcher emits
    //    rate-limits-updated via orchestrationEventsState, the server's in-memory relay loop
    //    broadcasts it to every WS client, and the web binding re-fetches the ledger-derived
    //    reading on that event.
    rateLimits.writeLedger({
      spendTokens: UPDATED_SPEND,
      fiveHourCeiling: FIVE_HOUR_CEILING,
      sevenDayCeiling: SEVEN_DAY_CEILING,
    });
    rateLimits.writeSnapshot({
      snapshot: RateLimitsSnapshotStub({
        fiveHour: RateLimitWindowStub({ usedPercentage: 81 }),
        sevenDay: RateLimitWindowStub({ usedPercentage: 39 }),
      }),
    });

    // 5–6. Assert DOM updated without reload — generous timeout to accommodate the
    //      orchestrator's polling interval plus WS relay + fetch round-trip.
    await expect(page.getByTestId('RATE_LIMIT_CARD_5H')).toContainText('81%', {
      timeout: POLL_TIMEOUT_MS,
    });
    await expect(page.getByTestId('RATE_LIMIT_CARD_7D')).toContainText('39%', {
      timeout: POLL_TIMEOUT_MS,
    });

    // 7. Verify no reload occurred — exactly one navigation entry means the page never
    //    hard-reloaded between the initial goto and the WS-driven update.
    const navigationCount = await page.evaluate(
      () => globalThis.performance.getEntriesByType('navigation').length,
    );

    expect(navigationCount).toBe(1);
  });
});
