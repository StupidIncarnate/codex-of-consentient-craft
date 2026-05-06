import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { RateLimitsSnapshotStub, RateLimitWindowStub } from '@dungeonmaster/shared/contracts';

import { rateLimitsHarness } from '../../test/harnesses/rate-limits/rate-limits.harness';

const POLL_TIMEOUT_MS = 9000;

const rateLimits = rateLimitsHarness();
wireHarnessLifecycle({ harness: rateLimits, testObj: test });

test.describe('Rate Limits Live Update', () => {
  test('VALID: {snapshot file updated mid-session} => rate-limits card DOM updates via WS without reload', async ({
    page,
  }) => {
    // 1. Write initial snapshot
    const initialSnapshot = RateLimitsSnapshotStub({
      fiveHour: RateLimitWindowStub({ usedPercentage: 42 }),
      sevenDay: RateLimitWindowStub({ usedPercentage: 20 }),
    });
    rateLimits.writeSnapshot({ snapshot: initialSnapshot });

    // 2. Navigate to home
    await page.goto('/');

    // 3. Wait for initial render with first snapshot values
    await expect(page.getByTestId('RATE_LIMIT_CARD_5H')).toContainText('42%', {
      timeout: POLL_TIMEOUT_MS,
    });
    await expect(page.getByTestId('RATE_LIMIT_CARD_7D')).toContainText('20%');

    // 4. Write updated snapshot — triggers the orchestrator's file watcher, which emits
    //    rate-limits-updated via orchestrationEventsState, relayed to all WS clients by
    //    the server's in-memory relay loop; the web binding re-fetches on that event.
    const updatedSnapshot = RateLimitsSnapshotStub({
      fiveHour: RateLimitWindowStub({ usedPercentage: 81 }),
      sevenDay: RateLimitWindowStub({ usedPercentage: 50 }),
    });
    rateLimits.writeSnapshot({ snapshot: updatedSnapshot });

    // 5–6. Assert DOM updated without reload — generous timeout to accommodate the
    //      orchestrator's ~5s polling interval plus WS relay + fetch round-trip.
    await expect(page.getByTestId('RATE_LIMIT_CARD_5H')).toContainText('81%', {
      timeout: POLL_TIMEOUT_MS,
    });
    await expect(page.getByTestId('RATE_LIMIT_CARD_7D')).toContainText('50%', {
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
