import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import {
  claudeMockHarness,
  SimpleTextResponseStub,
} from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-ws-reconnect';
const CHAT_TIMEOUT = 15_000;
// The adapter fires a 3 s setTimeout before reopening; give 10 s total so the new
// socket has time to open even on a slow CI box.
const RECONNECT_SOCKET_TIMEOUT = 10_000;
// The backend WebSocket endpoint — exclude Vite HMR sockets (different pathname).
const BACKEND_WS_PATHNAME = '/ws';

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

// WS tracker init script — passed as a string so TypeScript does not type-check
// the browser-side code.  Intercepts the WebSocket constructor so tests can
// forcefully close the live socket later to trigger the adapter's onclose handler.
const WS_TRACKER_SCRIPT = `
(function () {
  var OriginalWS = globalThis.WebSocket;
  globalThis.__wsRegistry = [];
  function TrackedWS(url, protocols) {
    var ws = protocols === undefined ? new OriginalWS(url) : new OriginalWS(url, protocols);
    globalThis.__wsRegistry.push(ws);
    return ws;
  }
  TrackedWS.CONNECTING  = OriginalWS.CONNECTING;
  TrackedWS.OPEN        = OriginalWS.OPEN;
  TrackedWS.CLOSING     = OriginalWS.CLOSING;
  TrackedWS.CLOSED      = OriginalWS.CLOSED;
  TrackedWS.prototype   = OriginalWS.prototype;
  globalThis.WebSocket  = TrackedWS;
})();
`;

// Evaluate script to close all tracked backend (/ws) sockets.
const WS_CLOSE_BACKEND_SCRIPT = `
(function () {
  var registry = globalThis.__wsRegistry || [];
  var closed = 0;
  for (var i = 0; i < registry.length; i++) {
    var ws = registry[i];
    try {
      var u = new URL(ws.url);
      if (u.pathname === '/ws') {
        ws.close();
        closed++;
      }
    } catch (e) {}
  }
  return closed;
})();
`;

test.describe('WS Reconnect', () => {
  // Override the per-test timeout — this test needs budget for:
  //   first chat round-trip (~5 s) + adapter reconnect delay (3 s) + second chat (~5 s).
  test.use({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {WS drops via offline mode, restored} => chat keeps streaming after reconnect', async ({
    page,
    request,
  }) => {
    // ── 0. Inject WebSocket tracker before page scripts run ───────────────────
    //
    // context.setOffline(true) does NOT close existing WebSocket connections in
    // Chromium — it only blocks NEW connections ("Does not affect already
    // established network connections", per Playwright docs).  To reliably trigger
    // the adapter's `onclose` handler (and thus its 3 s reconnect timer), we
    // intercept the WebSocket constructor via addInitScript so we can forcefully
    // close the live socket from test code.
    await page.addInitScript(WS_TRACKER_SCRIPT);

    // ── 1. Setup: guild + quest with chaoswhisperer work item ──────────────────

    const guild = await guildHarness({ request }).createGuild({
      name: 'WS Reconnect Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });
    const guildSlug = guildHarness({ request }).extractUrlSlug({ guild });

    const sessionId = `e2e-ws-reconnect-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'First message' });

    const quests = questHarness({ request });
    const created = await quests.createQuest({
      guildId,
      title: 'WS Reconnect Quest',
      userRequest: 'Test reconnect',
    });
    const { questId, questFolder, filePath: questFilePath } = created;

    quests.writeQuestFile({
      questId: String(questId),
      questFolder,
      questFilePath,
      status: 'review_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          sessionId,
        },
      ],
    });

    // ── 2. Navigate to the quest page ─────────────────────────────────────────

    const nav = navigationHarness({ page });
    await nav.navigateToQuest({ urlSlug: guildSlug, questId: String(questId) });

    // ── 3. Queue first response and send first chat message ───────────────────

    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ text: 'first reply' }),
    });

    await page.getByTestId('CHAT_INPUT').fill('First message');
    await page.getByTestId('SEND_BUTTON').click();

    // Assert first reply appears — confirms the WS pipeline is working pre-disconnect.
    await expect(page.getByTestId('CHAT_PANEL')).toContainText('first reply', {
      timeout: CHAT_TIMEOUT,
    });

    // ── 4. Arm the reconnect detector BEFORE simulating the disconnect ─────────
    //
    // Playwright fires a 'websocket' event on `page` each time a new WebSocket is
    // opened.  We filter by the backend endpoint ('/ws') to exclude Vite's HMR
    // socket which opens on a different pathname.  Register the promise now so it
    // captures the adapter's reconnect socket (opened after the 3 s delay) rather
    // than any socket opened before we drop.
    const nextBackendSocketPromise = page.waitForEvent('websocket', {
      predicate: (ws) => {
        try {
          return new URL(String(ws.url())).pathname === BACKEND_WS_PATHNAME;
        } catch {
          return false;
        }
      },
      timeout: RECONNECT_SOCKET_TIMEOUT,
    });

    // ── 5. Force-close the existing backend WebSocket ─────────────────────────
    //
    // Calls ws.close() on every socket in __wsRegistry whose URL path is '/ws'.
    // This fires the real browser onclose event, which the adapter handles by
    // scheduling a 3 s reconnect.  Returns the count of sockets closed.
    const closedCount = await page.evaluate(WS_CLOSE_BACKEND_SCRIPT);

    // At least one backend socket must have been tracked and closed — if zero were
    // closed, the init script did not intercept WebSocket creation and the rest of
    // this test exercises the wrong scenario.
    expect(closedCount).toBeGreaterThan(0);

    // ── 6. Wait for the adapter to open its new WebSocket ────────────────────
    //
    // The new socket appears ~3 s after onclose fires (the adapter's built-in delay).
    // This is the deterministic signal that the reconnect attempt actually happened.
    await nextBackendSocketPromise;

    // Wait until the SEND_BUTTON is enabled — a UI-observable proxy for the React
    // app being in a ready state after the reconnect window.
    await expect(page.getByTestId('SEND_BUTTON')).toBeEnabled({
      timeout: RECONNECT_SOCKET_TIMEOUT,
    });

    // ── 7. Queue second response and send second chat message ─────────────────

    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ text: 'second reply' }),
    });

    await page.getByTestId('CHAT_INPUT').fill('Second message after reconnect');
    await page.getByTestId('SEND_BUTTON').click();

    // ── 8. Assert second reply arrives — THIS IS THE FAILING ASSERTION today ──
    //
    // The adapter creates a new WebSocket on reconnect, but the binding's `send`
    // closure captured the original (now-closed) socket object.  The POST
    // /api/guilds/:guildId/quests/:questId/chat succeeds on the server and the fake
    // CLI runs and emits output, but the server broadcasts via WS and the browser
    // cannot receive it because the new socket has not re-subscribed to the
    // chat-output channel.  The chat message is effectively dropped from the
    // browser's perspective.
    await expect(page.getByTestId('CHAT_PANEL')).toContainText('second reply', {
      timeout: CHAT_TIMEOUT,
    });
  });
});
