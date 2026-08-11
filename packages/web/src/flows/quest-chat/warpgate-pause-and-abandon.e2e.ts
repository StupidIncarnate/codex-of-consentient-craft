import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { warpgateHarness } from '../../../test/harnesses/warpgate/warpgate.harness';

const GUILD_PATH = '/tmp/dm-e2e-warpgate-pause-abandon';
const PANEL_TIMEOUT = 10_000;
const ABANDON_LABEL = 'ABANDON QUEST';
const HTTP_OK = 200;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Warpgate merging is pauseable and abandonable, and pausing it leaves it resumable', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {status: merging} => PAUSE and ABANDON present, RESUME absent; pressing PAUSE stamps paused and swaps PAUSE for RESUME', async ({
    page,
    request,
  }) => {
    const warpgate = warpgateHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });
    const { urlSlug, questId, questFolder, questFilePath } = await warpgate.setup({
      guildName: 'Warpgate Pause Guild',
      title: 'Warpgate Pause Quest',
    });

    warpgate.seedWarpgateQuest({
      questId,
      questFolder,
      questFilePath,
      status: 'merging',
      warpgateStatus: 'in_progress',
    });

    await nav.navigateToQuest({ urlSlug, questId });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    const pauseButton = page.getByTestId('EXECUTION_PAUSE_BUTTON');
    const resumeButton = page.getByTestId('EXECUTION_RESUME_BUTTON');
    const abandonBar = page.getByTestId('ABANDON_BAR');

    // All three asserted together, at the SAME status, in the SAME test — the merging is not
    // resumable claim (RESUME absent) is only meaningful proof once this same suite also shows
    // RESUME reaching visible below; PAUSE and ABANDON are the two exits a hung merge needs.
    await expect(pauseButton).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(abandonBar).toBeVisible({ timeout: PANEL_TIMEOUT });
    expect(await abandonBar.textContent()).toBe(ABANDON_LABEL);
    await expect(resumeButton).not.toBeVisible();

    const pauseResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().includes(`/api/quests/${questId}/pause`),
    );

    await pauseButton.click();

    const pauseResponse = await pauseResponsePromise;
    expect(pauseResponse.status()).toBe(HTTP_OK);

    // FAILS IF pause never re-derives the panel (RESUME stays hidden / PAUSE stays visible) —
    // proving the negative above is not vacuous: RESUME really can reach VISIBLE, right here,
    // once the quest the pause landed on is actually resumable (`paused`).
    await expect(resumeButton).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(pauseButton).not.toBeVisible();

    const afterPauseResponse = await request.get(`/api/quests/${questId}`);
    const afterPauseBody = await afterPauseResponse.json();
    expect({
      status: afterPauseBody.quest.status,
      pausedAtStatus: afterPauseBody.quest.pausedAtStatus,
    }).toStrictEqual({ status: 'paused', pausedAtStatus: 'merging' });
  });
});
