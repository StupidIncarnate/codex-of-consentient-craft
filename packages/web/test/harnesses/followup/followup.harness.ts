/**
 * PURPOSE: Seeds a quest at a follow-up-relevant status, opens the quest execution view, and
 * exposes the FOLLOW-UP tab's structural + painted-geometry reads (tab order, active tab,
 * post-quest-bar stacking) that only a real attached browser tab can prove — jsdom has no layout
 * engine, so every width/border/adjacency check here would read 0 or pass vacuously there.
 *
 * USAGE:
 * const followup = followupHarness({ page, request, guildPath });
 * const seeded = await followup.seedAndOpen({ guildName: 'Followup Guild', status: 'blocked' });
 * await followup.pressFollowup();
 * expect(await followup.tabOrder()).toStrictEqual([
 *   'execution-panel-tab-followup', 'execution-panel-tab-execution', 'execution-panel-tab-spec',
 * ]);
 */
import { readFileSync, writeFileSync } from 'fs';

import type { APIRequestContext, Page } from '@playwright/test';

import type { FilePath, QuestId, UrlSlug } from '@dungeonmaster/shared/contracts';

import type { TestId } from '../../../src/contracts/test-id/test-id-contract';
import { guildHarness } from '../guild/guild.harness';
import { navigationHarness } from '../navigation/navigation.harness';
import { questHarness } from '../quest/quest.harness';

const PANEL_TIMEOUT = 10_000;
const JSON_INDENT = 2;
// Chrome's computed value for a `2px solid transparent` border-bottom — the inactive-tab state in
// execution-panel-widget.tsx. Restated rather than imported: a harness may not import app statics
// or widget internals, and the computed value IS the observable being asserted (same technique as
// test/harnesses/flow-diagram/flow-diagram.harness.ts's TRANSPARENT_COMPUTED).
const TAB_BORDER_TRANSPARENT_COMPUTED = 'rgba(0, 0, 0, 0)';
const EXPECTED_BORDER_WIDTH = '1px';
const EXPECTED_NO_BORDER_WIDTH = '0px';
const ADJACENCY_EPSILON_PX = 1;
// Mirrors EXECUTION_FLOOR_MIN_HEIGHT in execution-panel-widget.tsx. Restated rather than imported
// for the same reason as flow-diagram.harness.ts's MIN_CANVAS_HEIGHT_PX: the floor is the
// observable itself, so it must not follow the widget's own value down if that value regresses.
const EXECUTION_FLOOR_MIN_HEIGHT_PX = 160;

// Element-type extraction via literal `[0]` rather than `[number]` — both resolve to the same
// array element type, but `[number]` writes the bare `number` keyword this repo's ban-primitives
// rule flags on sight, even inside an indexed-access position.
type WorkItemInput = Parameters<ReturnType<typeof questHarness>['writeQuestFile']>[0]['workItems'][0];

