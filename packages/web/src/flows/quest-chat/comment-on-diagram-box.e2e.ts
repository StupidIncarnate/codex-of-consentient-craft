import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import {
  commentBoxHarness,
  COMMENT_BOX_FLOW_ID,
  COMMENT_BOX_ISO_CREATED_AT,
  COMMENT_BOX_JSON_HOSTILE_TEXT,
  COMMENT_BOX_LONG_TOKEN_TEXT,
  COMMENT_BOX_MARKUP_TEXT,
  COMMENT_BOX_NEWLINE_TEXT,
  COMMENT_BOX_NODE_ID,
  COMMENT_BOX_NODE_LABEL,
  COMMENT_BOX_OBSERVABLE_ID,
  COMMENT_BOX_OVERSIZED_TEXT,
  COMMENT_BOX_SECOND_NODE_ID,
  COMMENT_BOX_SECOND_OBSERVABLE_ID,
} from '../../../test/harnesses/comment-box/comment-box.harness';

const GUILD_PATH = '/tmp/dm-e2e-comment-on-diagram-box';
const PANEL_TIMEOUT = 5_000;
const REVIEW_FLOWS = 'review_flows';
const APPROVED = 'approved';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Leave a Comment on a Diagram Box', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  // #diagram-box-rendered — which box kinds carry the compose affordance at all.
  test('VALID: {review_flows quest with a resumable session} => every FLOW_NODE and FLOW_OBSERVABLE_NODE card carries one COMMENT_BUTTON and the portal card carries none', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Boxes Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    // Per-card counts, not a canvas total: a card rendering two buttons — or the assertion cards
    // sharing one button between them — must fail as loudly as a card rendering none.
    expect(await comments.everyFlowNodeHasOneCommentButton()).toBe(true);
    expect(await comments.everyObservableNodeHasOneCommentButton()).toBe(true);
    // A portal is a stand-in for a node that lives in ANOTHER flow, so a comment left on it would
    // strand the feedback on an artifact instead of the real box.
    expect(await comments.portalCardHasNoCommentButton()).toBe(true);
  });

  // #no-comment-controls terminal, status branch of #comment-controls-allowed.
  test('EMPTY: {status approved with a resumable session} => the flow diagram renders zero COMMENT_BUTTON elements', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Approved Guild',
      status: APPROVED,
      withSession: true,
    });

    await expect(page.getByTestId('COMMENT_BUTTON')).toHaveCount(0);
    // The canvas itself still painted, so the zero above is the compose gate closing rather than a
    // diagram that never rendered.
    await expect(comments.nodeCard()).toBeVisible();
    await expect(comments.observableCard()).toBeVisible();
  });

  // #no-comment-controls terminal, session branch of #comment-controls-allowed.
  test('EMPTY: {status review_flows with no work item carrying a sessionId} => zero COMMENT_BUTTON elements and no COMMENT_QUEUE_BAR even with a queue already in localStorage', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Sessionless Guild',
      status: REVIEW_FLOWS,
      withSession: false,
      preQueuedText: 'queued while the session still existed',
    });

    await expect(page.getByTestId('COMMENT_BUTTON')).toHaveCount(0);
    await expect(page.getByTestId('COMMENT_QUEUE_BAR')).toHaveCount(0);
    await expect(comments.nodeCard()).toBeVisible();
    // The queue really is sitting in localStorage — the bar is hidden by the session gate, not by an
    // empty queue, which is the whole point of gating the bar independently of its contents.
    expect(await comments.hasQueueKey()).toBe(true);
    expect(await comments.readQueue()).toStrictEqual([
      {
        flowId: COMMENT_BOX_FLOW_ID,
        nodeId: COMMENT_BOX_NODE_ID,
        text: 'queued while the session still existed',
        createdAt: COMMENT_BOX_ISO_CREATED_AT,
      },
    ]);
  });

  // #click-comment-icon into #open-editor-popover.
  test('VALID: {click COMMENT_BUTTON on a FLOW_NODE} => the editor popover opens and the card is left unselected with no detail panel', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Popover Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await expect(page.getByTestId('FLOW_NODE_DETAIL_PANEL')).toHaveCount(0);

    await comments.openCommentPopoverOnNode();

    await expect(page.getByTestId('COMMENT_POPOVER')).toBeVisible();
    await expect(page.getByTestId('COMMENT_TEXTAREA')).toHaveAttribute('rows', '2');
    await expect(page.getByTestId('COMMENT_QUEUE_BUTTON')).toBeVisible();
    await expect(page.getByTestId('COMMENT_CANCEL_BUTTON')).toBeVisible();
    // Without stopPropagation the card's own click handler fires too, and the detail panel it opens
    // covers the popover the same click just opened.
    await expect(page.getByTestId('FLOW_NODE_DETAIL_PANEL')).toHaveCount(0);
    await expect(page.locator('[data-testid="FLOW_NODE"][data-selected="true"]')).toHaveCount(0);
  });

  // #check-card-click-still-opens-detail-panel — stopping propagation on the button must not cost
  // the card its own click everywhere else.
  test('VALID: {click the FLOW_NODE card outside COMMENT_BUTTON} => the detail panel opens and the card is marked selected', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Card Click Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.clickNodeCardBody();

    const panel = page.getByTestId('FLOW_NODE_DETAIL_PANEL');
    await expect(panel).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(panel).toContainText(COMMENT_BOX_NODE_LABEL);
    await expect(comments.nodeCard()).toHaveAttribute('data-selected', 'true');
    await expect(page.getByTestId('COMMENT_POPOVER')).toHaveCount(0);
  });

  // #check-comment-button-does-not-drag-node — the nodrag/nopan opt-out only exists in a real
  // browser, so this is the one layer that can prove it.
  test('VALID: {press COMMENT_BUTTON and wobble the pointer before releasing} => the card stays at its canvas position and the popover still opens', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Drag Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    expect(await comments.commentButtonWobbleLeavesCardInPlace()).toBe(true);
    await expect(page.getByTestId('COMMENT_POPOVER')).toBeVisible();
  });

  // #insert-newline branch of #submit-key-pressed, looping back through #type-comment-text.
  test('VALID: {Shift+Enter between five lines} => newlines are inserted, the popover stays open, the textarea grows and nothing is queued', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Newline Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.captureTextareaHeight();
    await comments.composeMultiLineComment({ lines: ['one', 'two', 'three', 'four', 'five'] });

    await expect(page.getByTestId('COMMENT_TEXTAREA')).toHaveValue('one\ntwo\nthree\nfour\nfive');
    await expect(page.getByTestId('COMMENT_POPOVER')).toBeVisible();
    expect(await comments.textareaGrewSinceCapture()).toBe(true);
    // Shift+Enter is the newline key, never the submit key — five presses must leave the queue empty.
    expect(await comments.hasQueueKey()).toBe(false);
  });

  // #comment-text-empty, the "empty — nothing queued" branch looping back to #type-comment-text.
  test('EMPTY: {Enter on whitespace-only text} => nothing is queued, the editor stays open and no COMMENT_QUEUE_BAR renders', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Whitespace Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.typeComment({ text: '   ' });
    await comments.pressEnter();

    await expect(page.getByTestId('COMMENT_POPOVER')).toBeVisible();
    await expect(page.getByTestId('COMMENT_TEXTAREA')).toHaveValue('   ');
    await expect(page.getByTestId('COMMENT_QUEUE_BAR')).toHaveCount(0);
    expect(await comments.hasQueueKey()).toBe(false);
  });

  // #write-queue-entry into the #comment-queued terminal, via the Enter key.
  test('VALID: {Enter with text on a FLOW_NODE} => the entry is written to localStorage, the popover switches to the queued view and the bar reads 1 COMMENT QUEUED', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Queue Node Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.typeComment({ text: 'this step is wrong' });
    await comments.pressEnter();

    expect(await comments.readQueue()).toStrictEqual([
      {
        flowId: COMMENT_BOX_FLOW_ID,
        nodeId: COMMENT_BOX_NODE_ID,
        text: 'this step is wrong',
        createdAt: COMMENT_BOX_ISO_CREATED_AT,
      },
    ]);
    await expect(page.getByTestId('COMMENT_QUEUED_TEXT')).toHaveText('this step is wrong');
    await expect(page.getByTestId('COMMENT_TEXTAREA')).toHaveCount(0);
    await expect(page.getByTestId('COMMENT_EDIT_BUTTON')).toBeVisible();
    await expect(page.getByTestId('COMMENT_DELETE_BUTTON')).toBeVisible();
    await expect(page.getByTestId('COMMENT_QUEUE_COUNT')).toHaveText('1 COMMENT QUEUED');
  });

  // #comment-queued terminal, read-back half: the queued view has to SHOW the note it stored.
  test('VALID: {queue a comment whose text is one unbroken token wider than the popover} => the queued row wraps and stays inside COMMENT_POPOVER', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Long Token Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.typeComment({ text: COMMENT_BOX_LONG_TOKEN_TEXT });
    await comments.pressEnter();

    // The whole note reaches the DOM either way, so asserting the text FIRST separates "it was
    // stored and rendered" from "it is actually readable inside the dropdown".
    await expect(page.getByTestId('COMMENT_QUEUED_TEXT')).toHaveText(COMMENT_BOX_LONG_TOKEN_TEXT);
    // Real layout: pre-wrap alone leaves the token unbreakable, so the row paints past the
    // fixed-width dropdown and the rest of the note is clipped off-panel.
    expect(await comments.queuedTextFitsInsidePopover()).toBe(true);
  });

  // #write-queue-entry again, this time proving the assertion card anchors to its own observableId.
  test('VALID: {Queue button with text on a FLOW_OBSERVABLE_NODE} => the stored entry carries observableId alongside flowId and nodeId', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Queue Observable Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnObservable();
    await comments.typeComment({ text: 'this assertion is wrong' });
    await comments.clickQueueButton();

    // nodeId rides along on an observable comment so the anchor stays findable from its parent node.
    expect(await comments.readQueue()).toStrictEqual([
      {
        flowId: COMMENT_BOX_FLOW_ID,
        nodeId: COMMENT_BOX_NODE_ID,
        observableId: COMMENT_BOX_OBSERVABLE_ID,
        text: 'this assertion is wrong',
        createdAt: COMMENT_BOX_ISO_CREATED_AT,
      },
    ]);
    await expect(page.getByTestId('COMMENT_QUEUED_TEXT')).toHaveText('this assertion is wrong');
    await expect(page.getByTestId('COMMENT_QUEUE_COUNT')).toHaveText('1 COMMENT QUEUED');
  });

  // #popover-closed terminal — cancel with nothing previously queued on this box.
  test('VALID: {Cancel with nothing previously queued} => the popover closes and no queue key is written', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Cancel Close Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.typeComment({ text: 'abandoned text' });
    await comments.clickCancelButton();

    await expect(page.getByTestId('COMMENT_POPOVER')).toHaveCount(0);
    await expect(page.getByTestId('COMMENT_QUEUE_BAR')).toHaveCount(0);
    expect(await comments.hasQueueKey()).toBe(false);
  });

  // #open-queued-view -> #click-edit -> #restore-queued-view terminal: the reopen, the prefill and
  // the cancel that discards the edit session without touching the queue.
  test('VALID: {reopen a queued box, Edit, change the text, Cancel} => the queued view shows the original text and the stored entry is byte-identical', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Cancel Restore Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.typeComment({ text: 'original text' });
    await comments.pressEnter();
    await comments.captureQueueSnapshot();

    await comments.closeCommentPopoverOnNode();
    await comments.openCommentPopoverOnNode();

    // Reopening a box that already carries a queued comment shows that comment, not a blank editor.
    await expect(page.getByTestId('COMMENT_QUEUED_TEXT')).toHaveText('original text');
    await expect(page.getByTestId('COMMENT_TEXTAREA')).toHaveCount(0);

    await comments.clickEditButton();
    await expect(page.getByTestId('COMMENT_TEXTAREA')).toHaveValue('original text');
    await comments.replaceComment({ text: 'original text plus edits' });
    await expect(page.getByTestId('COMMENT_TEXTAREA')).toHaveValue('original text plus edits');

    await comments.clickCancelButton();

    await expect(page.getByTestId('COMMENT_QUEUED_TEXT')).toHaveText('original text');
    await expect(page.getByTestId('COMMENT_TEXTAREA')).toHaveCount(0);
    await expect(page.getByTestId('COMMENT_QUEUE_COUNT')).toHaveText('1 COMMENT QUEUED');
    // Byte-identical covers text AND createdAt: cancel writes nothing, so it can never rescue an
    // entry from the 7 day sweep the way a real re-queue does.
    expect(await comments.queueUnchangedSinceCapture()).toBe(true);
  });

  // #click-edit looping back through #open-editor-popover into #write-queue-entry — a real re-queue,
  // unlike the cancel above, resets createdAt to the edit time.
  test('VALID: {Edit a queued comment then re-queue it} => the stored text is replaced and createdAt is later than the original', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Edit Requeue Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.typeComment({ text: 'first draft' });
    await comments.pressEnter();
    await comments.captureQueueSnapshot();

    await comments.clickEditButton();
    await comments.replaceComment({ text: 'second draft' });
    await comments.pressEnter();

    expect(await comments.readQueue()).toStrictEqual([
      {
        flowId: COMMENT_BOX_FLOW_ID,
        nodeId: COMMENT_BOX_NODE_ID,
        text: 'second draft',
        createdAt: COMMENT_BOX_ISO_CREATED_AT,
      },
    ]);
    expect(await comments.queueCreatedAtBumpedSinceCapture()).toBe(true);
    await expect(page.getByTestId('COMMENT_QUEUED_TEXT')).toHaveText('second draft');
    // Re-queueing replaces the entry on that box rather than appending a second one.
    await expect(page.getByTestId('COMMENT_QUEUE_COUNT')).toHaveText('1 COMMENT QUEUED');
  });

  // #click-delete -> #queued-comment-deleted terminal.
  test('VALID: {Delete the only queued comment} => the entry and its storage key are gone, the popover closes and COMMENT_QUEUE_BAR is absent', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Delete Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.typeComment({ text: 'delete me' });
    await comments.pressEnter();
    await expect(page.getByTestId('COMMENT_QUEUE_COUNT')).toHaveText('1 COMMENT QUEUED');

    await comments.clickDeleteButton();

    await expect(page.getByTestId('COMMENT_POPOVER')).toHaveCount(0);
    await expect(page.getByTestId('COMMENT_QUEUE_BAR')).toHaveCount(0);
    expect(await comments.readQueue()).toStrictEqual([]);
    // The key is removed outright rather than left holding an empty array, so nothing accumulates.
    expect(await comments.hasQueueKey()).toBe(false);
  });

  // #check-delete-removes-entry, the multi-entry half every other test in this file leaves
  // unproven: with only ever one box queued at a time, `remove` filtering one anchor out of the
  // array is indistinguishable from `remove` wiping the array outright. Two DIFFERENT box kinds
  // (a FLOW_NODE and a FLOW_OBSERVABLE_NODE on a different node) also proves "the right box, not
  // just the first box" — reopening either one must show its own text, never the other's.
  test('VALID: {two different boxes each carry their own queued comment} => each box shows only its own text, and deleting one leaves the other entry, its COMMENT_QUEUE_BAR and its count intact', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Multi Box Guild',
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

    expect(await comments.readQueue()).toStrictEqual([
      {
        flowId: COMMENT_BOX_FLOW_ID,
        nodeId: COMMENT_BOX_NODE_ID,
        text: 'node box note',
        createdAt: COMMENT_BOX_ISO_CREATED_AT,
      },
      {
        flowId: COMMENT_BOX_FLOW_ID,
        nodeId: COMMENT_BOX_SECOND_NODE_ID,
        observableId: COMMENT_BOX_SECOND_OBSERVABLE_ID,
        text: 'second observable note',
        createdAt: COMMENT_BOX_ISO_CREATED_AT,
      },
    ]);
    await expect(page.getByTestId('COMMENT_QUEUE_COUNT')).toHaveText('2 COMMENTS QUEUED');
    // The second box's popover is still open from queueing above, showing only its own text.
    await expect(page.getByTestId('COMMENT_QUEUED_TEXT')).toHaveText('second observable note');
    await comments.closeCommentPopoverOnSecondObservable();

    // Reopening the FIRST box shows ITS text, not the second box's.
    await comments.openCommentPopoverOnNode();
    await expect(page.getByTestId('COMMENT_QUEUED_TEXT')).toHaveText('node box note');

    await comments.clickDeleteButton();

    // The survivor is untouched: same text, same anchor, same createdAt — filtered OUT of the
    // array by anchor, not wiped alongside it.
    expect(await comments.readQueue()).toStrictEqual([
      {
        flowId: COMMENT_BOX_FLOW_ID,
        nodeId: COMMENT_BOX_SECOND_NODE_ID,
        observableId: COMMENT_BOX_SECOND_OBSERVABLE_ID,
        text: 'second observable note',
        createdAt: COMMENT_BOX_ISO_CREATED_AT,
      },
    ]);
    await expect(page.getByTestId('COMMENT_QUEUE_BAR')).toBeVisible();
    await expect(page.getByTestId('COMMENT_QUEUE_COUNT')).toHaveText('1 COMMENT QUEUED');
  });

  // #write-queue-entry with a hostile-input class none of the tests above exercise: an authored
  // note that spans multiple lines. typeComment cannot type this directly (a bare \n in the string
  // types as an unshifted Enter keypress and would submit after "first line"), so this composes
  // through Shift+Enter and reads the result back with the one method that does not
  // whitespace-normalize — proving the newline survives the JSON round trip into localStorage
  // rather than collapsing into a space.
  test('VALID: {queue a comment spanning two lines} => the stored entry and the queued-view text both keep the real newline character', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Newline Queue Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.composeMultiLineComment({ lines: COMMENT_BOX_NEWLINE_TEXT.split('\n') });
    await comments.clickQueueButton();

    expect(await comments.readQueue()).toStrictEqual([
      {
        flowId: COMMENT_BOX_FLOW_ID,
        nodeId: COMMENT_BOX_NODE_ID,
        text: COMMENT_BOX_NEWLINE_TEXT,
        createdAt: COMMENT_BOX_ISO_CREATED_AT,
      },
    ]);
    expect(await comments.queuedTextExact()).toBe(COMMENT_BOX_NEWLINE_TEXT);
  });

  // #write-queue-entry with the other hostile-input class missing from this file: text that reads
  // as markup. {queued.text} is a React text node, never dangerouslySetInnerHTML, so this proves
  // the queue stores and repaints the note inert rather than stripped or interpreted — and stands
  // as a regression guard if a future change ever swapped that text node for raw HTML.
  test('VALID: {queue a comment that reads as markup} => the stored entry and the queued-view text both keep it as inert literal text', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Markup Queue Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.typeComment({ text: COMMENT_BOX_MARKUP_TEXT });
    await comments.pressEnter();

    expect(await comments.readQueue()).toStrictEqual([
      {
        flowId: COMMENT_BOX_FLOW_ID,
        nodeId: COMMENT_BOX_NODE_ID,
        text: COMMENT_BOX_MARKUP_TEXT,
        createdAt: COMMENT_BOX_ISO_CREATED_AT,
      },
    ]);
    expect(await comments.queuedTextExact()).toBe(COMMENT_BOX_MARKUP_TEXT);
  });

  // #write-queue-entry with the oversized hostile-input class: text far longer than any UI element
  // here was sized for. Nothing in this feature caps comment length, so this proves the absence of
  // a cap does not mean bulk text silently truncates or corrupts on the way through the popover and
  // into localStorage. Uses replaceComment (fill) rather than typeComment (keyboard) — typing this
  // many characters one keystroke at a time would make the test needlessly slow without proving
  // anything typeComment's own coverage elsewhere does not already prove about the keyboard path.
  test('EDGE: {queue a comment far longer than any UI here was designed for} => the stored entry and the queued-view text both keep it whole, byte-identical', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Oversized Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.replaceComment({ text: COMMENT_BOX_OVERSIZED_TEXT });
    await comments.pressEnter();

    expect(await comments.readQueue()).toStrictEqual([
      {
        flowId: COMMENT_BOX_FLOW_ID,
        nodeId: COMMENT_BOX_NODE_ID,
        text: COMMENT_BOX_OVERSIZED_TEXT,
        createdAt: COMMENT_BOX_ISO_CREATED_AT,
      },
    ]);
    expect(await comments.queuedTextExact()).toBe(COMMENT_BOX_OVERSIZED_TEXT);
  });

  // #write-queue-entry with the JSON-hostile input class: text containing quotes, a backslash and
  // brace characters — exactly what a hand-rolled (string-concatenation) serializer would mangle.
  // localStorage here uses JSON.stringify/JSON.parse, so this proves the real round trip survives
  // byte-identical rather than corrupting or truncating at the first quote or backslash.
  test('VALID: {queue a comment containing quotes, a backslash and braces} => the stored entry and the queued-view text both keep it byte-identical through the JSON round trip', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment JSON Hostile Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.typeComment({ text: COMMENT_BOX_JSON_HOSTILE_TEXT });
    await comments.pressEnter();

    expect(await comments.readQueue()).toStrictEqual([
      {
        flowId: COMMENT_BOX_FLOW_ID,
        nodeId: COMMENT_BOX_NODE_ID,
        text: COMMENT_BOX_JSON_HOSTILE_TEXT,
        createdAt: COMMENT_BOX_ISO_CREATED_AT,
      },
    ]);
    expect(await comments.queuedTextExact()).toBe(COMMENT_BOX_JSON_HOSTILE_TEXT);
  });

  // #write-queue-entry with the duplicate hostile-input class: the SAME text queued on two
  // DIFFERENT boxes. Storage keys on the anchor (flowId+nodeId[+observableId]), never on content —
  // isSameCommentAnchorGuard only compares the anchor — so this must NOT collapse into one entry.
  // A hypothetical content-based dedup bug (or a Set/Map keyed on text) would be caught here.
  test('VALID: {queue the identical text on two different boxes} => both entries persist independently, neither collapsed by the other', async ({
    page,
    request,
  }) => {
    const comments = commentBoxHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await comments.seedAndOpen({
      guildName: 'Comment Duplicate Text Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await comments.openCommentPopoverOnNode();
    await comments.typeComment({ text: 'please double check this' });
    await comments.pressEnter();
    await comments.closeCommentPopoverOnNode();

    await comments.openCommentPopoverOnSecondObservable();
    await comments.typeComment({ text: 'please double check this' });
    await comments.pressEnter();

    expect(await comments.readQueue()).toStrictEqual([
      {
        flowId: COMMENT_BOX_FLOW_ID,
        nodeId: COMMENT_BOX_NODE_ID,
        text: 'please double check this',
        createdAt: COMMENT_BOX_ISO_CREATED_AT,
      },
      {
        flowId: COMMENT_BOX_FLOW_ID,
        nodeId: COMMENT_BOX_SECOND_NODE_ID,
        observableId: COMMENT_BOX_SECOND_OBSERVABLE_ID,
        text: 'please double check this',
        createdAt: COMMENT_BOX_ISO_CREATED_AT,
      },
    ]);
    await expect(page.getByTestId('COMMENT_QUEUE_COUNT')).toHaveText('2 COMMENTS QUEUED');
  });
});
