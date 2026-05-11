import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-abandoned-quest-chaos-only-transcript';
const PANEL_TIMEOUT = 5_000;
const REPLAY_TEXT_TIMEOUT = 5_000;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Abandoned quest with only a chaoswhisperer work item still shows the chaos transcript', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {abandoned quest, only chaoswhisperer work item with sessionId} => execution panel surfaces the replayed chaos transcript', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Abandoned Chaos Only Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const chaosSessionId = `e2e-abandoned-chaos-${Date.now()}`;
    const chaosText = 'Chaoswhisperer transcript that must survive abandon';

    sessions.createSessionWithAssistantText({ sessionId: chaosSessionId, text: chaosText });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Abandoned Chaos Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    // OrchestrationAbandonResponder marks every non-terminal work item as
    // `skipped` while transitioning the quest to `abandoned`. A quest abandoned
    // during the chaoswhisperer phase therefore lands with EXACTLY this shape on
    // disk: one chaoswhisperer work item, status `skipped`, sessionId stamped.
    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'abandoned',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000020',
          role: 'chaoswhisperer',
          sessionId: chaosSessionId,
          status: 'skipped',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The abandoned-quest terminal banner must render.
    await expect(executionPanel.getByText('ABANDONED')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The chaos work item must render as a row even though it's `skipped` —
    // skipping happens as a side-effect of user-driven abandon, not because the
    // user has no interest in the transcript. The user-visible invariant is
    // "I should still be able to see the chaoswhisperer transcript that's
    // available on disk".
    await expect(executionPanel.getByText(chaosText)).toBeVisible({
      timeout: REPLAY_TEXT_TIMEOUT,
    });
  });
});
