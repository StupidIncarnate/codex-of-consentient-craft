import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { commentBoxHarness } from '../../../test/harnesses/comment-box/comment-box.harness';

const GUILD_PATH = '/tmp/dm-e2e-comment-bubble-fill';
const REVIEW_FLOWS = 'review_flows';
// The seeded flow paints three FLOW_NODE cards and two FLOW_OBSERVABLE_NODE cards, so five boxes
// carry a bubble. Every count assertion below is against this total: "one filled" only means
// anything next to "four hollow".
const TOTAL_BUBBLES = 5;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Queued Comment Fills Its Box Bubble', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  // #exp-open-spec-diagram into #exp-bubble-right-aligned — the presentation half: where the bubble
  // sits on each card kind, and the box it paints.
  test('VALID: {diagram rendered} => every bubble is square at the shared small size and sits flush with its box right edge on both card kinds', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Bubble Alignment Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    // Real layout, not a style declaration: a bubble left in the card's normal flow sits at the
    // card's left edge and fails this by a hundred-plus pixels.
    expect(await comments.bubbleRightAlignedOnNodeCard()).toBe(true);
    expect(await comments.bubbleRightAlignedOnObservableCard()).toBe(true);
    expect(await comments.bubbleIsSquareAtSharedSmallSize()).toBe(true);
  });

  // #exp-click-comment-button into #exp-bubble-fills-on-open, with #obs-open-does-not-fill-siblings
  // as the other half: opening one box's popover must not mark any other box.
  test('VALID: {popover opened on an uncommented box} => only that box fills, before any text is typed', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Bubble Open Fill Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await expect(comments.filledBubbles()).toHaveCount(0);
    await expect(comments.hollowBubbles()).toHaveCount(TOTAL_BUBBLES);

    await comments.openCommentPopoverOnNode();

    await expect(page.getByTestId('COMMENT_TEXTAREA')).toHaveValue('');
    await expect(comments.nodeCardFilledBubble()).toHaveCount(1);
    await expect(comments.filledBubbles()).toHaveCount(1);
    await expect(comments.hollowBubbles()).toHaveCount(TOTAL_BUBBLES - 1);
  });

  // #exp-close-without-queueing into #exp-bubble-hollow-on-dismiss — nothing was stored, so nothing
  // is owed, so nothing may stay marked.
  test('VALID: {type text then Cancel without queueing} => the bubble goes back to hollow and no queue key is written', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Bubble Cancel Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.typeComment({ text: 'abandoned text' });
    await expect(comments.nodeCardFilledBubble()).toHaveCount(1);

    await comments.clickCancelButton();

    await expect(page.getByTestId('COMMENT_POPOVER')).toHaveCount(0);
    await expect(comments.nodeCardHollowBubble()).toHaveCount(1);
    await expect(comments.filledBubbles()).toHaveCount(0);
    expect(await comments.hasQueueKey()).toBe(false);
  });

  // #exp-type-and-queue into #exp-bubble-fills and on into #exp-scan-diagram: the fill survives the
  // popover closing with no reload, and the rest of the canvas stays clean.
  test('VALID: {queue a comment then close the popover} => that box stays filled, every other box stays hollow, and the queue still holds the entry', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Bubble Queue Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.typeComment({ text: 'this step is wrong' });
    await comments.pressEnter();
    await comments.closeCommentPopoverOnNode();

    await expect(page.getByTestId('COMMENT_POPOVER')).toHaveCount(0);
    await expect(comments.nodeCardFilledBubble()).toHaveCount(1);
    await expect(comments.filledBubbles()).toHaveCount(1);
    await expect(comments.hollowBubbles()).toHaveCount(TOTAL_BUBBLES - 1);
    // The fill must not have cost the queueing it reads from.
    await expect(page.getByTestId('COMMENT_QUEUE_COUNT')).toHaveText('1 COMMENT QUEUED');
  });

  // #exp-observable-boxes-too — an assertion card anchors on its own observableId, so it fills for
  // its own comment and NOT for one left on its parent node.
  test('VALID: {comment queued on an observable card} => that card fills while its parent node card stays hollow', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Bubble Observable Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnObservable();
    await comments.typeComment({ text: 'this assertion is wrong' });
    await comments.clickQueueButton();

    await expect(comments.observableCardFilledBubble()).toHaveCount(1);
    // The observable's own parent node card shares its nodeId — only the observableId separates the
    // two anchors, so a fill lookup that ignored it would mark this card too.
    await expect(comments.nodeCardHollowBubble()).toHaveCount(1);
    await expect(comments.filledBubbles()).toHaveCount(1);
  });

  // #exp-reload into #exp-fill-persists — the fill is derived from the stored queue, so it comes
  // back on the same two boxes after a full page load.
  test('VALID: {two boxes queued, then the quest route is reloaded} => both bubbles come back filled and the rest stay hollow', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Bubble Reload Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.typeComment({ text: 'node box note' });
    await comments.pressEnter();
    await comments.closeCommentPopoverOnNode();
    await comments.openCommentPopoverOnSecondObservable();
    await comments.typeComment({ text: 'second observable note' });
    await comments.pressEnter();
    await comments.closeCommentPopoverOnSecondObservable();

    await expect(comments.filledBubbles()).toHaveCount(2);

    await comments.reloadQuestRoute();

    await expect(comments.nodeCardFilledBubble()).toHaveCount(1);
    await expect(comments.secondObservableCardFilledBubble()).toHaveCount(1);
    await expect(comments.filledBubbles()).toHaveCount(2);
    await expect(comments.hollowBubbles()).toHaveCount(TOTAL_BUBBLES - 2);
  });

  // #exp-remove-comment into #exp-bubble-hollow-again — deleting one box's comment empties that
  // box's bubble and leaves every other commented box marked.
  test('VALID: {two boxes queued, one deleted} => the deleted box goes hollow and the other stays filled', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Bubble Delete Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.typeComment({ text: 'node box note' });
    await comments.pressEnter();
    await comments.closeCommentPopoverOnNode();
    await comments.openCommentPopoverOnSecondObservable();
    await comments.typeComment({ text: 'second observable note' });
    await comments.pressEnter();
    await comments.closeCommentPopoverOnSecondObservable();
    await expect(comments.filledBubbles()).toHaveCount(2);

    await comments.openCommentPopoverOnNode();
    await comments.clickDeleteButton();

    await expect(comments.nodeCardHollowBubble()).toHaveCount(1);
    await expect(comments.secondObservableCardFilledBubble()).toHaveCount(1);
    await expect(comments.filledBubbles()).toHaveCount(1);
    await expect(page.getByTestId('COMMENT_QUEUE_COUNT')).toHaveText('1 COMMENT QUEUED');
  });

  // #exp-all-hollow-after-send, CLEAR half (#obs-clear-hollows-every-bubble): discarding the queue
  // is the other way it empties, and filled means queued-and-unsent either way.
  test('VALID: {two boxes queued, then CLEAR discards the queue} => every bubble on the diagram returns to hollow', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Bubble Clear Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.typeComment({ text: 'node box note' });
    await comments.pressEnter();
    await comments.closeCommentPopoverOnNode();
    await comments.openCommentPopoverOnSecondObservable();
    await comments.typeComment({ text: 'second observable note' });
    await comments.pressEnter();
    await comments.closeCommentPopoverOnSecondObservable();
    await expect(comments.filledBubbles()).toHaveCount(2);

    await comments.clickClearButton();

    await expect(page.getByTestId('COMMENT_QUEUE_BAR')).toHaveCount(0);
    await expect(comments.filledBubbles()).toHaveCount(0);
    await expect(comments.hollowBubbles()).toHaveCount(TOTAL_BUBBLES);
  });
});
