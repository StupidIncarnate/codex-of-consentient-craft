import { test, expect } from '../../../test/harnesses/e2e-fixtures';

import { healthBadgeHarness } from '../../../test/harnesses/health-badge/health-badge.harness';

// The server's shared heartbeat interval ticks only — never at connect time
// (server-init-responder.ts:806) — so a client's first frame lands anywhere in the next
// 10s (health-heartbeat-statics.ts, emit.intervalMs) and its second ~10s after that.
// Two frames cost ~20s of real wall clock; the config's per-test default (10_000) is under
// a single interval.
const HEARTBEAT_TEST_TIMEOUT_MS = 120_000;
const FRAME_WAIT_TIMEOUT_MS = 15_000;
// The rendered label is `Xh Ym`, so it only CHANGES when uptime crosses a 60-second boundary —
// at most one uptime minute away from the first frame, i.e. ~60s of wall clock plus one frame
// interval of slack.
const MINUTE_ROLL_WAIT_TIMEOUT_MS = 80_000;
// health-badge-statics.ts silenceThresholdMs — the badge only goes OFFLINE at 30s of silence.
const SILENCE_THRESHOLD_MS = 30000;

test.describe('Health Badge Heartbeat', () => {
  test.describe.configure({ timeout: HEARTBEAT_TEST_TIMEOUT_MS });

  test('VALID: {two consecutive real health-status frames} => badge label tracks the newest frame uptime, stays ONLINE, and issues no second seed', async ({
    page,
  }) => {
    const hb = healthBadgeHarness({ page });
    await hb.arm();

    await page.goto('/');
    await expect(hb.badge()).toBeVisible();

    // First real heartbeat frame off the shared /ws socket.
    const firstFrame = await hb.frameAt({ index: 0, timeoutMs: FRAME_WAIT_TIMEOUT_MS });
    expect(firstFrame.status).toBe('ok');

    const expectedFirstLabel = hb.expectedOnlineLabel({ uptimeSeconds: firstFrame.uptimeSeconds });
    await expect(hb.badge()).toHaveText(expectedFirstLabel);

    // A second, later frame — proves the badge keeps tracking the MOST RECENT frame rather
    // than latching onto the first one it ever saw. Consecutive frames differ by ~10 uptime
    // seconds, so the rendered minute usually does not change; assert against this frame's
    // OWN uptimeSeconds rather than asserting the two rendered strings differ.
    const secondFrame = await hb.frameAt({ index: 1, timeoutMs: FRAME_WAIT_TIMEOUT_MS });

    // Combined into one toStrictEqual (rather than two separate property checks) to avoid
    // bleedthrough: status must be the real 'ok' the server always emits, and uptimeSeconds
    // must have genuinely advanced past the first frame's own reading.
    expect({
      status: secondFrame.status,
      uptimeIncreasedSinceFirstFrame: secondFrame.uptimeSeconds > firstFrame.uptimeSeconds,
    }).toStrictEqual({
      status: 'ok',
      uptimeIncreasedSinceFirstFrame: true,
    });

    const expectedSecondLabel = hb.expectedOnlineLabel({
      uptimeSeconds: secondFrame.uptimeSeconds,
    });
    await expect(hb.badge()).toHaveText(expectedSecondLabel);

    // Sampled immediately after the second frame: Date.now() and the badge's own rendered
    // text read in ONE page.evaluate, so the elapsed asserted here is the elapsed the text
    // was actually read at — the badge is still ONLINE well under the 30s silence threshold.
    const sample = await hb.elapsedSinceLastFrameAndLabel();
    expect({
      elapsedUnderSilenceThreshold: sample.elapsedMs < SILENCE_THRESHOLD_MS,
      label: sample.label,
    }).toStrictEqual({
      elapsedUnderSilenceThreshold: true,
      label: expectedSecondLabel,
    });

    // The rendered label ADVANCES rather than latching on the frame it saw first. Two consecutive
    // frames are ~10s apart and render the identical `Xh Ym` string, so the assertion at :54
    // compares that string against itself — it holds just as well on a badge frozen at its first
    // frame. Waiting for the frame whose uptime crosses a 60-second boundary is what makes the
    // visible text have to move, and that frame is at most one uptime minute away.
    const rolledFrame = await hb.frameWithLaterUptimeMinute({
      afterUptimeSeconds: firstFrame.uptimeSeconds,
      timeoutMs: MINUTE_ROLL_WAIT_TIMEOUT_MS,
    });
    const expectedRolledLabel = hb.expectedOnlineLabel({
      uptimeSeconds: rolledFrame.uptimeSeconds,
    });

    // Guards the assertion below against going vacuous: if this frame rendered the same label as
    // the first one, toHaveText would pass on a frozen badge and prove nothing.
    expect({
      labelMovedSinceFirstFrame: expectedRolledLabel !== expectedFirstLabel,
    }).toStrictEqual({
      labelMovedSinceFirstFrame: true,
    });

    await expect(hb.badge()).toHaveText(expectedRolledLabel);

    // Across the whole multi-frame window, only the mount's own seed fired — the heartbeat
    // frames never trigger a second GET /api/health/status.
    expect(hb.getSeedRequestCount().length).toBe(1);
  });
});
