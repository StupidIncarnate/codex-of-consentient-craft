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

test.describe('Observables approval gate (Gate #2)', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('EDGE: a feature quest at review_observables with NO flows cannot be approved — the APPROVE control is disabled', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Gate Reject Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    // Feature quest (questType defaults to 'feature' on parse) at review_observables with an EMPTY
    // operations ledger AND no flows. The ledger is what the `approved` gate stopped measuring —
    // codeweaver items are derived at Start from the flow node tags and the contract source paths,
    // so the ledger being empty here is normal. Non-empty `flows` is the whole requirement
    // `hasQuestGateContentGuard` still enforces, and withholding them is what disables APPROVE.
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
      flows: [],
    });

    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const specPanel = page.getByTestId('QUEST_SPEC_PANEL');
    await expect(specPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Still in observables review — the header proves the quest never transitioned.
    await expect(specPanel.getByTestId('PANEL_HEADER')).toHaveText('OBSERVABLES APPROVAL');

    // Empty ledger renders nothing (the widget returns null on an empty operations array). Asserted
    // on the tab that WOULD show it — on SPEC its absence proves only which tab was open.
    await specPanel.getByTestId('QUEST_SPEC_TAB_details').click();

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

  test('VALID: a quest carrying flows enables APPROVE — clicking it drives review_observables -> approved through the UI', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Gate Accept Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    // Same review_observables feature quest, but the harness's default flows are left in place, so
    // the gate's one requirement is satisfied and APPROVE is enabled. The codeweaver item seeded
    // below is there to prove the ledger still RENDERS in the DETAILS tab — it is not what opens
    // the gate.
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

    // The codeweaver operation renders in the DETAILS tab's ledger and the gate enables APPROVE.
    // The action bar is a sibling of the tab content, so APPROVE stays reachable from either tab.
    await specPanel.getByTestId('QUEST_SPEC_TAB_details').click();

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
