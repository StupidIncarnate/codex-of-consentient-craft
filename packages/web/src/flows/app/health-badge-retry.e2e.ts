import { test, expect } from '../../../test/harnesses/e2e-fixtures';

import { healthBadgeHarness } from '../../../test/harnesses/health-badge/health-badge.harness';

// Each click is a real network round trip, and the failing one waits out the browser's own
// connection-failure handling against a cut wire.
const RETRY_TEST_TIMEOUT_MS = 45_000;
// The recovery click's genuine response has to be distinguished from the mount's own seed — see
// seedResponseAt's own comment in the harness for why a fixed index is required here.
const RECOVERY_SEED_TIMEOUT_MS = 10_000;

test.describe('Health Badge Retry', () => {
  test.describe.configure({ timeout: RETRY_TEST_TIMEOUT_MS });

  test('VALID: {wire cut, badge clicked, wire restored, badge clicked again} => OFFLINE with the unreachable title, then ONLINE with the fresh uptime', async ({
    page,
  }) => {
    const hb = healthBadgeHarness({ page });
    await hb.arm();

    await page.goto('/');
    await expect(hb.badge()).toBeVisible();

    // Wait for the mount seed's own RESPONSE before touching the wire. Two later reads depend on
    // it having landed: the baseline below counts its REQUEST, and seedResponseAt({index: 1})
    // further down assumes its RESPONSE already occupies index 0. Cut the wire while it is still
    // in flight and it fails instead — the baseline reads one short, and the recovery response
    // lands at index 0 where that fixed-index poll never sees it.
    await hb.lastSeedResponse();

    // Baseline: the mount's own seed has already fired one GET before this walk drives
    // anything, so every later count here is asserted as a DELTA off this, never an absolute.
    const seedCountBeforeCutClick = hb.getSeedRequestCount().length;

    await hb.cutWire();

    // The badge stays an enabled control in every state — health-badge-widget.tsx:29-32 puts
    // onClick on an unconditional UnstyledButton that never returns null — so a click taken
    // straight from the live ONLINE reading re-issues the seed with no silence walk in front
    // of it.
    await hb.badge().click();

    await expect(hb.badge()).toHaveText('OFFLINE');
    // health-badge-statics.ts offlineTitleUnreachable.
    expect(await hb.titleText()).toBe('No response from server');

    // Counted AFTER the badge reached OFFLINE, never straight off the click: that reading is
    // downstream of the click's fetch having already failed, so Playwright has certainly
    // delivered the request event by now. A synchronous read on the line after click() races
    // that delivery instead, and this expect does not retry.
    // page.on('request') still fires for a request that then fails against a cut wire, so the
    // counter reads correctly while offline: exactly one further GET was issued by the click.
    expect(hb.getSeedRequestCount().length).toBe(seedCountBeforeCutClick + 1);

    await hb.restoreWire();

    const seedCountBeforeRecoveryClick = hb.getSeedRequestCount().length;

    await hb.badge().click();

    // The cut-wire click's request never reached the server, so it never produced a `response`
    // event (a network failure fires `requestfailed`, not `response`) — the harness's response
    // log holds only the mount's own seed until THIS click's genuine response lands. Index 1 is
    // that second, real response; polling a fixed position is what stops this read from
    // resolving against the stale mount response before the fresh one arrives.
    const recoverySeed = await hb.seedResponseAt({ index: 1, timeoutMs: RECOVERY_SEED_TIMEOUT_MS });
    expect(recoverySeed).toStrictEqual({
      httpStatus: 200,
      status: 'ok',
      uptimeSeconds: recoverySeed.uptimeSeconds,
    });

    // Same ordering rule as the OFFLINE count above: awaiting the recovery response first puts
    // this click's request event on record before the delta is read.
    expect(hb.getSeedRequestCount().length).toBe(seedCountBeforeRecoveryClick + 1);

    const expectedRecoveryLabel = hb.expectedOnlineLabel({
      uptimeSeconds: recoverySeed.uptimeSeconds,
    });
    await expect(hb.badge()).toHaveText(expectedRecoveryLabel);
  });
});
