import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { warpgateHarness } from '../../../test/harnesses/warpgate/warpgate.harness';

const GUILD_PATH = '/tmp/dm-e2e-warpgate-row-header';
const PANEL_TIMEOUT = 10_000;
const WARPGATE_ROLE_BADGE = '[WARPGATE]';
const MERGING_HEADER = 'MERGING';
const HOSTILE_TOKEN_LENGTH = 300;
// An unbroken 300-char token with no break opportunity — proves the row's name/title survive
// without being dropped, truncated at the JS level, or otherwise mangled.
const HOSTILE_UNBROKEN_TITLE = 'w'.repeat(HOSTILE_TOKEN_LENGTH);

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Warpgate row and MERGING header', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {status: merging} => warpgate row renders [WARPGATE] role badge and header reads exactly MERGING, not EXECUTION COMPLETE', async ({
    page,
    request,
  }) => {
    const warpgate = warpgateHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });
    const { urlSlug, questId, questFolder, questFilePath } = await warpgate.setup({
      guildName: 'Warpgate Row Guild',
      title: HOSTILE_UNBROKEN_TITLE,
    });

    warpgate.seedWarpgateQuest({
      questId,
      questFolder,
      questFilePath,
      title: HOSTILE_UNBROKEN_TITLE,
      status: 'merging',
      warpgateStatus: 'in_progress',
    });

    await nav.navigateToQuest({ urlSlug, questId });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // FAILS IF the warpgate work item never rendered a row at all, or rendered under a
    // different role's badge (e.g. it stayed labelled by whatever role preceded it).
    const warpgateRoleBadge = executionPanel
      .getByTestId('execution-row-role-badge')
      .filter({ hasText: WARPGATE_ROLE_BADGE });
    await expect(warpgateRoleBadge).toHaveCount(1, { timeout: PANEL_TIMEOUT });
    expect(await warpgateRoleBadge.textContent()).toBe(WARPGATE_ROLE_BADGE);

    // FAILS IF the banner still reads EXECUTION COMPLETE (the pre-repair regression this
    // observable exists to catch — merging used to be keyed off isTerminalQuestStatusGuard,
    // which never included it, so the banner branch was unreachable) or any other header
    // string. A single exact-equality assertion on the real string already rules out every
    // wrong value, EXECUTION COMPLETE included.
    const banner = page.getByTestId('execution-panel-status-banner');
    await expect(banner).toBeVisible({ timeout: PANEL_TIMEOUT });
    expect(await banner.textContent()).toBe(MERGING_HEADER);

    // The hostile 300-char unbroken title survives verbatim on the title bar.
    expect(await page.getByTestId('QUEST_TITLE').textContent()).toBe(HOSTILE_UNBROKEN_TITLE);
  });
});
