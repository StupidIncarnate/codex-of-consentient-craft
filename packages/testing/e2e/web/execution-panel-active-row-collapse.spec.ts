import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';

import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';

const GUILD_PATH = '/tmp/dm-e2e-execution-active-row-collapse';
const PANEL_TIMEOUT = 5_000;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Execution panel: active (in_progress) row stays collapsed when user clicks the header', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {in_progress row, user clicks header to collapse} => row stays collapsed (auto-expand effect must not re-fire on the user-initiated state flip)', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Active Row Collapse Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const codeweaverSessionId = `e2e-active-collapse-${Date.now()}`;

    // Seed a session JSONL with a single assistant text entry. The orchestrator's
    // chat-history-replay-broker will deliver this on subscribe so the codeweaver
    // row has `hasEntries === true` — the precondition for the in_progress
    // auto-expand effect to fire.
    sessions.createSessionWithAssistantText({
      sessionId: codeweaverSessionId,
      text: 'Active row pre-seeded text',
    });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Active Row Collapse Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder, filePath: questFilePath } = created;

    // Seed a chaoswhisperer for quest→session linking and an in_progress codeweaver
    // pointing at the seeded session. Status `in_progress` ensures the row triggers
    // the auto-expand effect under test.
    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'in_progress',
      steps: [{ id: 'step-active-row', name: 'Active row collapse step' }],
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000a1',
          role: 'chaoswhisperer',
          sessionId: `e2e-active-chaos-${Date.now()}`,
          status: 'complete',
        },
        {
          id: 'e2e00000-0000-4000-8000-0000000000a2',
          role: 'codeweaver',
          sessionId: codeweaverSessionId,
          status: 'in_progress',
          relatedDataItems: ['steps/step-active-row'],
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const codeweaverRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: 'Active row collapse step' });

    // Wait for the in_progress auto-expand: status === 'in_progress' && hasEntries
    // triggers the effect that opens the expanded body on initial render.
    await expect(codeweaverRow.getByTestId('execution-row-expanded')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // User collapses the row by clicking its header.
    await codeweaverRow.getByTestId('execution-row-header').click();

    // The bug: the in-progress auto-expand effect re-fires when `expanded` flips false
    // (because `expanded` is in its deps array) and immediately re-expands the row,
    // racing the user click. With the fix (`!userClickedRef.current` guard), the row
    // stays collapsed.
    await expect(codeweaverRow.getByTestId('execution-row-expanded')).not.toBeVisible();

    // Assert the collapse is durable across at least one more re-render window. If the
    // bug returned, the auto-expand effect would re-run on the next React commit and
    // the expanded body would re-appear.
    await expect(codeweaverRow.getByTestId('execution-row-expanded')).not.toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
  });
});
