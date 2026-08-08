import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { claudeMockHarness } from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import {
  commentQueueSendHarness,
  SEND_FLOW_ID,
  SEND_NODE_ALPHA_ID,
  SEND_NODE_BETA_ID,
  SEND_NODE_GAMMA_ID,
  SEND_OBSERVABLE_ID,
} from '../../../test/harnesses/comment-queue-send/comment-queue-send.harness';

const GUILD_PATH = '/tmp/dm-e2e-send-queued-comment-batch';
const SEND_TIMEOUT = 15_000;
// The queue bar's immediate-sibling-of-ACTION_BAR CSS pairing, expressed declaratively rather
// than via a browser-evaluated conditional — proves DOM adjacency without a JS if/&&.
const QUEUE_BAR_IMMEDIATELY_BEFORE_ACTION_BAR =
  '[data-testid="COMMENT_QUEUE_BAR"] + [data-testid="ACTION_BAR"]';
// Mirrors CommentQueueBarWidget's own NETWORK_ERROR_MESSAGE constant verbatim — the widget does
// not export it, so the literal is duplicated here the same way other e2e specs in this package
// duplicate implementation literals they must match exactly (see COMMENT_BOX_LONG_TOKEN_TEXT).
const NETWORK_ERROR_MESSAGE = 'Failed to send comments — check your connection and try again.';
// Mirrors staleAnchorNoticeTransformer's output for exactly one stale, non-observable anchor.
const STALE_BETA_NOTICE = `Dropped 1 queued comment — its box no longer exists on the quest: ${SEND_FLOW_ID} / ${SEND_NODE_BETA_ID}`;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Send the Queued Comment Batch (browser side)', () => {
  test.describe.configure({ timeout: 45_000 });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  // #check-no-bar-empty-queue
  test('VALID: {quest opened with an empty comment queue} => COMMENT_QUEUE_BAR is absent', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Empty Queue Guild' });

    await expect(send.queueBar()).toHaveCount(0);
  });

  // #check-bar-sits-above-action-bar
  test('VALID: {one comment queued} => COMMENT_QUEUE_BAR renders as the immediate previous sibling of ACTION_BAR inside QUEST_SPEC_PANEL', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Sibling Order Guild' });
    await send.queueCommentOn({
      card: send.nodeCard({ which: 'alpha' }),
      text: 'sibling order check',
    });

    await expect(send.queueBar()).toBeVisible();
    await expect(page.locator(QUEUE_BAR_IMMEDIATELY_BEFORE_ACTION_BAR)).toHaveCount(1);
  });

  // #check-bar-stays-visible-when-scrolled
  test('VALID: {DETAILS tab scrolled to its bottom} => COMMENT_QUEUE_BAR remains visible', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Scroll Visible Guild' });
    await send.queueCommentOn({
      card: send.nodeCard({ which: 'alpha' }),
      text: 'scroll visibility check',
    });
    await expect(send.queueBar()).toBeVisible();

    // The queue bar sits outside the tab content entirely, so neither switching tabs nor scrolling
    // the one that DOES scroll may take a pending batch off screen.
    await send.scrollDetailsTabToBottom();

    await expect(send.queueBar()).toBeVisible();
  });

  // #check-bar-count-text + #check-clear-and-send-buttons
  test('VALID: {three comments queued} => COMMENT_QUEUE_BAR reads 3 COMMENTS QUEUED and carries COMMENT_CLEAR_BUTTON and COMMENT_SEND_BUTTON', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Three Queued Guild' });
    await send.queueCommentOn({ card: send.nodeCard({ which: 'alpha' }), text: 'alpha note' });
    await send.queueCommentOn({ card: send.nodeCard({ which: 'beta' }), text: 'beta note' });
    await send.queueCommentOn({ card: send.nodeCard({ which: 'gamma' }), text: 'gamma note' });

    await expect(send.queueCount()).toHaveText('3 COMMENTS QUEUED');
    await expect(send.clearButton()).toBeVisible();
    await expect(send.sendButton()).toBeVisible();
  });

  // #check-clear-wipes-storage + #check-clear-sends-nothing
  test('VALID: {Clear with one queued comment} => the storage key is removed and zero POST requests reach the comments route', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Clear Wipes Guild' });
    await send.queueCommentOn({ card: send.nodeCard({ which: 'alpha' }), text: 'will be cleared' });
    expect(await send.hasQueueKey()).toBe(true);

    await send.clickClearButton();

    expect(await send.hasQueueKey()).toBe(false);
    await expect(send.queueBar()).toHaveCount(0);
    expect(send.hasCommentPostRequest()).toBe(false);
  });

  // #check-requeue-after-clear + #check-requeue-after-clear-recreates-key
  test('VALID: {queue a new comment after Clear} => COMMENT_QUEUE_BAR reads 1 COMMENT QUEUED again and the storage key is recreated holding only the new entry', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Requeue After Clear Guild' });
    await send.queueCommentOn({
      card: send.nodeCard({ which: 'alpha' }),
      text: 'the original note before clear',
    });
    await send.clickClearButton();
    expect(await send.hasQueueKey()).toBe(false);

    await send.queueCommentOn({
      card: send.nodeCard({ which: 'gamma' }),
      text: 'the note queued right after clear',
    });

    await expect(send.queueCount()).toHaveText('1 COMMENT QUEUED');
    expect(await send.hasQueueKey()).toBe(true);
    const [newEntry] = await send.readQueue();
    if (newEntry === undefined) {
      throw new Error('expected exactly one stored queue entry after requeuing');
    }
    expect([newEntry]).toStrictEqual([
      {
        flowId: SEND_FLOW_ID,
        nodeId: SEND_NODE_GAMMA_ID,
        text: 'the note queued right after clear',
        createdAt: newEntry.createdAt,
      },
    ]);
  });

  // #check-post-body-shape + #check-bar-hidden-after-send
  test('VALID: {Send a single node comment} => the POST body carries exactly flowId, nodeId, text and createdAt matching the stored entry, and COMMENT_QUEUE_BAR is absent afterward', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Post Body Shape Guild' });
    await send.queueCommentOn({
      card: send.nodeCard({ which: 'alpha' }),
      text: 'this step is wrong',
    });
    const [storedEntry] = await send.readQueue();
    if (storedEntry === undefined) {
      throw new Error('expected exactly one stored queue entry before sending');
    }

    send.queueClaudeResponse({ text: 'Reviewing the feedback now' });
    const postBodyPromise = send.waitForCommentsPostRequest();
    await send.clickSendButton();
    const postBody = await postBodyPromise;

    expect(postBody).toStrictEqual({
      comments: [
        {
          flowId: SEND_FLOW_ID,
          nodeId: SEND_NODE_ALPHA_ID,
          text: 'this step is wrong',
          createdAt: storedEntry.createdAt,
        },
      ],
    });
    await expect(send.queueBar()).toHaveCount(0, { timeout: SEND_TIMEOUT });
  });

  // #obs-send-hollows-every-bubble — a filled bubble means "queued and unsent". Send flushes the
  // whole queue to the quest, so nothing is queued afterwards and no box may stay marked. The
  // count is taken across the whole canvas: a rule that only cleared the box Send was clicked
  // from would leave the other two filled and fail here.
  test('VALID: {three queued comments flushed by Send} => every comment bubble on the diagram returns to hollow', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Send Hollows Bubbles Guild' });
    await send.queueCommentOn({ card: send.nodeCard({ which: 'alpha' }), text: 'alpha note' });
    await send.queueCommentOn({ card: send.nodeCard({ which: 'beta' }), text: 'beta note' });
    await send.queueCommentOn({ card: send.observableCard(), text: 'observable note' });

    await expect(send.filledBubbles()).toHaveCount(3);
    const hollowBeforeSend = await send.hollowBubbles().count();

    send.queueClaudeResponse({ text: 'Reviewing the feedback now' });
    await send.clickSendButton();

    await expect(send.queueBar()).toHaveCount(0, { timeout: SEND_TIMEOUT });
    await expect(send.filledBubbles()).toHaveCount(0);
    // Every bubble that was filled is now hollow — the boxes did not lose their buttons, they
    // lost their fill.
    await expect(send.hollowBubbles()).toHaveCount(hollowBeforeSend + 3);
    expect(await send.hasQueueKey()).toBe(false);
  });

  // #check-post-includes-observable-id + #check-post-omits-labels
  test('VALID: {Send a comment queued on the observable card} => the POST body carries observableId alongside flowId, nodeId, text and createdAt, and no label fields', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Post Observable Guild' });
    await send.queueCommentOn({
      card: send.observableCard(),
      text: 'this assertion is wrong',
    });
    const [storedEntry] = await send.readQueue();
    if (storedEntry === undefined) {
      throw new Error('expected exactly one stored queue entry before sending');
    }

    send.queueClaudeResponse({ text: 'Reviewing the assertion now' });
    const postBodyPromise = send.waitForCommentsPostRequest();
    await send.clickSendButton();
    const postBody = await postBodyPromise;

    // toStrictEqual on the whole posted entry proves the key set is EXACTLY
    // {flowId, nodeId, observableId, text, createdAt} — no flowName/nodeLabel/description leaked.
    expect(postBody).toStrictEqual({
      comments: [
        {
          flowId: SEND_FLOW_ID,
          nodeId: SEND_NODE_ALPHA_ID,
          observableId: SEND_OBSERVABLE_ID,
          text: 'this assertion is wrong',
          createdAt: storedEntry.createdAt,
        },
      ],
    });
  });

  // #check-network-failure-retains-queue + #check-network-failure-notifies
  test('ERROR: {POST rejects before any response arrives} => the storage key retains the entry, the app error notification shows, and COMMENT_QUEUE_BAR stays visible with its count unchanged', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Network Failure Guild' });
    await send.queueCommentOn({
      card: send.nodeCard({ which: 'alpha' }),
      text: 'never leaves the browser',
    });
    const beforeSend = await send.readQueue();

    await send.goOffline();
    await send.clickSendButton();

    await expect(page.getByText(NETWORK_ERROR_MESSAGE)).toBeVisible({ timeout: SEND_TIMEOUT });
    expect(await send.readQueue()).toStrictEqual(beforeSend);
    await expect(send.queueBar()).toBeVisible();
    await expect(send.queueCount()).toHaveText('1 COMMENT QUEUED');

    await send.goOnline();
  });

  // #check-only-stale-entries-dropped + #check-stale-drop-notification + #check-bar-count-decremented
  test('EDGE: {3 queued comments where the beta anchor is genuinely deleted server-side} => exactly the beta entry is pruned, the bar decrements to 2, and the notification names the vanished box', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Stale Anchor Guild' });
    await send.queueCommentOn({ card: send.nodeCard({ which: 'alpha' }), text: 'alpha survives' });
    await send.queueCommentOn({ card: send.nodeCard({ which: 'beta' }), text: 'beta gets pruned' });
    await send.queueCommentOn({ card: send.nodeCard({ which: 'gamma' }), text: 'gamma survives' });
    const beforePrune = await send.readQueue();
    const expectedSurvivors = beforePrune.filter((entry) => entry.nodeId !== SEND_NODE_BETA_ID);

    // The real server-side mutation: the beta node genuinely no longer exists on the flow, so
    // the route's own anchor resolution rejects it for real — no stubbed 409.
    send.makeNodeBetaStale();
    await send.clickSendButton();

    await expect(page.getByText(STALE_BETA_NOTICE)).toBeVisible({ timeout: SEND_TIMEOUT });
    expect(await send.readQueue()).toStrictEqual(expectedSurvivors);
    await expect(send.queueCount()).toHaveText('2 COMMENTS QUEUED');
  });

  // #check-queue-cleared-only-after-200
  test('EDGE: {POST 500s then 200s} => the storage key survives the 500 response and is removed only after the 200', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Cleared Only After 200 Guild' });
    await send.queueCommentOn({
      card: send.nodeCard({ which: 'alpha' }),
      text: 'survives a 500, clears on 200',
    });
    const beforeSend = await send.readQueue();

    // A real 500: quest.json is overwritten with a shape questContract rejects, so the route's
    // own quest-load call throws for real and its catch block is what turns that into a 500.
    send.corruptQuestFile();
    await send.clickSendButton();

    // The SEND button re-enabling (its `sending` state resets in the widget's `.finally()`) is
    // the deterministic "this attempt settled" signal — the 500's error text embeds a Zod
    // validation message that is not worth pinning here.
    await expect(send.sendButton()).toBeEnabled({ timeout: SEND_TIMEOUT });
    expect(await send.hasQueueKey()).toBe(true);
    expect(await send.readQueue()).toStrictEqual(beforeSend);

    // Dismiss the 500's error toast before retrying: Mantine pauses a notification's auto-close
    // timer while the cursor sits over it, and the toast physically overlaps COMMENT_SEND_BUTTON
    // here, so the very act of retrying the next click keeps it alive indefinitely. A real user
    // hits the same close button before trying again.
    await page.locator('[role="alert"] button').first().click();
    await expect(page.locator('[role="alert"]')).toHaveCount(0);

    // Restore the exact quest state the first attempt had, then let a real 200 clear the queue.
    send.restoreQuestFile();
    send.queueClaudeResponse({ text: 'Retrying now that the quest loads again' });
    await send.clickSendButton();

    await expect(send.queueBar()).toHaveCount(0, { timeout: SEND_TIMEOUT });
    expect(await send.hasQueueKey()).toBe(false);
  });

  // #check-badge-appears-after-send, and pairs #check-clear-sends-nothing's zero-request claim
  // against a real non-zero reading on the SAME hasCommentPostRequest() selector — a Clear-only
  // suite could otherwise pass with a selector that never fires.
  test('VALID: {Send succeeds on a box with zero prior comments} => COMMENT_COUNT_BADGE appears reading 1 and the comments POST is observed', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Badge Appears Guild' });
    await send.queueCommentOn({
      card: send.nodeCard({ which: 'gamma' }),
      text: 'gamma needs a second look',
    });

    send.queueClaudeResponse({ text: 'Looking into the gamma note now' });
    await send.clickSendButton();

    await expect(send.commentBadge({ card: send.nodeCard({ which: 'gamma' }) })).toHaveText('1', {
      timeout: SEND_TIMEOUT,
    });
    expect(send.hasCommentPostRequest()).toBe(true);
  });

  // #check-user-turn-in-chat — the fake CLI mirrors real Claude CLI: the -p prompt is never echoed
  // to stdout, only appended to the on-disk session transcript (writeJsonlSessionFile). The live
  // WS stream during THIS send therefore carries only the assistant's reply (proven empirically:
  // an unreloaded assertion here finds no "User Comment:" text). A reload re-subscribes and
  // replays the now-updated transcript from disk, which is what actually surfaces the composed
  // markdown as a user chat entry — the same reload-replay technique quest-dual-panel.e2e.ts uses
  // to prove chat content survives navigation.
  test('VALID: {reload after a successful send} => the replayed chat transcript carries a user entry containing User Comment:', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'User Turn In Chat Guild' });
    await send.queueCommentOn({
      card: send.nodeCard({ which: 'alpha' }),
      text: 'alpha needs a rewrite',
    });

    send.queueClaudeResponse({ text: 'Reworking alpha now' });
    await send.clickSendButton();
    await expect(send.queueBar()).toHaveCount(0, { timeout: SEND_TIMEOUT });
    await expect(page.getByText('Reworking alpha now')).toBeVisible({ timeout: SEND_TIMEOUT });

    await page.reload();
    await page.getByTestId('QUEST_SPEC_PANEL').waitFor({ state: 'visible', timeout: SEND_TIMEOUT });

    await expect(page.getByText(/User Comment: alpha needs a rewrite/u).first()).toBeVisible({
      timeout: SEND_TIMEOUT,
    });
  });

  // #check-second-round-same-box
  test('VALID: {send a second comment on a box that already has one} => COMMENT_COUNT_BADGE reads 2 with the newer comment listed first', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Second Round Guild' });

    await send.queueCommentOn({
      card: send.nodeCard({ which: 'alpha' }),
      text: 'first observation',
    });
    send.queueClaudeResponse({ text: 'Reviewing first observation' });
    await send.clickSendButton();
    await expect(send.commentBadge({ card: send.nodeCard({ which: 'alpha' }) })).toHaveText('1', {
      timeout: SEND_TIMEOUT,
    });

    await send.queueCommentOn({
      card: send.nodeCard({ which: 'alpha' }),
      text: 'second observation',
    });
    send.queueClaudeResponse({ text: 'Reviewing second observation' });
    await send.clickSendButton();
    await expect(send.commentBadge({ card: send.nodeCard({ which: 'alpha' }) })).toHaveText('2', {
      timeout: SEND_TIMEOUT,
    });

    await send.clickCardBody({ card: send.nodeCard({ which: 'alpha' }) });

    expect(await send.panelCommentTexts()).toStrictEqual([
      'second observation',
      'first observation',
    ]);
  });

  // #check-requeue-after-send
  test('VALID: {queue a new comment after a successful send} => COMMENT_QUEUE_BAR reads 1 COMMENT QUEUED again while the previously sent comment still shows in the detail panel', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Requeue After Send Guild' });

    await send.queueCommentOn({ card: send.nodeCard({ which: 'alpha' }), text: 'sent comment' });
    send.queueClaudeResponse({ text: 'Reviewing the sent comment' });
    await send.clickSendButton();
    await expect(send.queueBar()).toHaveCount(0, { timeout: SEND_TIMEOUT });

    await send.queueCommentOn({
      card: send.nodeCard({ which: 'gamma' }),
      text: 'requeued comment',
    });

    await expect(send.queueCount()).toHaveText('1 COMMENT QUEUED');

    await send.clickCardBody({ card: send.nodeCard({ which: 'alpha' }) });
    expect(await send.panelCommentTexts()).toStrictEqual(['sent comment']);
  });

  // #check-resend-after-prune-succeeds — continues directly from the same stale-anchor prune
  // #check-only-stale-entries-dropped already proves (3 queued, beta genuinely deleted server-side),
  // then drives a SECOND real Send against the two survivors and proves it actually succeeds.
  test('EDGE: {Send again after a stale-anchor prune} => the resend returns 200 and persists the 2 surviving comments', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Resend After Prune Guild' });
    await send.queueCommentOn({
      card: send.nodeCard({ which: 'alpha' }),
      text: 'alpha survives resend',
    });
    await send.queueCommentOn({
      card: send.nodeCard({ which: 'beta' }),
      text: 'beta gets pruned again',
    });
    await send.queueCommentOn({
      card: send.nodeCard({ which: 'gamma' }),
      text: 'gamma survives resend',
    });
    const beforePrune = await send.readQueue();
    const expectedSurvivors = beforePrune.filter((entry) => entry.nodeId !== SEND_NODE_BETA_ID);

    send.makeNodeBetaStale();
    await send.clickSendButton();
    await expect(send.queueCount()).toHaveText('2 COMMENTS QUEUED', { timeout: SEND_TIMEOUT });
    await expect(send.sendButton()).toBeEnabled({ timeout: SEND_TIMEOUT });

    send.queueClaudeResponse({ text: 'Resending after the prune' });
    await send.clickSendButton();

    await expect(send.queueBar()).toHaveCount(0, { timeout: SEND_TIMEOUT });
    const persisted = await send.readPersistedComments();
    expect(
      persisted.map((entry) => ({
        flowId: entry.flowId,
        nodeId: entry.nodeId,
        text: entry.text,
        createdAt: entry.createdAt,
      })),
    ).toStrictEqual(
      expectedSurvivors.map((entry) => ({
        flowId: entry.flowId,
        nodeId: entry.nodeId,
        text: entry.text,
        createdAt: entry.createdAt,
      })),
    );
  });

  // #check-clear-then-send-cycle
  test('VALID: {Clear, then queue two fresh comments, then Send} => returns 200 and persists exactly those two comments', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Clear Then Send Cycle Guild' });
    await send.queueCommentOn({
      card: send.nodeCard({ which: 'alpha' }),
      text: 'discarded before send',
    });

    await send.clickClearButton();
    expect(await send.hasQueueKey()).toBe(false);

    await send.queueCommentOn({ card: send.nodeCard({ which: 'beta' }), text: 'fresh beta note' });
    await send.queueCommentOn({
      card: send.nodeCard({ which: 'gamma' }),
      text: 'fresh gamma note',
    });
    const beforeSend = await send.readQueue();

    send.queueClaudeResponse({ text: 'Reviewing the fresh batch' });
    await send.clickSendButton();

    await expect(send.queueBar()).toHaveCount(0, { timeout: SEND_TIMEOUT });
    const persisted = await send.readPersistedComments();
    expect(
      persisted.map((entry) => ({
        flowId: entry.flowId,
        nodeId: entry.nodeId,
        text: entry.text,
        createdAt: entry.createdAt,
      })),
    ).toStrictEqual(
      beforeSend.map((entry) => ({
        flowId: entry.flowId,
        nodeId: entry.nodeId,
        text: entry.text,
        createdAt: entry.createdAt,
      })),
    );
  });

  // #check-clear-leaves-quest-comments
  test('VALID: {Clear a freshly queued comment after an earlier comment was already sent} => the previously persisted comment survives Clear unchanged', async ({
    page,
    request,
  }) => {
    const send = commentQueueSendHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await send.seedAndOpen({ guildName: 'Clear Leaves Quest Comments Guild' });

    await send.queueCommentOn({
      card: send.nodeCard({ which: 'alpha' }),
      text: 'already sent note',
    });
    send.queueClaudeResponse({ text: 'Reviewing the already-sent note' });
    await send.clickSendButton();
    await expect(send.queueBar()).toHaveCount(0, { timeout: SEND_TIMEOUT });

    const persistedBeforeClear = await send.readPersistedComments();
    const [firstPersisted] = persistedBeforeClear;
    if (firstPersisted === undefined) {
      throw new Error('expected exactly one persisted comment before queueing the second note');
    }

    await send.queueCommentOn({ card: send.nodeCard({ which: 'gamma' }), text: 'never sent note' });
    await send.clickClearButton();
    expect(await send.hasQueueKey()).toBe(false);

    const persistedAfterClear = await send.readPersistedComments();
    expect(persistedAfterClear).toStrictEqual(persistedBeforeClear);
  });
});
