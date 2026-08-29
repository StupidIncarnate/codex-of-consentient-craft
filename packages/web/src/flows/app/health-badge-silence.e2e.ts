import { test, expect } from '../../../test/harnesses/e2e-fixtures';

import { healthBadgeHarness } from '../../../test/harnesses/health-badge/health-badge.harness';

// health-heartbeat-statics.ts emit.intervalMs (10000) — the server's shared heartbeat interval
// ticks only, never at connect time (server-init-responder.ts:806), so the first real frame can
// land anywhere in the next 10s.
const FRAME_WAIT_TIMEOUT_MS = 15_000;
// health-badge-statics.ts silenceThresholdMs (30000) polled every silenceTickMs (1000) — the
// OFFLINE transition is measured from the last real frame's own arrival, not from when the wire
// is cut, so this assertion must outlast a genuine 30 real seconds.
const OFFLINE_ASSERTION_TIMEOUT_MS = 40_000;
const SILENCE_TEST_TIMEOUT_MS = 90_000;

test.describe('Health Badge Silence', () => {
  test.describe.configure({ timeout: SILENCE_TEST_TIMEOUT_MS });

  test('VALID: {wire cut and every /ws socket force-closed after a real frame} => badge flips OFFLINE after 30 real seconds of genuine heartbeat silence', async ({
    page,
  }) => {
    const hb = healthBadgeHarness({ page });
    await hb.arm();

    await page.goto('/');
    await expect(hb.badge()).toBeVisible();

    // At least one real health-status frame MUST arrive before the wire is cut.
    // isHeartbeatSilentGuard returns false while lastHeartbeatAt is undefined
    // (is-heartbeat-silent-guard.ts:24-26), and the seed never sets it — only the binding's
    // frame handler stamps lastHeartbeatAt (use-health-status-binding.ts:55). Cutting the wire
    // before any frame arrives leaves the badge on its seeded ONLINE reading forever, correctly.
    await hb.waitForFrames({ count: 1, timeoutMs: FRAME_WAIT_TIMEOUT_MS });

    // Cut the wire FIRST: context.setOffline(true) does not close an already-established
    // socket (ws-reconnect.e2e.ts:82-87) — it blocks NEW connections, which is exactly what
    // stops the channel's own reconnect from landing once the live socket is force-closed below.
    await hb.cutWire();

    // THEN force-close every tracked /ws socket, firing the real browser onclose event.
    const closedSockets = await hb.closeBackendSockets();

    // At least one backend socket must have been tracked and closed — zero means the init
    // script never intercepted WebSocket construction, and the rest of this walk would exercise
    // nothing real.
    expect(closedSockets.length).toBeGreaterThan(0);

    // 30 real seconds of genuine silence follow: the socket is closed so no frame can arrive,
    // and the wire is cut so the channel's own reconnect can never land and restart the
    // heartbeat. Assert the label, THEN the title, and only THEN click — a click fires the
    // widget's retry(), which flips the title to the unreachable-seed string before it could be
    // read as the silence one.
    await expect(hb.badge()).toHaveText('OFFLINE', { timeout: OFFLINE_ASSERTION_TIMEOUT_MS });

    // health-badge-statics.ts offlineTitleSilence.
    expect(await hb.titleText()).toBe('No heartbeat for 30 seconds');

    // The badge stays an enabled control in every state — health-badge-widget.tsx:29-32 puts
    // onClick on an unconditional UnstyledButton that never returns null — and it accepts the
    // click.
    await expect(hb.badge()).toBeEnabled();
    await hb.badge().click();
  });
});
