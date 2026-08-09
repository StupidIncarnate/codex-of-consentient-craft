import {
  AssistantTextStreamLineStub,
  SessionIdStub,
  SystemInitStreamLineStub,
  TimeoutMsStub,
} from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
import { streamLineToJsonLineTransformer } from '@dungeonmaster/shared/transformers';

import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { claudeMockHarness } from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { followupHarness } from '../../../test/harnesses/followup/followup.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';

const GUILD_PATH = '/tmp/dm-e2e-followup-reply-streams';
const PANEL_TIMEOUT = 10_000;
// The window the FIRST streamed turn has to appear in. Generous because the tail attaches
// asynchronously (work-item stamp → quest outbox → watcher reconcile → tail opened at `end`).
const FIRST_TURN_TIMEOUT = 10_000;
// The SECOND turn's window is deliberately shorter: by then the tail is attached, so anything
// slower than this is a real regression rather than attach latency.
const SECOND_TURN_TIMEOUT = 6_000;
// Per-line delay in the fake CLI. Its init line writes immediately (so the spawn is real and the
// child is alive); the line after it is held past every assertion below, which is what keeps the
// turn IN FLIGHT while the transcript is read half-written. Without the hold, the only observable
// state is the finished transcript — and a batch render dumping every entry at exit satisfies that
// exactly as well as a streaming one does.
const HELD_TURN_DELAY_MS = 25_000;
// The hold above is this suite's wall-clock floor, so the 10s project default cannot fit it.
const HELD_TURN_SUITE_TIMEOUT_MS = 60_000;

const PRIOR_ASSISTANT_TURN = 'Earlier: the ward run came back green before the quest stopped.';
const USER_QUESTION = 'What is left to do on this quest?';
const FIRST_STREAMED_TURN = 'Two operations remain on the ledger, both locked.';
// Hostile member of the streamed-reply input class: an unbroken token with no break opportunity,
// far past any sane line width. A transcript that wraps, clips or truncates its entries renders
// something other than this exact string, and the order read below then drops it.
const SECOND_STREAMED_TURN =
  'worktree/packages/web/src/flows/quest-chat/followup-reply-streams-into-tab.e2e.ts:unbroken-token-with-no-break-opportunity-0000000000000000';
const HELD_BACK_CLI_LINE = 'Held back past the assertion window';
// The tavernkeeper's opening turn is its whole agent prompt, delivered as a user message, and it
// quotes the user's question back — so a bare hasText filter resolves to two CHAT_MESSAGE elements
// and trips Playwright strict mode.
const TAVERNKEEPER_PROMPT_HEADING = '# Tavernkeeper - Follow-Up';

// Derived from the SAME statics the guards read, never a hardcoded [blocked, complete, merged].
// `isFollowupChatable` decides which quests can open the tab at all; `isTerminal` is what splits
// the set into the case that passes with OR without a session watcher for a finished quest
// (blocked — not terminal, so its watcher is reconciled either way) and the cases that only pass
// WITH it (complete, merged).
type StatusKey = keyof typeof questStatusMetadataStatics.statuses;
const FOLLOWUP_CHATABLE_STATUSES = (
  Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[]
).filter((status) => questStatusMetadataStatics.statuses[status].isFollowupChatable);

