import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-ws-update';
const PANEL_TIMEOUT = 5_000;

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

  // The legacy "spec panel appears when quest is linked mid-chat via
  // quest-session-linked WS event" test was retired in the `/dumpster-create`
  // pivot. It drove chat through the no-questId route's CHAT_INPUT to trigger
  // POST /api/guilds/:guildId/quests (questNewBroker), which Step 16 sidelined.
  // Quest creation is now owned by the user's Claude session via
  // /dumpster-create; the no-questId route renders the
  // QUEST_CHAT_NO_QUEST_PLACEHOLDER banner instead of a CHAT_INPUT.
});
