import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { followupHarness } from '../../../test/harnesses/followup/followup.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

const GUILD_PATH = '/tmp/dm-e2e-followup-post-quest-bar';

// Derive every matrix from the SAME statics source the guards read (isFollowupChatableQuestStatusGuard
// / isMergeableQuestStatusGuard) — never hand-maintain a parallel list. A status added later is
// picked up automatically instead of silently skipped.
type StatusKey = keyof typeof questStatusMetadataStatics.statuses;
const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

const FOLLOWUP_CHATABLE_STATUSES = STATUSES.filter(
  (status) => questStatusMetadataStatics.statuses[status].isFollowupChatable,
);
// The other half of the vacuous-negative pair: every status where the execution panel DOES
// render (so the bar's absence is a real "gated off", not "nothing painted at all") but the
// quest is not followup-chatable.
const EXECUTION_RENDERED_NOT_CHATABLE_STATUSES = STATUSES.filter(
  (status) =>
    questStatusMetadataStatics.statuses[status].shouldRenderExecutionPanel &&
    !questStatusMetadataStatics.statuses[status].isFollowupChatable,
);
const MERGEABLE_STATUSES = STATUSES.filter(
  (status) => questStatusMetadataStatics.statuses[status].isMergeable,
);
// The merge-segment contrast case: followup-chatable but NOT mergeable. Both bars share the same
// outer post-quest-bar (already proven visible above), so this isolates the inner segment alone.
const FOLLOWUP_CHATABLE_NOT_MERGEABLE_STATUSES = FOLLOWUP_CHATABLE_STATUSES.filter(
  (status) => !questStatusMetadataStatics.statuses[status].isMergeable,
);

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Post-quest action bar gating', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  // action-bar-visible-terminal, derived across every isFollowupChatable status rather than a
  // hardcoded [blocked, complete, merged] literal.
  for (const status of FOLLOWUP_CHATABLE_STATUSES) {
    test(`VALID: {status: ${status}} => post-quest bar is visible with a FOLLOW-UP segment`, async ({
      page,
      request,
    }) => {
      const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
      await followup.seedAndOpen({ guildName: `Bar Visible ${status} Guild`, status });

      expect(await followup.postQuestBarVisible()).toBe(true);
      expect(await followup.followupButtonVisible()).toBe(true);
    });
  }

  // action-bar-hidden-running: the vacuous-negative partner of the loop above. Every one of these
  // statuses still renders the execution panel (so a blank panel can't masquerade as "bar
  // hidden"), it is simply not followup-chatable.
  for (const status of EXECUTION_RENDERED_NOT_CHATABLE_STATUSES) {
    test(`INVALID: {status: ${status}} => post-quest bar is absent`, async ({ page, request }) => {
      const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
      await followup.seedAndOpen({ guildName: `Bar Hidden ${status} Guild`, status });

      await expect(page.getByTestId('execution-panel-widget')).toBeVisible();
      expect(await followup.postQuestBarVisible()).toBe(false);
    });
  }

  // merge-segment-gating, positive half: blocked and complete both show the merge segment.
  for (const status of MERGEABLE_STATUSES) {
    test(`VALID: {status: ${status}} => post-quest bar shows a Teleport with Booty (Merge) segment`, async ({
      page,
      request,
    }) => {
      const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
      await followup.seedAndOpen({ guildName: `Merge Segment ${status} Guild`, status });

      expect(await followup.postQuestBarVisible()).toBe(true);
      expect(await followup.mergeButtonVisible()).toBe(true);
    });
  }

  // merge-segment-gating, negative half: followup-chatable statuses that are NOT mergeable
  // (merged, on the current statics) omit the segment even though the bar itself is visible —
  // the contrast that proves the omission is status-driven, not "the bar never renders".
  for (const status of FOLLOWUP_CHATABLE_NOT_MERGEABLE_STATUSES) {
    test(`INVALID: {status: ${status}} => post-quest bar is visible but omits the merge segment`, async ({
      page,
      request,
    }) => {
      const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
      await followup.seedAndOpen({ guildName: `Merge Segment Absent ${status} Guild`, status });

      expect(await followup.postQuestBarVisible()).toBe(true);
      expect(await followup.followupButtonVisible()).toBe(true);
      expect(await followup.mergeButtonVisible()).toBe(false);
    });
  }

  // post-quest-bars-stack-cleanly: on a blocked quest BOTH the pause/resume action bar (RESUME,
  // since blocked isAnyAgentRunning=false but isResumable=true) and the post-quest bar are live
  // and must stack as clean siblings — painted geometry, unreachable from jsdom.
  test('VALID: {blocked quest} => the pause/resume bar and the post-quest bar are both live, stack with a single 1px top hairline each, and the work-item scroll container keeps its 160px floor', async ({
    page,
    request,
  }) => {
    const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
    await followup.seedAndOpen({ guildName: 'Bars Stack Cleanly Guild', status: 'blocked' });

    expect(await followup.actionBarVisible()).toBe(true);
    expect(await followup.postQuestBarVisible()).toBe(true);
    await expect(page.getByTestId('EXECUTION_RESUME_BUTTON')).toBeVisible();

    const geometry = await followup.barsStackCleanly();

    expect(geometry).toStrictEqual({
      stacksCleanly: true,
      actionBarHasSingleTopHairline: true,
      postQuestBarHasSingleTopHairline: true,
      floorMeetsMinHeight: true,
    });
  });
});
