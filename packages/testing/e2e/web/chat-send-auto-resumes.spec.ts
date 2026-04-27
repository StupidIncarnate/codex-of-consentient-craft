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

const GUILD_PATH = '/tmp/dm-e2e-chat-send-auto-resumes';
const HTTP_OK = 200;
const PANEL_TIMEOUT = 10_000;
const CHAT_TIMEOUT = 10_000;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Chat send auto-resumes paused quest', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {quest paused with pausedAtStatus=explore_flows, user sends chat} => quest.status restored to explore_flows and message streams', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Chat Auto Resume Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const sessionId = `e2e-chat-auto-resume-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Chat Auto Resume Quest',
      userRequest: 'Build feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    // The quest-harness writer does not expose pausedAtStatus directly — we seed at
    // explore_flows, call the pause endpoint once to set the pausedAtStatus snapshot,
    // then let the test exercise the auto-resume-on-send flow.
    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000c1',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    const pauseResponse = await request.post(`/api/quests/${questId}/pause`);

    expect(pauseResponse.status()).toBe(HTTP_OK);

    const afterPauseResponse = await request.get(`/api/quests/${questId}`);
    const afterPauseBody = await afterPauseResponse.json();

    expect({
      status: afterPauseBody.quest.status,
      pausedAtStatus: afterPauseBody.quest.pausedAtStatus,
    }).toStrictEqual({ status: 'paused', pausedAtStatus: 'explore_flows' });

    // Queue a Claude response for the auto-resumed chat message.
    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ sessionId, text: 'Resuming exploration' }),
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Observe the resume request that sessionChatBroker must fire before sending the chat.
    const resumePromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/resume`),
    );

    await page.getByTestId('CHAT_INPUT').fill('Unpause me');
    await page.getByTestId('SEND_BUTTON').click();

    await resumePromise;

    // Assert the reply lands in a live (resumed) session.
    await expect(page.getByText('Resuming exploration')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Quest status must be restored from pausedAtStatus back to the pre-pause status.
    await expect
      .poll(
        async () => {
          const resp = await request.get(`/api/quests/${questId}`);
          if (resp.status() !== HTTP_OK) {
            return null;
          }
          const body = await resp.json();
          return body.quest.status;
        },
        { timeout: PANEL_TIMEOUT },
      )
      .toBe('explore_flows');
  });
});
