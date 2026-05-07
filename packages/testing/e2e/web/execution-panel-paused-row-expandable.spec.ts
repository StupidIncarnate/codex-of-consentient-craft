import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-execution-panel-paused-row-expandable';
const PANEL_TIMEOUT = 5_000;
const REPLAY_TEXT_TIMEOUT = 5_000;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Paused quest: pending work items with sessionId stay expandable', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {paused quest, codeweaver pending row with sessionId} => row is expandable and shows replayed messages', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Paused Row Expandable Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const chaosSessionId = `e2e-paused-chaos-${Date.now()}`;
    const codeweaverSessionId = `e2e-paused-codeweaver-${Date.now()}`;

    const codeweaverText = 'Codeweaver progress captured before pause';

    sessions.createSessionWithAssistantText({
      sessionId: chaosSessionId,
      text: 'Chaos summary',
    });
    sessions.createSessionWithAssistantText({
      sessionId: codeweaverSessionId,
      text: codeweaverText,
    });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Paused Row Expandable Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'paused',
      steps: [{ id: 'step-build-broker', name: 'Create auth broker' }],
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000a1',
          role: 'chaoswhisperer',
          sessionId: chaosSessionId,
          status: 'complete',
        },
        {
          id: 'e2e00000-0000-4000-8000-0000000000a2',
          role: 'codeweaver',
          sessionId: codeweaverSessionId,
          status: 'pending',
          relatedDataItems: ['steps/step-build-broker'],
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Sanity-check that we hit the paused branch (RESUME visible, PAUSE not).
    await expect(page.getByTestId('EXECUTION_RESUME_BUTTON')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('EXECUTION_PAUSE_BUTTON')).not.toBeVisible();

    // The pending codeweaver row shows its step name. Status badge confirms it's pending.
    const codeweaverRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: 'Create auth broker' });

    await expect(codeweaverRow.getByTestId('execution-row-status-badge')).toHaveText('PENDING');

    // The expanded body must NOT exist yet — opening is the user action under test.
    await expect(codeweaverRow.getByTestId('execution-row-expanded')).not.toBeVisible();

    // Click the row header to expand. If the row weren't expandable (the bug),
    // the click would be a no-op and the expanded body would never appear.
    await codeweaverRow.getByTestId('execution-row-header').click();

    await expect(codeweaverRow.getByTestId('execution-row-expanded')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(codeweaverRow.getByText(codeweaverText)).toBeVisible({
      timeout: REPLAY_TEXT_TIMEOUT,
    });
  });
});
