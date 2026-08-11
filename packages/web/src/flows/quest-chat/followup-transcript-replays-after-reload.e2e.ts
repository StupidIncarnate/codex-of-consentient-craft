import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { followupHarness } from '../../../test/harnesses/followup/followup.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';

const GUILD_PATH = '/tmp/dm-e2e-followup-transcript-replay';
// Kept under the project's 10s per-test budget on purpose: a poll window LONGER than the test's
// own timeout can never spend it, so an ordering failure would surface as an opaque "test timeout"
// instead of the array diff that names which turn moved.
const REPLAY_TIMEOUT = 8_000;

const SESSION_ID = 'e2e-followup-replay-session-0000000000c1';

// TWO full turns, four lines. One turn alone cannot tell "renders the previous turns" from
// "renders the previous turn", and cannot fail on an ordering bug at all.
// Hostile members of the transcript input class:
//  - FIRST_USER_TURN is markup-shaped, so a transcript that injects rather than escapes its
//    content renders no such text and the order read drops it.
//  - FIRST_ASSISTANT_TURN is an unbroken token with no break opportunity, far past any sane line
//    width — the case a wrapping/clipping/truncating renderer fails.
const FIRST_USER_TURN = '<script>alert("tavernkeeper")</script> what actually shipped?';
const FIRST_ASSISTANT_TURN =
  'worktree/packages/orchestrator/src/responders/followup-chat/start/followup-chat-start-responder.ts:unbroken-token-no-break-opportunity-1111111111111111';
const SECOND_USER_TURN = 'And what is still open after the merge?';
const SECOND_ASSISTANT_TURN = 'The verify tail is drained; nothing is still open.';

const ALL_TURNS = [
  FIRST_USER_TURN,
  FIRST_ASSISTANT_TURN,
  SECOND_USER_TURN,
  SECOND_ASSISTANT_TURN,
] as const;

// The `fed…` prefix keeps these clear of every other spec's work item ids. The server resolves a
// chat-output frame's questId by workItemId through a cache that lives for the whole server process
// and is never invalidated, so an id shared with another spec in the same run tags this quest's
// frames with that spec's questId and the browser drops them.
const PRIOR_WORK_ITEM_ID = 'fed00000-0000-4000-8000-0000000000d1';
const TAVERNKEEPER_WORK_ITEM_ID = 'fed00000-0000-4000-8000-0000000000d2';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('FOLLOW-UP transcript replays after a reload', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  // transcript-replays-after-reload. A REAL page.reload(), never a tab switch: a switch keeps the
  // component (and its entries) mounted, so it proves nothing about replay from the session
  // transcript on disk. The reload is also what makes the FOLLOW-UP tab's absence a real state —
  // `followupTabOpen` is component state, so the tab is gone until it is pressed again, which is
  // exactly the surface the observable names.
  test('VALID: {two prior FOLLOW-UP turns on disk, quest page reloaded} => the FOLLOW-UP tab is gone until pressed again, and pressing it replays all four transcript lines in their recorded order', async ({
    page,
    request,
  }) => {
    const followup = followupHarness({ page, request, guildPath: GUILD_PATH });

    followup.seedTavernkeeperSession({
      sessionId: SESSION_ID,
      turns: [
        { role: 'user', text: FIRST_USER_TURN },
        { role: 'assistant', text: FIRST_ASSISTANT_TURN },
        { role: 'user', text: SECOND_USER_TURN },
        { role: 'assistant', text: SECOND_ASSISTANT_TURN },
      ],
    });

    const { questId } = await followup.seedAndOpen({
      guildName: 'Followup Replay Guild',
      status: 'complete',
      workItems: [
        { id: PRIOR_WORK_ITEM_ID, role: 'codeweaver', status: 'complete' },
        {
          id: TAVERNKEEPER_WORK_ITEM_ID,
          role: 'tavernkeeper',
          status: 'complete',
          sessionId: SESSION_ID,
        },
      ],
    });

    // Baseline before the reload. This is what keeps the post-reload absence assertion below from
    // being vacuous — the same tab selector and the same four turns are shown reaching their
    // present state first.
    expect(await followup.hasAnyFollowupTab()).toBe(false);
    await followup.pressFollowup();
    expect(await followup.hasAnyFollowupTab()).toBe(true);

    await expect
      .poll(async () => followup.transcriptOrder({ candidates: ALL_TURNS }), {
        timeout: REPLAY_TIMEOUT,
      })
      .toStrictEqual([...ALL_TURNS]);

    await followup.reloadQuestPage();

    // The page really did reload: nothing carried the tab over.
    expect(await followup.hasAnyFollowupTab()).toBe(false);
    expect(await followup.transcriptHasText({ text: SECOND_ASSISTANT_TURN })).toBe(false);

    await followup.pressFollowup();

    expect(await followup.hasAnyFollowupTab()).toBe(true);

    // The observable itself. Fails if replay came back empty, dropped a turn (that turn falls out
    // of the list entirely), replayed only the newest turn, or emitted the four lines in any order
    // other than the one recorded on disk.
    await expect
      .poll(async () => followup.transcriptOrder({ candidates: ALL_TURNS }), {
        timeout: REPLAY_TIMEOUT,
      })
      .toStrictEqual([...ALL_TURNS]);

    // …and the reload landed back on the SAME quest, not a fresh one whose empty transcript would
    // have read as "no turns" for an unrelated reason.
    await expect(page).toHaveURL(new RegExp(`/quest/${String(questId)}$`, 'u'));
  });
});
