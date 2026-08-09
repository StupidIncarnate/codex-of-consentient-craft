import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { warpgateHarness } from '../../../test/harnesses/warpgate/warpgate.harness';

const GUILD_PATH = '/tmp/dm-e2e-warpgate-merge-button';
const PANEL_TIMEOUT = 10_000;
const MERGE_LABEL = 'Teleport with Booty (Merge)';
const FOLLOWUP_LABEL = 'FOLLOW-UP';
const HOSTILE_TOKEN_LENGTH = 300;
// An unbroken token with no break opportunity — proves the title renders verbatim rather than
// being silently dropped or word-wrapped away.
const HOSTILE_UNBROKEN_TITLE = 'x'.repeat(HOSTILE_TOKEN_LENGTH);
const MARKUP_SHAPED_TITLE = '<img src=x onerror=alert(1)>Merge Quest & "quoted" <b>bold</b>';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;
// Derive from the statics — never hardcode. A status added later that becomes mergeable is
// picked up automatically instead of silently skipped.
const MERGEABLE_STATUSES = (
  Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[]
).filter((status) => questStatusMetadataStatics.statuses[status].isMergeable);

test.describe('Warpgate merge button visibility', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  for (const status of MERGEABLE_STATUSES) {
    // First status in the derived list also carries the unbroken-300-char hostile title so the
    // matrix proves the button renders regardless of what the quest is named.
    const title = status === MERGEABLE_STATUSES[0] ? HOSTILE_UNBROKEN_TITLE : `Mergeable ${status}`;

    test(`VALID: {status: ${status}} => Teleport with Booty (Merge) segment is enabled`, async ({
      page,
      request,
    }) => {
      const warpgate = warpgateHarness({ request, guildPath: GUILD_PATH });
      const nav = navigationHarness({ page });
      const { urlSlug, questId, questFolder, questFilePath } = await warpgate.setup({
        guildName: `Merge Button ${status} Guild`,
        title,
      });

      warpgate.seedWarpgateQuest({
        questId,
        questFolder,
        questFilePath,
        title,
        status,
        warpgateStatus: 'complete',
      });

      await nav.navigateToQuest({ urlSlug, questId });

      await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
        timeout: PANEL_TIMEOUT,
      });

      const mergeButton = page.getByTestId('EXECUTION_MERGE_BUTTON');

      await expect(mergeButton).toBeVisible({ timeout: PANEL_TIMEOUT });
      expect(await mergeButton.textContent()).toBe(MERGE_LABEL);

      // The hostile title itself must render verbatim, unclipped by any JS-level truncation and
      // never interpreted as markup — a markup-shaped title is covered by the merged-vs-complete
      // test below, and this test proves the unbroken 300-char token survives instead.
      if (title === HOSTILE_UNBROKEN_TITLE) {
        expect(await page.getByTestId('QUEST_TITLE').textContent()).toBe(HOSTILE_UNBROKEN_TITLE);
      }
    });
  }

  test('VALID: {status: merged} => Teleport with Booty (Merge) segment absent, FOLLOW-UP segment present', async ({
    page,
    request,
  }) => {
    const warpgate = warpgateHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });
    const { urlSlug, questId, questFolder, questFilePath } = await warpgate.setup({
      guildName: 'Merged Guild',
      title: MARKUP_SHAPED_TITLE,
    });

    warpgate.seedWarpgateQuest({
      questId,
      questFolder,
      questFilePath,
      title: MARKUP_SHAPED_TITLE,
      status: 'merged',
      warpgateStatus: 'complete',
    });

    await nav.navigateToQuest({ urlSlug, questId });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Assert BOTH halves — a bar that vanished entirely would also pass a check that only
    // asserted the Merge segment's absence.
    await expect(page.getByTestId('EXECUTION_MERGE_BUTTON')).not.toBeVisible();
    const followupButton = page.getByTestId('EXECUTION_FOLLOWUP_BUTTON');
    await expect(followupButton).toBeVisible({ timeout: PANEL_TIMEOUT });
    expect(await followupButton.textContent()).toBe(FOLLOWUP_LABEL);

    // The markup-shaped title renders as literal text — proof it was never interpreted as HTML.
    expect(await page.getByTestId('QUEST_TITLE').textContent()).toBe(MARKUP_SHAPED_TITLE);
  });

  test('VALID: {status: merged vs complete} => merged terminal banner renders in the same success colour the complete banner uses', async ({
    page,
    request,
  }) => {
    const warpgate = warpgateHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });

    // Read the expected colour from the SAME statics source the widget itself reads, rather
    // than hardcoding a hex — let the browser resolve the hex to whatever rgb() form
    // getComputedStyle/toHaveCSS compares against, so both banners are checked against a value
    // neither test nor widget hardcodes independently.
    const expectedSuccessColor = await page.evaluate((hex) => {
      const probe = document.createElement('div');
      probe.style.color = hex;
      document.body.appendChild(probe);
      const resolved = globalThis.getComputedStyle(probe).color;
      document.body.removeChild(probe);
      return resolved;
    }, emberDepthsThemeStatics.colors.success);

    // BOTH quests live in ONE guild. The guilds API registers one guild per PATH, so a second
    // createGuild against this same GUILD_PATH answers an error body with no id and the quest
    // create that follows it fails contract validation instead.
    const completeSetup = await warpgate.setup({
      guildName: 'Banner Guild',
      title: 'Banner Complete Quest',
    });
    warpgate.seedWarpgateQuest({
      questId: completeSetup.questId,
      questFolder: completeSetup.questFolder,
      questFilePath: completeSetup.questFilePath,
      title: 'Banner Complete Quest',
      status: 'complete',
      warpgateStatus: 'complete',
    });

    await nav.navigateToQuest({ urlSlug: completeSetup.urlSlug, questId: completeSetup.questId });
    const completeBanner = page.getByTestId('execution-panel-status-banner');
    await expect(completeBanner).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(completeBanner).toHaveCSS('color', expectedSuccessColor);

    const mergedQuest = await warpgate.createQuestInGuild({
      guildId: completeSetup.guildId,
      title: 'Banner Merged Quest',
    });
    warpgate.seedWarpgateQuest({
      questId: mergedQuest.questId,
      questFolder: mergedQuest.questFolder,
      questFilePath: mergedQuest.questFilePath,
      title: 'Banner Merged Quest',
      status: 'merged',
      warpgateStatus: 'complete',
    });

    await nav.navigateToQuest({ urlSlug: completeSetup.urlSlug, questId: mergedQuest.questId });
    const mergedBanner = page.getByTestId('execution-panel-status-banner');
    await expect(mergedBanner).toBeVisible({ timeout: PANEL_TIMEOUT });
    // The merged banner is checked against the EXACT same expected value the complete banner
    // was just checked against above — that transitively proves "merged renders in the same
    // colour complete uses" without either test hardcoding a hex of its own.
    await expect(mergedBanner).toHaveCSS('color', expectedSuccessColor);
  });
});
