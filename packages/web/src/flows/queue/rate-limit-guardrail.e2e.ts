import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { rateLimitsHarness } from '../../../test/harnesses/rate-limits/rate-limits.harness';

// Weighted spend, and the two learned ceilings it is measured against. Input tokens weigh 1, so
// the number the harness writes IS the weighted total: 4200 of 10000 is 42%, and of 21000 is 20%.
const CALM_SPEND = 4200;
const CALM_FIVE_HOUR_CEILING = 10_000;
const CALM_SEVEN_DAY_CEILING = 21_000;

// 9300 of 10000 is 93% — over rateLimitStatics.hold.thresholdPercentage — while the same spend
// against 18600 leaves the five-hour window at 50%, so the hold the guardrail raises names the
// seven-day window and nothing else.
const SPENT_SPEND = 9300;
const SPENT_FIVE_HOUR_CEILING = 18_600;
const SPENT_SEVEN_DAY_CEILING = 10_000;

// The orchestrator's rate-limits poller runs at DUNGEONMASTER_RATE_LIMITS_POLL_MS (500ms in this
// config) and the hold reaches the browser over a WebSocket broadcast after it. Every wait below
// spans several of those cycles rather than one.
const POLL_TIMEOUT_MS = 9000;

const HELD_NOTICE = /^HELD — 7d window at 93% — dispatch holds until it resets · resumes in .+$/u;

const rateLimits = rateLimitsHarness();
wireHarnessLifecycle({ harness: rateLimits, testObj: test });

