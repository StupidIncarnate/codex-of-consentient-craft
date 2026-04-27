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

const GUILD_PATH = '/tmp/dm-e2e-quest-ws-update';
const PANEL_TIMEOUT = 5_000;
const CHAT_TIMEOUT = 5_000;

const claudeMock = wireHarnessLifecycle({
  harness: claudeMockHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Quest WS Update', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: spec panel appears via WebSocket when quest gains content after page load', async ({
    page,
    request,
  }) => {
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'WS Update Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-ws-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Build the feature',
    });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E WS Update Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const questFilePath = created.filePath;
    const { questFolder } = created;

    // Seed at 'explore_flows' so the subsequent PATCH that adds flows passes the
    // per-status input allowlist (created status only permits title + status).
    quests.writeQuestFile({
      questId: String(questId),
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

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    // Quest exists but has no content — spec panel shows immediately with empty quest data
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible();

    // PATCH the quest to add a flow — this triggers quest-modified WS broadcast
    await request.patch(`/api/quests/${questId}`, {
      data: {
        flows: [
          {
            id: 'ws-live-flow',
            name: 'WS Live Flow',
            flowType: 'runtime',
            entryPoint: 'Start',
            exitPoints: ['End'],
            nodes: [],
            edges: [],
          },
        ],
      },
    });

    // Flow should appear via WS without page refresh
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
  });

  test('VALID: spec panel updates with new flows added via WS after initial render', async ({
    page,
    request,
  }) => {
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'WS Incremental Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-ws-inc-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Build the feature',
    });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E WS Incremental Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const questFilePath = created.filePath;
    const { questFolder } = created;

    // Seed at 'flows_approved' so the subsequent PATCH that adds another flow
    // passes the per-status input allowlist (approved status only permits status).
    quests.writeQuestFile({
      questId: String(questId),
      questFolder,
      questFilePath,
      status: 'flows_approved',
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
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    // Spec panel should be visible with the initial flow
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByText('Harness Flow')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // PATCH the quest to add a second flow via WS broadcast
    await request.patch(`/api/quests/${questId}`, {
      data: {
        flows: [
          {
            id: 'live-ws-flow',
            name: 'Live WS Flow',
            flowType: 'runtime',
            entryPoint: 'Begin',
            exitPoints: ['Finish'],
            nodes: [],
            edges: [],
          },
        ],
      },
    });

    // The new flow should appear via WS update without page refresh
    await expect(page.getByText('Live WS Flow')).toBeVisible({ timeout: PANEL_TIMEOUT });
  });

  test('VALID: spec panel appears when quest is linked mid-chat via quest-session-linked WS event', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Quest Link Race Guild',
      path: GUILD_PATH,
    });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    // Queue a Claude response for the new-session flow.
    // The sessionId must be unique; the fake CLI writes a JSONL file using it.
    const sessionId = `e2e-session-link-race-${Date.now()}`;
    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ sessionId, text: 'Quest created successfully' }),
    });

    // Navigate to the guild session page WITHOUT a sessionId — this is a new chat
    const _nav = navigationHarness({ page });
    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === 200,
    );
    await page.goto(`/${urlSlug}/session`);
    await guildsResponsePromise;

    // Initially there's no quest, so we should see the awaiting placeholder
    await expect(page.getByText('Awaiting quest activity...')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Send a message — this triggers the /api/sessions/new endpoint which:
    // 1. Creates a quest via questUserAddBroker (empty, no flows)
    // 2. Emits quest-session-linked WS event with chatProcessId
    // 3. Spawns fake CLI
    // 4. Returns { chatProcessId } in HTTP response
    // The race condition: quest-session-linked arrives BEFORE chatProcessId is set on the client
    await page.getByTestId('CHAT_INPUT').fill('Build a login feature');
    await page.getByTestId('SEND_BUTTON').click();

    // Wait for the chat response to stream through (confirms fake CLI ran)
    await expect(page.getByText('Quest created successfully')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // The server created a quest during the chat flow. Find it via the API
    // so we can PATCH it with flows.
    const guildId = String(guild.id);
    const questsResponse = await request.get(`/api/quests?guildId=${guildId}`);
    const quests = await questsResponse.json();
    const [createdQuest] = quests;
    const questId = String(createdQuest.id);

    // PATCH the quest to add a flow and advance status — this triggers quest-modified WS broadcast.
    // If quest-session-linked was handled correctly, the client knows the questId and
    // useQuestEventsBinding is subscribed to updates for it.
    // The transition to explore_flows must run first because the per-status input
    // allowlist gate runs against the current status before mutations apply, and
    // the freshly-created quest sits at 'created' which only allows title + status.
    await request.patch(`/api/quests/${questId}`, {
      data: { status: 'explore_flows' },
    });
    await request.patch(`/api/quests/${questId}`, {
      data: {
        flows: [
          {
            id: 'race-condition-flow',
            name: 'Race Condition Flow',
            flowType: 'runtime',
            entryPoint: 'Start',
            exitPoints: ['End'],
            nodes: [],
            edges: [],
          },
        ],
      },
    });

    // If the fix works: quest-session-linked was buffered and replayed when chatProcessId arrived,
    // so linkedQuestId is set, useQuestEventsBinding received quest-modified, spec panel shows.
    // If the bug is present: quest-session-linked was dropped, linkedQuestId is null,
    // useQuestEventsBinding ignores quest-modified, spec panel stays stuck on "Awaiting..."
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByText('Awaiting quest activity...')).not.toBeVisible();
    await expect(page.getByText('Race Condition Flow')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
  });
});
