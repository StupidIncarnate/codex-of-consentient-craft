import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-replay-execution-rows';
const PANEL_TIMEOUT = 5_000;
const REPLAY_TEXT_TIMEOUT = 5_000;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Quest reload replays per-work-item entries onto execution rows', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {seek_scope quest with in-progress pathseeker-surface workItem} => its execution row shows replayed pathseeker text on reload', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Replay Pathseeker Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const chaosSessionId = `e2e-replay-chaos-${Date.now()}`;
    const pathseekerSessionId = `e2e-replay-pathseeker-${Date.now()}`;

    const chaosText = 'Chaoswhisperer summary captured during streaming';
    const pathseekerText = 'Pathseeker analysis captured before pause';

    sessions.createSessionWithAssistantText({ sessionId: chaosSessionId, text: chaosText });
    sessions.createSessionWithAssistantText({
      sessionId: pathseekerSessionId,
      text: pathseekerText,
    });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Replay Pathseeker Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    const pathseekerWorkItemId = 'e2e00000-0000-4000-8000-000000000011';
    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'seek_scope',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000010',
          role: 'chaoswhisperer',
          sessionId: chaosSessionId,
          status: 'complete',
        },
        {
          id: pathseekerWorkItemId,
          role: 'pathseeker-surface',
          sessionId: pathseekerSessionId,
          status: 'in_progress',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The actual pathseeker-surface workItem row (no longer a synthetic
    // "Planning steps..." row) must surface the in-progress workItem's replayed
    // assistant text. Streaming and replay paths converge on the same
    // workItem.sessionId, so this row sources from sessionEntries — both paths
    // populate the same key.
    const pathseekerRoleBadge = executionPanel
      .getByTestId('execution-row-role-badge')
      .filter({ hasText: '[PATHSEEKER-SURFACE]' });

    await expect(pathseekerRoleBadge).toHaveCount(1, { timeout: PANEL_TIMEOUT });
    await expect(pathseekerRoleBadge).toHaveText('[PATHSEEKER-SURFACE]');

    await expect(executionPanel.getByText(pathseekerText)).toBeVisible({
      timeout: REPLAY_TEXT_TIMEOUT,
    });
  });
});
