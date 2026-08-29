import { test, expect } from '../../../test/harnesses/e2e-fixtures';

import { healthBadgeHarness } from '../../../test/harnesses/health-badge/health-badge.harness';

// The backend WebSocket endpoint — exclude Vite's HMR socket, which opens on a different
// pathname. Same filter ws-reconnect.e2e.ts:150-159 uses.
const BACKEND_WS_PATHNAME = '/ws';
const BACKEND_SOCKET_TIMEOUT_MS = 10_000;
const SOCKET_CLOSE_TIMEOUT_MS = 10_000;
const UNMOUNT_TEST_TIMEOUT_MS = 45_000;

test.describe('Health Badge Unmount', () => {
  test.describe.configure({ timeout: UNMOUNT_TEST_TIMEOUT_MS });

  test('VALID: {navigate away from the live ONLINE reading} => the /ws socket closes and no pageerror or console error is collected', async ({
    page,
  }) => {
    const hb = healthBadgeHarness({ page });
    await hb.arm();

    // Arm the socket detector BEFORE navigating, so it captures the socket this very load opens
    // rather than missing it.
    const backendSocketPromise = page.waitForEvent('websocket', {
      predicate: (ws) => {
        try {
          return new URL(String(ws.url())).pathname === BACKEND_WS_PATHNAME;
        } catch {
          return false;
        }
      },
      timeout: BACKEND_SOCKET_TIMEOUT_MS,
    });

    await page.goto('/');
    await expect(hb.badge()).toBeVisible();

    // The live ONLINE reading this test navigates away from — the real seed's own uptimeSeconds,
    // not a hardcoded string.
    const seed = await hb.lastSeedResponse();
    const expectedLabel = hb.expectedOnlineLabel({ uptimeSeconds: seed.uptimeSeconds });
    await expect(hb.badge()).toHaveText(expectedLabel);

    const backendSocket = await backendSocketPromise;
    const socketClosePromise = backendSocket.waitForEvent('close', {
      timeout: SOCKET_CLOSE_TIMEOUT_MS,
    });

    // Scoped to what the navigation ITSELF produces — the live path drives no failed request
    // before this point, so the count is 0 either way, but the offline case below needs this
    // same scoping to not blame the navigation for console noise its own precondition produced.
    const consoleErrorsBeforeNav = hb.getConsoleErrors().length;

    // "Unmounting the shell" is a real navigation away, never page.close() — a closed page has
    // nothing left to read the collectors below off of. about:blank tears down the app's JS
    // context while the page object stays queryable.
    await page.goto('about:blank');

    const closedSocket = await socketClosePromise;
    expect(closedSocket.isClosed()).toBe(true);

    expect(hb.getPageErrors()).toStrictEqual([]);
    expect(hb.getConsoleErrors().slice(consoleErrorsBeforeNav)).toStrictEqual([]);
  });

  test('VALID: {navigate away from the OFFLINE reading} => the /ws socket closes and no pageerror or console error is collected', async ({
    page,
  }) => {
    const hb = healthBadgeHarness({ page });
    await hb.arm();

    const backendSocketPromise = page.waitForEvent('websocket', {
      predicate: (ws) => {
        try {
          return new URL(String(ws.url())).pathname === BACKEND_WS_PATHNAME;
        } catch {
          return false;
        }
      },
      timeout: BACKEND_SOCKET_TIMEOUT_MS,
    });

    await page.goto('/');
    await expect(hb.badge()).toBeVisible();

    // Reach OFFLINE the cheap way — cutWire() then one click — rather than waiting out the
    // 30-second silence threshold, which is chunk 3's own cost to pay. The badge stays an
    // enabled control in every state (health-badge-widget.tsx:29-32's onClick is unconditional),
    // so a click taken straight from the live ONLINE reading re-issues the seed and lands OFFLINE.
    await hb.cutWire();
    await hb.badge().click();
    await expect(hb.badge()).toHaveText('OFFLINE');

    const backendSocket = await backendSocketPromise;
    const socketClosePromise = backendSocket.waitForEvent('close', {
      timeout: SOCKET_CLOSE_TIMEOUT_MS,
    });

    // Scoped to what the navigation ITSELF produces. The cut-wire click just above genuinely
    // fails a real request, and Chromium logs its own "Failed to load resource:
    // net::ERR_INTERNET_DISCONNECTED" console error for that — browser-level noise from the
    // OFFLINE precondition, not from the app or from leaving the page. Blaming the navigation for
    // console output the precondition already produced would fail this assertion on EVERY offline
    // run regardless of whether teardown itself is clean, so only entries appended from this point
    // forward count.
    const consoleErrorsBeforeNav = hb.getConsoleErrors().length;

    await page.goto('about:blank');

    const closedSocket = await socketClosePromise;
    expect(closedSocket.isClosed()).toBe(true);

    expect(hb.getPageErrors()).toStrictEqual([]);
    expect(hb.getConsoleErrors().slice(consoleErrorsBeforeNav)).toStrictEqual([]);
  });
});
