import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { RateLimitsSnapshotStub, RateLimitWindowStub } from '@dungeonmaster/shared/contracts';
import {
  claudeMockHarness,
  SimpleTextResponseStub,
} from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import { rateLimitsHarness } from '../../test/harnesses/rate-limits/rate-limits.harness';

const GUILD_PATH = '/tmp/dm-e2e-multi-widget-coexistence';
const WIDGET_TIMEOUT = 10_000;
const QUEUE_TIMEOUT = 9_000;
const BACKEND_WS_PATHNAME = '/ws';
const EXPECTED_BACKEND_WS_COUNT = 1;

const claudeMock = wireHarnessLifecycle({
  harness: claudeMockHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
const rateLimits = rateLimitsHarness();
wireHarnessLifecycle({ harness: rateLimits, testObj: test });

test.describe('Multi-widget coexistence', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {chat + queue + rate-limits widgets mounted together} => exactly one WebSocket opened', async ({
    page,
    request,
  }) => {
    const quests = questHarness({ request });

    // 1. Write a rate-limits snapshot so the rate-limits stack renders.
    const snapshot = RateLimitsSnapshotStub({
      fiveHour: RateLimitWindowStub({ usedPercentage: 55 }),
      sevenDay: RateLimitWindowStub({ usedPercentage: 30 }),
    });
    rateLimits.writeSnapshot({ snapshot });

    // 2. Create a guild.
    const guild = await guildHarness({ request }).createGuild({
      name: 'Multi Widget Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    // 3. Create the primary quest (chat widget subject) and seed it at
    //    'review_flows' — a non-execution, non-recoverable phase so:
    //    a) QuestChatContentLayerWidget renders ChatPanelWidget
    //       (data-testid="CHAT_PANEL") because shouldRenderExecutionPanel is false.
    //    b) The server's startup-recovery loop does NOT re-enqueue it
    //       (isRecoverable is false for review_flows), so the only queue entry
    //       is the queued quest explicitly started below.
    const sessionId1 = `e2e-session-mwc-primary-${Date.now()}`;
    sessions.createSessionFile({ sessionId: sessionId1, userMessage: 'Build the feature' });

    const primary = await quests.createQuest({
      guildId,
      title: 'Multi Widget Primary Quest',
      userRequest: 'Build the feature',
    });
    const primaryQuestId = String(primary.questId);

    quests.writeQuestFile({
      questId: primaryQuestId,
      questFolder: String(primary.questFolder),
      questFilePath: String(primary.filePath),
      title: 'Multi Widget Primary Quest',
      status: 'review_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          sessionId: sessionId1,
        },
      ],
    });

    // 4. Create a second quest and start it so the queue bar becomes visible.
    //    The queue bar (QUEST_QUEUE_BAR_COLLAPSED_LABEL) only renders when there
    //    is at least one entry in the execution queue — POST /start enqueues it.
    const sessionId2 = `e2e-session-mwc-queued-${Date.now()}`;
    sessions.createSessionFile({ sessionId: sessionId2, userMessage: 'Add second feature' });

    const queued = await quests.createQuest({
      guildId,
      title: 'Multi Widget Queued Quest',
      userRequest: 'Add second feature',
    });
    const queuedQuestId = String(queued.questId);

    quests.writeQuestFile({
      questId: queuedQuestId,
      questFolder: String(queued.questFolder),
      questFilePath: String(queued.filePath),
      title: 'Multi Widget Queued Quest',
      status: 'approved',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000002',
          role: 'chaoswhisperer',
          sessionId: sessionId2,
        },
      ],
    });

    // 5. Register the WebSocket listener BEFORE navigating. Track every
    //    connection whose pathname is '/ws' — that is the backend socket
    //    endpoint. Vite's HMR socket connects to a different port/pathname
    //    and is excluded by the pathname check.
    let backendWsCount = 0;
    page.on('websocket', (ws) => {
      try {
        const { pathname } = new URL(String(ws.url()));
        if (pathname === BACKEND_WS_PATHNAME) {
          backendWsCount += 1;
        }
      } catch {
        // Unparseable URL — not a backend socket, ignore.
      }
    });

    // 6. Navigate to the primary quest URL. This route mounts three widgets
    //    that each open their own WebSocket today:
    //    - QuestQueueBarWidget via useQuestQueueBinding
    //    - RateLimitsStackWidget via useRateLimitsBinding
    //    - QuestChatContentLayerWidget via useQuestChatBinding
    //    (quest is at 'review_flows' — non-execution phase — so ChatPanelWidget
    //    renders under data-testid="CHAT_PANEL" rather than ExecutionPanelWidget)
    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === 200,
    );
    await page.goto(`/${urlSlug}/quest/${primaryQuestId}`);
    await guildsResponsePromise;

    // 7a. Confirm chat panel and rate-limits are already visible — these two
    //     widgets prove that useQuestChatBinding and useRateLimitsBinding have
    //     both mounted and opened their respective WebSocket connections.
    await expect(page.getByTestId('CHAT_PANEL')).toBeVisible({ timeout: WIDGET_TIMEOUT });
    await expect(page.getByTestId('RATE_LIMITS_STACK')).toBeVisible({ timeout: WIDGET_TIMEOUT });

    // 7b. useQuestQueueBinding also opens its WebSocket at mount, regardless of
    //     whether the queue is empty (see use-quest-queue-binding.ts — the
    //     websocketConnectAdapter call is unconditional in the useEffect). The
    //     binding subscribes to execution-queue-updated events immediately; the
    //     queue bar widget only renders when the queue is non-empty, but the WS
    //     connection is always open once the AppWidget mounts.
    //
    //     Assert the socket count NOW — all three bindings have mounted and
    //     opened their sockets. The queue bar binding's WS connection is already
    //     counted even though the bar isn't visible yet (queue is empty).
    //
    //     TODAY this is RED: each binding opens its own socket →
    //     useRateLimitsBinding, useQuestQueueBinding, and useQuestChatBinding
    //     each call `new WebSocket('/ws')`, yielding backendWsCount = 3.
    //
    //     After the consolidation phase all bindings subscribe through a single
    //     shared channel, so backendWsCount will drop to 1 and this test turns GREEN.
    expect(backendWsCount).toBe(EXPECTED_BACKEND_WS_COUNT);

    // 7c. NOW start the queued quest to prove the queue binding is live and
    //     updates the DOM via its existing WS connection (fan-out sanity check).
    //     This verifies that even after consolidation, the single channel fans
    //     execution-queue-updated events out to useQuestQueueBinding correctly.
    claudeMock.queueResponse({
      response: SimpleTextResponseStub({
        sessionId: sessionId2,
        text: 'Pathseeker scope analysis complete',
      }),
    });
    await request.post(`/api/quests/${queuedQuestId}/start`);

    // 7d. Queue bar must appear via WS — proves the binding received the
    //     execution-queue-updated event and re-fetched the queue without a reload.
    await expect(page.getByTestId('QUEST_QUEUE_BAR_COLLAPSED_LABEL')).toBeVisible({
      timeout: QUEUE_TIMEOUT,
    });
    await expect(page.getByTestId('QUEST_QUEUE_BAR_COLLAPSED_LABEL')).toContainText(
      'Multi Widget Queued Quest',
      { timeout: QUEUE_TIMEOUT },
    );
  });
});
