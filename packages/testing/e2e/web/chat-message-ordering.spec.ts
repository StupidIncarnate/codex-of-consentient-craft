import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import {
  claudeMockHarness,
  ClarificationResponseStub,
  SimpleTextResponseStub,
} from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';

/**
 * Streaming chat-message ordering invariants.
 *
 * The user's typed message lives in the binding's SYNTHETIC_SESSION_KEY bucket at a real
 * wall-clock timestamp; the agent's streamed chat-output lines arrive with no `timestamp`
 * field (Claude CLI omits it on most stream lines), so the orchestrator falls back to an
 * epoch timestamp on those entries. The widget's global timestamp sort then pushes
 * `1970-01-01` epoch entries to the top and the user's `2026-...` real timestamp to the
 * bottom — even though the user typed FIRST in wall-clock time.
 *
 * These tests assert relative DOM ordering. `toBeVisible` alone would pass even with the
 * user's message dumped under every agent entry.
 */

const GUILD_PATH = '/tmp/dm-e2e-chat-message-ordering';
const HTTP_OK = 200;
const CHAT_TIMEOUT = 10_000;
const PANEL_TIMEOUT = 5_000;

const claudeMock = wireHarnessLifecycle({
  harness: claudeMockHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Chat message ordering during streaming', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {user types prompt then agent streams text} => user message renders BEFORE agent text in DOM order', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Ordering Smoke Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const userText = 'ordering-user-prompt-9911';
    const agentText = 'ordering-agent-reply-2244';

    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ text: agentText }),
    });

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill(userText);
    await page.getByTestId('SEND_BUTTON').click();

    const chatPanel = page.getByTestId('CHAT_PANEL');

    await expect(chatPanel.getByText(agentText)).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(chatPanel.getByText(userText).first()).toBeVisible({ timeout: CHAT_TIMEOUT });

    const chatMessages = chatPanel.locator('[data-testid="CHAT_MESSAGE"]');
    const allText = await chatMessages.allTextContents();
    const userIdx = allText.findIndex((t) => t.indexOf(userText) !== -1);
    const agentIdx = allText.findIndex((t) => t.indexOf(agentText) !== -1);

    // Single toStrictEqual surfaces every failure at once: marker not found (-1),
    // or user-after-agent reordering (userBeforeAgent: false).
    expect({
      userFound: userIdx >= 0,
      agentFound: agentIdx >= 0,
      userBeforeAgent: userIdx < agentIdx,
    }).toStrictEqual({
      userFound: true,
      agentFound: true,
      userBeforeAgent: true,
    });
  });

  test('VALID: {user answers clarification mid-stream} => clarify answer renders BEFORE follow-up agent message', async ({
    page,
    request,
  }) => {
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Ordering Clarify Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-ordering-clarify-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Build the feature',
    });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Ordering Clarify Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = created.filePath;
    const { questFolder } = created;

    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder,
      questFilePath,
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          sessionId,
        },
      ],
    });

    const followUpText = 'ordering-after-clarify-7733';
    claudeMock.queueResponse({ response: ClarificationResponseStub({ sessionId }) });
    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ sessionId, text: followUpText }),
    });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();

    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    const option = page.getByTestId('CLARIFY_OPTION').first();

    await expect(option).toBeVisible();

    await option.click();

    const chatPanel = page.getByTestId('CHAT_PANEL');

    await expect(chatPanel.getByText(followUpText)).toBeVisible({ timeout: CHAT_TIMEOUT });

    const chatMessages = chatPanel.locator('[data-testid="CHAT_MESSAGE"]');
    const allText = await chatMessages.allTextContents();
    const clarifyAnswerMarker = 'Database Selection: PostgreSQL';
    const clarifyIdx = allText.findIndex((t) => t.indexOf(clarifyAnswerMarker) !== -1);
    const followUpIdx = allText.findIndex((t) => t.indexOf(followUpText) !== -1);

    expect({
      clarifyFound: clarifyIdx >= 0,
      followUpFound: followUpIdx >= 0,
      clarifyBeforeFollowUp: clarifyIdx < followUpIdx,
    }).toStrictEqual({
      clarifyFound: true,
      followUpFound: true,
      clarifyBeforeFollowUp: true,
    });
  });
});
