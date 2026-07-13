import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-operations-approval-gate';
const PANEL_TIMEOUT = 10_000;
const MODAL_TIMEOUT = 5_000;
const REQUEST_TIMEOUT = 5_000;

const CW_OP = '00000000-0000-4000-8000-0000000000c1';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Operations ledger approval gate (Gate #2)', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('EDGE: a feature quest at review_observables with NO codeweaver operation cannot be approved — the APPROVE control is disabled', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Gate Reject Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    // Feature quest (questType defaults to 'feature' on parse) at review_observables with flows but
    // an EMPTY operations ledger — no codeweaver implementation item authored yet. The `approved`
    // gate (hasQuestGateContentGuard) requires an operations item with role:codeweaver for feature
    // quests, so the APPROVE control must be disabled.
    const created = await quests.createQuest({
      guildId,
      title: 'Gate Reject Quest',
      userRequest: 'Build the feature',
    });

    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      title: 'Gate Reject Quest',
      status: 'review_observables',
      workItems: [
        { id: 'e2e00000-0000-4000-8000-000000000001', role: 'chaoswhisperer', status: 'complete' },
      ],
      operations: [],
    });

    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const specPanel = page.getByTestId('QUEST_SPEC_PANEL');
    await expect(specPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Still in observables review — the header proves the quest never transitioned.
    await expect(specPanel.getByTestId('PANEL_HEADER')).toHaveText('OBSERVABLES APPROVAL');

    // Empty ledger renders nothing (the widget returns null on an empty operations array).
    await expect(specPanel.getByTestId('OPERATIONS_LEDGER')).toHaveCount(0);

    // The APPROVE button is present but disabled (the gate wired `disabled` onto it), so the quest
    // cannot leave review_observables through the UI.
    const approveBtn = specPanel
      .getByTestId('ACTION_BAR')
      .getByTestId('PIXEL_BTN')
      .filter({ hasText: 'APPROVE' });
    await expect(approveBtn).toHaveText('APPROVE');
    await expect(approveBtn).toHaveCSS('pointer-events', 'none');
  });

  test('VALID: adding a codeweaver operation enables APPROVE — clicking it drives review_observables -> approved through the UI', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Gate Accept Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    // Same review_observables feature quest, but now the ledger carries one role:codeweaver item —
    // the gate's requirement is satisfied, so APPROVE is enabled.
    const created = await quests.createQuest({
      guildId,
      title: 'Gate Accept Quest',
      userRequest: 'Build the feature',
    });

    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      title: 'Gate Accept Quest',
      status: 'review_observables',
      workItems: [
        { id: 'e2e00000-0000-4000-8000-000000000001', role: 'chaoswhisperer', status: 'complete' },
      ],
      operations: [
        { id: CW_OP, role: 'codeweaver', text: 'core: build the feature', status: 'pending' },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const specPanel = page.getByTestId('QUEST_SPEC_PANEL');
    await expect(specPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The codeweaver operation renders in the ledger and the gate enables APPROVE.
    await expect(specPanel.getByTestId('OPERATIONS_LEDGER_ROW_ROLE')).toHaveText(['[CODEWEAVER]']);
    const approveBtn = specPanel
      .getByTestId('ACTION_BAR')
      .getByTestId('PIXEL_BTN')
      .filter({ hasText: 'APPROVE' });
    await expect(approveBtn).toHaveCSS('pointer-events', 'auto');

    // Drive the REAL APPROVE button — it issues the status PATCH itself (no direct PATCH here).
    const patchPromise = page.waitForRequest(
      (req) =>
        req.method() === 'PATCH' && req.url().includes(`/api/quests/${String(created.questId)}`),
      { timeout: REQUEST_TIMEOUT },
    );
    await approveBtn.click();

    const patchRequest = await patchPromise;
    expect(patchRequest.postDataJSON()).toHaveProperty('status', 'approved');

    // Reaching `approved` opens the Begin-Quest modal (its guard fires only for exactly 'approved'),
    // proving the gate transition landed through the UI.
    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });
  });
});
