import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { RateLimitsSnapshotStub, RateLimitWindowStub } from '@dungeonmaster/shared/contracts';

import { rateLimitsHarness } from '../../../test/harnesses/rate-limits/rate-limits.harness';
import { healthBadgeHarness } from '../../../test/harnesses/health-badge/health-badge.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';

const GUILD_PATH = '/tmp/dm-e2e-health-badge-mount';
const NAV_TIMEOUT = 5_000;
const GUILD_NAME = 'Health Badge Guild';

const rateLimits = rateLimitsHarness();
wireHarnessLifecycle({ harness: rateLimits, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Health Badge Mount', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {mount at /} => badge renders ONLINE beside LOGO_LINK and RATE_LIMITS_STACK, and survives an in-app route change', async ({
    page,
    request,
  }) => {
    // Seed the rate-limits snapshot BEFORE goto so RATE_LIMITS_STACK is present at first paint —
    // rate-limits-snapshot.e2e.ts:36 proves the absent branch when this is skipped.
    const snapshot = RateLimitsSnapshotStub({
      fiveHour: RateLimitWindowStub({ usedPercentage: 42 }),
      sevenDay: RateLimitWindowStub({ usedPercentage: 20 }),
    });
    rateLimits.writeSnapshot({ snapshot });

    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({ name: GUILD_NAME, path: GUILD_PATH });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const hb = healthBadgeHarness({ page });
    await hb.arm();

    await page.goto('/');

    await expect(page.getByTestId('LOGO_LINK')).toBeVisible();
    await expect(hb.badge()).toBeVisible();
    await expect(page.getByTestId('RATE_LIMITS_STACK')).toBeVisible();

    // The badge's seed request really reached the real server: a genuine 200 carrying status
    // 'ok'. uptimeSeconds is server-generated and non-deterministic, so it is asserted by its own
    // field in this same toStrictEqual (bleedthrough-free) rather than a literal — its real value
    // is cross-checked below via the rendered label, which is where a wrong number would surface.
    const seed = await hb.lastSeedResponse();
    expect(seed).toStrictEqual({
      httpStatus: 200,
      status: 'ok',
      uptimeSeconds: seed.uptimeSeconds,
    });

    // The rendered label tracks THIS page's own received uptimeSeconds — not a hardcoded string.
    const expectedLabel = hb.expectedOnlineLabel({ uptimeSeconds: seed.uptimeSeconds });
    await expect(hb.badge()).toHaveText(expectedLabel);

    // In-app navigation off `/` into a quest route: select the guild (local state only, no
    // navigation), then click the session list's own "+" (PixelBtnWidget), whose onAdd handler
    // calls react-router's navigate(`/${slug}/quest`) — a same-document move, never a page.goto.
    await page.getByText(GUILD_NAME).click();
    const sessionList = page.getByTestId('GUILD_SESSION_LIST');
    await expect(sessionList).toBeVisible({ timeout: NAV_TIMEOUT });
    await sessionList.getByTestId('PIXEL_BTN').filter({ hasText: '+' }).click();
    await page.waitForURL(`**/${urlSlug}/quest`, { timeout: NAV_TIMEOUT });

    await expect(hb.badge()).toBeVisible();

    // Proves the move above was genuinely same-document rather than a hard reload: the Navigation
    // Timing API records one entry per real document load, and pushState-based route changes never
    // add one. rate-limits-live-update.e2e.ts:51-55 is the source of this exact recipe.
    const navigationEntryCount = await page.evaluate(
      () => globalThis.performance.getEntriesByType('navigation').length,
    );
    expect(navigationEntryCount).toBe(1);
  });
});
