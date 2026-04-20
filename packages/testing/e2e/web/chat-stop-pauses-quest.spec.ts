import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { claudeMockHarness } from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import {
  SessionIdStub,
  TimeoutMsStub,
  SystemInitStreamLineStub,
  AssistantTextStreamLineStub,
  ResultStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { streamLineToJsonLineTransformer } from '@dungeonmaster/shared/transformers';

const GUILD_PATH = '/tmp/dm-e2e-chat-stop-pauses-quest';
const HTTP_OK = 200;
const PANEL_TIMEOUT = 10_000;
const CHAT_TIMEOUT = 10_000;
const SLOW_DELAY_MS = 3000;

const claudeMock = claudeMockHarness();
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Chat STOP pauses quest', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {quest bound at explore_flows, chat streaming, click STOP} => quest.status=paused, pausedAtStatus=explore_flows', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Chat Stop Pauses Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    // Pre-seed session JSONL so navigating to /session/:sessionId doesn't 404.
    const sessionId = `e2e-chat-stop-pauses-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Chat Stop Pauses Quest',
      userRequest: 'Build feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    // Seed quest at explore_flows with chaoswhisperer work item linked to the session.
    // The quest-session linkage is what makes the widget's `questWithContent` truthy,
    // which in turn routes the chat STOP button to `questPauseBroker` instead of the
    // generic chat-stop broker.
    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000b1',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    // Queue a slow Claude response so the chat stays in streaming state long enough
    // for us to click STOP.
    claudeMock.queueResponse({
      response: {
        sessionId: SessionIdStub({ value: sessionId }),
        delayMs: TimeoutMsStub({ value: SLOW_DELAY_MS }),
        lines: [
          streamLineToJsonLineTransformer({ streamLine: SystemInitStreamLineStub() }),
          streamLineToJsonLineTransformer({
            streamLine: AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                content: [{ type: 'text', text: 'Starting slow work...' }],
              },
            }),
          }),
          streamLineToJsonLineTransformer({
            streamLine: AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                content: [{ type: 'text', text: 'This text should never appear' }],
              },
            }),
          }),
          streamLineToJsonLineTransformer({ streamLine: ResultStreamLineStub() }),
        ],
      },
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToSession({ urlSlug, sessionId });

    // Wait for quest data + spec panel to appear so questWithContent is truthy.
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Send a new user message to trigger live streaming in this session.
    await page.getByTestId('CHAT_INPUT').fill('Keep exploring');
    await page.getByTestId('SEND_BUTTON').click();

    // Wait for streaming to be active — the first assistant text confirms it.
    await expect(page.getByText('Starting slow work...')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // STOP button should now be visible while the slow response streams.
    const stopButton = page.getByTestId('STOP_BUTTON');

    await expect(stopButton).toBeVisible();

    // Observe the pause request going out when STOP is clicked.
    const pausePromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/pause`),
    );

    await stopButton.click();

    await pausePromise;

    // Quest must now be paused with pausedAtStatus set to the pre-pause status.
    // Poll the GET endpoint until the pause has persisted (broker write is async).
    await expect
      .poll(
        async () => {
          const resp = await request.get(`/api/quests/${questId}`);
          if (resp.status() !== HTTP_OK) {
            return null;
          }
          const body = await resp.json();
          return {
            status: body.quest.status,
            pausedAtStatus: body.quest.pausedAtStatus,
          };
        },
        { timeout: PANEL_TIMEOUT },
      )
      .toStrictEqual({ status: 'paused', pausedAtStatus: 'explore_flows' });
  });
});