test.describe('The rate-limit guardrail on the queue page', () => {
  test('VALID: {both windows calibrated} => the queue page shows each window with its percentage', async ({
    page,
    request,
  }) => {
    await guildHarness({ request }).cleanGuilds();
    await rateLimits.writeLedger({
      spendTokens: CALM_SPEND,
      fiveHourCeiling: CALM_FIVE_HOUR_CEILING,
      sevenDayCeiling: CALM_SEVEN_DAY_CEILING,
    });

    const readingResponse = page.waitForResponse(
      (response) => response.url().includes('/api/rate-limits') && response.status() === 200,
    );

    await page.goto('/queue');

    expect((await readingResponse).ok()).toBe(true);

    const cards = page.getByTestId('QUEUE_PAGE_RATE_LIMITS');

    await expect(cards.getByTestId('RATE_LIMIT_CARD_5H')).toHaveText(/^\[ 5h .* 42% \(.*\) \]$/u, {
      timeout: POLL_TIMEOUT_MS,
    });
    await expect(cards.getByTestId('RATE_LIMIT_CARD_7D')).toHaveText(/^\[ 7d .* 20% \(.*\) \]$/u);
  });

  test('EMPTY: {spend measured but no ceiling learned} => the queue page shows no cards, because 0% would be a lie', async ({
    page,
    request,
  }) => {
    await guildHarness({ request }).cleanGuilds();
    // A machine that has never been refused has no denominator, however much it has spent.
    await rateLimits.writeLedger({
      spendTokens: SPENT_SPEND,
      fiveHourCeiling: null,
      sevenDayCeiling: null,
    });

    const readingResponse = page.waitForResponse(
      (response) => response.url().includes('/api/rate-limits') && response.status() === 200,
    );

    await page.goto('/queue');

    expect((await readingResponse).ok()).toBe(true);

    await expect(page.getByTestId('QUEUE_PAGE')).toBeVisible();
    await expect(
      page.getByTestId('QUEUE_PAGE_RATE_LIMITS').getByTestId('RATE_LIMITS_STACK'),
    ).toHaveCount(0);
  });

  test('VALID: {the guardrail raises a hold while the queue page is open} => the HELD notice appears and PLAY goes disabled', async ({
    page,
    request,
  }) => {
    await guildHarness({ request }).cleanGuilds();
    await rateLimits.writeLedger({
      spendTokens: CALM_SPEND,
      fiveHourCeiling: CALM_FIVE_HOUR_CEILING,
      sevenDayCeiling: CALM_SEVEN_DAY_CEILING,
    });

    await page.goto('/queue');

    const toggle = page.getByTestId('DISPATCH_TOGGLE').getByTestId('PIXEL_BTN');

    await expect(toggle).toHaveText('PLAY');
    await expect(toggle).toBeEnabled();
    await expect(page.getByTestId('DISPATCH_HOLD_NOTICE')).toHaveCount(0);

    // The browser re-reads the dispatch state on the `dispatch-state-changed` broadcast the hold
    // raises, so watching for that GET proves the guardrail — not the spec — moved the UI.
    const dispatchRead = page.waitForRequest(
      (req) => req.method() === 'GET' && req.url().includes('/api/orchestration/dispatch'),
    );

    await rateLimits.writeLedger({
      spendTokens: SPENT_SPEND,
      fiveHourCeiling: SPENT_FIVE_HOUR_CEILING,
      sevenDayCeiling: SPENT_SEVEN_DAY_CEILING,
    });

    await dispatchRead;

    await expect(page.getByTestId('DISPATCH_HOLD_NOTICE')).toHaveText(HELD_NOTICE, {
      timeout: POLL_TIMEOUT_MS,
    });
    await expect(toggle).toBeDisabled();
    await expect(toggle).toHaveText('PLAY');
  });

  test('EMPTY: {no hold} => the queue page carries no notice and an enabled PLAY', async ({
    page,
    request,
  }) => {
    await guildHarness({ request }).cleanGuilds();
    await rateLimits.writeLedger({
      spendTokens: CALM_SPEND,
      fiveHourCeiling: CALM_FIVE_HOUR_CEILING,
      sevenDayCeiling: CALM_SEVEN_DAY_CEILING,
    });

    await page.goto('/queue');

    const toggle = page.getByTestId('DISPATCH_TOGGLE').getByTestId('PIXEL_BTN');

    await expect(toggle).toHaveText('PLAY');
    await expect(toggle).toBeEnabled();
    await expect(page.getByTestId('DISPATCH_HOLD_NOTICE')).toHaveCount(0);
  });

  test('VALID: {a hold lands over a playing queue} => PAUSE stays clickable and stops the queue', async ({
    page,
    request,
  }) => {
    await guildHarness({ request }).cleanGuilds();
    await rateLimits.writeLedger({
      spendTokens: CALM_SPEND,
      fiveHourCeiling: CALM_FIVE_HOUR_CEILING,
      sevenDayCeiling: CALM_SEVEN_DAY_CEILING,
    });

    await page.goto('/queue');

    const toggle = page.getByTestId('DISPATCH_TOGGLE').getByTestId('PIXEL_BTN');

    await expect(toggle).toHaveText('PLAY');

    const playPost = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes('/api/orchestration/dispatch/play'),
    );
    await toggle.click();
    await playPost;

    await expect(toggle).toHaveText('PAUSE');

    await rateLimits.writeLedger({
      spendTokens: SPENT_SPEND,
      fiveHourCeiling: SPENT_FIVE_HOUR_CEILING,
      sevenDayCeiling: SPENT_SEVEN_DAY_CEILING,
    });

    await expect(page.getByTestId('DISPATCH_HOLD_NOTICE')).toHaveText(HELD_NOTICE, {
      timeout: POLL_TIMEOUT_MS,
    });

    // The whole point of the split: the guardrail took the queue, the user keeps the stop lever.
    await expect(toggle).toBeEnabled();
    await expect(toggle).toHaveText('PAUSE');

    const pausePost = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes('/api/orchestration/dispatch/pause'),
    );
    await toggle.click();
    await pausePost;

    // PAUSE is gone, PLAY is back — and disabled, because the hold outlives the user's own lever.
    await expect(toggle).toHaveText('PLAY', { timeout: POLL_TIMEOUT_MS });
    await expect(toggle).toBeDisabled();
    await expect(page.getByTestId('DISPATCH_HOLD_NOTICE')).toBeVisible();
  });
});
