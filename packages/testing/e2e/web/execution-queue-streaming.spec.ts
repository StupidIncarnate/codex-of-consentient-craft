import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import {
  claudeMockHarness,
  SimpleTextResponseStub,
} from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-exec-queue-stream';
const QUEUE_TIMEOUT = 9_000;

const claudeMock = wireHarnessLifecycle({
  harness: claudeMockHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Execution Queue Streaming', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {quest enqueued mid-session} => queue bar DOM updates via WS without reload', async ({
    page,
    request,
  }) => {
    const quests = questHarness({ request });

    // 1. Create guild
    const guild = await guildHarness({ request }).createGuild({
      name: 'Queue Stream Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    // 2. Navigate to home — queue is empty, bar must not be present
    await page.goto('/');

    await expect(page.getByTestId('QUEST_QUEUE_BAR')).toHaveCount(0);

    // 3. Seed the first quest at 'approved' so start is allowed
    const sessionId1 = `e2e-session-queue-stream-${Date.now()}-1`;
    sessions.createSessionFile({ sessionId: sessionId1, userMessage: 'Build the feature' });

    const created1 = await quests.createQuest({
      guildId,
      title: 'Queue Stream Quest One',
      userRequest: 'Build the feature',
    });
    const questId1 = String(created1.questId);

    quests.writeQuestFile({
      questId: questId1,
      questFolder: String(created1.questFolder),
      questFilePath: String(created1.filePath),
      title: 'Queue Stream Quest One',
      status: 'approved',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000011',
          role: 'chaoswhisperer',
          sessionId: sessionId1,
        },
      ],
    });

    // 4. Queue a fake-CLI response so the runner (kicked when the browser WS
    //    connects and web-presence flips true) can drain the pathseeker slot
    //    without exiting on an empty queue.
    claudeMock.queueResponse({
      response: SimpleTextResponseStub({
        sessionId: sessionId1,
        text: 'Pathseeker scope analysis complete',
      }),
    });

    // 5. Enqueue the quest via the real start API — this calls
    //    questExecutionQueueState.enqueue() which fires onChange, triggering
    //    the execution-queue-bootstrap-responder's onChange listener to emit
    //    execution-queue-updated on orchestrationEventsState, which the server
    //    relays as a global WS broadcast; useQuestQueueBinding re-fetches
    //    GET /api/quests/queue and updates the DOM.
    await request.post(`/api/quests/${questId1}/start`);

    // 6. Queue bar must appear with 'Quest 1/1' — proves DOM updated via WS,
    //    not a page reload.
    await expect(page.getByTestId('QUEST_QUEUE_BAR_COLLAPSED_LABEL')).toContainText('Quest 1/1', {
      timeout: QUEUE_TIMEOUT,
    });
    await expect(page.getByTestId('QUEST_QUEUE_BAR_COLLAPSED_LABEL')).toContainText(
      'Queue Stream Quest One',
      { timeout: QUEUE_TIMEOUT },
    );

    // 7. Enqueue a second quest and verify the count updates to 1/2.
    //    The second quest can live under the same guild — it just needs a
    //    unique sessionId and its own approved quest file.
    const sessionId2 = `e2e-session-queue-stream-${Date.now()}-2`;
    sessions.createSessionFile({ sessionId: sessionId2, userMessage: 'Add second feature' });

    const created2 = await quests.createQuest({
      guildId,
      title: 'Queue Stream Quest Two',
      userRequest: 'Add second feature',
    });
    const questId2 = String(created2.questId);

    quests.writeQuestFile({
      questId: questId2,
      questFolder: String(created2.questFolder),
      questFilePath: String(created2.filePath),
      title: 'Queue Stream Quest Two',
      status: 'approved',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000022',
          role: 'chaoswhisperer',
          sessionId: sessionId2,
        },
      ],
    });

    claudeMock.queueResponse({
      response: SimpleTextResponseStub({
        sessionId: sessionId2,
        text: 'Second pathseeker scope analysis complete',
      }),
    });

    await request.post(`/api/quests/${questId2}/start`);

    // 8. Label updates to 1/2 — active entry is still quest-one (head of queue)
    //    but total is now two.
    await expect(page.getByTestId('QUEST_QUEUE_BAR_COLLAPSED_LABEL')).toContainText('Quest 1/2', {
      timeout: QUEUE_TIMEOUT,
    });

    // 9. Verify no page reload occurred — exactly one navigation entry means
    //    both DOM updates arrived via WS, not reload.
    const navigationCount = await page.evaluate(
      () => globalThis.performance.getEntriesByType('navigation').length,
    );

    expect(navigationCount).toBe(1);
  });
});