const claudeMock = wireHarnessLifecycle({
  harness: claudeMockHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('FOLLOW-UP reply streams into the tab', () => {
  test.describe.configure({ timeout: HELD_TURN_SUITE_TIMEOUT_MS });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  // reply-streams-into-tab (every case) + streaming-works-on-complete-quest and
  // streaming-works-on-merged-quest (the two isTerminal cases). The terminal cases are NOT a
  // stylistic duplicate of the blocked one: session transcript watchers are reconciled over
  // non-terminal quests plus terminal quests carrying a live post-quest session, so a `blocked`
  // quest streams whether or not that second clause exists, while `complete` and `merged` render a
  // permanently empty transcript under a spinner without it.
  for (const status of FOLLOWUP_CHATABLE_STATUSES) {
    const terminality = questStatusMetadataStatics.statuses[status].isTerminal
      ? 'terminal'
      : 'non-terminal';
    // Work item ids are UNIQUE PER CASE, and that is load-bearing rather than tidiness. The server
    // resolves a chat-output frame's questId by workItemId through a cache that lives for the whole
    // server process and is never invalidated (in production a work item never changes quests, and
    // its id is a real uuid). Reuse one id across two cases and the second case's frames are
    // broadcast tagged with the FIRST case's questId — the browser, subscribed to its own quest,
    // drops every one of them and the transcript stays empty for a reason that has nothing to do
    // with the observable. The `fed…` prefix keeps them clear of every other spec's ids too.
    const caseIndex = FOLLOWUP_CHATABLE_STATUSES.indexOf(status);
    const priorWorkItemId = `fed00000-0000-4000-8000-00000000b${String(caseIndex)}01`;
    const tavernkeeperWorkItemId = `fed00000-0000-4000-8000-00000000b${String(caseIndex)}02`;

    test(`VALID: {status: ${status} (${terminality}), tavernkeeper still running} => the first assistant turn renders while the composer still shows STOP and the second has not arrived, then the second lands and both read in arrival order`, async ({
      page,
      request,
    }) => {
      const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
      const sessionId = `e2e-followup-stream-${status}`;

      // The transcript file has to exist before the tail attaches — it tails from `end`.
      followup.seedTavernkeeperSession({
        sessionId,
        turns: [{ role: 'assistant', text: PRIOR_ASSISTANT_TURN }],
      });

      // Resumed rather than fresh: the seeded tavernkeeper item already carries this sessionId, so
      // the followup route spawns with `--resume <sessionId>` and the child appends to the same
      // JSONL instead of overwriting the seeded turn.
      claudeMock.queueResponse({
        response: {
          sessionId: SessionIdStub({ value: sessionId }),
          delayMs: TimeoutMsStub({ value: HELD_TURN_DELAY_MS }),
          lines: [
            streamLineToJsonLineTransformer({ streamLine: SystemInitStreamLineStub() }),
            streamLineToJsonLineTransformer({
              streamLine: AssistantTextStreamLineStub({
                message: {
                  role: 'assistant',
                  content: [{ type: 'text', text: HELD_BACK_CLI_LINE }],
                },
              }),
            }),
          ],
        },
      });

      await followup.seedAndOpen({
        guildName: `Followup Streaming ${status} Guild`,
        status,
        workItems: [
          { id: priorWorkItemId, role: 'codeweaver', status: 'complete' },
          { id: tavernkeeperWorkItemId, role: 'tavernkeeper', status: 'complete', sessionId },
        ],
      });

      await followup.pressFollowup();
      await followup.sendFollowupMessage({ text: USER_QUESTION });

      await expect(
        page
          .getByTestId('CHAT_MESSAGE')
          .filter({ hasText: USER_QUESTION })
          .filter({ hasNotText: TAVERNKEEPER_PROMPT_HEADING }),
      ).toBeVisible({ timeout: PANEL_TIMEOUT });

      // The append is retried each poll because the tail attaches asynchronously, and a line
      // written before it attaches is never emitted. Retrying is idempotent in the panel: every
      // line the harness writes carries a stable uuid and the web upserts entries by uuid.
      await expect
        .poll(
          async () => {
            followup.streamAssistantTurn({ sessionId, text: FIRST_STREAMED_TURN, order: 0 });
            return followup.transcriptHasText({ text: FIRST_STREAMED_TURN });
          },
          { timeout: FIRST_TURN_TIMEOUT },
        )
        .toBe(true);

      // The load-bearing half: the first turn is on screen while the turn is STILL RUNNING and the
      // second turn has not been written yet. A build that only rendered the finished transcript
      // reaches this line with the composer already back on SEND.
      expect(await followup.isTurnInFlight()).toBe(true);
      expect(await followup.transcriptHasText({ text: SECOND_STREAMED_TURN })).toBe(false);

      followup.streamAssistantTurn({ sessionId, text: SECOND_STREAMED_TURN, order: 1 });

      await expect(
        page.getByTestId('CHAT_MESSAGE').filter({ hasText: SECOND_STREAMED_TURN }),
      ).toBeVisible({ timeout: SECOND_TURN_TIMEOUT });

      // …and the run is STILL going, so the second turn also arrived incrementally rather than in
      // an end-of-run dump. This is also the non-vacuous partner of the absence assertion above:
      // the same selector that read false now reads true.
      expect(await followup.isTurnInFlight()).toBe(true);
      expect(await followup.transcriptHasText({ text: SECOND_STREAMED_TURN })).toBe(true);

      expect(
        await followup.transcriptOrder({
          candidates: [FIRST_STREAMED_TURN, SECOND_STREAMED_TURN],
        }),
      ).toStrictEqual([FIRST_STREAMED_TURN, SECOND_STREAMED_TURN]);
    });
  }
});
