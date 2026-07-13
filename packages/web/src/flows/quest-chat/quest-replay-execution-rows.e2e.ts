import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

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

  test('VALID: {in_progress quest with in-progress codeweaver workItem} => its execution row shows replayed codeweaver text on reload', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Replay Codeweaver Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const chaosSessionId = `e2e-replay-chaos-${Date.now()}`;
    const codeweaverSessionId = `e2e-replay-codeweaver-${Date.now()}`;

    const chaosText = 'Chaoswhisperer summary captured during streaming';
    const codeweaverText = 'Codeweaver analysis captured before pause';

    sessions.createSessionWithAssistantText({ sessionId: chaosSessionId, text: chaosText });
    sessions.createSessionWithAssistantText({
      sessionId: codeweaverSessionId,
      text: codeweaverText,
    });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Replay Codeweaver Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    const codeweaverWorkItemId = 'e2e00000-0000-4000-8000-000000000011';
    const codeweaverOpId = '00000000-0000-4000-8000-0000000000c5';
    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'in_progress',
      operations: [
        {
          id: codeweaverOpId,
          role: 'codeweaver',
          text: 'analyze scope',
          status: 'in_progress',
        },
      ],
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000010',
          role: 'chaoswhisperer',
          sessionId: chaosSessionId,
          status: 'complete',
        },
        {
          id: codeweaverWorkItemId,
          role: 'codeweaver',
          sessionId: codeweaverSessionId,
          status: 'in_progress',
          relatedDataItems: [`operations/${codeweaverOpId}`],
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The codeweaver workItem row must surface the in-progress workItem's replayed assistant
    // text. Streaming and replay paths converge on the same workItem.sessionId, so this row
    // sources from sessionEntries — both paths populate the same key. The row name resolves
    // from the linked operation's `text`.
    const codeweaverRoleBadge = executionPanel
      .getByTestId('execution-row-role-badge')
      .filter({ hasText: '[CODEWEAVER]' });

    await expect(codeweaverRoleBadge).toHaveCount(1, { timeout: PANEL_TIMEOUT });
    await expect(codeweaverRoleBadge).toHaveText('[CODEWEAVER]');

    await expect(executionPanel.getByText(codeweaverText)).toBeVisible({
      timeout: REPLAY_TEXT_TIMEOUT,
    });
  });
});
