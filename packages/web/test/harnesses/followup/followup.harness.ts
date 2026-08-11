/**
 * PURPOSE: Seeds a quest at a follow-up-relevant status, opens the quest execution view, and
 * exposes the FOLLOW-UP tab reads that only a real attached browser tab can settle — painted
 * geometry (jsdom has no layout engine, so every width/border/adjacency check reads 0 or passes
 * vacuously there) and live transcript state across a real reload. It also owns the tavernkeeper
 * session JSONL, because the FOLLOW-UP transcript is rendered from that file and the fake Claude
 * CLI writes it only once at exit — a spec observing a half-written transcript mid-run has to
 * write the turns itself, at controlled timestamps, or it cannot pin an order at all. It also owns
 * the one precondition no HTTP route offers: moving a quest's status out from under a tab that is
 * already open, which is the only way a browser reaches the follow-up route's rejection at all.
 *
 * USAGE:
 * const followup = followupHarness({ page, request, guildPath });
 * const seeded = await followup.seedAndOpen({ guildName: 'Followup Guild', status: 'blocked' });
 * await followup.pressFollowup();
 * expect(await followup.tabOrder()).toStrictEqual([
 *   'execution-panel-tab-followup', 'execution-panel-tab-execution', 'execution-panel-tab-spec',
 * ]);
 */
import { appendFileSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';

import type { APIRequestContext, Page } from '@playwright/test';

import {
  AssistantTextStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import type { ContentText, FilePath, QuestId, UrlSlug } from '@dungeonmaster/shared/contracts';

import type { TestId } from '../../../src/contracts/test-id/test-id-contract';
import { guildHarness } from '../guild/guild.harness';
import { navigationHarness } from '../navigation/navigation.harness';
import { questHarness } from '../quest/quest.harness';
import { sessionHarness } from '../session/session.harness';

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
// The label ChatMessageWidget paints above a `role: 'system'` entry's content. It is what
// separates a failure the user can read from an ordinary transcript turn, so an error read that
// did not key on it would count the user's own message as an error and never notice a missing one.
const ERROR_ENTRY_LABEL = 'ERROR';

// Every stream line this harness writes carries an EXPLICIT uuid and timestamp.
// - timestamp: the FOLLOW-UP transcript is ordered by `sortChatEntriesByTimestampTransformer`,
//   so two lines left on a stub's shared default sort as a tie and no ordering assertion over
//   them can fail.
// - uuid: the web upserts chat entries keyed by uuid, so a line appended more than once collapses
//   to one rendered message. `streamAssistantTurn` is called from a poll that re-appends until the
//   quest-driven tail attaches (it tails from `end`, so anything written before it attaches is
//   never emitted), and without the stable uuid each retry would render another copy.
const SESSION_BASE_EPOCH_ISO = '2026-08-09T12:00:00.000Z';
const SEEDED_TURN_INTERVAL_MS = 1000;
// Streamed turns sort after every seeded turn, which is what makes "the reply arrived after the
// transcript already on disk" the order an assertion can pin.
const STREAMED_TURN_BASE_OFFSET_MS = 60_000;
const STREAMED_TURN_INTERVAL_MS = 1000;

// Element-type extraction via literal `[0]` rather than `[number]` — both resolve to the same
// array element type, but `[number]` writes the bare `number` keyword this repo's ban-primitives
// rule flags on sight, even inside an indexed-access position.
type WorkItemInput = Parameters<
  ReturnType<typeof questHarness>['writeQuestFile']
>[0]['workItems'][0];

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
  reloadQuestPage: () => Promise<void>;
  setQuestStatusOnDisk: (params: { questFilePath: string; status: string }) => void;
  pressFollowup: () => Promise<void>;
  sendFollowupMessage: (params: { text: string }) => Promise<void>;
  errorMessages: () => Promise<ContentText[]>;
  seedTavernkeeperSession: (params: {
    sessionId: string;
    turns: readonly { role: 'user' | 'assistant'; text: string }[];
  }) => void;
  streamAssistantTurn: (params: { sessionId: string; text: string; order: number }) => void;
  transcriptHasText: (params: { text: string }) => Promise<boolean>;
  transcriptOrder: (params: { candidates: readonly string[] }) => Promise<ContentText[]>;
  isTurnInFlight: () => Promise<boolean>;
  switchToExecutionTab: () => Promise<void>;
  switchToFollowupTab: () => Promise<void>;
  tabOrder: () => Promise<TestId[]>;
  hasAnyFollowupTab: () => Promise<boolean>;
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
    // QUEST_CHAT going visible only proves the ROUTE mounted; the execution panel paints a frame
    // later, once the seeded quest arrives. Every status this harness is called with is an
    // execution-phase one, so the panel is always the landing surface — and the boolean reads
    // below (postQuestBarVisible / actionBarVisible / followupButtonVisible / mergeButtonVisible)
    // are Playwright's NON-retrying isVisible(), which answers `false` for a surface that simply
    // has not painted yet. Settling here is what makes those reads a claim about gating rather
    // than about arrival order.
    await page
      .getByTestId('execution-panel-widget')
      .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

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

  // A REAL browser reload, not a tab switch: the FOLLOW-UP tab's open state and the whole chat
  // transcript live in component state, so only a reload proves the turns come back from the
  // session transcript on disk rather than from a component that never unmounted.
  const reloadQuestPage = async (): Promise<void> => {
    await page.reload();
    await page.getByTestId('QUEST_CHAT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
  };

  // Rewrites ONLY the status field of an already-written quest.json, then appends the same
  // quest-modified outbox line questPersistBroker writes in production so the running server
  // re-reads the file and the browser learns the new status. This is how a FOLLOW-UP tab is made
  // STALE: it was opened while the quest was still follow-up-chatable, and the quest moved on
  // underneath it. It is never the mutation under test — the message that meets the moved status
  // is always typed into the real composer.
  const setQuestStatusOnDisk = ({
    questFilePath,
    status,
  }: {
    questFilePath: string;
    status: string;
  }): void => {
    const questJson = JSON.parse(readFileSync(questFilePath, 'utf8')) as Record<
      PropertyKey,
      unknown
    >;
    questJson.status = status;
    writeFileSync(questFilePath, JSON.stringify(questJson, null, JSON_INDENT));

    // questFilePath shape: <DUNGEONMASTER_HOME>/guilds/<guildId>/quests/<questFolder>/quest.json —
    // four levels up is DUNGEONMASTER_HOME, where the event outbox lives.
    const dungeonmasterHome = dirname(dirname(dirname(dirname(questFilePath))));
    appendFileSync(
      `${dungeonmasterHome}/event-outbox.jsonl`,
      `${JSON.stringify({ questId: String(questJson.id), timestamp: new Date().toISOString() })}\n`,
    );
  };

  const pressFollowup = async (): Promise<void> => {
    await page.getByTestId('EXECUTION_FOLLOWUP_BUTTON').click();
    await page
      .getByTestId('execution-panel-tab-followup')
      .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
  };

  const sendFollowupMessage = async ({ text }: { text: string }): Promise<void> => {
    await page.getByTestId('CHAT_INPUT').fill(text);
    await page.getByTestId('SEND_BUTTON').click();
  };

  // Writes the tavernkeeper's session JSONL — the file the FOLLOW-UP transcript is rendered from,
  // both on replay and while a turn streams. Callers seed it BEFORE navigating, because
  // subscribe-quest replays it as soon as the browser binds the quest, and because the quest-driven
  // watcher tails it from `end` (a file that does not exist yet has no `end` to tail from).
  const seedTavernkeeperSession = ({
    sessionId,
    turns,
  }: {
    sessionId: string;
    turns: readonly { role: 'user' | 'assistant'; text: string }[];
  }): void => {
    const sessions = sessionHarness({ guildPath });
    const baseEpoch = new Date(SESSION_BASE_EPOCH_ISO).getTime();
    sessions.createMultiEntrySessionFile({
      sessionId,
      lines: turns.map((turn, index) =>
        JSON.stringify({
          ...(turn.role === 'user'
            ? UserTextStringStreamLineStub({ message: { role: 'user', content: turn.text } })
            : AssistantTextStreamLineStub({
                message: { role: 'assistant', content: [{ type: 'text', text: turn.text }] },
              })),
          uuid: `${sessionId}-seed-${String(index)}`,
          timestamp: new Date(baseEpoch + index * SEEDED_TURN_INTERVAL_MS).toISOString(),
        }),
      ),
    });
  };

  // Appends ONE assistant turn to the live tavernkeeper session JSONL. This is the fake Claude
  // CLI's transcript-write boundary: the real CLI writes its transcript progressively as the reply
  // is produced, while `test/harnesses/claude-mock/bin/claude` writes the whole file once at exit —
  // so a spec that needs a partially-written transcript mid-run has to write the lines itself. The
  // held-back queue response keeps the child alive around it, so the run really is still going.
  const streamAssistantTurn = ({
    sessionId,
    text,
    order,
  }: {
    sessionId: string;
    text: string;
    order: number;
  }): void => {
    const sessions = sessionHarness({ guildPath });
    const streamedAt = new Date(
      new Date(SESSION_BASE_EPOCH_ISO).getTime() +
        STREAMED_TURN_BASE_OFFSET_MS +
        order * STREAMED_TURN_INTERVAL_MS,
    ).toISOString();
    sessions.appendMainSessionLine({
      sessionId,
      line: JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: { role: 'assistant', content: [{ type: 'text', text }] },
        }),
        uuid: `${sessionId}-stream-${String(order)}`,
        timestamp: streamedAt,
      }),
    });
  };

  // Every transcript read is scoped INSIDE the FOLLOW-UP tab's own CHAT_PANEL. Unscoped, a message
  // rendered on an expanded execution row would answer "is it in the transcript" with yes, and the
  // absence half of a before/after pair would be reading a surface the observable never named.
  const transcriptHasText = async ({ text }: { text: string }): Promise<boolean> =>
    (await page
      .getByTestId('CHAT_PANEL')
      .getByTestId('CHAT_MESSAGE')
      .filter({ hasText: text })
      .count()) > 0;

  // Every failure the FOLLOW-UP tab is showing, as the EXACT string its content node carries —
  // scoped inside the tab's own CHAT_PANEL like every other transcript read here. Returned as a
  // list rather than a boolean for two reasons: `transcriptHasText` matches a SUBSTRING, which
  // cannot tell "the exact 400 body text" from a longer string that merely contains it; and an
  // exact list makes "this failure and no other" assertable, so a tab naming the WRONG quest's
  // worktree fails instead of passing on a hasText hit.
  const errorMessages = async (): Promise<ContentText[]> => {
    const texts = await page
      .getByTestId('CHAT_PANEL')
      .getByTestId('CHAT_MESSAGE')
      .evaluateAll(
        (elements, label) =>
          elements
            .filter((element) => element.children[0]?.textContent === label)
            .map((element) => element.children[1]?.textContent ?? ''),
        ERROR_ENTRY_LABEL,
      );
    return texts as ContentText[];
  };

  // The candidates, in the order their messages appear in the transcript's DOM — the only read
  // that can fail on a REORDERED transcript. A set of independent `toBeVisible()` calls passes on
  // any permutation, and a candidate the transcript dropped drops out of this list entirely.
  const transcriptOrder = async ({
    candidates,
  }: {
    candidates: readonly string[];
  }): Promise<ContentText[]> => {
    const messages = await page
      .getByTestId('CHAT_PANEL')
      .getByTestId('CHAT_MESSAGE')
      .evaluateAll((elements) => elements.map((element) => element.textContent ?? ''));
    return candidates
      .map((candidate) => ({
        candidate,
        position: messages.findIndex((message) => message.includes(candidate)),
      }))
      .filter((entry) => entry.position >= 0)
      .sort((left, right) => left.position - right.position)
      .map((entry) => entry.candidate) as ContentText[];
  };

  // "The tavernkeeper is still running": the composer shows STOP and no longer offers SEND. Both
  // halves are read, because a surface rendering BOTH controls would satisfy either one alone.
  const isTurnInFlight = async (): Promise<boolean> => {
    const [stopVisible, sendVisible] = await Promise.all([
      page.getByTestId('STOP_BUTTON').isVisible(),
      page.getByTestId('SEND_BUTTON').isVisible(),
    ]);
    return stopVisible && !sendVisible;
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
        (testids) => testids.filter((id): id is NonNullable<typeof id> => id !== null) as TestId[],
      );

  const hasAnyFollowupTab = async (): Promise<boolean> =>
    (await page.getByTestId('execution-panel-tab-followup').count()) > 0;

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
    reloadQuestPage,
    setQuestStatusOnDisk,
    pressFollowup,
    sendFollowupMessage,
    errorMessages,
    seedTavernkeeperSession,
    streamAssistantTurn,
    transcriptHasText,
    transcriptOrder,
    isTurnInFlight,
    switchToExecutionTab,
    switchToFollowupTab,
    tabOrder,
    hasAnyFollowupTab,
    hasExactlyOneFollowupTab,
    isTabActive,
    postQuestBarVisible,
    actionBarVisible,
    followupButtonVisible,
    mergeButtonVisible,
    barsStackCleanly,
  };
};