export const followupHarness = ({
  page,
  request,
  guildPath,
}: {
  page: Page;
  request: APIRequestContext;
  guildPath: string;
}): {
  seedAndOpen: (params: {
    guildName: string;
    status: string;
    worktreePath?: string;
    workItems?: WorkItemInput[];
  }) => Promise<{ questId: QuestId; questFilePath: FilePath; urlSlug: UrlSlug }>;
  reopen: (params: { urlSlug: string; questId: string }) => Promise<void>;
  pressFollowup: () => Promise<void>;
  switchToExecutionTab: () => Promise<void>;
  switchToFollowupTab: () => Promise<void>;
  tabOrder: () => Promise<TestId[]>;
  hasExactlyOneFollowupTab: () => Promise<boolean>;
  isTabActive: (params: { testid: string }) => Promise<boolean>;
  postQuestBarVisible: () => Promise<boolean>;
  actionBarVisible: () => Promise<boolean>;
  followupButtonVisible: () => Promise<boolean>;
  mergeButtonVisible: () => Promise<boolean>;
  barsStackCleanly: () => Promise<{
    stacksCleanly: boolean;
    actionBarHasSingleTopHairline: boolean;
    postQuestBarHasSingleTopHairline: boolean;
    floorMeetsMinHeight: boolean;
  }>;
} => {
  const seedAndOpen = async ({
    guildName,
    status,
    worktreePath,
    workItems,
  }: {
    guildName: string;
    status: string;
    worktreePath?: string;
    workItems?: WorkItemInput[];
  }): Promise<{ questId: QuestId; questFilePath: FilePath; urlSlug: UrlSlug }> => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: guildName, path: guildPath });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: `Followup: ${guildName}`,
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status,
      workItems: workItems ?? [],
    });

    // worktreePath has no writeQuestFile param — quest.harness.ts is consume-only while every
    // flowrider bundle runs concurrently against this same seed helper, so a real (or
    // deliberately dangling) worktree is patched onto the already-written JSON directly.
    if (worktreePath !== undefined) {
      const questJson = JSON.parse(readFileSync(String(questFilePath), 'utf8')) as Record<
        PropertyKey,
        unknown
      >;
      questJson.worktreePath = worktreePath;
      writeFileSync(String(questFilePath), JSON.stringify(questJson, null, JSON_INDENT));
    }

    await nav.navigateToQuest({ urlSlug: String(urlSlug), questId: String(questId) });
    await page.getByTestId('QUEST_CHAT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    return { questId, questFilePath, urlSlug };
  };

  const reopen = async ({
    urlSlug,
    questId,
  }: {
    urlSlug: string;
    questId: string;
  }): Promise<void> => {
    const nav = navigationHarness({ page });
    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('QUEST_CHAT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
  };

  const pressFollowup = async (): Promise<void> => {
    await page.getByTestId('EXECUTION_FOLLOWUP_BUTTON').click();
    await page
      .getByTestId('execution-panel-tab-followup')
      .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
  };

  const switchToExecutionTab = async (): Promise<void> => {
    await page.getByTestId('execution-panel-tab-execution').click();
  };

  const switchToFollowupTab = async (): Promise<void> => {
    await page.getByTestId('execution-panel-tab-followup').first().click();
  };

  // Reads every direct child of the tab bar in DOM order — the ONLY way to prove an ORDER claim
  // (membership alone, e.g. three separate .toBeVisible() calls, cannot fail on a shuffled row).
  const tabOrder = async (): Promise<TestId[]> =>
    page
      .getByTestId('execution-panel-tab-bar')
      .locator('> *')
      .evaluateAll((elements) => elements.map((element) => element.getAttribute('data-testid')))
      .then(
        (testids) =>
          testids.filter((id): id is NonNullable<typeof id> => id !== null) as TestId[],
      );

  const hasExactlyOneFollowupTab = async (): Promise<boolean> =>
    (await page.getByTestId('execution-panel-tab-followup').count()) === 1;

  // Active tab carries a solid `colors.primary` border-bottom; every inactive tab carries a
  // same-width TRANSPARENT one (never removed, so layout never shifts on switch) — so "active" is
  // provable as "not the transparent computed colour" without hardcoding the theme's orange hex.
  const isTabActive = async ({ testid }: { testid: string }): Promise<boolean> => {
    const color = await page
      .getByTestId(testid)
      .first()
      .evaluate((element) => globalThis.getComputedStyle(element).borderBottomColor);
    return color !== TAB_BORDER_TRANSPARENT_COMPUTED;
  };

  const postQuestBarVisible = async (): Promise<boolean> =>
    page.getByTestId('execution-panel-post-quest-bar').isVisible();

  const actionBarVisible = async (): Promise<boolean> =>
    page.getByTestId('execution-panel-action-bar').isVisible();

  const followupButtonVisible = async (): Promise<boolean> =>
    page.getByTestId('EXECUTION_FOLLOWUP_BUTTON').isVisible();

  const mergeButtonVisible = async (): Promise<boolean> =>
    page.getByTestId('EXECUTION_MERGE_BUTTON').isVisible();

  // Painted-geometry proof for `post-quest-bars-stack-cleanly`: both bars carry exactly one 1px
  // top border and no bottom border (so two hairlines never land adjacent), the post-quest bar's
  // top sits flush against the action bar's bottom (no gap, no overlap), and the scroll container
  // above them never collapses under its 160px floor. A jsdom style read cannot resolve any of
  // this — border widths on an un-laid-out node and bounding boxes both read 0.
  const barsStackCleanly = async (): Promise<{
    stacksCleanly: boolean;
    actionBarHasSingleTopHairline: boolean;
    postQuestBarHasSingleTopHairline: boolean;
    floorMeetsMinHeight: boolean;
  }> => {
    const actionBar = page.getByTestId('execution-panel-action-bar');
    const postQuestBar = page.getByTestId('execution-panel-post-quest-bar');
    const floor = page.getByTestId('execution-panel-floor-content');

    const [actionBox, postBox, floorBox] = await Promise.all([
      actionBar.boundingBox(),
      postQuestBar.boundingBox(),
      floor.boundingBox(),
    ]);
    if (actionBox === null || postBox === null || floorBox === null) {
      throw new Error(
        'post-quest-bar geometry unavailable: one of execution-panel-action-bar / ' +
          'execution-panel-post-quest-bar / execution-panel-floor-content has no bounding box',
      );
    }

    const [actionBarBorders, postQuestBarBorders] = await Promise.all([
      actionBar.evaluate((element) => ({
        top: globalThis.getComputedStyle(element).borderTopWidth,
        bottom: globalThis.getComputedStyle(element).borderBottomWidth,
      })),
      postQuestBar.evaluate((element) => ({
        top: globalThis.getComputedStyle(element).borderTopWidth,
        bottom: globalThis.getComputedStyle(element).borderBottomWidth,
      })),
    ]);

    return {
      stacksCleanly: Math.abs(actionBox.y + actionBox.height - postBox.y) <= ADJACENCY_EPSILON_PX,
      actionBarHasSingleTopHairline:
        actionBarBorders.top === EXPECTED_BORDER_WIDTH &&
        actionBarBorders.bottom === EXPECTED_NO_BORDER_WIDTH,
      postQuestBarHasSingleTopHairline:
        postQuestBarBorders.top === EXPECTED_BORDER_WIDTH &&
        postQuestBarBorders.bottom === EXPECTED_NO_BORDER_WIDTH,
      floorMeetsMinHeight: floorBox.height >= EXECUTION_FLOOR_MIN_HEIGHT_PX,
    };
  };

  return {
    seedAndOpen,
    reopen,
    pressFollowup,
    switchToExecutionTab,
    switchToFollowupTab,
    tabOrder,
    hasExactlyOneFollowupTab,
    isTabActive,
    postQuestBarVisible,
    actionBarVisible,
    followupButtonVisible,
    mergeButtonVisible,
    barsStackCleanly,
  };
};
