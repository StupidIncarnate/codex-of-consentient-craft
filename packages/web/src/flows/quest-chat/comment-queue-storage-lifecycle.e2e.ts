import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import {
  commentQueueLifecycleHarness,
  LIFECYCLE_FIRST_NODE_ID,
  LIFECYCLE_FLOW_ID,
  LIFECYCLE_OBSERVABLE_ID,
  LIFECYCLE_PAST_WINDOW,
  LIFECYCLE_SECOND_NODE_ID,
  LIFECYCLE_WITHIN_WINDOW,
} from '../../../test/harnesses/comment-queue-lifecycle/comment-queue-lifecycle.harness';

const GUILD_PATH = '/tmp/dm-e2e-comment-queue-storage-lifecycle';

const FIRST_BOX_TEXT = 'the note left on the first box';
const SECOND_BOX_TEXT = 'the note left on the second box';
const ASSERTION_BOX_TEXT = 'the note left on the assertion card';
const STALE_TEXT = 'the eight day old note nobody came back to';
const FRESH_TEXT = 'the one day old note still being worked on';
const SIX_DAY_TEXT = 'the six day old note just inside the window';
const OTHER_QUEST_FIRST_TEXT = "the other quest's first note";
const OTHER_QUEST_SECOND_TEXT = "the other quest's second note";

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Comment Queue Storage Lifecycle', () => {
  // Every test seeds two quests, loads the quest route at least twice (the mount under test is the
  // SECOND load) and waits on a real ELK layout each time — comfortably past the 10 s default budget.
  test.describe.configure({ timeout: 40_000 });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  // #quest-route-mounts -> #scan-comment-queue-keys -> #entry-older-than-week "within 7 days" ->
  // #load-this-quest-queue -> #queue-restored, walked as a full round trip: the queue is written by
  // the real popover, destroyed along with the whole React tree by a real reload, and read back.
  // Nothing but localStorage can carry it across that boundary, which is the whole flow in one test.
  test('VALID: {two comments queued through the popover, then a full page reload} => COMMENT_QUEUE_BAR shows the same 2 COMMENTS QUEUED and each commented box reopens to its own queued text', async ({
    page,
    request,
  }) => {
    const lifecycle = commentQueueLifecycleHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
    });
    await lifecycle.seedTwoQuests({ guildName: 'Reload Survival Guild' });
    await lifecycle.openQuest({ which: 'first' });

    await lifecycle.queueCommentOn({
      card: lifecycle.nodeCard({ which: 'first' }),
      text: FIRST_BOX_TEXT,
    });
    await lifecycle.queueCommentOn({ card: lifecycle.assertionCard(), text: ASSERTION_BOX_TEXT });
    await expect(lifecycle.queueCount()).toHaveText('2 COMMENTS QUEUED');

    await lifecycle.reloadQuest();

    // Same count after the reload — the bar is rebuilt from storage, not from surviving React state.
    await expect(lifecycle.queueCount()).toHaveText('2 COMMENTS QUEUED');
    // Each box reopens to ITS OWN text: the node card's popover must not show the assertion card's
    // note, which is what the observableId on the stored entry is there to keep apart.
    await lifecycle.openCommentPopoverOn({ card: lifecycle.nodeCard({ which: 'first' }) });
    await expect(lifecycle.popoverQueuedText()).toHaveText(FIRST_BOX_TEXT);
    await lifecycle.closeCommentPopoverOn({ card: lifecycle.nodeCard({ which: 'first' }) });
    await lifecycle.openCommentPopoverOn({ card: lifecycle.assertionCard() });
    await expect(lifecycle.popoverQueuedText()).toHaveText(ASSERTION_BOX_TEXT);
    // The restored anchors survive intact, both minted inside the window by the popover itself.
    expect(await lifecycle.readQueue({ which: 'first' })).toStrictEqual([
      {
        flowId: LIFECYCLE_FLOW_ID,
        nodeId: LIFECYCLE_FIRST_NODE_ID,
        text: FIRST_BOX_TEXT,
        createdAt: LIFECYCLE_WITHIN_WINDOW,
      },
      {
        flowId: LIFECYCLE_FLOW_ID,
        nodeId: LIFECYCLE_FIRST_NODE_ID,
        observableId: LIFECYCLE_OBSERVABLE_ID,
        text: ASSERTION_BOX_TEXT,
        createdAt: LIFECYCLE_WITHIN_WINDOW,
      },
    ]);
  });

  // #entry-older-than-week "within 7 days" at the boundary just inside it. 6 days is the case a
  // sweep with an off-by-one window would wrongly purge, so the entry must survive byte-identical.
  test('VALID: {a 6-day-old entry in this quest key} => the mount leaves the key byte-identical and COMMENT_QUEUE_BAR shows 1 COMMENT QUEUED', async ({
    page,
    request,
  }) => {
    const lifecycle = commentQueueLifecycleHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
    });
    await lifecycle.seedTwoQuests({ guildName: 'Fresh Entry Guild' });
    await lifecycle.openQuest({ which: 'first' });
    await lifecycle.writeQueue({
      which: 'first',
      entries: [{ nodeId: LIFECYCLE_FIRST_NODE_ID, text: SIX_DAY_TEXT, ageDays: 6 }],
    });

    await lifecycle.reloadQuest();

    expect(await lifecycle.rawQueue({ which: 'first' })).toBe(
      lifecycle.seededRawQueue({ which: 'first' }),
    );
    await expect(lifecycle.queueCount()).toHaveText('1 COMMENT QUEUED');
    await lifecycle.openCommentPopoverOn({ card: lifecycle.nodeCard({ which: 'first' }) });
    await expect(lifecycle.popoverQueuedText()).toHaveText(SIX_DAY_TEXT);
  });

  // #entry-older-than-week "older than 7 days" -> #purge-expired-entry -> #quest-queue-now-empty
  // "no" -> #load-this-quest-queue -> #queue-restored. The partial purge is the sharp case: a sweep
  // that dropped the whole key, or kept the wrong entry, fails on the surviving text.
  test('EDGE: {one 8-day-old and one 1-day-old entry} => the mount retains exactly the 1-day-old, its box reopens to that text and the expired box reopens to an empty editor', async ({
    page,
    request,
  }) => {
    const lifecycle = commentQueueLifecycleHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
    });
    await lifecycle.seedTwoQuests({ guildName: 'Mixed Age Guild' });
    await lifecycle.openQuest({ which: 'first' });
    await lifecycle.writeQueue({
      which: 'first',
      entries: [
        { nodeId: LIFECYCLE_FIRST_NODE_ID, text: STALE_TEXT, ageDays: 8 },
        { nodeId: LIFECYCLE_SECOND_NODE_ID, text: FRESH_TEXT, ageDays: 1 },
      ],
    });

    await lifecycle.reloadQuest();

    expect(await lifecycle.readQueue({ which: 'first' })).toStrictEqual([
      {
        flowId: LIFECYCLE_FLOW_ID,
        nodeId: LIFECYCLE_SECOND_NODE_ID,
        text: FRESH_TEXT,
        createdAt: LIFECYCLE_WITHIN_WINDOW,
      },
    ]);
    await expect(lifecycle.queueCount()).toHaveText('1 COMMENT QUEUED');
    // The survivor's box still reads back its queued text...
    await lifecycle.openCommentPopoverOn({ card: lifecycle.nodeCard({ which: 'second' }) });
    await expect(lifecycle.popoverQueuedText()).toHaveText(FRESH_TEXT);
    await lifecycle.closeCommentPopoverOn({ card: lifecycle.nodeCard({ which: 'second' }) });
    // ...while the purged box is back to a blank editor rather than showing a swept comment.
    await lifecycle.openCommentPopoverOn({ card: lifecycle.nodeCard({ which: 'first' }) });
    await expect(lifecycle.popoverEditor()).toHaveValue('');
  });

  // #purge-expired-entry -> #quest-queue-now-empty "yes" -> #remove-queue-key -> the mounted quest
  // loads an empty queue. The key must be ABSENT, not left holding an empty array: an empty array is
  // a key that never expires on its own and accumulates one per quest the user ever reviewed.
  test('EDGE: {an 8-day-old entry as the key only entry} => the mount removes the whole dungeonmaster-quest-comments key and renders no COMMENT_QUEUE_BAR', async ({
    page,
    request,
  }) => {
    const lifecycle = commentQueueLifecycleHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
    });
    await lifecycle.seedTwoQuests({ guildName: 'Emptied Key Guild' });
    await lifecycle.openQuest({ which: 'first' });
    await lifecycle.writeQueue({
      which: 'first',
      entries: [{ nodeId: LIFECYCLE_FIRST_NODE_ID, text: STALE_TEXT, ageDays: 8 }],
    });

    await lifecycle.reloadQuest();

    expect(await lifecycle.hasQueueKey({ which: 'first' })).toBe(false);
    expect(await lifecycle.rawQueue({ which: 'first' })).toBe(null);
    await expect(lifecycle.queueBar()).toHaveCount(0);
    await lifecycle.openCommentPopoverOn({ card: lifecycle.nodeCard({ which: 'first' }) });
    await expect(lifecycle.popoverEditor()).toHaveValue('');
  });

  // #other-quest-queues-intact terminal, reached on a mount that DID write: the sweep purges the
  // mounted quest's key and must leave the other quest's key alone in the same pass. Also
  // #check-only-mounted-quest-read — the bar counts 1, not the 3 entries localStorage holds in total.
  test('VALID: {this quest holds a stale and a fresh entry while a second quest holds two fresh ones} => the purge rewrites only this quest key, the bar counts only this quest queue, and the second quest key stays byte-identical', async ({
    page,
    request,
  }) => {
    const lifecycle = commentQueueLifecycleHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
    });
    await lifecycle.seedTwoQuests({ guildName: 'Other Quest Intact Guild' });
    await lifecycle.openQuest({ which: 'first' });
    await lifecycle.writeQueue({
      which: 'first',
      entries: [
        { nodeId: LIFECYCLE_FIRST_NODE_ID, text: STALE_TEXT, ageDays: 8 },
        { nodeId: LIFECYCLE_SECOND_NODE_ID, text: FRESH_TEXT, ageDays: 1 },
      ],
    });
    await lifecycle.writeQueue({
      which: 'second',
      entries: [
        { nodeId: LIFECYCLE_FIRST_NODE_ID, text: OTHER_QUEST_FIRST_TEXT, ageDays: 1 },
        { nodeId: LIFECYCLE_SECOND_NODE_ID, text: OTHER_QUEST_SECOND_TEXT, ageDays: 2 },
      ],
    });

    await lifecycle.reloadQuest();

    // Byte-identical: the sweep neither reordered, re-stamped nor rewrote the other quest's array
    // while it was rewriting the mounted quest's.
    expect(await lifecycle.rawQueue({ which: 'second' })).toBe(
      lifecycle.seededRawQueue({ which: 'second' }),
    );
    expect(await lifecycle.readQueue({ which: 'first' })).toStrictEqual([
      {
        flowId: LIFECYCLE_FLOW_ID,
        nodeId: LIFECYCLE_SECOND_NODE_ID,
        text: FRESH_TEXT,
        createdAt: LIFECYCLE_WITHIN_WINDOW,
      },
    ]);
    // 3 entries sit in localStorage across the two keys; the mounted quest restores only its own 1.
    await expect(lifecycle.queueCount()).toHaveText('1 COMMENT QUEUED');
  });

  // #load-this-quest-queue "for the mounted quest only", walked as the real route-to-route move a
  // reviewer makes. The second quest must come up with no bar at all, and the first quest's queue
  // must still be waiting when they go back — the #other-quest-queues-intact terminal from the other
  // side, where the quest left behind is the one holding comments.
  test('VALID: {navigating from a quest with 2 queued comments to a quest with 0} => the second quest renders no COMMENT_QUEUE_BAR and a blank editor while the first quest key still holds both entries', async ({
    page,
    request,
  }) => {
    const lifecycle = commentQueueLifecycleHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
    });
    await lifecycle.seedTwoQuests({ guildName: 'Cross Quest Guild' });
    await lifecycle.openQuest({ which: 'first' });
    await lifecycle.writeQueue({
      which: 'first',
      entries: [
        { nodeId: LIFECYCLE_FIRST_NODE_ID, text: FIRST_BOX_TEXT, ageDays: 1 },
        { nodeId: LIFECYCLE_SECOND_NODE_ID, text: SECOND_BOX_TEXT, ageDays: 2 },
      ],
    });
    await lifecycle.reloadQuest();
    await expect(lifecycle.queueCount()).toHaveText('2 COMMENTS QUEUED');

    await lifecycle.openQuest({ which: 'second' });

    // The bar the first quest was showing is gone rather than carried over with its count.
    await expect(lifecycle.queueBar()).toHaveCount(0);
    expect(await lifecycle.hasQueueKey({ which: 'second' })).toBe(false);
    // No bleed into the boxes either: the same node ids are queued on the other quest, so a lookup
    // that keyed on the anchor alone rather than on quest+anchor would prefill this editor.
    await lifecycle.openCommentPopoverOn({ card: lifecycle.nodeCard({ which: 'first' }) });
    await expect(lifecycle.popoverEditor()).toHaveValue('');
    // And the queue left behind on the first quest is still there, whole.
    expect(await lifecycle.rawQueue({ which: 'first' })).toBe(
      lifecycle.seededRawQueue({ which: 'first' }),
    );
    expect(await lifecycle.readQueue({ which: 'first' })).toStrictEqual([
      {
        flowId: LIFECYCLE_FLOW_ID,
        nodeId: LIFECYCLE_FIRST_NODE_ID,
        text: FIRST_BOX_TEXT,
        createdAt: LIFECYCLE_WITHIN_WINDOW,
      },
      {
        flowId: LIFECYCLE_FLOW_ID,
        nodeId: LIFECYCLE_SECOND_NODE_ID,
        text: SECOND_BOX_TEXT,
        createdAt: LIFECYCLE_WITHIN_WINDOW,
      },
    ]);
  });

  // The one branch of #scan-comment-queue-keys with no user-facing surface: a key that has already
  // aged out is dropped on the FIRST mount that notices it, whichever quest that mount belongs to.
  // Proven here by mounting quest TWO while the expired entries sit under quest ONE's key.
  test('EDGE: {an 8-day-old entry under a quest the user never opens} => mounting the other quest still purges that key', async ({
    page,
    request,
  }) => {
    const lifecycle = commentQueueLifecycleHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
    });
    await lifecycle.seedTwoQuests({ guildName: 'Abandoned Review Guild' });
    await lifecycle.openQuest({ which: 'second' });
    await lifecycle.writeQueue({
      which: 'first',
      entries: [{ nodeId: LIFECYCLE_FIRST_NODE_ID, text: STALE_TEXT, ageDays: 8 }],
    });
    await lifecycle.writeQueue({
      which: 'second',
      entries: [{ nodeId: LIFECYCLE_FIRST_NODE_ID, text: FRESH_TEXT, ageDays: 1 }],
    });

    await lifecycle.reloadQuest();

    // The abandoned quest's key is gone even though its route was never opened — that is what keeps
    // reviews the user walked away from out of localStorage forever.
    expect(await lifecycle.hasQueueKey({ which: 'first' })).toBe(false);
    // The mounted quest's own fresh entry is untouched by the same pass.
    expect(await lifecycle.rawQueue({ which: 'second' })).toBe(
      lifecycle.seededRawQueue({ which: 'second' }),
    );
    await expect(lifecycle.queueCount()).toHaveText('1 COMMENT QUEUED');
  });

  // #scan-comment-queue-keys reaching #remove-queue-key TWICE inside one mount. Every other case in
  // this file pairs one expiring key with one surviving key, which cannot tell a scan that visits
  // every key from one that visits every OTHER key: removing a key re-indexes localStorage, so a
  // live index walk slides the next key into a slot it has already passed. Two keys that both need
  // removing is the only shape where that skip has somewhere to hide.
  test('EDGE: {two quests whose keys both hold only 8-day-old entries} => one mount removes both keys and the mounted quest renders no COMMENT_QUEUE_BAR', async ({
    page,
    request,
  }) => {
    const lifecycle = commentQueueLifecycleHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
    });
    await lifecycle.seedTwoQuests({ guildName: 'Double Purge Guild' });
    await lifecycle.openQuest({ which: 'first' });
    await lifecycle.writeQueue({
      which: 'first',
      entries: [{ nodeId: LIFECYCLE_FIRST_NODE_ID, text: STALE_TEXT, ageDays: 8 }],
    });
    await lifecycle.writeQueue({
      which: 'second',
      entries: [{ nodeId: LIFECYCLE_FIRST_NODE_ID, text: OTHER_QUEST_FIRST_TEXT, ageDays: 9 }],
    });

    await lifecycle.reloadQuest();

    expect(await lifecycle.hasQueueKey({ which: 'first' })).toBe(false);
    expect(await lifecycle.hasQueueKey({ which: 'second' })).toBe(false);
    await expect(lifecycle.queueBar()).toHaveCount(0);
    // The popover still opens, so the absent bar means "this quest's queue is empty" rather than
    // "the status or session gate closed the compose affordance" — and it opens onto a blank editor.
    await lifecycle.openCommentPopoverOn({ card: lifecycle.nodeCard({ which: 'first' }) });
    await expect(lifecycle.popoverEditor()).toHaveValue('');
  });

  // The stale-entry side of the same scan: a past-window entry that has NOT yet been swept reads
  // back as past-window, so the sentinel readQueue returns is proven to discriminate rather than
  // labelling everything "within". Without this, every purge assertion above could pass vacuously.
  test('EDGE: {an 8-day-old entry read before any mount sweeps it} => readQueue reports it as past the expiry window', async ({
    page,
    request,
  }) => {
    const lifecycle = commentQueueLifecycleHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
    });
    await lifecycle.seedTwoQuests({ guildName: 'Window Sentinel Guild' });
    await lifecycle.openQuest({ which: 'first' });
    await lifecycle.writeQueue({
      which: 'first',
      entries: [{ nodeId: LIFECYCLE_FIRST_NODE_ID, text: STALE_TEXT, ageDays: 8 }],
    });

    expect(await lifecycle.readQueue({ which: 'first' })).toStrictEqual([
      {
        flowId: LIFECYCLE_FLOW_ID,
        nodeId: LIFECYCLE_FIRST_NODE_ID,
        text: STALE_TEXT,
        createdAt: LIFECYCLE_PAST_WINDOW,
      },
    ]);
  });
});
