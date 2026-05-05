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

  test('VALID: {seek_scope quest with in-progress pathseeker workItem} => synthetic Planning steps row shows replayed pathseeker text on reload', async ({
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
          id: 'e2e00000-0000-4000-8000-000000000011',
          role: 'pathseeker',
          sessionId: pathseekerSessionId,
          status: 'in_progress',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The synthetic "Planning steps..." pathseeker row in the planning branch must
    // surface the in-progress pathseeker workItem's replayed assistant text — not
    // just render a streaming bar with no body. Streaming and replay paths converge
    // on the same workItem.sessionId, so this row must source from sessionEntries,
    // not slotEntries (which is only stamped during live emission).
    await expect(executionPanel.getByText('Planning steps...')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(executionPanel.getByText(pathseekerText)).toBeVisible({
      timeout: REPLAY_TEXT_TIMEOUT,
    });
  });
});
