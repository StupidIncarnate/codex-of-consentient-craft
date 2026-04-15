import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import {
  claudeMockHarness,
  ClarificationResponseStub,
  SimpleTextResponseStub,
} from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-clarify-design-decisions';
const CHAT_TIMEOUT = 5_000;
const PANEL_TIMEOUT = 5_000;

const claudeMock = wireHarnessLifecycle({ harness: claudeMockHarness(), testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Clarification Design Decisions', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: answering clarification persists design decision to quest', async ({
    page,
    request,
  }) => {
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Clarify DD Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-clarify-dd-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Build the feature',
    });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Clarify DD Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = created.filePath;
    const { questFolder } = created;

    // Seed at 'explore_flows' — ChaosWhisperer's clarification flow writes
    // designDecisions via modify-quest, and the per-status input allowlist only
    // permits designDecisions during the spec-exploration phases.
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

    // Queue clarification response followed by continuation text
    claudeMock.queueResponse({ response: ClarificationResponseStub({ sessionId }) });
    claudeMock.queueResponse({
      response: SimpleTextResponseStub({
        sessionId,
        text: 'Great, proceeding with PostgreSQL setup',
      }),
    });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToSession({ urlSlug, sessionId });

    // No "Keep Chatting" modal at explore_flows; proceed straight to chat.

    // Send initial message to trigger the clarification
    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();

    // Wait for clarify panel to appear
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Click PostgreSQL option
    const options = page.getByTestId('CLARIFY_OPTION');

    await expect(options.first()).toBeVisible();
    await expect(options.first()).toContainText('PostgreSQL');

    await options.first().click();

    // Clarify panel should disappear after answering
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).not.toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Wait for continuation text confirming chat resumed
    await expect(page.getByText('Great, proceeding with PostgreSQL setup')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // Read back the quest via API and assert design decisions were persisted
    const questResponse = await request.get(`/api/quests/${String(created.questId)}`);
    const questResult = (await questResponse.json()) as Record<PropertyKey, unknown>;
    const quest = questResult.quest as Record<PropertyKey, unknown>;
    const designDecisions = quest.designDecisions as unknown[];

    expect(Array.isArray(designDecisions)).toBe(true);

    const ddMatch = designDecisions.find(
      (dd) =>
        typeof dd === 'object' &&
        dd !== null &&
        Reflect.get(dd, 'title') === 'Database Selection: PostgreSQL',
    ) as Record<PropertyKey, unknown> | undefined;

    expect(ddMatch).toStrictEqual({
      id: 'dd-database-selection',
      title: 'Database Selection: PostgreSQL',
      rationale: 'Relational database with JSONB support',
      relatedNodeIds: [],
    });
  });

  test('VALID: quest without clarification has no design decisions', async ({ page, request }) => {
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'No Clarify DD Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-no-clarify-dd-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Build the feature',
    });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E No Clarify DD Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = created.filePath;
    const { questFolder } = created;

    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder,
      questFilePath,
      status: 'approved',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          sessionId,
        },
      ],
    });

    // Queue a simple text response — no clarification
    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ sessionId, text: 'Starting implementation now' }),
    });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToSession({ urlSlug, sessionId });

    // Dismiss the quest approved modal
    const keepChattingBtn = page.getByText('Keep Chatting');

    await expect(keepChattingBtn).toBeVisible({ timeout: PANEL_TIMEOUT });

    await keepChattingBtn.click();

    // Send message to trigger the simple text response
    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();

    // Wait for the response to appear
    await expect(page.getByText('Starting implementation now')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // Clarify panel should never have appeared
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).not.toBeVisible();

    // Read back the quest via API and assert design decisions remain empty
    const questResponse = await request.get(`/api/quests/${String(created.questId)}`);
    const questResult = (await questResponse.json()) as Record<PropertyKey, unknown>;
    const quest = questResult.quest as Record<PropertyKey, unknown>;
    const designDecisions = quest.designDecisions as unknown[];

    expect(designDecisions).toStrictEqual([]);
  });
});
