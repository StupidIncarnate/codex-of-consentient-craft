import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-operations-ledger-spec-panel';
const PANEL_TIMEOUT = 10_000;

// Fixed operation-item ids so the seed and the assertions reference the same ledger rows.
const CW1_OP = '00000000-0000-4000-8000-0000000000c1';
const CW2_OP = '00000000-0000-4000-8000-0000000000c2';
const WARD_OP = '00000000-0000-4000-8000-0000000000a1';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Operations ledger in the quest spec panel', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: a review_observables quest with a non-empty operations ledger renders the ledger inside the QUEST SPEC panel', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Spec Panel Ledger Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    // Create via API to get the server-resolved file path, then overwrite quest.json with a
    // spec-phase (review_observables) quest whose authored operations ledger is non-empty. This is
    // the OTHER ledger surface from the execution panel: the QuestSpecPanelWidget's OPERATIONS
    // section, rendered directly for a pre-execution quest (shouldRenderExecutionPanel = false).
    const created = await quests.createQuest({
      guildId,
      title: 'Spec Panel Ledger Quest',
      userRequest: 'Build the feature',
    });

    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      title: 'Spec Panel Ledger Quest',
      status: 'review_observables',
      workItems: [
        { id: 'e2e00000-0000-4000-8000-000000000001', role: 'chaoswhisperer', status: 'complete' },
      ],
      operations: [
        { id: CW1_OP, role: 'codeweaver', text: 'core: config adapter', status: 'pending' },
        { id: CW2_OP, role: 'codeweaver', text: 'core: config broker', status: 'pending' },
        {
          id: WARD_OP,
          role: 'ward',
          text: 'ward (changed)',
          status: 'pending',
          locked: true,
          wardMode: 'changed',
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const specPanel = page.getByTestId('QUEST_SPEC_PANEL');
    await expect(specPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The ledger renders inside the spec panel's OPERATIONS section (not the execution panel).
    await expect(specPanel.getByTestId('OPERATIONS_SECTION')).toBeVisible();
    await expect(specPanel.getByTestId('OPERATIONS_LEDGER')).toBeVisible();

    // Each authored operation is one row with the right role + prose text, in ledger order; a
    // pre-execution ledger is all pending ([ ]); the ward row carries its (changed) mode.
    await expect(specPanel.getByTestId('OPERATIONS_LEDGER_ROW_ROLE')).toHaveText([
      '[CODEWEAVER]',
      '[CODEWEAVER]',
      '[WARD]',
    ]);
    await expect(specPanel.getByTestId('OPERATIONS_LEDGER_ROW_TEXT')).toHaveText([
      'core: config adapter',
      'core: config broker',
      'ward (changed)',
    ]);
    await expect(specPanel.getByTestId('OPERATIONS_LEDGER_ROW_MARKER')).toHaveText([
      '[ ]',
      '[ ]',
      '[ ]',
    ]);
    await expect(specPanel.getByTestId('OPERATIONS_LEDGER_ROW_WARD_MODE')).toHaveText('(changed)');
  });
});
