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

const GUILD_PATH = '/tmp/dm-e2e-quest-dual-panel';
const CHAT_TIMEOUT = 5_000;
const PANEL_TIMEOUT = 5_000;

const claudeMock = wireHarnessLifecycle({ harness: claudeMockHarness(), testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Quest Dual Panel', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('clarify panel and spec panel are visible simultaneously after ask-user-question tool use', async ({
    page,
    request,
  }) => {
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Dual Panel Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-dual-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Build the login feature',
    });

    // Create quest via API to get the server-resolved file path
    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Dual Panel Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = created.filePath;
    const { questFolder } = created;

    // Overwrite quest.json with desired test data
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

    // Queue a clarification response that triggers the clarify panel
    claudeMock.queueResponse({ response: ClarificationResponseStub({ sessionId }) });

    // Navigate to the session page and wait for data to load
    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToSession({ urlSlug, sessionId });

    // Dismiss the quest approved modal that appears when quest status is 'approved'
    const keepChattingBtn = page.getByText('Keep Chatting');

    await expect(keepChattingBtn).toBeVisible({ timeout: PANEL_TIMEOUT });

    await keepChattingBtn.click();

    // Send a message to trigger the queued clarification response
    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();

    // Both panels should be visible simultaneously
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Verify question text is visible
    await expect(page.getByTestId('CLARIFY_QUESTION_TEXT')).toBeVisible();
    await expect(page.getByTestId('CLARIFY_QUESTION_TEXT')).toContainText(
      'Which database do you want to use?',
    );

    // Verify options are visible and clickable
    const options = page.getByTestId('CLARIFY_OPTION');

    await expect(options.first()).toBeVisible();
    await expect(options.first()).toContainText('PostgreSQL');

    // Click an option to answer the question
    await options.first().click();

    // After answering, clarify panel should disappear while spec panel remains
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).not.toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible();
  });

  test('clarify panel disappears after answering and does not reappear during continued chat', async ({
    page,
    request,
  }) => {
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Dual Panel Stale Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-dual-stale-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Build the login feature',
    });

    // Create quest via API to get the server-resolved file path
    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Dual Panel Stale Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = created.filePath;
    const { questFolder } = created;

    // Overwrite quest.json with desired test data
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

    // Queue TWO responses:
    // 1. Clarification question
    // 2. Continuation text after the user answers
    claudeMock.queueResponse({ response: ClarificationResponseStub({ sessionId }) });
    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ sessionId, text: 'Phase 1: Setting up database schema' }),
    });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToSession({ urlSlug, sessionId });

    // Dismiss the quest approved modal that appears when quest status is 'approved'
    const keepChattingBtn = page.getByText('Keep Chatting');

    await expect(keepChattingBtn).toBeVisible({ timeout: PANEL_TIMEOUT });

    await keepChattingBtn.click();

    // Send a message to trigger the clarification
    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();

    // Wait for clarify panel to appear
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Click the first option to answer the question
    const options = page.getByTestId('CLARIFY_OPTION');
    await options.first().click();

    // Clarify panel should disappear after answering
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).not.toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Wait for the continuation response to stream through
    await expect(page.getByText('Phase 1: Setting up database schema')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // Bug A: clarify panel should STILL not be visible after continuation streams
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).not.toBeVisible();

    // Spec panel should be visible throughout
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible();
  });

  test('spec panel loads quest data on initial page load without sending a message', async ({
    page,
    request,
  }) => {
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Dual Panel Load Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-dual-load-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Build the feature',
    });

    // Create quest via API to get the server-resolved file path
    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Dual Panel Load Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = created.filePath;
    const { questFolder } = created;

    // Overwrite quest.json with desired test data
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

    // Do NOT queue any claude responses — this test validates initial load only

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToSession({ urlSlug, sessionId });

    // Bug B: spec panel should load quest data via WebSocket without user interaction
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The "Awaiting quest activity..." placeholder should NOT be visible
    await expect(page.getByText('Awaiting quest activity...')).not.toBeVisible();

    // Quest flow name should be visible in the spec panel
    await expect(page.getByText('Harness Flow')).toBeVisible({ timeout: PANEL_TIMEOUT });
  });

  test('history replay of session with answered clarification does not show clarify panel', async ({
    page,
    request,
  }) => {
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Dual Panel History Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-dual-history-${Date.now()}`;
    sessions.createAnsweredClarificationSession({ sessionId });

    // Create quest via API to get the server-resolved file path
    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Dual Panel History Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = created.filePath;
    const { questFolder } = created;

    // Overwrite quest.json with flows for the spec panel
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

    // Do NOT queue any claude responses — this is pure history replay

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToSession({ urlSlug, sessionId });

    // Wait for history to fully replay — the Phase 1 text from the final assistant entry
    await expect(page.getByText('Phase 1: Setting up PostgreSQL schema.')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // Bug A: clarify panel must NOT be visible — the question was already answered in history
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).not.toBeVisible();

    // Spec panel should be visible since the quest has flows
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
  });

  test('page reload after answering clarification preserves spec panel and hides clarify panel', async ({
    page,
    request,
  }) => {
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Dual Panel Reload Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-dual-reload-${Date.now()}`;
    sessions.createAnsweredClarificationSession({ sessionId });

    // Create quest via API to get the server-resolved file path
    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Dual Panel Reload Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = created.filePath;
    const { questFolder } = created;

    // Overwrite quest.json with flows for the spec panel
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

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToSession({ urlSlug, sessionId });

    // Wait for initial history load
    await expect(page.getByText('Phase 1: Setting up PostgreSQL schema.')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // Verify initial state is correct
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).not.toBeVisible();
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Reload the page to test re-navigation timing
    const reloadResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === 200,
    );
    await page.reload();
    await reloadResponsePromise;

    // Wait for history to replay again after reload
    await expect(page.getByText('Phase 1: Setting up PostgreSQL schema.')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // After reload, clarify panel should still not appear
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).not.toBeVisible();

    // Spec panel should still be visible after reload
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
  });
});
